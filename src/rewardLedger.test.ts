import { creditXp, drawItem, EMPTY_REWARDS, macaronBalance, purchaseItem, readRewards, registerLogin, REWARD_KEY, tokyoDay, updateRewards } from './rewardLedger';
import { collectXpEvents } from './xpEvents';
import { evolutionFromXp } from './evolution';

test('旧記録のXPを初回に付与し、再起動と同じ記録の編集で重複しない', async () => {
  localStorage.clear();
  const date = '2026-11-06';
  const events = collectXpEvents([date], { [date]: { mood: 4, text: '日記' } },
    { medicines: [], taken: {} }, { [date]: 1000 }, {});
  const initial = await updateRewards(state => creditXp(state, events));
  expect(macaronBalance(initial)).toBe(25);
  expect(creditXp(readRewards(), events)).toEqual(initial);
  const improved = creditXp(initial, { ...events, ['steps:' + date]: 30 });
  expect(macaronBalance(improved)).toBe(50);
  expect(creditXp(improved, events)).toBe(improved);
  expect(creditXp(improved, { ...events, ['steps:' + date]: 30 })).toBe(improved);
  const bought = purchaseItem(improved, 'test-item', 20);
  expect(macaronBalance(bought)).toBe(30);
  expect(evolutionFromXp(bought.earned).level).toBe(evolutionFromXp(improved.earned).level);
});

test('日本時間の午前0時に切り替え、同日と時計の巻き戻しを数えない', () => {
  expect(tokyoDay(new Date('2026-11-06T14:59:59Z'))).toBe('2026-11-06');
  expect(tokyoDay(new Date('2026-11-06T15:00:00Z'))).toBe('2026-11-07');
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(2026, 0, 1 + i * 2)).toISOString().slice(0, 10));
  const first = days.slice(0, 7).reduce(registerLogin, EMPTY_REWARDS);
  expect(first).toMatchObject({ loginDays: 7, tickets: 1 });
  expect(registerLogin(first, days[0])).toBe(first);
  expect(registerLogin(first, days[6])).toBe(first);
  expect(days.slice(7).reduce(registerLogin, first)).toMatchObject({ loginDays: 14, tickets: 2 });
});

test('共通の抽選設定で両方の通貨を使用し、エラー時は保存しない', async () => {
  localStorage.clear();
  const original = { ...EMPTY_REWARDS, earned: 150, tickets: 1, loginDays: 7 };
  await updateRewards(() => original);
  const config = { macaronCost: 100, pool: [{ id: 'test-a', weight: 6000 }, { id: 'test-b', weight: 4000 }],
    resolveDuplicate: () => { throw new Error('duplicate fixture'); } };
  const ticket = drawItem(original, config, 'ticket', () => .8);
  const macaron = drawItem(original, config, 'macaron', () => .8);
  expect(ticket.state).toMatchObject({ tickets: 0, spent: 0, ownedItemIds: ['test-b'] });
  expect(macaron.state).toMatchObject({ tickets: 1, spent: 100, ownedItemIds: ['test-b'] });
  await expect(updateRewards(state => drawItem(state, { ...config, pool: [{ id: 'bad', weight: 9999 }] }, 'ticket').state)).rejects.toThrow();
  await expect(updateRewards(state => drawItem({ ...state, tickets: 0 }, config, 'ticket').state)).rejects.toThrow();
  expect(JSON.parse(localStorage.getItem(REWARD_KEY) || '')).toEqual(original);
  const fail = jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('quota'); });
  try {
    await expect(updateRewards(state => drawItem(state, config, 'ticket', () => .8).state)).rejects.toThrow('quota');
    expect(readRewards()).toEqual(original);
  } finally { fail.mockRestore(); }
});
