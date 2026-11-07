import React, { useState } from 'react';
import { Icon } from './Icon';
import RokiCharacter from './RokiCharacter';
import RoomStage from './RoomStage';
import type { RoomState } from './interior';
import HomeIllustration from './HomeIllustration';
import PresentBox from './PresentBox';
import { evolutionFromXp } from './evolution';
import { LOGIN_DAYS_PER_TICKET, macaronBalance, RewardState } from './rewardLedger';
import { RewardIcon } from './RewardPanel';

type Evolution = ReturnType<typeof evolutionFromXp>;
const scenes = ['avatar', 'illustration', 'room'] as const;
type Scene = typeof scenes[number];
const sceneLabels: Record<Scene, string> = { avatar: 'ろきちゃん', illustration: 'イラスト', room: 'ルーム' };
type Destination = 'home' | 'room' | 'diary' | 'medication' | 'steps' | 'meditation' | 'growth' | 'dressup' | 'rewards' | 'gacha' | 'menu';
interface Props {
  onLoginRewards: () => void;
  evolution: Evolution;
  level: number;
  displayForm: { name: string; image: string };
  room: RoomState;
  equipped?: string[];
  wallet: RewardState;
  onWalletChange:(wallet:RewardState)=>void;
  realWallet?: RewardState;
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

export default function HomePage({ onLoginRewards, evolution, level, displayForm, room, equipped, wallet, realWallet, walletError,
  totalPoints, checkedIn, checkinDays, onCheckIn, onNavigate,onWalletChange }: Props) {
  const [scene, setScene] = useState<Scene>('avatar');
  const nextScene = scenes[(scenes.indexOf(scene) + 1) % scenes.length];
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
          : scene === 'illustration'
            ? <HomeIllustration />
            : <RoomStage layout={room.layout} form={displayForm} equipped={equipped} compact />}
      </div>
      <span className="avatar-scene-label" role="status" aria-live="polite">{sceneLabels[scene]}</span>
      <nav className="avatar-side avatar-side-right" aria-label="ホームの表示切替">
        <button type="button" onClick={() => setScene(nextScene)}
          aria-label={`${sceneLabels[nextScene]}表示へ切り替え`} title={`次：${sceneLabels[nextScene]}`}>
          <Icon name="scene" /><span>表示切替</span>
        </button>
        <PresentBox wallet={realWallet ?? wallet} room={room} level={level} onWalletChange={onWalletChange}/>
      </nav>
    </section>

    <nav className="avatar-care" aria-label="セルフケアのクイックメニュー">
      {careActions.map(([target, label]) =>
        <button key={target} type="button" onClick={() => onNavigate(target)}><Icon name={target} /><span>{label}</span></button>)}
    </nav>

    <section className="home-progress avatar-progress">
      <div className="home-progress-grid avatar-summary-grid">
        <GrowthSummaryCard {...{ evolution, displayForm, equipped, onNavigate }} />
        <TicketProgressCard wallet={realWallet ?? wallet} walletError={walletError} />
      </div>
      <CheckInCompactCard {...{ checkinDays, totalPoints, checkedIn, onCheckIn }} /><button className="login-reward-link" type="button" onClick={onLoginRewards}>累積ログイン報酬を見る</button>
    </section>


  </div>;
}

function GrowthSummaryCard({ evolution, displayForm, equipped, onNavigate }: Pick<Props, 'evolution' | 'displayForm' | 'equipped' | 'onNavigate'>) {
 return (
    <button type="button" className="avatar-growth" onClick={() => onNavigate('growth')} aria-label={`ろきちゃん育成 Lv.${evolution.level}を開く`}>
      <span className="avatar-mini"><RokiCharacter key={displayForm.image} form={displayForm} equipped={equipped} size={48} /></span>
      <span className="avatar-growth-text">
        <span className="avatar-growth-title"><strong>Lv.{evolution.level}</strong><span>{displayForm.name}</span></span>
        <span className="avatar-growth-xp">EXP {evolution.currentLevelXp} / {evolution.requiredLevelXp}</span>
        <progress aria-label="ろきちゃんの経験値" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} />
        <span className="avatar-growth-next">{evolution.nextLevel ? `次の進化は Lv.${evolution.nextLevel}` : '成熟フォルムに到達しました'}</span>
      </span>
    </button>
 );
}

function TicketProgressCard({ wallet, walletError }: Pick<Props, 'wallet' | 'walletError'>) {
 const ticketProgress = wallet.loginDays % LOGIN_DAYS_PER_TICKET;
 return (
    <section className="avatar-login" aria-label="処方箋チケットの進捗情報">
      <Icon name="backup" /><div className="avatar-login-heading"><span>処方箋チケットまで <strong>{ticketProgress}/{LOGIN_DAYS_PER_TICKET}日</strong></span>
        <span>累積ログイン {wallet.loginDays}日</span></div>
      <progress aria-label="処方箋チケットの進捗" value={ticketProgress} max={LOGIN_DAYS_PER_TICKET} />
      {walletError && <p role="status">報酬の保存状態を確認できませんでした。</p>}
    </section>
 );
}

function CheckInCompactCard({ checkinDays, totalPoints, checkedIn, onCheckIn }: Pick<Props, 'checkinDays' | 'totalPoints' | 'checkedIn' | 'onCheckIn'>) {
 return (
<section className="avatar-checkin avatar-checkin-compact" aria-label="チェックイン">
      <span>チェックイン {checkinDays}日<span className="checkin-total-xp"> · {totalPoints.toLocaleString('ja-JP')} EXP</span></span>
      <button type="button" onClick={onCheckIn}>{checkedIn ? '今日のスタンプ ✓' : 'スタンプ履歴'}</button>
    </section>
 );
}
