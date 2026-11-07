import { MedicationRewardPolicy, makeMedicationPolicy, parseMedicationPolicy, legacyMedicationEvents, MEDICATION_DAILY_XP } from './medicationPolicy';
import type { MedicationData } from './MedicationTracker';
import { withStorageLock } from './storageLock';
export const REWARD_KEY = 'kokoro-rewards-v1';
export const LOGIN_DAYS_PER_TICKET = 7;
export const TICKET_DRAW_COST = 1;

export interface PendingGachaResult {
 id:string; itemId:string; gachaId:string; payment:'ticket'|'macaron'; amount:number; confirmedAt:string;
}
export interface RewardState {
  version: 1;
  earned: number;
  spent: number;
  tickets: number;
  loginDays: number;
  lastLoginDate: string | null;
  creditedXp: Record<string, number>;
  ownedItemIds: string[];
  medicationPolicy?: MedicationRewardPolicy;
  pendingGachaResult?: PendingGachaResult;
}

export const EMPTY_REWARDS: RewardState = {
  version: 1, earned: 0, spent: 0, tickets: 0, loginDays: 0,
  lastLoginDate: null, creditedXp: {}, ownedItemIds: [],
};

export const macaronBalance = (state: RewardState) => state.earned - state.spent;

const tokyoCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function tokyoDay(date = new Date()): string {
  const parts = tokyoCalendar.formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}

export function creditXp(state: RewardState, events: Readonly<Record<string, number>>): RewardState {
  let earned = state.earned;
  let creditedXp: RewardState['creditedXp'] | undefined;
  for (const [id, requestedXp] of Object.entries(events)) {
    const legacy=/^medication:(\d{4}-\d{2}-\d{2})\|[^|]+$/.exec(id);
    // After migration legacy per-dose credits are immutable; a daily credit also blocks later legacy replay.
    if(id.startsWith('medication:')&&(state.medicationPolicy||(legacy&&((creditedXp??state.creditedXp)['medication-day:'+legacy[1]]||0)>0)))continue;
    const daily=/^medication-day:(\d{4}-\d{2}-\d{2})$/.exec(id);
    const xp=daily?Math.min(requestedXp,MEDICATION_DAILY_XP):requestedXp;
    const previous = state.creditedXp[id] ?? 0;
    if (xp > previous) {
      const alreadyPaid=daily&&(Object.entries(creditedXp??state.creditedXp).some(([key,value])=>key.startsWith('medication:'+daily[1]+'|')&&value>0)||(state.medicationPolicy?.legacyDayXp[daily[1]]||0)>0);
      if(!alreadyPaid)earned+=xp-previous;
      creditedXp ??= { ...state.creditedXp };
      creditedXp[id] = xp;
    }
  }
  return creditedXp ? { ...state, earned, creditedXp } : state;
}

export function migrateMedicationRewards(state:RewardState,data:MedicationData,adoptionDay:string):RewardState {
 if(state.medicationPolicy)return state;
 const settled=creditXp(state,legacyMedicationEvents(data));
 return {...settled,medicationPolicy:makeMedicationPolicy(data,settled.creditedXp,adoptionDay)};
}

export function registerLogin(state: RewardState, day: string): RewardState {
  if (state.lastLoginDate !== null && day <= state.lastLoginDate) return state;
  const loginDays = state.loginDays + 1;
  return {
    ...state, loginDays, lastLoginDate: day,
    tickets: state.tickets + (loginDays % LOGIN_DAYS_PER_TICKET === 0 ? 1 : 0),
  };
}

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

export function readRewards(): RewardState {
  const raw = localStorage.getItem(REWARD_KEY);
  if (raw === null) return EMPTY_REWARDS;
  return parseRewards(JSON.parse(raw));
}

