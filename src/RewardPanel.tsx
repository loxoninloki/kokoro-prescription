import React from 'react';
import { LOGIN_DAYS_PER_TICKET, macaronBalance, RewardState, TICKET_DRAW_COST, updateRewards, drawItem } from './rewardLedger';
import { GACHA_TYPES, drawCandidates, equalWeightPool, gachaItemName, isInteriorPrize } from './gachaCatalog';
import { ITEMS } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import InteriorIcon from './InteriorIcon';

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


type Payment = 'ticket' | 'macaron';
type GachaChoice = typeof GACHA_TYPES[number];

function PrizeArt({ id }: { id: string }) {
  const garment = ITEMS.find(item => item.id === id);
  if (garment) return <img src={String(process.env.PUBLIC_URL) + '/' + garment.layers[0].image}
    loading="lazy" alt="" onError={event => { event.currentTarget.hidden = true; }} />;
  const furnishing = INTERIOR_ITEMS.find(item => item.id === id);
  if (furnishing) return <span className="gacha-furniture-icon" style={{ backgroundColor: furnishing.color }}>
    <InteriorIcon name={furnishing.slot} />
  </span>;
  return <span aria-hidden="true">✦</span>;
}

function GachaBanner({ gacha, onOpen }: { gacha: GachaChoice; onOpen: () => void }) {
  const highlights = gacha.itemIds.slice(0, 3);
  return <button type="button" className={'gacha-banner gacha-banner--' + gacha.id} onClick={onOpen}
    aria-label={gacha.name + 'の詳細と排出アイテムを見る'}>
    <span className="gacha-banner-caption"><span className="gacha-banner-label">GACHA COLLECTION</span>
      <strong>{gacha.name}</strong><span className="gacha-banner-copy">{gacha.description}</span>
      <span className="gacha-banner-more">ラインナップを見る　›</span>
    </span>
    <span className="gacha-banner-arts" aria-hidden="true">{highlights.map(id =>
      <span className="gacha-banner-art" key={id}><PrizeArt id={id}/></span>)}</span>
  </button>;
}

