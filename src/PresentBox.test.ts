import {syncPresentReceipts,receivePresent,deletePresentHistory,PRESENT_KEY} from './PresentBox';
import {EMPTY_REWARDS,REWARD_KEY} from './rewardLedger';
import {EMPTY_ROOM} from './interior';
const wallet={...EMPTY_REWARDS,loginDays:7,lastLoginDate:'2026-11-08',tickets:1,earned:70,ownedItemIds:['growth-gift-birth'],creditedXp:{'checkin:2026-11-08':10}};
beforeEach(()=>localStorage.clear());
test('付与済みのログイン・進化報酬を二重登録せず、受取確認でも通貨を増やさない',()=>{
 localStorage.setItem(REWARD_KEY,JSON.stringify(wallet));const before=localStorage.getItem(REWARD_KEY);
 const first=syncPresentReceipts(wallet,EMPTY_ROOM);expect(first.entries).toHaveLength(2);expect(first.entries[0].description).toContain('チケット 1枚');
 expect(syncPresentReceipts(wallet,EMPTY_ROOM).entries).toHaveLength(2);
 expect(receivePresent(first.entries[0].id).entries[0].receivedAt).toBeDefined();expect(localStorage.getItem(REWARD_KEY)).toBe(before);
});
test('履歴削除は未確認を残し、同期後も削除履歴を復活させない',()=>{
 const first=syncPresentReceipts(wallet,EMPTY_ROOM);receivePresent(first.entries[0].id);deletePresentHistory();
 const next=syncPresentReceipts(wallet,EMPTY_ROOM);expect(next.entries).toHaveLength(1);expect(next.entries[0].receivedAt).toBeUndefined();
});
test('壊れた保存内容を上書きしない',()=>{localStorage.setItem(PRESENT_KEY,'broken');expect(()=>syncPresentReceipts(wallet,EMPTY_ROOM)).toThrow();expect(localStorage.getItem(PRESENT_KEY)).toBe('broken');});
