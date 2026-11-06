import React from 'react';
import { ITEMS } from './appearance';
import { LOGIN_DAYS_PER_TICKET, macaronBalance, RewardState, TICKET_DRAW_COST } from './rewardLedger';

export function RewardIcon({ kind }: { kind: 'macaron' | 'ticket' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="reward-icon"
    fill="#e7ccfa" stroke="#704397" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
    {kind === 'macaron' ? <>
      <path d="M3 12v3c0 3 4 5 9 5s9-2 9-5v-3" />
      <path d="M3 13c2 4 16 4 18 0" fill="none" />
      <ellipse cx="12" cy="10" rx="9" ry="5" />
      <path d="M12 7.5v5m-2.5-2.5h5" fill="none" />
    </> : <>
      <path d="M3 6h18v4a2 2 0 0 0 0 4v4H3v-4a2 2 0 0 0 0-4V6Z" />
      <path d="M10 9v6m-3-3h6m4-3h1m-1 3h1m-1 3h1" fill="none" />
    </>}
  </svg>;
}

function RewardBalances({ wallet }: { wallet: RewardState }) {
  return <span className="reward-balances">
    <span><RewardIcon kind="macaron" /> マカロン {macaronBalance(wallet).toLocaleString('ja-JP')}個</span>
    <span><RewardIcon kind="ticket" /> 処方箋チケット {wallet.tickets.toLocaleString('ja-JP')}枚</span>
  </span>;
}

export default function RewardPanel({ wallet, error }: { wallet: RewardState; error: boolean }) {
  const [section, setSection] = React.useState<'gacha' | 'shop'>('shop');
  const progress = wallet.loginDays % LOGIN_DAYS_PER_TICKET;
  return <section className="reward-panel" aria-labelledby="reward-title">
    <h1 id="reward-title">ショップ</h1>
    {error ? <p role="status">報酬データを保存または読み込みできませんでした。</p> : <>
      <RewardBalances wallet={wallet} />
      <p><label htmlFor="ticket-progress">次の処方箋チケットまで {progress}/{LOGIN_DAYS_PER_TICKET}日</label></p>
      <progress id="ticket-progress" value={progress} max={LOGIN_DAYS_PER_TICKET} />
      <p>あと{LOGIN_DAYS_PER_TICKET - progress}日。間が空いても、これまでの日数は残ります。</p>
    </>}
    <div className="wardrobe-options" role="group" aria-label="ショップメニュー">
      <button type="button" aria-pressed={section === 'gacha'} onClick={() => setSection('gacha')}>ガチャ</button>
      <button type="button" aria-pressed={section === 'shop'} onClick={() => setSection('shop')}>ショップ</button>
    </div>
    {section === 'gacha' ? <>
      <h2>着せ替えガチャ</h2>
      <p>ラインナップと排出率は準備中です。</p>
      <div className="wardrobe-options">
        <button type="button" disabled>チケット{TICKET_DRAW_COST}枚で引く</button>
        <button type="button" disabled>マカロンで引く</button>
      </div>
    </> : <>
      <h2>着せ替えショップ</h2>
      <p>商品と価格は準備中です。</p>
    </>}
    <h2>ガチャ・ショップで獲得したアイテム</h2>
    {wallet.ownedItemIds.length ? <ul>{wallet.ownedItemIds.map(id =>
      <li key={id}>{ITEMS.find(item => item.id === id)?.name ?? id}</li>
    )}</ul> : <p>獲得したアイテムはここに表示されます。</p>}
  </section>;
}
