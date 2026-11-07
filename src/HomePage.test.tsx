import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import HomePage from './HomePage';
import { EMPTY_ROOM } from './interior';
import { EMPTY_REWARDS } from './rewardLedger';
import { evolutionFromXp } from './evolution';

test('home scene cycles through character, illustration and saved room without changing room data', async () => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const element = document.createElement('div');
  document.body.appendChild(element);
  const root = createRoot(element);
  const room = {
    ...EMPTY_ROOM,
    layout: { wallpaper: 'wall-night', floor: 'floor-basic', desk: 'desk-basic' },
  };
  const props = {
    onLoginRewards: jest.fn(),
    evolution: evolutionFromXp(0),
    displayForm: { name: '錠剤', image: 'tablet.webp' },
    room,
    equipped: [],
    wallet: EMPTY_REWARDS,
    walletError: false,
    totalPoints: 0,
    checkedIn: false,
    checkinDays: 0,
    onCheckIn: jest.fn(),
    onNavigate: jest.fn(),
  };

  const clickNext = async () => {
    const button = element.querySelector<HTMLButtonElement>('.avatar-side-right button');
    expect(button).not.toBeNull();
    await act(async () => { button!.click(); });
  };

  try {
    await act(async () => { root.render(<HomePage {...props} />); });
    expect(element.querySelector('.avatar-room-preview')).toBeNull();
    expect(element.querySelector('.roki-character')).not.toBeNull();

    await clickNext();
    expect(element.querySelector('.kokoro-hero-art')).not.toBeNull();

    await clickNext();
    const preview = element.querySelector<HTMLElement>('.avatar-room-preview');
    expect(preview).not.toBeNull();
    expect(preview!.style.background).toBe('rgb(158, 146, 192)');
    expect(preview!.querySelector('.interior-desk')).not.toBeNull();
    expect(preview!.querySelector('.roki-character')).not.toBeNull();

    await act(async () => { root.render(<HomePage {...props} room={{ ...room, layout: { ...room.layout, desk: null } }} />); });
    expect(element.querySelector('.avatar-room-preview .interior-desk')).toBeNull();

    await clickNext();
    expect(element.querySelector('.avatar-room-preview')).toBeNull();
    expect(element.querySelector('.roki-character')).not.toBeNull();
    expect(props.onNavigate).not.toHaveBeenCalled();
  } finally {
    await act(async () => { root.unmount(); });
    element.remove();
  }
});
