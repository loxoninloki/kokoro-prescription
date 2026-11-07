import { readMedication } from './MedicationTracker';
import { CHECKIN_XP } from './evolution';
import { creditXp, readRewards, migrateMedicationRewards, registerLogin, REWARD_KEY, RewardState } from './rewardLedger';
import { grantInterior, readRoom, ROOM_KEY, RoomState } from './interior';
import { withStorageLock } from './storageLock';
export const CHECKIN_KEY='kokoro-checkins-v1';
const JOURNAL_KEY='kokoro-login-pending-v1';
const KEYS=[CHECKIN_KEY,REWARD_KEY,ROOM_KEY];
export function readCheckins(): string[] {
 const raw:unknown=JSON.parse(localStorage.getItem(CHECKIN_KEY)||'[]');
 if(!Array.isArray(raw)||!raw.every(v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v))) throw new Error('ログイン履歴を読み込めませんでした。');
 return Array.from(new Set(raw)).sort();
}
export interface StampReceipt {xp:number;tickets:number;furnitureIds:string[];}
interface LoginResult {receipt:StampReceipt;days:string[];wallet:RewardState;room:RoomState;stamped:boolean;}
// A recoverable journal protects the three localStorage writes against quota errors and interrupted startup.
export function recoverLogin() {
 const raw=localStorage.getItem(JOURNAL_KEY);if(!raw)return;
 const previous:unknown=JSON.parse(raw);
 if(!Array.isArray(previous)||previous.length!==KEYS.length||!previous.every(v=>v===null||typeof v==='string')) throw new Error('保存処理の復旧情報を確認してください。');
 KEYS.forEach((key,i)=>previous[i]===null?localStorage.removeItem(key):localStorage.setItem(key,previous[i]));
 localStorage.removeItem(JOURNAL_KEY);
}
export function calculateLogin(wallet:RewardState, days:string[], room:RoomState, day:string, events:Record<string,number>):LoginResult {
 const latest=[wallet.lastLoginDate||'',...days].sort().slice(-1)[0]||'';
 const stamped=!days.includes(day)&&day>=latest;
 const nextDays=stamped?[...days,day].sort():days;
 // Keep undated legacy login totals without inventing historical dates or replaying old ticket grants.
 const base={...wallet,loginDays:Math.max(wallet.loginDays,days.length),lastLoginDate:latest||null};
 const next=registerLogin(base,day);
 const xp={...events};for(const date of nextDays)xp['checkin:'+date]=CHECKIN_XP;
 const credited=creditXp(next,xp);
 const nextRoom=grantInterior(room,credited.loginDays);
 return {days:nextDays,wallet:credited,room:nextRoom,stamped,receipt:{xp:Math.max(0,(credited.creditedXp['checkin:'+day]||0)-(wallet.creditedXp['checkin:'+day]||0)),tickets:credited.tickets-wallet.tickets,furnitureIds:nextRoom.ownedItemIds.filter(id=>!room.ownedItemIds.includes(id))}};
}
export function syncLogin(day:string, readXp:()=>Record<string,number>):Promise<LoginResult> {
 return withStorageLock(()=>{
  recoverLogin();
  const previous=KEYS.map(k=>localStorage.getItem(k));
  const result=calculateLogin(migrateMedicationRewards(readRewards(),readMedication(),day),readCheckins(),readRoom(),day,readXp());
  const next=[result.days,result.wallet,result.room].map(v=>JSON.stringify(v));
  if(next.every((v,i)=>v===previous[i]))return result;
  localStorage.setItem(JOURNAL_KEY,JSON.stringify(previous));
  try {KEYS.forEach((k,i)=>localStorage.setItem(k,next[i]));localStorage.removeItem(JOURNAL_KEY);}
  catch(e){try{recoverLogin();}catch{/* keep durable recovery journal for retry */}throw e;}
  return result;
 });
}

