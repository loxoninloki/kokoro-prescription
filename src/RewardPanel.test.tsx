import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import RewardPanel from './RewardPanel';
import { EMPTY_REWARDS } from './rewardLedger';
import { GACHA_TYPES } from './gachaCatalog';

test('ガチャは縦一覧→詳細と排出プレビュー→支払い確認の順で進む', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const root = createRoot(target);
  const onWalletChange = jest.fn();
  const wallet = { ...EMPTY_REWARDS, earned: 200, tickets: 2, loginDays: 14 };
  const click = async (label: string) => {
    const button = Array.from(target.querySelectorAll('button')).find(b =>
      b.textContent?.includes(label) || b.getAttribute('aria-label')?.includes(label));
    expect(button).toBeDefined();
    await act(async () => { button!.click(); });
  };
  try {
    await act(async () => root.render(<RewardPanel wallet={wallet} error={false} section="gacha"
      roomOwnedItemIds={[]} onWalletChange={onWalletChange} />));
    expect(target.querySelector('.gacha-catalog-scroll')).not.toBeNull();
    expect(target.querySelectorAll('.gacha-banner')).toHaveLength(GACHA_TYPES.length);
    expect(target.querySelector('.gacha-actions')).toBeNull();
    await click('衣装セレクトガチャ');
    expect(target.querySelector('.gacha-catalog-scroll')).toBeNull();
    expect(target.querySelectorAll('.gacha-prize-card')).toHaveLength(GACHA_TYPES[1].itemIds.length);
    expect(target.querySelector('.gacha-confirm')).toBeNull();
    await click('を拡大表示');
    expect(target.querySelector('.gacha-item-preview')).not.toBeNull();
    await click('ラインナップに戻る');
    expect(target.querySelector('.gacha-item-preview')).toBeNull();
    await click('マカロン');
    expect(target.querySelector('.gacha-confirm')).not.toBeNull();
    expect(onWalletChange).not.toHaveBeenCalled();
    await click('やめる');
    expect(target.querySelector('.gacha-confirm')).toBeNull();
    expect(onWalletChange).not.toHaveBeenCalled();
    await click('一覧へ');
    expect(target.querySelectorAll('.gacha-banner')).toHaveLength(3);
  } finally {
    await act(async () => root.unmount());
    target.remove();
  }
});

test('ショップはガチャ一覧とは別画面', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div');
  const root = createRoot(target);
  try {
    await act(async () => root.render(<RewardPanel wallet={EMPTY_REWARDS} error={false} section="shop"
      roomOwnedItemIds={[]} onWalletChange={jest.fn()} />));
    expect(target.querySelector('#reward-title')?.textContent).toBe('ショップ');
    expect(target.querySelector('.gacha-catalog-scroll')).toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});
