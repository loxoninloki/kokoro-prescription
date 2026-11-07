import { drawItem, EMPTY_REWARDS, PendingGachaResult, RewardState } from './rewardLedger';
import { drawCandidates, equalWeightPool, GachaType } from './gachaCatalog';

// Only the Cloudflare DEV hostname exposes this isolated, in-memory demo wallet.
// Never writes to localStorage, the production reward ledger or room inventory.
export const isDevGachaHost = () =>
  typeof window !== 'undefined' && window.location.hostname === 'kokoro-prescription-dev.pages.dev';

export const freshDevGachaWallet = (): RewardState => ({
  ...EMPTY_REWARDS,
  creditedXp: {},
  ownedItemIds: [],
  earned: 1000,
  spent: 0,
  tickets: 3,
});

export function confirmDevGachaDraw(
  wallet: RewardState,
  gacha: GachaType,
  payment: 'ticket' | 'macaron',
): { wallet: RewardState; result: PendingGachaResult } {
  if (wallet.pendingGachaResult) throw new Error('前回のテスト結果を確認してください。');
  const candidates = drawCandidates(gacha, wallet.ownedItemIds);
  if (!candidates.length) throw new Error('テスト用アイテムをすべて獲得しました。残高をリセットしてください。');
  const drawn = drawItem(wallet, {
    macaronCost: gacha.macaronCost,
    pool: equalWeightPool(candidates),
    resolveDuplicate: () => { throw new Error('抽選対象が更新されました。'); },
  }, payment);
  const id = typeof window.crypto?.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const result: PendingGachaResult = {
    id,
    itemId: drawn.itemId,
    gachaId: gacha.id,
    payment,
    amount: payment === 'ticket' ? 1 : gacha.macaronCost,
    confirmedAt: new Date().toISOString(),
  };
  return { wallet: { ...drawn.state, pendingGachaResult: result }, result };
}

export function acknowledgeDevGachaResult(wallet: RewardState, id: string): RewardState {
  if (wallet.pendingGachaResult?.id !== id) return wallet;
  const { pendingGachaResult, ...rest } = wallet;
  return rest;
}
