import React from 'react';
import { LOGIN_DAYS_PER_TICKET, macaronBalance, RewardState, TICKET_DRAW_COST, PendingGachaResult } from './rewardLedger';
import { GACHA_TYPES, drawCandidates, equalWeightPool, gachaItemName, isInteriorPrize } from './gachaCatalog';
import { FormId } from './appearance';
import { RoomState } from './interior';
import GachaTryOn, { canTryOn } from './GachaTryOn';
import PrizeArt from './GachaPrizeArt';
import GachaDrawSequence from './GachaDrawSequence';
import GachaRewardModal from './GachaRewardModal';
import { GachaAudio,readGachaAudio,saveGachaAudio } from './gachaAudio';
import { gachaRarity } from './gachaRarity';
import { confirmGachaDraw,acknowledgeGachaResult } from './gachaDraw';
import { confirmDevGachaDraw, acknowledgeDevGachaResult } from './devGachaSandbox';

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

function GachaBanner({ gacha, onOpen, onLineup }: {
  gacha: GachaChoice;
  onOpen: () => void;
  onLineup: () => void;
}) {
  const highlights = gacha.itemIds.slice(0, 3);
  return <article className={'gacha-banner gacha-banner--' + gacha.id}>
    <button type="button" className="gacha-banner-main" onClick={onOpen}
      aria-label={gacha.name + 'を選ぶ'}>
      <span className="gacha-banner-caption"><span className="gacha-banner-label">GACHA COLLECTION</span>
        <strong>{gacha.name}</strong><span className="gacha-banner-copy">{gacha.description}</span>
        <span className="gacha-banner-select">このガチャを選ぶ ›</span>
      </span>
      <span className="gacha-banner-arts" aria-hidden="true">{highlights.map(id =>
        <span className="gacha-banner-art" key={id}><PrizeArt id={id}/></span>)}</span>
    </button>
    <div className="gacha-banner-footer">
      <button type="button" className="gacha-banner-more" onClick={onLineup}
        aria-label={gacha.name + 'のラインナップを見る'}>
        ラインナップを見る　›
      </button>
    </div>
  </article>;
}