export default function RewardPanel({ wallet, error, section, roomOwnedItemIds, onWalletChange }: {
  wallet: RewardState;
  error: boolean;
  section: 'gacha' | 'shop';
  roomOwnedItemIds: readonly string[];
  onWalletChange: (next: RewardState) => void;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = React.useState<Payment | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [prize, setPrize] = React.useState<string | null>(null);
  const selected = GACHA_TYPES.find(gacha => gacha.id === selectedId);
  const owned = Array.from(new Set([...wallet.ownedItemIds, ...roomOwnedItemIds]));
  const candidates = selected ? drawCandidates(selected, owned) : [];
  const pool = candidates.length ? equalWeightPool(candidates) : [];
  const progress = wallet.loginDays % LOGIN_DAYS_PER_TICKET;
  const cost = pendingPayment === 'ticket' ? TICKET_DRAW_COST : selected?.macaronCost ?? 0;
  const payName = pendingPayment === 'ticket' ? '処方箋チケット' : 'マカロン';
  const enough = pendingPayment === 'ticket'
    ? wallet.tickets >= TICKET_DRAW_COST
    : macaronBalance(wallet) >= (selected?.macaronCost ?? 0);

  const openGacha = (id: string) => {
    setSelectedId(id);
    setPendingPayment(null);
    setMessage('');
    setPrize(null);
  };
  const backToList = () => {
    setSelectedId(null);
    setPendingPayment(null);
    setMessage('');
    setPrize(null);
  };
  const draw = async () => {
    if (busy || error || !selected || !pendingPayment || !candidates.length || !enough) return;
    setBusy(true); setMessage(''); setPrize(null);
    try {
      let winner = '';
      const next = await updateRewards(current => {
        const available = drawCandidates(selected, Array.from(new Set([...current.ownedItemIds, ...roomOwnedItemIds])));
        if (!available.length) throw new Error('このガチャのアイテムはすべて所持しています。');
        const result = drawItem(current, {
          macaronCost: selected.macaronCost,
          pool: equalWeightPool(available),
          resolveDuplicate: () => { throw new Error('抽選対象が更新されました。もう一度お試しください。'); },
        }, pendingPayment);
        winner = result.itemId;
        return result.state;
      });
      onWalletChange(next);
      setPendingPayment(null);
      setPrize(winner);
      setMessage('「' + gachaItemName(winner) + '」を獲得しました！');
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '抽選できませんでした。');
      setPendingPayment(null);
    } finally { setBusy(false); }
  };

  return <section className={'reward-panel reward-panel--' + section} aria-labelledby="reward-title">
    <header className="gacha-header">
      {selected && section === 'gacha' && <button className="gacha-back" type="button" onClick={backToList} disabled={busy}>‹ 一覧へ</button>}
      <h1 id="reward-title">{section === 'gacha' ? (selected ? selected.name : 'ガチャ') : 'ショップ'}</h1>
    </header>
    {error ? <p role="alert">報酬データを読み込めないため、抽選は利用できません。</p> : <>
      <RewardBalances wallet={wallet} />
      {section === 'gacha' ? !selected ? <>
        <p className="gacha-help">今日はどれにしよう？ 気になるガチャを選んでラインナップを見てみましょう。</p>
        <div className="gacha-catalog-scroll" role="region" aria-label="ガチャ一覧（縦スクロール）" tabIndex={0}>
          {GACHA_TYPES.map(gacha => <GachaBanner gacha={gacha} key={gacha.id} onOpen={() => openGacha(gacha.id)} />)}
        </div>
      </> : <>
        <div className={'gacha-featured gacha-featured--' + selected.id}>
          <span className="gacha-featured-tag">SELECT GACHA</span>
          <strong>{selected.name}</strong>
          <p>{selected.description}</p>
          <div className="gacha-featured-art" aria-hidden="true">{selected.itemIds.slice(0, 3).map(id =>
            <span key={id}><PrizeArt id={id}/></span>)}</div>
        </div>
        <div className="gacha-detail-overview">
          <h2>このガチャのラインナップ</h2>
          <p>タップするとアイテムを拡大表示できます。未所持のアイテムから抽選されます。</p>
          <p>排出対象：<strong>{candidates.length}種類</strong> ／ 全{selected.itemIds.length}種類</p>
        </div>
        <div className="gacha-prize-grid" aria-label="排出アイテムのプレビュー">
          {selected.itemIds.map(id => {
            const itemOwned = owned.includes(id);
            const chance = pool.find(item => item.id === id)?.weight ?? 0;
            return <div key={id} className="gacha-prize-card" data-owned={itemOwned}>
              <div className="gacha-prize-art"><PrizeArt id={id}/></div>
              <strong>{gachaItemName(id)}</strong>
              <span>{itemOwned ? '所持済み' : '排出対象'}</span>
              <small>{(chance / 100).toFixed(2)}%</small>
            </div>;
          })}
        </div>
        <p className="gacha-rate">表示確率は現在の所持状況に基づく値です。対象アイテムはほぼ均等確率（0.01%単位）で抽選されます。</p>
        <div className="gacha-detail-choices">
          <h2>このガチャを引く</h2>
          <p>支払い方法を選んだあと、確認画面が表示されます。</p>
          <div className="gacha-actions">
            <button type="button" disabled={busy || !candidates.length || macaronBalance(wallet) < selected.macaronCost}
              onClick={() => { setPendingPayment('macaron'); setMessage(''); setPrize(null); }}>
              <RewardIcon kind="macaron" /> マカロン {selected.macaronCost}個
            </button>
            <button type="button" disabled={busy || !candidates.length || wallet.tickets < TICKET_DRAW_COST}
              onClick={() => { setPendingPayment('ticket'); setMessage(''); setPrize(null); }}>
              <RewardIcon kind="ticket" /> チケット {TICKET_DRAW_COST}枚
            </button>
          </div>
          {!candidates.length && <p>このガチャのアイテムはすべて獲得済みです。</p>}
          {message && <p role="status" className={prize ? 'gacha-win' : undefined}>{message}</p>}
          {prize && <div className="gacha-win-preview"><div className="gacha-prize-art"><PrizeArt id={prize}/></div>
            <strong>{gachaItemName(prize)}</strong>
            <p>{isInteriorPrize(prize) ? 'ルームの模様替えから配置できます。' : 'コーデ画面から着せ替えできます。'}</p>
          </div>}
        </div>
        {pendingPayment && <div className="gacha-confirm-backdrop" role="presentation">
          <div className="gacha-confirm" role="dialog" aria-modal="true" aria-labelledby="gacha-confirm-title">
            <button type="button" className="gacha-confirm-close" disabled={busy} aria-label="閉じる" onClick={() => setPendingPayment(null)}>×</button>
            <span className="gacha-confirm-symbol" aria-hidden="true">✧</span>
            <h2 id="gacha-confirm-title">{selected.name}</h2>
            <p>このガチャを引きますか？</p>
            <p className="gacha-confirm-cost"><RewardIcon kind={pendingPayment === 'ticket' ? 'ticket' : 'macaron'}/>
              {payName} {cost}{pendingPayment === 'ticket' ? '枚' : '個'}を消費します</p>
            <p className="gacha-confirm-warning">抽選確定後はキャンセルできません。</p>
            <div className="gacha-confirm-buttons">
              <button type="button" disabled={busy} onClick={() => setPendingPayment(null)}>やめる</button>
              <button type="button" disabled={busy || !enough} onClick={() => void draw()}>{busy ? '抽選中…' : 'ガチャを引く'}</button>
            </div>
          </div>
        </div>}
      </> : <>
        <h2>着せ替え・インテリアショップ</h2>
        <p>ショップの商品と販売価格は準備中です。</p>
        <p>ガチャは下の「ガチャ」タブから利用できます。</p>
        <p><label htmlFor="ticket-progress">次の処方箋チケットまで {progress}/{LOGIN_DAYS_PER_TICKET}日</label></p>
        <progress id="ticket-progress" value={progress} max={LOGIN_DAYS_PER_TICKET} />
      </>}
    </>}
    <details className="gacha-owned">
      <summary>所持アイテム（{owned.length}種類）</summary>
      {owned.length ? <ul>{owned.map(id => <li key={id}>{gachaItemName(id)}</li>)}</ul> : <p>獲得したアイテムはここに表示されます。</p>}
    </details>
  </section>;
}