export function parseRewards(raw: unknown): RewardState {
  const value = raw as Partial<RewardState> | null;
  if (!value || value.version !== 1 || !isCount(value.earned) || !isCount(value.spent) ||
      value.spent > value.earned || !isCount(value.tickets) || !isCount(value.loginDays) ||
      value.tickets > Math.floor(value.loginDays / LOGIN_DAYS_PER_TICKET) ||
      !(value.lastLoginDate === null || (typeof value.lastLoginDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastLoginDate))) ||
      !value.creditedXp || typeof value.creditedXp !== 'object' || Array.isArray(value.creditedXp) ||
      !Object.entries(value.creditedXp).every(([id, xp]) => /^(checkin|mood|diary|medication|medication-day|steps|meditation):/.test(id) && isCount(xp)) ||
      !Array.isArray(value.ownedItemIds) || !value.ownedItemIds.every(id => typeof id === 'string')) {
    throw new Error('報酬の保存データを読み込めませんでした。');
  }
  if(value.pendingGachaResult!==undefined){
    const p=value.pendingGachaResult;
    if(!p||typeof p.id!=='string'||!p.id||p.id.length>150||typeof p.itemId!=='string'||!value.ownedItemIds.includes(p.itemId)||
      typeof p.gachaId!=='string'||!['standard','outfit','interior'].includes(p.gachaId)||
      !['ticket','macaron'].includes(p.payment)||!isCount(p.amount)||p.amount<1||
      typeof p.confirmedAt!=='string'||!Number.isFinite(Date.parse(p.confirmedAt)))throw new Error('ガチャの確定結果を読み込めませんでした。');
  }
  if(value.medicationPolicy!==undefined)parseMedicationPolicy(value.medicationPolicy);
  return value as RewardState;
}

export async function updateRewards(change: (current: RewardState) => RewardState): Promise<RewardState> {
  const update = () => {
    const current = readRewards();
    const next = change(current);
    if (next !== current) localStorage.setItem(REWARD_KEY, JSON.stringify(next));
    return next;
  };
  // Serialise the read/modify/write across tabs where Web Locks is available.
  return withStorageLock(update);
}

interface GachaConfig {
  macaronCost: number;
  pool: readonly { id: string; weight: number }[];
  resolveDuplicate: (ownedItemId: string, state: Readonly<RewardState>) => RewardState;
}

export function purchaseItem(state: RewardState, id: string, price: number): RewardState {
  if (!id || !Number.isSafeInteger(price) || price < 1 ||
      state.ownedItemIds.includes(id) || macaronBalance(state) < price) {
    throw new Error('購入条件を満たしていません。');
  }
  return { ...state, spent: state.spent + price, ownedItemIds: [...state.ownedItemIds, id] };
}

export function drawItem(state: RewardState, config: GachaConfig, payment: 'ticket' | 'macaron', random = Math.random) {
  const { pool, macaronCost, resolveDuplicate } = config;
  if (!isCount(macaronCost) || macaronCost < 1 || !pool.length ||
      pool.some(item => !item.id || !isCount(item.weight) || item.weight === 0) ||
      new Set(pool.map(item => item.id)).size !== pool.length ||
      pool.reduce((sum, item) => sum + item.weight, 0) !== 10000) {
    throw new Error('抽選設定が不正です。');
  }
  if (payment === 'ticket' ? state.tickets < TICKET_DRAW_COST : macaronBalance(state) < macaronCost) {
    throw new Error('残高が足りません。');
  }
  let roll = random() * 10000;
  const winner = pool.find(item => (roll -= item.weight) < 0);
  if (!winner) throw new Error('抽選を完了できませんでした。');
  const paid = payment === 'ticket' ? { ...state, tickets: state.tickets - TICKET_DRAW_COST }
    : { ...state, spent: state.spent + macaronCost };
  const next = paid.ownedItemIds.includes(winner.id) ? resolveDuplicate(winner.id, paid)
    : { ...paid, ownedItemIds: [...paid.ownedItemIds, winner.id] };
  return { state: next, itemId: winner.id };
}

