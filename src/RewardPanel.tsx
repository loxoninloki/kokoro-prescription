import React from 'react';
import { LOGIN_DAYS_PER_TICKET, macaronBalance, RewardState, TICKET_DRAW_COST, updateRewards, drawItem } from './rewardLedger';
import { GACHA_TYPES, drawCandidates, equalWeightPool, gachaItemName, isInteriorPrize } from './gachaCatalog';

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

export default function RewardPanel({ wallet, error, section, roomOwnedItemIds, onWalletChange }: {
  wallet: RewardState;
  error: boolean;
  section: 'gacha' | 'shop';
  roomOwnedItemIds: readonly string[];
  onWalletChange: (next: RewardState) => void;
}) {
  const [selectedId, setSelectedId] = React.useState(GACHA_TYPES[0].id);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [prize, setPrize] = React.useState<string | null>(null);
  const selected = GACHA_TYPES.find(gacha => gacha.id === selectedId) ?? GACHA_TYPES[0];
  const owned = Array.from(new Set([...wallet.ownedItemIds, ...roomOwnedItemIds]));
  const candidates = drawCandidates(selected, owned);
  const pool = candidates.length ? equalWeightPool(candidates) : [];
  const progress = wallet.loginDays % LOGIN_DAYS_PER_TICKET;
  const draw = async (payment: 'ticket' | 'macaron') => {
    if (busy || error || !candidates.length) return;
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
        }, payment);
        winner = result.itemId;
        return result.state;
      });
      onWalletChange(next);
      setPrize(winner);
      setMessage(`「${gachaItemName(winner)}」を獲得しました！`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '抽選できませんでした。');
    } finally { setBusy(false); }
  };

  return <section className="reward-panel" aria-labelledby="reward-title">
    <h1 id="reward-title">{section === 'gacha' ? 'ガチャ' : 'ショップ'}</h1>
    {error ? <p role="alert">報酬データを読み込めないため、抽選は利用できません。</p> : <>
      <RewardBalances wallet={wallet} />
      {section === 'gacha' ? <>
        <p className="gacha-help">ガチャの種類を選んでください。左右にスクロールできます。</p>
        <div className="gacha-select-scroll" role="group" aria-label="ガチャの種類" tabIndex={0}>
          {GACHA_TYPES.map(gacha => <button type="button" key={gacha.id} aria-pressed={selected.id === gacha.id}
            onClick={() => { setSelectedId(gacha.id); setMessage(''); setPrize(null); }}>
            <span aria-hidden="true" className="gacha-type-icon">{gacha.icon}</span>
            <strong>{gacha.name}</strong>
          </button>)}
        </div>
        <article className="gacha-detail" aria-live="polite">
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <p>未所持のアイテムから抽選します。現在の対象：<strong>{candidates.length}種類</strong></p>
          <p className="gacha-rate">対象アイテムはそれぞれほぼ均等な確率です（端数は0.01%単位で調整）。</p>
          <details className="gacha-odds">
            <summary>排出対象と確率を見る</summary>
            {pool.length ? <ul>{pool.map(item => <li key={item.id}><span>{gachaItemName(item.id)}</span><strong>{(item.weight / 100).toFixed(2)}%</strong></li>)}</ul>
              : <p>すべて獲得済みです。</p>}
          </details>
          <div className="gacha-actions">
            <button type="button" disabled={busy || !candidates.length || wallet.tickets < TICKET_DRAW_COST}
              onClick={() => void draw('ticket')}>チケット{TICKET_DRAW_COST}枚で引く</button>
            <button type="button" disabled={busy || !candidates.length || macaronBalance(wallet) < selected.macaronCost}
              onClick={() => void draw('macaron')}>マカロン{selected.macaronCost}個で引く</button>
          </div>
          {busy && <p role="status">抽選中です…</p>}
          {message && <p role="status" className={prize ? 'gacha-win' : undefined}>{message}</p>}
          {prize && <p className="gacha-prize-notice">{isInteriorPrize(prize) ? 'ルームの模様替えから配置できます。' : 'コーデ画面から着せ替えできます。'}</p>}
        </article>
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
