import {claimOperatorPresent,parseOperatorPresents,presentAvailable} from './operatorPresents';
import {EMPTY_REWARDS,REWARD_KEY,readRewards,parseRewards} from './rewardLedger';
const gift={id:'welcome-2026',title:'運営テスト特典',startsAt:'2020-01-01T00:00:00Z',macarons:20,tickets:2,itemIds:['lavender-bloom']};
beforeEach(()=>{localStorage.clear();localStorage.setItem(REWARD_KEY,JSON.stringify(EMPTY_REWARDS));global.fetch=jest.fn().mockResolvedValue({ok:true,json:async()=>({version:1,gifts:[gift]})});});
afterEach(()=>jest.restoreAllMocks());
test('一斉配布を同時受取しても1回だけ付与し、保存後も復元できる',async()=>{
 await Promise.all([claimOperatorPresent(gift.id),claimOperatorPresent(gift.id)]);const w=readRewards();expect(w.earned).toBe(20);expect(w.tickets).toBe(2);expect(w.ownedItemIds).toEqual(['lavender-bloom']);expect(w.presentClaims).toEqual([gift.id]);expect(w.presentClaimDates?.[gift.id]).toBeDefined();expect(parseRewards(JSON.parse(localStorage.getItem(REWARD_KEY)!))).toEqual(w);
});
test('配布停止・期限・改ざん・重複IDを拒否する',async()=>{
 expect(presentAvailable({...gift,endsAt:'2021-01-01T00:00:00Z'})).toBe(false);expect(()=>parseOperatorPresents({version:1,gifts:[gift,gift]})).toThrow();expect(()=>parseOperatorPresents({version:1,gifts:[{...gift,itemIds:['unknown']}]})).toThrow();
 (global.fetch as jest.Mock).mockResolvedValue({ok:true,json:async()=>({version:1,gifts:[]})});await expect(claimOperatorPresent(gift.id)).rejects.toThrow();expect(readRewards().earned).toBe(0);
});
test('通信・保存失敗は受取済みにしない',async()=>{
 (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'));await expect(claimOperatorPresent(gift.id)).rejects.toThrow();
 jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});await expect(claimOperatorPresent(gift.id)).rejects.toThrow();expect(readRewards().presentClaims).toBeUndefined();
});
