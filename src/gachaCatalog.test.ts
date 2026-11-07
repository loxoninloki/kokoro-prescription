import { GACHA_TYPES, drawCandidates, equalWeightPool, isInteriorPrize } from './gachaCatalog';
import { drawItem, EMPTY_REWARDS } from './rewardLedger';
import { ITEMS } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import { FIRST_GIFT_IDS } from './formFirstGifts';

test('3種類のガチャは用途別のラインナップを持ち、あとから追加可能', () => {
  expect(GACHA_TYPES.map(g => g.name)).toEqual(['通常ガチャ', 'ファッションセレクトガチャ', 'インテリアセレクトガチャ']);
  expect(GACHA_TYPES[0].itemIds).toHaveLength(ITEMS.length - FIRST_GIFT_IDS.length + INTERIOR_ITEMS.length);
  expect(GACHA_TYPES[1].itemIds).toEqual(ITEMS.filter(item => !FIRST_GIFT_IDS.includes(item.id)).map(item => item.id));
  expect(GACHA_TYPES[2].itemIds).toEqual(INTERIOR_ITEMS.map(item => item.id));
  expect(GACHA_TYPES[1].itemIds.every(id => !isInteriorPrize(id))).toBe(true);
  expect(GACHA_TYPES[2].itemIds.every(isInteriorPrize)).toBe(true);
});

test('既に所持している家具や服は抽選対象から除外し、排出確率が合計100%', () => {
  const gacha = GACHA_TYPES[2];
  const owned = [gacha.itemIds[0], gacha.itemIds[1]];
  const candidates = drawCandidates(gacha, owned);
  expect(candidates).toHaveLength(gacha.itemIds.length - 2);
  expect(candidates).not.toContain(owned[0]);
  const pool = equalWeightPool(candidates);
  expect(pool.reduce((total, item) => total + item.weight, 0)).toBe(10000);
  expect(Math.max(...pool.map(p => p.weight)) - Math.min(...pool.map(p => p.weight))).toBeLessThanOrEqual(1);
});

test('セレクトガチャは既存の抽選処理とチケット・マカロン残高を使用する', () => {
  const gacha = GACHA_TYPES[1];
  const first = gacha.itemIds[0];
  const state = { ...EMPTY_REWARDS, earned: 100, tickets: 1, loginDays: 7 };
  const config = {
    macaronCost: gacha.macaronCost,
    pool: equalWeightPool(drawCandidates(gacha, [])),
    resolveDuplicate: () => { throw new Error('duplicate'); },
  };
  const ticket = drawItem(state, config, 'ticket', () => 0);
  expect(ticket.itemId).toBe(first);
  expect(ticket.state).toMatchObject({ tickets: 0, spent: 0, ownedItemIds: [first] });
  const macaron = drawItem(state, config, 'macaron', () => 0);
  expect(macaron.state).toMatchObject({ tickets: 1, spent: gacha.macaronCost, ownedItemIds: [first] });
  expect(state).toMatchObject({ tickets: 1, spent: 0, ownedItemIds: [] });
});

test('フォルムの初回ボーナスはガチャ排出対象に入らない',()=>{
 for (const gacha of GACHA_TYPES) for(const id of FIRST_GIFT_IDS)expect(gacha.itemIds).not.toContain(id);
});
