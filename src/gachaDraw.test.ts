import {confirmGachaDraw,acknowledgeGachaResult} from './gachaDraw';
import {EMPTY_REWARDS,REWARD_KEY,readRewards,parseRewards} from './rewardLedger';
import {GACHA_TYPES,equalWeightPool} from './gachaCatalog';
import {gachaRarity,APPROVED_ITEM_RARITIES} from './gachaRarity';
beforeEach(()=>{localStorage.clear();localStorage.setItem(REWARD_KEY,JSON.stringify({...EMPTY_REWARDS,earned:200,tickets:2,loginDays:14}));});
test.each(['macaron','ticket'] as const)('%s消費と所有・未確認結果を1回で保存し、OKで所有を保持する',async payment=>{
 const random=jest.spyOn(Math,'random').mockReturnValue(0);
 const {wallet,result}=await confirmGachaDraw(GACHA_TYPES[0],payment,[]);
 expect(wallet.spent).toBe(payment==='macaron'?50:0);expect(wallet.tickets).toBe(payment==='ticket'?1:2);
 expect(result.itemId).toBe(GACHA_TYPES[0].itemIds[0]);
 expect(readRewards().pendingGachaResult).toEqual(result);
 expect(readRewards().ownedItemIds).toContain(result.itemId);
 await expect(confirmGachaDraw(GACHA_TYPES[0],payment,[])).rejects.toThrow('前回');
 expect(readRewards().spent).toBe(wallet.spent);expect(readRewards().tickets).toBe(wallet.tickets);
 const unchanged=await acknowledgeGachaResult('different-tab-result');expect(unchanged.pendingGachaResult).toEqual(result);
 const acknowledged=await acknowledgeGachaResult(result.id);expect(acknowledged.pendingGachaResult).toBeUndefined();
 expect(acknowledged.ownedItemIds).toEqual(wallet.ownedItemIds);expect(acknowledged.spent).toBe(wallet.spent);
 random.mockRestore();
});
test('同一アイテムを2回引くと所持数×2になり、通貨は2回だけ消費する',async()=>{
 const random=jest.spyOn(Math,'random').mockReturnValue(0);
 try {
  const first=await confirmGachaDraw(GACHA_TYPES[0],'macaron',[]);
  const id=first.result.itemId;
  expect(first.wallet.itemCounts?.[id]).toBe(1);
  await acknowledgeGachaResult(first.result.id);
  const second=await confirmGachaDraw(GACHA_TYPES[0],'macaron',[]);
  expect(second.result.itemId).toBe(id);
  expect(second.wallet.itemCounts?.[id]).toBe(2);
  expect(second.wallet.ownedItemIds.filter(item=>item===id)).toHaveLength(1);
  expect(second.wallet.spent).toBe(100);
 } finally {random.mockRestore();}
});
test('旧所持品だけの保存データも重複取得時は×2へ移行する',async()=>{
 const id=GACHA_TYPES[0].itemIds[0];
 localStorage.setItem(REWARD_KEY,JSON.stringify({...EMPTY_REWARDS,earned:200,ownedItemIds:[id]}));
 const random=jest.spyOn(Math,'random').mockReturnValue(0);
 try { const result=await confirmGachaDraw(GACHA_TYPES[0],'macaron',[]);
  expect(result.wallet.itemCounts?.[id]).toBe(2);
 } finally {random.mockRestore();}
});
test('保存失敗で消費や結果が保存されない・再抽選は発生しない',async()=>{
 const before=localStorage.getItem(REWARD_KEY),random=jest.spyOn(Math,'random').mockReturnValue(0);
 const set=jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
 await expect(confirmGachaDraw(GACHA_TYPES[0],'macaron',[])).rejects.toThrow('quota');
 expect(localStorage.getItem(REWARD_KEY)).toBe(before);set.mockRestore();random.mockRestore();
});
test('並行確認も未確認結果のロックで1回しか消費しない',async()=>{
 const outcomes=await Promise.allSettled([confirmGachaDraw(GACHA_TYPES[0],'macaron',[]),confirmGachaDraw(GACHA_TYPES[0],'macaron',[])]);
 expect(outcomes.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(readRewards().spent).toBe(50);expect(readRewards().ownedItemIds).toHaveLength(1);
});
test('レア分類未承認は全て通常、表示指定で抽選プールは変わらない',()=>{
 expect(Object.keys(APPROVED_ITEM_RARITIES)).toHaveLength(0);
 const ids=GACHA_TYPES[0].itemIds,pool=equalWeightPool(ids);
 ids.forEach(id=>expect(gachaRarity(id)).toBe('normal'));
 expect(gachaRarity(ids[0],{[ids[0]]:'highest'})).toBe('highest');expect(equalWeightPool(ids)).toEqual(pool);
});
test('古い台帳はそのまま読め、所持していない未確認結果は拒否する',()=>{
 expect(parseRewards(EMPTY_REWARDS)).toEqual(EMPTY_REWARDS);
 expect(()=>parseRewards({...EMPTY_REWARDS,pendingGachaResult:{id:'a',itemId:'fake',gachaId:'standard',payment:'macaron',amount:50,confirmedAt:new Date().toISOString()}})).toThrow('確定結果');
});
