export const ROOM_KEY = 'kokoro-room-v1';
export const INTERIOR_ITEMS = [
 { id: 'wall-basic', name: 'やさしい紫の壁', category: '内装', slot: 'wallpaper', day: 1, color: '#eee3f6', symbol: '▥' },
 { id: 'floor-basic', name: 'ミルク色の床', category: '内装', slot: 'floor', day: 1, color: '#dfd2e6', symbol: '▱' },
 { id: 'desk-basic', name: '小さな机', category: '家具', slot: 'desk', day: 1, color: '#b6a1ce', symbol: '机' },
 { id: 'rug-lavender', name: 'ラベンダーのラグ', category: '雑貨', slot: 'rug', day: 3, color: '#bca0d4', symbol: '◯' },
 { id: 'wall-night', name: '夜空の壁紙', category: '内装', slot: 'wallpaper', day: 7, color: '#9e92c0', symbol: '☾' },
 { id: 'bed-lavender', name: 'おやすみベッド', category: '家具', slot: 'bed', day: 14, color: '#c7acd9', symbol: 'ベッド' },
 { id: 'lamp-soft', name: 'やすらぎのランプ', category: '雑貨', slot: 'lamp', day: 21, color: '#f4deb3', symbol: '灯' },
 { id: 'wall-special', name: '癒しの夕空', category: '内装', slot: 'wallpaper', day: 30, color: '#cbb0d4', symbol: '♡' },
] as const;
export const INTERIOR_REWARDS = [1,3,7,14,21,30].map(day => ({ id: `interior-day-${day}`, day, items: INTERIOR_ITEMS.filter(i => i.day === day).map(i => i.id) }));
export interface RoomState {
 version: 1; layout: Record<string, string | null>; ownedItemIds: string[];
 claimedRewardIds: string[]; selectedFormId: string | null; updatedAt: string;
}
export const EMPTY_ROOM: RoomState = {version:1, layout:{}, ownedItemIds:[], claimedRewardIds:[], selectedFormId:null, updatedAt:''};
export function parseRoom(raw: unknown): RoomState {
 const s = raw as RoomState;
 if (!s || s.version !== 1 || !s.layout || typeof s.layout !== 'object' || Array.isArray(s.layout) ||
 !Array.isArray(s.ownedItemIds) || !s.ownedItemIds.every(id => typeof id === 'string') ||
 !Array.isArray(s.claimedRewardIds) || !s.claimedRewardIds.every(id => typeof id === 'string') ||
 !(s.selectedFormId === null || typeof s.selectedFormId === 'string') || typeof s.updatedAt !== 'string' ||
 !Object.values(s.layout).every(id => id === null || typeof id === 'string')) throw new Error('ルームデータが不正です。');
 for (const [slot,id] of Object.entries(s.layout)) {
  if (id !== null && (!s.ownedItemIds.includes(id) || !INTERIOR_ITEMS.some(i => i.id === id && i.slot === slot))) throw new Error('家具の配置データが不正です。');
 }
 return s;
}
export function readRoom(): RoomState { const raw = localStorage.getItem(ROOM_KEY); return raw === null ? EMPTY_ROOM : parseRoom(JSON.parse(raw)); }
export function grantInterior(state: RoomState, loginDays: number): RoomState {
 const due = INTERIOR_REWARDS.filter(r => r.day <= loginDays && !state.claimedRewardIds.includes(r.id));
 if (!due.length) return state;
 return {...state, ownedItemIds: Array.from(new Set([...state.ownedItemIds,...due.flatMap(r => r.items)])), claimedRewardIds: [...state.claimedRewardIds,...due.map(r => r.id)]};
}
export async function updateRoom(change: (state: RoomState) => RoomState): Promise<RoomState> {
 const write = () => { const current=readRoom(); const next=change(current); if(next!==current) localStorage.setItem(ROOM_KEY, JSON.stringify(parseRoom(next))); return next; };
 return navigator.locks ? navigator.locks.request(ROOM_KEY,write) : write();
}