export default function RewardPanel({ wallet, error, testMode = false, section, roomOwnedItemIds, onWalletChange, previewForm, previewEquipment, roomLayout, onEquip }: {
  onEquip?: (itemId:string,formId:FormId)=>Promise<void>;
  wallet: RewardState;
  error: boolean;
  testMode?: boolean;
  section: 'gacha' | 'shop';
  roomOwnedItemIds: readonly string[];
  onWalletChange: (next: RewardState) => void;
  previewForm: { id: FormId; name: string; image: string };
  previewEquipment: readonly string[];
  roomLayout: Readonly<RoomState['layout']>;
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [view, setView] = React.useState<'catalog' | 'draw' | 'lineup'>('catalog');
  const [pendingPayment, setPendingPayment] = React.useState<Payment | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);
  const [tryingOn, setTryingOn] = React.useState(false);
  const [trialApplied, setTrialApplied] = React.useState(true);
  const [wearing,setWearing]=React.useState(false),[wearMessage,setWearMessage]=React.useState('');
  const wearLock=React.useRef(false);
  const wearPreview=async()=>{if(wearLock.current||testMode||!previewId||!onEquip)return;wearLock.current=true;setWearing(true);setWearMessage('');try{await onEquip(previewId,previewForm.id);setWearMessage('着用しました！');}catch(reason){setWearMessage(reason instanceof Error?reason.message:'コーデを保存できませんでした。');}finally{wearLock.current=false;setWearing(false);}};
  const closePreview = () => { setPreviewId(null); setTryingOn(false); setTrialApplied(true); setWearMessage(''); };
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const restored=section==='gacha'?wallet.pendingGachaResult:undefined;
  const [drawResult,setDrawResult]=React.useState<PendingGachaResult|null>(restored??null);
  const [gachaReveal,setGachaReveal]=React.useState<'playing'|'revealed'|null>(restored?'revealed':null);
  const drawLock=React.useRef(!!restored),mounted=React.useRef(true);
  const audioRef=React.useRef<GachaAudio|null>(null);
  const getAudio=()=>audioRef.current??(audioRef.current=new GachaAudio());
  const [soundOn,setSoundOn]=React.useState(readGachaAudio),[soundMessage,setSoundMessage]=React.useState('');
  const [resultError,setResultError]=React.useState('');
  const toggleSound=()=>{
    const on=!soundOn;if(on)getAudio().unlock();else getAudio().stop();
    setSoundOn(on);setSoundMessage(saveGachaAudio(on)?'': '音声設定を保存できません。この画面では切り替わります。');
  };
  React.useEffect(()=>{
    mounted.current=true;
    return()=>{mounted.current=false;audioRef.current?.dispose();audioRef.current=null;};
  },[]);
  React.useEffect(()=>{
    if(section==='gacha'&&wallet.pendingGachaResult&&!drawLock.current){
      drawLock.current=true;setDrawResult(wallet.pendingGachaResult);setGachaReveal('revealed');
    }
  },[wallet.pendingGachaResult,section]);
  const closeResult=async()=>{
    if(!drawResult||busy)return;
    setBusy(true);setResultError('');
    try {
      const next=testMode ? acknowledgeDevGachaResult(wallet,drawResult.id) : await acknowledgeGachaResult(drawResult.id);
      onWalletChange(next);
      if(mounted.current){setDrawResult(null);setGachaReveal(null);drawLock.current=false;}
    }catch{if(mounted.current)setResultError('確認状態を保存できませんでした。獲得アイテムは保存済みです。もう一度OKを押してください。');}
    finally{if(mounted.current)setBusy(false);}
  };
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

  const openGacha = (id: string, target: 'draw' | 'lineup') => {
    setSelectedId(id);
    setView(target);
    setPendingPayment(null);
    closePreview();
    setMessage('');

  };
  const backToList = () => {
    setSelectedId(null);
    setView('catalog');
    setPendingPayment(null);
    setPreviewId(null);
    setMessage('');

  };
  const draw = async () => {
    if(drawLock.current||busy||error||!selected||!pendingPayment||!candidates.length||!enough)return;
    drawLock.current=true;setBusy(true);setMessage('');
    // Unlock during this user gesture, before any asynchronous storage work.
    if(soundOn)getAudio().unlock();
    try {
      const committed=testMode
        ? confirmDevGachaDraw(wallet,selected,pendingPayment)
        : await confirmGachaDraw(selected,pendingPayment,roomOwnedItemIds);
      if(mounted.current){setDrawResult(committed.result);setGachaReveal('playing');setPendingPayment(null);}
      onWalletChange(committed.wallet);
    }catch(reason){
      drawLock.current=false;getAudio().stop();
      if(mounted.current){setMessage(reason instanceof Error?reason.message:'抽選できませんでした。');setPendingPayment(null);}
    }finally{if(mounted.current)setBusy(false);}
  };

  return <section className={'reward-panel reward-panel--' + section} aria-labelledby="reward-title">
    <header className="gacha-header">
      {selected && section === 'gacha' &&
        <button className="gacha-back" type="button" onClick={backToList} disabled={busy||!!gachaReveal}>‹ 一覧へ</button>}
      <h1 id="reward-title">{section === 'gacha' ? (selected ? selected.name : 'ガチャ') : 'ショップ'}</h1>
    </header>
    {error ? <p role="alert">報酬データを読み込めないため、抽選は利用できません。</p> : <>
      {testMode && <p className="gacha-test-notice" role="status">🧪 テストモード：通貨・獲得アイテムは仮のものです。実際の所持品には反映されません。</p>}
      <RewardBalances wallet={wallet} />
      {section==='gacha'&&<div className="gacha-sound-setting"><button className="gacha-sound-toggle" type="button" aria-pressed={soundOn} onClick={toggleSound}>BGM・効果音 {soundOn?'ON':'OFF'}</button><small>小さな音で再生します。初期設定はOFF。</small>{soundMessage&&<span role="status">{soundMessage}</span>}</div>}
      {section === 'gacha' ? !selected || view === 'catalog' ? <>
        <p className="gacha-help">今日はどれにしよう？ 気になるガチャを選んでください。ラインナップは引く前に確認できます。</p>
        <div className="gacha-catalog-scroll" role="region" aria-label="ガチャ一覧（縦スクロール）" tabIndex={0}>
          {GACHA_TYPES.map(gacha => <GachaBanner gacha={gacha} key={gacha.id}
            onOpen={() => openGacha(gacha.id, 'draw')}
            onLineup={() => openGacha(gacha.id, 'lineup')} />)}
        </div>
      </> : view === 'draw' ? <>
        <div className={'gacha-featured gacha-featured--' + selected.id}>
          <span className="gacha-featured-tag">SELECT GACHA</span>
          <strong>{selected.name}</strong>
          <p>{selected.description}</p>
          <div className="gacha-featured-art" aria-hidden="true">{selected.itemIds.slice(0, 3).map(id =>
            <span key={id}><PrizeArt id={id}/></span>)}</div>
        </div>
        <div className="gacha-detail-choices gacha-draw-choices">
          <h2>どちらで引きますか？</h2>
          <p>支払い方法を選ぶと、抽選前の確認画面が表示されます。</p>
          <div className="gacha-actions">
            <button type="button" disabled={busy || !!gachaReveal || !candidates.length || macaronBalance(wallet) < selected.macaronCost}
              onClick={() => { setPendingPayment('macaron'); setMessage(''); }}>
              <RewardIcon kind="macaron" /> マカロン {selected.macaronCost}個で引く
            </button>
            <button type="button" disabled={busy || !!gachaReveal || !candidates.length || wallet.tickets < TICKET_DRAW_COST}
              onClick={() => { setPendingPayment('ticket'); setMessage(''); }}>
              <RewardIcon kind="ticket" /> チケット {TICKET_DRAW_COST}枚で引く
            </button>
          </div>
          {!candidates.length && <p>このガチャのアイテムはすべて獲得済みです。</p>}
          {message&&<p role="status">{message}</p>}
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
        <section className="gacha-lineup-page" aria-label={selected.name + 'のラインナップ'}>
          <div className="gacha-detail-overview">
            <h2>{selected.name} のラインナップ</h2>
            <p>{selected.description}</p>
            <p>左右にスワイプしてアイテムを見られます。タップすると拡大表示できます。</p>
            <p>未所持の排出対象：<strong>{candidates.length}種類</strong> ／ 全{selected.itemIds.length}種類</p>
          </div>
          <div className="gacha-prize-grid" role="region" aria-label="排出アイテムのラインナップ（横スクロール）" tabIndex={0}>
            {selected.itemIds.map(id => {
              const itemOwned = owned.includes(id);
              const chance = pool.find(item => item.id === id)?.weight ?? 0;
              return <button type="button" key={id} className="gacha-prize-card" data-owned={itemOwned}
                onClick={() => { setPreviewId(id); setTryingOn(false); setTrialApplied(true); }} aria-label={gachaItemName(id) + 'を拡大表示'}>
                <div className="gacha-prize-art"><PrizeArt id={id}/></div>
                <strong>{gachaItemName(id)}</strong>
                <span>{itemOwned ? '所持済み' : '排出対象'}</span>
                <small>{(chance / 100).toFixed(2)}%</small>
              </button>;
            })}
          </div>
          <p className="gacha-rate">確率は現在の所持状況に基づく表示です。未所持アイテムをほぼ均等な確率（0.01%単位）で抽選します。</p>
          <button type="button" className="gacha-lineup-to-draw" onClick={() => {
            setView('draw'); setPreviewId(null); setMessage('');
          }}>このガチャを選ぶ ›</button>
        </section>
        {previewId && <div className="gacha-confirm-backdrop" role="presentation" onClick={()=>{if(!wearing)closePreview();}}>
          <div className="gacha-confirm gacha-item-preview" role="dialog" aria-modal="true"
            aria-label={gachaItemName(previewId) + (tryingOn ? 'のお試しプレビュー' : 'のプレビュー')}
            onClick={event => event.stopPropagation()}>
            <button type="button" className="gacha-confirm-close" aria-label="閉じる" disabled={wearing} onClick={closePreview}>×</button>
            {!tryingOn ? <>
              <div className="gacha-prize-art"><PrizeArt id={previewId}/></div>
              <h2>{gachaItemName(previewId)}</h2>
              <p>{owned.includes(previewId) ? '所持済み' : '未所持アイテムもお試しできます。'}</p>
              {canTryOn(previewId, previewForm.id) ? <button type="button" className="gacha-tryon-start" onClick={() => {
                setTryingOn(true); setTrialApplied(true);
              }}>{isInteriorPrize(previewId) ? 'ルームに置いてみる' : 'ろきちゃんに試着する'}</button> :
                <p className="gacha-tryon-unsupported">現在のろきちゃんの姿では試着できません。対応するフォルムに進化すると試せます。</p>}
              <button type="button" className="gacha-preview-close" onClick={closePreview}>ラインナップに戻る</button>
            </> : <>
              <span className="gacha-tryon-badge">{wearMessage==='着用しました！'?'保存したコーデ':trialApplied ? 'お試し中 · 保存されません' : '元の状態'}</span>
              <h2>{gachaItemName(previewId)}</h2>
              <GachaTryOn itemId={previewId} form={previewForm} equipped={previewEquipment}
                roomLayout={roomLayout} applied={trialApplied}/>
              <p className="gacha-tryon-notice">{wearMessage==='着用しました！'?'現在のフォルムのコーデに保存しました。':'未所持でも試せます。着用を保存するまでコーデやルームは変更されません。'}</p>
              <div className="gacha-tryon-actions">
                <button type="button" disabled={wearing} onClick={() => setTrialApplied(current => !current)}>
                  {trialApplied ? '元に戻す' : 'もう一度お試し'}
                </button>
                <button type="button" disabled={wearing} onClick={() => { setTryingOn(false); setTrialApplied(true); }}>アイテム詳細に戻る</button>
                {!testMode&&owned.includes(previewId)&&!isInteriorPrize(previewId)&&canTryOn(previewId,previewForm.id)&&onEquip&&<button type="button" className="gacha-wear" disabled={wearing||!trialApplied||wearMessage==='着用しました！'} onClick={()=>void wearPreview()}>{wearing?'保存中…':wearMessage==='着用しました！'?'着用済み':'このまま着用する'}</button>}
              </div>
              {testMode&&<p className="gacha-tryon-notice">仮着用です。テスト中は保存できません。</p>}
              {wearMessage&&<p role="status">{wearMessage}</p>}
              <button type="button" disabled={wearing} className="gacha-preview-close" onClick={closePreview}>ラインナップに戻る</button>
            </>}
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
    {drawResult&&gachaReveal==='playing'&&<GachaDrawSequence key={drawResult.id} drawId={drawResult.id} rarity={gachaRarity(drawResult.itemId)} audio={getAudio()} soundOn={soundOn} onSoundChange={toggleSound} onComplete={()=>setGachaReveal('revealed')}/>}
    {drawResult&&gachaReveal==='revealed'&&<GachaRewardModal itemId={drawResult.itemId} ownedItemIds={wallet.ownedItemIds} onEquip={onEquip} testMode={testMode} form={previewForm} equipped={previewEquipment} roomLayout={roomLayout} busy={busy} error={resultError} onClose={()=>void closeResult()}/>}
    {(section === 'shop' || view === 'catalog') && <details className="gacha-owned">
      <summary>所持アイテム（{owned.length}種類）</summary>
      {owned.length ? <ul>{owned.map(id => <li key={id}>{gachaItemName(id)}</li>)}</ul> : <p>獲得したアイテムはここに表示されます。</p>}
    </details>}
  </section>;
}
