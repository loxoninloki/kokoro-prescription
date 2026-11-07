import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import LoginRewards from './LoginRewards';
import { INTERIOR_ITEMS, readRoom } from './interior';

test('スタンプ帳の期間切替・正式報酬詳細・報酬通知を保存処理なしで表示する', async () => {
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
 const host=document.createElement('div');document.body.appendChild(host);
 const root=createRoot(host);const close=jest.fn();
 const before=JSON.stringify({...localStorage});
 try {
  await act(async()=>root.render(<LoginRewards days={7} room={readRoom()} onClose={close} stampDay={7} receipt={{xp:10,tickets:1,furnitureIds:[INTERIOR_ITEMS[0].id]}}/>));
  expect(host.querySelectorAll('.stamp-calendar article')).toHaveLength(30);
  expect(host.querySelectorAll('[data-stamped=true]')).toHaveLength(7);
  expect(host.querySelector('[data-today=true] small')?.textContent).toBe('7日目');
  expect(host.querySelector('.stamp-receipt')?.textContent).toContain('処方箋チケット +1');
  const reward=host.querySelector<HTMLButtonElement>('[data-special=true] .stamp-info')!;
  await act(async()=>reward.click());
  expect(host.querySelector('.stamp-detail')?.textContent).toContain('累積');
  expect(reward.getAttribute('aria-expanded')).toBe('true');
  const buttons=host.querySelectorAll<HTMLButtonElement>('.stamp-pagination button');
  expect(buttons[0].disabled).toBe(true);
  await act(async()=>buttons[1].click());
  expect(host.querySelector('.stamp-pagination b')?.textContent).toBe('31〜60日');
  expect(host.querySelector('.stamp-detail')).toBeNull();
  await act(async()=>buttons[0].click());
  expect(host.querySelector('.stamp-pagination b')?.textContent).toBe('1〜30日');
  expect(JSON.stringify({...localStorage})).toBe(before);
  await act(async()=>host.querySelector<HTMLButtonElement>('.stamp-heading button')!.click());
  expect(close).toHaveBeenCalledTimes(1);
 } finally {await act(async()=>root.unmount());host.remove();}
});
