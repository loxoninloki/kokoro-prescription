import React, { useState } from 'react';
import { Icon } from './Icon';
import RokiCharacter from './RokiCharacter';
import HomeIllustration from './HomeIllustration';
import { MATURE_FORM, evolutionFromXp } from './evolution';
import { LOGIN_DAYS_PER_TICKET, macaronBalance, RewardState } from './rewardLedger';
import { RewardIcon } from './RewardPanel';

type Evolution = ReturnType<typeof evolutionFromXp>;
type Destination = 'home' | 'room' | 'diary' | 'medication' | 'steps' | 'meditation' | 'growth' | 'dressup' | 'rewards' | 'gacha' | 'menu';
interface Props {
  evolution: Evolution;
  displayForm: { name: string; image: string };
  equipped?: string[];
  wallet: RewardState;
  walletError: boolean;
  totalPoints: number;
  checkedIn: boolean;
  checkinDays: number;
  onCheckIn: () => void;
  onNavigate: (destination: Destination) => void;
}

const careActions = [
  ['diary', '気分・日記'], ['medication', 'お薬'], ['steps', '歩数'], ['meditation', '瞑想BGM'],
] as const;

const navigation = [
  ['diary', 'きろく', 'diary'], ['rewards', 'ショップ', 'rewards'], ['home', 'ホーム', 'home'],
  ['gacha', 'ガチャ', 'gacha'], ['dressup', 'コーデ', 'dressup'], ['menu', 'メニュー', 'menu'],
] as const;

export default function HomePage({ evolution, displayForm, equipped, wallet, walletError,
  totalPoints, checkedIn, checkinDays, onCheckIn, onNavigate }: Props) {
  const [scene, setScene] = useState<'avatar' | 'illustration'>('avatar');
  const mature = evolution.form.id === MATURE_FORM.id;
  const ticketProgress = wallet.loginDays % LOGIN_DAYS_PER_TICKET;
  const remainingXp = evolution.requiredLevelXp - evolution.currentLevelXp;

  return <div className="avatar-home">
    <header className="avatar-header">
      <h1><Icon name="brand" /> こころの処方箋</h1>
      <div className="avatar-status">
        <button type="button" className="avatar-level" aria-label="ろきちゃんの育成を見る" onClick={() => onNavigate('growth')}>
          <strong>Lv.{evolution.level}</strong>
          <progress aria-label="レベルの経験値" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} />
          <small>次まで {remainingXp} EXP</small>
        </button>
        {([
          ['macaron', 'マカロン', macaronBalance(wallet), '個'],
          ['ticket', '処方箋チケット', wallet.tickets, '枚'],
        ] as const).map(([kind, label, amount, unit]) =>
          <button className="avatar-currency" key={kind} type="button" onClick={() => onNavigate('rewards')}
            aria-label={walletError ? `${label}の残高を確認する` : `${label} ${amount.toLocaleString('ja-JP')}${unit}、ショップを開く`}>
            <RewardIcon kind={kind} /><strong>{walletError ? '—' : amount.toLocaleString('ja-JP')}</strong>
            <span className="avatar-plus" aria-hidden="true">+</span>
          </button>)}
      </div>
    </header>

    <section className="avatar-scene" aria-label="ろきちゃんと過ごす空間">
      <div className="avatar-center">
        {scene === 'avatar'
          ? <RokiCharacter key={displayForm.image} form={displayForm} equipped={equipped} size={280} />
          : <HomeIllustration />}
      </div>
      <nav className="avatar-side avatar-side-left" aria-label="ろきちゃんのメニュー">
        <button type="button" onClick={() => onNavigate('room')}><Icon name="home" /><span>ルーム</span></button>
        <button type="button" disabled={!mature} onClick={() => onNavigate('dressup')}
          aria-label={mature ? '着せ替え' : '着せ替え Lv.50で解放'}>
          <Icon name="dressup" /><span>{mature ? '着せ替え' : 'Lv.50〜'}</span>
        </button>
        <button type="button" onClick={() => onNavigate('gacha')}><Icon name="gacha" /><span>ガチャ</span></button>
        <button type="button" onClick={() => onNavigate('rewards')}><Icon name="rewards" /><span>ショップ</span></button>
      </nav>
      <nav className="avatar-side avatar-side-right" aria-label="ホームの表示とメニュー">
        <button type="button" onClick={() => setScene(previous => previous === 'avatar' ? 'illustration' : 'avatar')}
          aria-label={scene === 'avatar' ? 'イラスト表示へ切り替え' : 'アバター表示へ切り替え'}>
          <Icon name="scene" /><span>表示切替</span>
        </button>
        <button type="button" onClick={() => onNavigate('menu')}><Icon name="menu" /><span>メニュー</span></button>
      </nav>
    </section>

    <nav className="avatar-care" aria-label="セルフケアのクイックメニュー">
      {careActions.map(([target, label]) =>
        <button key={target} type="button" onClick={() => onNavigate(target)}><Icon name={target} /><span>{label}</span></button>)}
    </nav>

    <button type="button" className="avatar-growth" onClick={() => onNavigate('growth')} aria-label={`ろきちゃん育成 Lv.${evolution.level}を開く`}>
      <span className="avatar-mini"><RokiCharacter key={displayForm.image} form={displayForm} equipped={equipped} size={48} /></span>
      <span className="avatar-growth-text">
        <span className="avatar-growth-title"><strong>ろきちゃん Lv.{evolution.level}</strong><span>{evolution.form.name}</span></span>
        <span className="avatar-growth-xp">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp} EXP · あと {remainingXp} EXP</span>
        <progress aria-label="ろきちゃんの経験値" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} />
        <span className="avatar-growth-next">{evolution.nextLevel ? `次の進化は Lv.${evolution.nextLevel}` : '成熟フォルムに到達しました'}</span>
      </span>
    </button>

    <section className="avatar-login" aria-label="ログインとチェックイン">
      <div className="avatar-login-heading"><span>処方箋チケットまで {ticketProgress}/{LOGIN_DAYS_PER_TICKET}日</span>
        <span>累積ログイン {wallet.loginDays}日</span></div>
      <progress aria-label="処方箋チケットの進捗" value={ticketProgress} max={LOGIN_DAYS_PER_TICKET} />
      <div className="avatar-checkin">
        <span>チェックイン {checkinDays}日 · {totalPoints.toLocaleString('ja-JP')} EXP</span>
        <button type="button" onClick={onCheckIn} disabled={checkedIn}>{checkedIn ? 'チェックイン済み ✓' : 'チェックイン'}</button>
      </div>
      {walletError && <p role="status">報酬の保存状態を確認できませんでした。</p>}
    </section>

    <nav className="avatar-bottom" aria-label="ホームナビゲーション">
      {navigation.map(([target, label, icon]) =>
        <button key={target} type="button" aria-current={target === 'home' ? 'page' : undefined}
          disabled={target === 'dressup' && !mature} onClick={() => onNavigate(target)}
          aria-label={target === 'dressup' && !mature ? 'コーデ Lv.50で解放' : label}>
          <Icon name={icon} /><span>{label}</span>
        </button>)}
    </nav>
  </div>;
}
