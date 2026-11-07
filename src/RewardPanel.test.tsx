import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import RewardPanel from './RewardPanel';
import { EMPTY_REWARDS } from './rewardLedger';
import { GACHA_TYPES } from './gachaCatalog';

test('通常ガチャを含む全ガチャで、一覧から直接横スクロールのラインナップを見られる', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const root = createRoot(target);
  const onWalletChange = jest.fn();
  const wallet = { ...EMPTY_REWARDS, earned: 200, tickets: 2, loginDays: 14 };
  const click = async (element: Element | null) => {
    expect(element).not.toBeNull();
    await act(async () => { (element as HTMLButtonElement).click(); });
  };
  try {
    await act(async () => root.render(<RewardPanel wallet={wallet} error={false} section="gacha"
      roomOwnedItemIds={[]} onWalletChange={onWalletChange}
      previewForm={{id:'tablet',name:'錠剤フォルム',image:'lv1_tablet.webp'}} previewEquipment={[]} roomLayout={{}} />));
    expect(target.querySelector('.gacha-catalog-scroll')).not.toBeNull();
    expect(target.querySelectorAll('.gacha-banner')).toHaveLength(3);
    expect(target.querySelectorAll('.gacha-banner-more')).toHaveLength(3);
    expect(target.querySelector('.gacha-actions')).toBeNull();
    for (const gacha of GACHA_TYPES) {
      const lineup = Array.from(target.querySelectorAll<HTMLButtonElement>('.gacha-banner-more'))
        .find(button => button.getAttribute('aria-label')?.includes(gacha.name));
      await click(lineup || null);
      const preview = target.querySelector<HTMLElement>('.gacha-lineup-page .gacha-prize-grid');
      expect(preview).not.toBeNull();
      expect(preview?.getAttribute('aria-label')).toContain('横スクロール');
      expect(target.querySelectorAll('.gacha-prize-card')).toHaveLength(gacha.itemIds.length);
      expect(target.querySelector('.gacha-actions')).toBeNull();
      expect(onWalletChange).not.toHaveBeenCalled();
      await click(target.querySelector<HTMLButtonElement>('.gacha-prize-card'));
      expect(target.querySelector('.gacha-item-preview')).not.toBeNull();
      await click(target.querySelector<HTMLButtonElement>('.gacha-preview-close'));
      expect(target.querySelector('.gacha-item-preview')).toBeNull();
      await click(target.querySelector<HTMLButtonElement>('.gacha-back'));
      expect(target.querySelectorAll('.gacha-banner')).toHaveLength(3);
    }
  } finally {
    await act(async () => root.unmount());
    target.remove();
  }
});

test('カード選択後はガチャ説明と2種類の支払いだけ、抽選は最終確認後', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const root = createRoot(target);
  const onWalletChange = jest.fn();
  const wallet = { ...EMPTY_REWARDS, earned: 200, tickets: 2, loginDays: 14 };
  const click = async (element: Element | null) => {
    expect(element).not.toBeNull();
    await act(async () => { (element as HTMLButtonElement).click(); });
  };
  try {
    await act(async () => root.render(<RewardPanel wallet={wallet} error={false} section="gacha"
      roomOwnedItemIds={[]} onWalletChange={onWalletChange}
      previewForm={{id:'tablet',name:'錠剤フォルム',image:'lv1_tablet.webp'}} previewEquipment={[]} roomLayout={{}} />));
    await click(target.querySelectorAll<HTMLButtonElement>('.gacha-banner-main')[1]);
    expect(target.querySelector('.gacha-catalog-scroll')).toBeNull();
    expect(target.querySelector('.gacha-lineup-page')).toBeNull();
    expect(target.querySelector('.gacha-prize-grid')).toBeNull();
    expect(target.querySelector('.gacha-draw-choices')).not.toBeNull();
    expect(target.querySelectorAll('.gacha-actions button')).toHaveLength(2);
    const macaron = Array.from(target.querySelectorAll<HTMLButtonElement>('.gacha-actions button'))
      .find(button => button.textContent?.includes('マカロン'));
    await click(macaron || null);
    expect(target.querySelector('.gacha-confirm')).not.toBeNull();
    expect(onWalletChange).not.toHaveBeenCalled();
    await click(Array.from(target.querySelectorAll<HTMLButtonElement>('.gacha-confirm-buttons button'))
      .find(button => button.textContent === 'やめる') || null);
    expect(target.querySelector('.gacha-confirm')).toBeNull();
    expect(onWalletChange).not.toHaveBeenCalled();
    await click(target.querySelector<HTMLButtonElement>('.gacha-back'));
    expect(target.querySelector('.gacha-catalog-scroll')).not.toBeNull();
    await click(target.querySelectorAll<HTMLButtonElement>('.gacha-banner-more')[2]);
    await click(target.querySelector<HTMLButtonElement>('.gacha-lineup-to-draw'));
    expect(target.querySelector('.gacha-draw-choices')).not.toBeNull();
    expect(target.querySelector('.gacha-prize-grid')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    target.remove();
  }
});

test('ショップはガチャ一覧とは別画面', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div');
  document.body.appendChild(target);
  const root = createRoot(target);
  try {
    await act(async () => root.render(<RewardPanel wallet={EMPTY_REWARDS} error={false} section="shop"
      roomOwnedItemIds={[]} onWalletChange={jest.fn()}
      previewForm={{id:'tablet',name:'錠剤フォルム',image:'lv1_tablet.webp'}} previewEquipment={[]} roomLayout={{}} />));
    expect(target.querySelector('#reward-title')?.textContent).toBe('ショップ');
    expect(target.querySelector('.gacha-catalog-scroll')).toBeNull();
  } finally {
    await act(async () => root.unmount());
    target.remove();
  }
});
