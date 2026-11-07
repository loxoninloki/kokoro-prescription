import React from 'react';
import { Icon } from './Icon';

const navigation = [
  ['room', 'ルーム', 'room'], ['rewards', 'ショップ', 'rewards'], ['home', 'ホーム', 'home'],
  ['gacha', 'ガチャ', 'gacha'], ['dressup', 'コーデ', 'dressup'], ['menu', 'メニュー', 'menu'],
] as const;

export default function BottomNavigation({ page, onNavigate }: {
  page: string;
  onNavigate: (page: 'home' | 'room' | 'rewards' | 'gacha' | 'dressup' | 'menu') => void;
}) {
  const active = ['backup', 'invite'].includes(page) ? 'menu' : page;
  return <nav className="avatar-bottom app-bottom-navigation" aria-label="ホームナビゲーション">
    {navigation.map(([target, label, icon]) =>
      <button key={target} type="button" aria-current={active === target ? 'page' : undefined} onClick={() => onNavigate(target)}>
        <Icon name={icon} /><span>{label}</span>
      </button>)}
  </nav>;
}
