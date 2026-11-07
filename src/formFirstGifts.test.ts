import { giftForForm, FIRST_GIFT_IDS, FORM_FIRST_GIFTS } from './formFirstGifts';
import { ITEMS } from './appearance';
import { EMPTY_REWARDS } from './rewardLedger';

test('各進化フォルムに専用の衣装エフェクトが存在し、該当フォルムで使える',()=>{
  expect(FIRST_GIFT_IDS).toHaveLength(5);
  expect(new Set(FIRST_GIFT_IDS).size).toBe(5);
  for(const [id,level] of [['development',10],['birth',20],['growth',30],['mature',50],['human',50]] as const){
    const gift=giftForForm(id,level);
    expect(gift).not.toBeNull();
    expect(gift?.item.category).toBe('effects');
    expect(gift?.item.supportedForms).toContain(id);
    expect(ITEMS.some(i=>i.id===FORM_FIRST_GIFTS[id])).toBe(true);
    expect(giftForForm(id,level-1)).toBeNull();
  }
  expect(giftForForm('tablet',1)).toBeNull();
});

test('所持品を用いた記念アイテム受け取りは一度きりで、残高や経験値を変えない',()=>{
  const itemId=giftForForm('development',10)!.item.id;
  const grant=(state:typeof EMPTY_REWARDS)=>state.ownedItemIds.includes(itemId)
    ? state : {...state,ownedItemIds:[...state.ownedItemIds,itemId]};
  const earned=grant(EMPTY_REWARDS);
  expect(earned.ownedItemIds).toEqual([itemId]);
  expect(grant(earned)).toBe(earned);
  expect(earned.earned).toBe(EMPTY_REWARDS.earned);
  expect(earned.tickets).toBe(EMPTY_REWARDS.tickets);
  expect(earned.spent).toBe(EMPTY_REWARDS.spent);
});
