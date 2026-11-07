import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import RewardPanel from './RewardPanel';
import { EMPTY_REWARDS, REWARD_KEY } from './rewardLedger';
import { EMPTY_ROOM, ROOM_KEY } from './interior';
import { APPEARANCE_KEY, DEFAULT_APPEARANCE } from './appearance';

const form = { id: 'tablet' as const, name: '錠剤フォルム', image: 'lv1_tablet.webp' };
const click = async (el: Element | null) => {
  expect(el).not.toBeNull();
  await act(async () => { (el as HTMLButtonElement).click(); });
};
function byName(root: HTMLElement, name: string) {
  return Array.from(root.querySelectorAll<HTMLButtonElement>('.gacha-prize-card'))
    .find(el => el.getAttribute('aria-label')?.includes(name)) || null;
}

test('未所持衣装を試着・解除しても所持品や残高は変わらない', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  localStorage.setItem(REWARD_KEY, JSON.stringify(EMPTY_REWARDS));
  localStorage.setItem(ROOM_KEY, JSON.stringify(EMPTY_ROOM));
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(DEFAULT_APPEARANCE));
  const before = [REWARD_KEY, ROOM_KEY, APPEARANCE_KEY].map(key => localStorage.getItem(key));
  const target = document.createElement('div'); document.body.appendChild(target);
  const root = createRoot(target);
  const onWalletChange = jest.fn();
  try {
    await act(async () => root.render(<RewardPanel wallet={EMPTY_REWARDS} error={false}
      section="gacha" roomOwnedItemIds={[]} onWalletChange={onWalletChange}
      previewForm={form} previewEquipment={[]} roomLayout={{}} />));
    await click(target.querySelectorAll('.gacha-banner-more')[1]);
    await click(byName(target, '月夜のきらめき'));
    expect(target.querySelector('.gacha-tryon-start')).not.toBeNull();
    await click(target.querySelector('.gacha-tryon-start'));
    expect(target.querySelector('.gacha-tryon-badge')?.textContent).toContain('お試し中');
    expect(target.querySelectorAll('.gacha-tryon-character img[src*="moon_sparkles_floor.svg"]')).toHaveLength(1);
    const reset = Array.from(target.querySelectorAll<HTMLButtonElement>('.gacha-tryon-actions button'))
      .find(el => el.textContent?.includes('元に戻す')) || null;
    await click(reset);
    expect(target.querySelector('.gacha-tryon-badge')?.textContent).toContain('元の状態');
    expect(target.querySelector('.gacha-tryon-character img[src*="moon_sparkles_floor.svg"]')).toBeNull();
    const again = Array.from(target.querySelectorAll<HTMLButtonElement>('.gacha-tryon-actions button'))
      .find(el => el.textContent?.includes('もう一度お試し')) || null;
    await click(again);
    expect(target.querySelector('.gacha-tryon-character img[src*="moon_sparkles_floor.svg"]')).not.toBeNull();
    await click(target.querySelector('.gacha-preview-close'));
    expect(target.querySelector('.gacha-tryon-stage')).toBeNull();
    expect(onWalletChange).not.toHaveBeenCalled();
    expect([REWARD_KEY, ROOM_KEY, APPEARANCE_KEY].map(key => localStorage.getItem(key))).toEqual(before);
  } finally {
    await act(async () => root.unmount()); target.remove();
    localStorage.clear();
  }
});

test('ガチャ内の未所持家具は保存中のルームに仮配置でき、元へ戻せる', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div'); document.body.appendChild(target);
  const root = createRoot(target);
  const roomLayout = { wallpaper: 'wall-basic', floor: 'floor-basic', desk: 'desk-basic' };
  try {
    await act(async () => root.render(<RewardPanel wallet={EMPTY_REWARDS} error={false}
      section="gacha" roomOwnedItemIds={[]} onWalletChange={jest.fn()}
      previewForm={form} previewEquipment={[]} roomLayout={roomLayout} />));
    await click(target.querySelectorAll('.gacha-banner-more')[2]);
    await click(byName(target, '夜空の壁紙'));
    await click(target.querySelector('.gacha-tryon-start'));
    expect(target.querySelector('.gacha-tryon-room .interior-stage')).not.toBeNull();
    expect((target.querySelector('.gacha-tryon-room .interior-stage') as HTMLElement).style.background).toBe('rgb(158, 146, 192)');
    await click(target.querySelector('.gacha-tryon-actions button'));
    expect((target.querySelector('.gacha-tryon-room .interior-stage') as HTMLElement).style.background).toBe('rgb(238, 227, 246)');
    expect(roomLayout.wallpaper).toBe('wall-basic');
  } finally {
    await act(async () => root.unmount()); target.remove();
  }
});

test('現在のフォルムに非対応の帽子は誤った試着をしない', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const target = document.createElement('div'); document.body.appendChild(target);
  const root = createRoot(target);
  try {
    await act(async () => root.render(<RewardPanel wallet={EMPTY_REWARDS} error={false}
      section="gacha" roomOwnedItemIds={[]} onWalletChange={jest.fn()}
      previewForm={form} previewEquipment={[]} roomLayout={{}} />));
    await click(target.querySelectorAll('.gacha-banner-more')[1]);
    await click(byName(target, '星夜のベレー帽'));
    expect(target.querySelector('.gacha-tryon-start')).toBeNull();
    expect(target.querySelector('.gacha-tryon-unsupported')?.textContent).toContain('対応するフォルム');
  } finally {
    await act(async () => root.unmount()); target.remove();
  }
});
