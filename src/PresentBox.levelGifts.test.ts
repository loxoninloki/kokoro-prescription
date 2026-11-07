import { syncPresentReceipts, receivePresent, PRESENT_KEY } from './PresentBox';
import { EMPTY_REWARDS } from './rewardLedger';
import { EMPTY_ROOM } from './interior';

beforeEach(() => localStorage.clear());

const giftEntries = () => {
  const raw = localStorage.getItem(PRESENT_KEY);
  return (JSON.parse(raw || '{"entries":[]}').entries as Array<{id:string;receivedAt?:string}>)
    .filter(entry => entry.id.startsWith('form:'));
};

test('reaching a level queues a gift without granting ownership', () => {
  syncPresentReceipts(EMPTY_REWARDS, EMPTY_ROOM, 10);
  expect(giftEntries().map(e => e.id)).toEqual(['form:growth-gift-development']);
  expect(giftEntries()[0].receivedAt).toBeUndefined();
  expect(EMPTY_REWARDS.ownedItemIds).toEqual([]);
});

test('skipping levels queues every milestone once', () => {
  syncPresentReceipts(EMPTY_REWARDS, EMPTY_ROOM, 50);
  syncPresentReceipts(EMPTY_REWARDS, EMPTY_ROOM, 50);
  expect(giftEntries()).toHaveLength(5);
  expect(new Set(giftEntries().map(e => e.id)).size).toBe(5);
});

test('gifts previously owned remain received, not pending', () => {
  const wallet = {...EMPTY_REWARDS, ownedItemIds:['growth-gift-development']};
  syncPresentReceipts(wallet, EMPTY_ROOM, 50);
  const ownedGift = giftEntries().find(e => e.id === 'form:growth-gift-development');
  expect(ownedGift?.receivedAt).toBeTruthy();
  expect(giftEntries().filter(e => !e.receivedAt)).toHaveLength(4);
});

test('received gifts do not reappear as pending on next sync', () => {
  syncPresentReceipts(EMPTY_REWARDS, EMPTY_ROOM, 10);
  receivePresent('form:growth-gift-development');
  syncPresentReceipts({...EMPTY_REWARDS, ownedItemIds:['growth-gift-development']}, EMPTY_ROOM, 10);
  expect(giftEntries()).toHaveLength(1);
  expect(giftEntries()[0].receivedAt).toBeTruthy();
});
