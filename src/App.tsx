import { makeMedicationPolicy, hasMedicationCredit } from './medicationPolicy';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CHECKIN_XP, evolutionFromXp, FORM_STAGES } from './evolution';
import { isFormLocked, visibleFormName } from './formVisibility';
import DiaryCalendar, { diaryExperience, DiaryEntries, readDiary } from './DiaryCalendar';
import MedicationTracker, { MedicationData, medicationExperience, readMedication } from './MedicationTracker';
import StepTracker, { StepEntries, readSteps, stepsExperience, parseStepImport, StepImport } from './StepTracker';
import Meditation, { MeditationEntries, readMeditation, meditationExperience } from './Meditation';
import BackupExport from './BackupExport';
import AppInvite from './AppInvite';
import { APPEARANCE_KEY, Appearance, parseAppearance, readAppearance, selectedForm, outfitView, saveFormEquipment, equipmentForForm, FORM_CHOICES, FormId } from './appearance';
import DressUp from './DressUp';
import { countRecordDays } from './recordDays';
import RokiCharacter from './RokiCharacter';
import RokiRoom from './RokiRoom';
import LoginRewards from './LoginRewards';
import { readRoom, EMPTY_ROOM, ROOM_KEY, updateRoom, INTERIOR_ITEMS } from './interior';
import HomePage from './HomePage';
import BottomNavigation from './BottomNavigation';
import RewardPanel from './RewardPanel';
import { collectXpEvents } from './xpEvents';
import useRewards from './useRewards';
import { tokyoDay, RewardState, updateRewards } from './rewardLedger';
import { giftForForm } from './formFirstGifts';
import { freshDevGachaWallet, isDevGachaHost } from './devGachaSandbox';
import { readCheckins } from './loginStamp';
import { Icon } from './Icon';

const POINTS_PER_DAY = CHECKIN_XP;
const HEADER_STICKERS = ['01_erai.png', '02_otsukare.png', '03_yoshiyoshi.png', '04_hitoyasumi.png', '05_yattane.png'] as const;


const localDay = tokyoDay;
function loadCheckins():string[] {try {return readCheckins();}catch{return [];}}

function readSavedXp() {
  return collectXpEvents(loadCheckins(), readDiary(), readMedication(), readSteps(), readMeditation());
}

export default function App() {
  const [roomError, setRoomError] = useState('');
  const [room, setRoom] = useState(() => { try { return readRoom(); } catch { return EMPTY_ROOM; } });
  const [loginRewardsOpen, setLoginRewardsOpen] = useState(false);
  const [days, setDays] = useState<string[]>(loadCheckins);
  const [diary, setDiary] = useState<DiaryEntries>(readDiary);
  const [medication, setMedication] = useState<MedicationData>(readMedication);
  const [steps, setSteps] = useState<StepEntries>(readSteps);
  const [stepImport, setStepImport] = useState<StepImport | 'invalid' | null>(null);
  const [meditation, setMeditation] = useState<MeditationEntries>(readMeditation);
  const [appearance, setAppearance] = useState(readAppearance);
  const [appearanceMessage, setAppearanceMessage] = useState('');
  const [firstFormGift, setFirstFormGift] = useState<{name:string;formName:string;image:string}|null>(null);
  const formGiftBusy = useRef(false);
  const [today, setToday] = useState(localDay);
  const [headerSticker, setHeaderSticker] = useState<string | null>(null);
  const [headerStickerFailed, setHeaderStickerFailed] = useState(false);
  type Page = 'home' | 'room' | 'diary' | 'medication' | 'steps' | 'meditation' | 'growth' | 'dressup' | 'backup' | 'invite' | 'menu' | 'rewards' | 'gacha';
  const route = (): Page => {
    const value = new URL(window.location.href).searchParams.get('page');
    return ['home','room','diary','medication','steps','meditation','growth','dressup','backup','invite','menu','rewards','gacha'].includes(value || '') ? value as Page : 'home';
  };
  const [page, setPage] = useState<Page>(route);
  const [draft, setDraft] = useState(readAppearance);
  const [pendingPage, setPendingPage] = useState<Page | null>(null);
  const xpEvents = useMemo(() => collectXpEvents(days, diary, medication, steps, meditation),
    [days, diary, medication, steps, meditation]);
  const { wallet, walletError, setWallet, stampDay, receipt, clearStamp } = useRewards(readSavedXp, xpEvents, (nextDays, nextRoom) => {
    setDays(previous => JSON.stringify(previous) === JSON.stringify(nextDays) ? previous : nextDays);
    setRoom(nextRoom);
  });
  const devGachaHost = isDevGachaHost();
  const [devGachaWallet, setDevGachaWallet] = useState<RewardState | null>(() =>
    devGachaHost && window.localStorage.getItem('kokoro-dev-gacha-mode-off-v1') !== '1'
      ? freshDevGachaWallet() : null);
  const displayedWallet = devGachaWallet ?? wallet;
  // Gacha furniture is recorded in the reward ledger and mirrored into room ownership.
  // Reconciliation also repairs an interrupted previous write without duplicating a draw.
  useEffect(() => {
    const acquired = wallet.ownedItemIds.filter(id => INTERIOR_ITEMS.some(item => item.id === id));
    if (!acquired.length || acquired.every(id => room.ownedItemIds.includes(id))) return;
    void updateRoom(current => ({
      ...current,
      ownedItemIds: Array.from(new Set([...current.ownedItemIds, ...acquired])),
    })).then(setRoom).catch(() => setRoomError('獲得した家具をルームに同期できませんでした。再読み込みしてください。'));
  }, [wallet.ownedItemIds, room.ownedItemIds]);
  const totalPoints = days.length * POINTS_PER_DAY + diaryExperience(diary) + medicationExperience(medication, wallet.medicationPolicy ?? makeMedicationPolicy(medication,wallet.creditedXp,today), wallet.creditedXp) + stepsExperience(steps) + meditationExperience(meditation);
  const evolution = evolutionFromXp(totalPoints);
  const displayForm = selectedForm(appearance,evolution.level,room.selectedFormId);
  const dirty = page === 'dressup' && JSON.stringify(draft.equipped) !== JSON.stringify(equipmentForForm(appearance,displayForm.id));
  const commitNavigation = (next: Page, push = true) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', next);
    if (push) window.history.pushState(null, '', url);
    setHeaderSticker(HEADER_STICKERS[Math.floor(Math.random() * HEADER_STICKERS.length)]);
    setHeaderStickerFailed(false);
    if (next !== 'steps') setStepImport(null);
    if (next === 'dressup') setDraft(outfitView(appearance, displayForm.id));
    setPage(next);
    window.scrollTo(0, 0);
  };
  const navigate = (next: Page) => {
    if (next === page) return;
    if (dirty) { setPendingPage(next); return; }
    commitNavigation(next);
  };
  useEffect(() => {
    const back = () => {
      const next = route();
      if (dirty) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', page);
        window.history.replaceState(null, '', url);
        setPendingPage(next);
      } else commitNavigation(next, false);
    };
    const unloading = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('popstate', back);
    window.addEventListener('beforeunload', unloading);
    return () => {
      window.removeEventListener('popstate', back);
      window.removeEventListener('beforeunload', unloading);
    };
  });

  useEffect(() => {
    const receiveSteps = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      if (!params.has('steps')) return;
      const day = localDay();
      setStepImport(parseStepImport(params, day) ?? 'invalid');
      setToday(day);
      setPage('steps');
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    };
    receiveSteps();
    window.addEventListener('hashchange', receiveSteps);
    return () => window.removeEventListener('hashchange', receiveSteps);
  }, []);

  useEffect(() => {
    const updateDate = () => setToday(localDay());
    const interval = window.setInterval(updateDate, 60_000);
    window.addEventListener('focus', updateDate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', updateDate);
    };
  }, []);

  const closeRewards = () => {setLoginRewardsOpen(false);clearStamp();};
  useEffect(() => {
    const sync=(e:StorageEvent)=>{if(e.key===APPEARANCE_KEY){setAppearance(readAppearance());}if(e.key===ROOM_KEY){try{setRoom(readRoom());}catch{setRoomError('ルーム情報を読み込めません。');}}};
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);
  const recordDays = countRecordDays(today, days, diary, medication, steps, meditation);
  const rewardDays = Math.max(recordDays, appearance.rewardDays ?? 0);
  const checkedIn = days.includes(today);
  const visibleEquipment = equipmentForForm(appearance,displayForm.id);
  const draftForm=useRef<FormId>();
  useEffect(()=>{if(draftForm.current!==displayForm.id){setDraft(outfitView(appearance,displayForm.id));draftForm.current=displayForm.id;}},[appearance,displayForm.id]);
  const character = (size:number) => <RokiCharacter key={displayForm.image} form={displayForm} size={size} equipped={visibleEquipment}/>;
  const saveAppearance = useCallback((next: Appearance) => {
    try {
      const raw=localStorage.getItem(APPEARANCE_KEY);if(raw)parseAppearance(JSON.parse(raw));
      const progress = Math.max(recordDays, next.rewardDays ?? 0, readAppearance().rewardDays ?? 0);
      const updated = { ...next, rewardDays: progress };
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(updated));
      setAppearance(updated);
      return true;
    } catch {
      return false;
    }
  }, [recordDays]);
  useEffect(() => {
    if (recordDays > (appearance.rewardDays ?? 0)) saveAppearance(appearance);
  }, [appearance, recordDays, saveAppearance]);

  const saveOutfit = (next:Appearance) => saveAppearance(saveFormEquipment(appearance,displayForm.id,next.equipped));
  const switchForm = async (id:FormId) => {
    if (formGiftBusy.current || !FORM_CHOICES.some(f => f.id === id && f.level <= evolution.level)) return;
    formGiftBusy.current = true;
    try {
      const saved = saveAppearance({...appearance,selectedFormId:id,mode:id==='human'?'human':'chibi'});
      if (!saved) { setAppearanceMessage('表示する姿を保存できませんでした。'); return; }
      setAppearanceMessage('フォルムを変更しました。');
      const gift = giftForForm(id, evolution.level);
      if (!gift) return;
      let granted = false;
      const next = await updateRewards(current => {
        if (current.ownedItemIds.includes(gift.item.id)) return current;
        granted = true;
        return {...current, ownedItemIds:[...current.ownedItemIds,gift.item.id]};
      });
      setWallet(next);
      if (granted) setFirstFormGift({name:gift.item.name,formName:gift.form.name,image:gift.item.layers[0].image});
    } catch {
      setAppearanceMessage('フォルムの記念アイテムを保存できませんでした。再度フォルムを選択すると受け取れます。');
    } finally {
      formGiftBusy.current = false;
    }
  };
  // Persist the former room selection once; every screen subsequently reads appearance.selectedFormId.
  useEffect(()=>{
    if(!appearance.selectedFormId&&room.selectedFormId)saveAppearance({...appearance,selectedFormId:selectedForm(appearance,evolution.level,room.selectedFormId).id});
  },[appearance,room.selectedFormId,evolution.level,saveAppearance]);

  return (
    <main className="kokoro-app" data-page={page}>
      {devGachaHost && <aside className="dev-gacha-banner" aria-label="開発版のガチャテスト設定">
        <span>🧪 {devGachaWallet ? "テスト残高：マカロン " + (devGachaWallet.earned - devGachaWallet.spent) + "／チケット " + devGachaWallet.tickets : "ガチャテスト：OFF"}</span>
        <div>
          <button type="button" disabled={!!devGachaWallet?.pendingGachaResult} onClick={() => { window.localStorage.removeItem('kokoro-dev-gacha-mode-off-v1'); setDevGachaWallet(freshDevGachaWallet()); }}>
            {devGachaWallet ? "リセット" : "テスト開始"}
          </button>
          {devGachaWallet && <button type="button" disabled={!!devGachaWallet.pendingGachaResult} onClick={() => { window.localStorage.setItem('kokoro-dev-gacha-mode-off-v1', '1'); setDevGachaWallet(null); }}>終了</button>}
        </div>
      </aside>}

      {page === 'home' && <HomePage onLoginRewards={() => setLoginRewardsOpen(true)} evolution={evolution} displayForm={displayForm} room={room}
        equipped={visibleEquipment}
        wallet={displayedWallet} realWallet={wallet} walletError={walletError && !devGachaWallet} totalPoints={totalPoints} checkedIn={checkedIn}
        checkinDays={wallet.loginDays} onCheckIn={() => setLoginRewardsOpen(true)} onNavigate={navigate} />}
      {page === 'room' && <RokiRoom level={evolution.level} form={displayForm}
        equipped={visibleEquipment} room={room} onChange={setRoom} />}
      {page !== 'home' && page !== 'room' && page !== 'dressup' && headerSticker && !headerStickerFailed &&
        <img className="page-sticker" src={`${process.env.PUBLIC_URL}/stickers/${headerSticker}`} alt="" aria-hidden="true"
          onError={() => setHeaderStickerFailed(true)} />}
      {page === 'growth' && <>
        <section className="growth-card growth-card-compact" aria-label="ろきちゃんの成長">
          <div className="growth-overview">
            <div className="growth-portrait">{character(136)}</div>
            <div className="growth-overview-info">
              <h2><Icon name="growth" /> ろきちゃん Lv.{evolution.level}</h2>
              <p className="growth-current-form">{displayForm.name}</p>
              <label htmlFor="xp-progress">EXP {evolution.currentLevelXp} / {evolution.requiredLevelXp}</label>
              <progress id="xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} />
              <p className="growth-next">{evolution.nextLevel ? `次の進化 Lv.${evolution.nextLevel}` : '成熟フォルムに到達しました！'}</p>
            </div>
          </div>
          <section className="form-picker" aria-label="フォルム変更">
            <h3>フォルム変更</h3>
            <p className="growth-picker-help">選んだ姿をホーム・ルーム・コーデで表示します。</p>
            <div>{FORM_CHOICES.map(f => {
              const locked = isFormLocked(f.level, evolution.level);
              return <button type="button" key={f.id} disabled={locked} data-locked={locked} aria-label={locked ? `？？？、Lv.${f.level}で解放` : f.name} aria-pressed={!locked && displayForm.id===f.id} onClick={()=>switchForm(f.id)}>
                <img className={locked ? 'form-locked-silhouette' : undefined} src={`${process.env.PUBLIC_URL}/forms/${f.image}`} alt="" aria-hidden="true" />
                <span>{visibleFormName(f.name, locked)}</span>
                <small>{locked ? `Lv.${f.level}で解放` : displayForm.id===f.id ? '選択中 ✓' : '解放済み'}</small>
              </button>;
            })}</div>
            {appearanceMessage && <p role="status">{appearanceMessage}</p>}
          </section>
          <details className="growth-disclosure">
            <summary>進化の5段階を見る</summary>
            <ol className="evolution-stages" aria-label="進化の5段階">
              {FORM_STAGES.map(form => {
                const locked = isFormLocked(form.level, evolution.level);
                return <li key={form.id} aria-current={!locked && form.id === evolution.form.id ? 'step' : undefined}>
                  <span>Lv.{form.level}〜</span> {visibleFormName(form.name, locked)}{locked ? `（Lv.${form.level}で解放）` : ''}
                </li>;
              })}
            </ol>
          </details>
        </section>
        <details className="growth-disclosure growth-history">
          <summary>チェックイン履歴（直近14件）</summary>
          {days.length === 0 ? <p>最初のチェックインをお待ちしています。</p> :
            <ul>{[...days].reverse().slice(0, 14).map(day => <li key={day}>{day} ✓</li>)}</ul>}
        </details>
      </>}
      {page === 'dressup' && <DressUp key={displayForm.id} form={displayForm} saved={outfitView(appearance,displayForm.id)} draft={draft} setDraft={setDraft} onSave={saveOutfit} rewardDays={rewardDays} ownedItemIds={wallet.ownedItemIds} />}
      {(page === 'rewards' || page === 'gacha') && <RewardPanel key={page + (devGachaWallet ? '-test' : '-real')} wallet={displayedWallet} error={walletError && !devGachaWallet} testMode={!!devGachaWallet} section={page === 'gacha' ? 'gacha' : 'shop'}
        roomOwnedItemIds={devGachaWallet ? [] : room.ownedItemIds} onWalletChange={devGachaWallet ? setDevGachaWallet : setWallet} previewForm={displayForm}
        previewEquipment={visibleEquipment} roomLayout={room.layout} />}
      {page === 'diary' && <DiaryCalendar entries={diary} setEntries={setDiary} checkins={days} today={today} steps={steps} medicationTaken={medication.taken} />}
      {page === 'medication' && <MedicationTracker bonusEarned={hasMedicationCredit(wallet.creditedXp,today)} data={medication} setData={setMedication} today={today} />}
      {page === 'steps' && <StepTracker entries={steps} setEntries={setSteps} today={today} incoming={stepImport} clearIncoming={() => setStepImport(null)} />}
      {page === 'meditation' && <Meditation entries={meditation} setEntries={setMeditation} today={today} />}
      {page === 'menu' && <section className="menu-panel" aria-labelledby="menu-title">
        <h1 id="menu-title"><Icon name="menu" /> メニュー</h1>
        <nav className="menu-links" aria-label="メニュー項目">
          <button type="button" onClick={() => navigate('backup')}><Icon name="backup" /> バックアップ</button>
          <button type="button" onClick={() => setLoginRewardsOpen(true)}>ログインスタンプ履歴</button>
          <button type="button" onClick={() => navigate('invite')}><Icon name="invite" /> 紹介する</button>
        </nav>
      </section>}
      {page === 'invite' && <AppInvite />}
      {page === 'backup' && <BackupExport checkins={days} diary={diary} medication={medication} steps={steps} meditation={meditation} appearance={appearance} />}
      {page !== 'home' && page !== 'room' && page !== 'dressup' && <p style={{ fontSize: 12, color: '#766b82', marginTop: 24 }}>記録はこの端末のブラウザに保存されます。ブラウザのデータを削除すると記録も消える場合があります。</p>}
      {roomError && <p role="alert">{roomError}</p>}
      {(loginRewardsOpen || stampDay !== null) && <LoginRewards days={wallet.loginDays} room={room} stampDay={stampDay} receipt={receipt} onClose={closeRewards} />}
      <BottomNavigation page={page} onNavigate={navigate} />
      {firstFormGift && <div className="form-gift-backdrop">
        <section className="form-gift-dialog" role="dialog" aria-modal="true" aria-labelledby="form-gift-title">
          <span className="form-gift-sparkle" aria-hidden="true">✦ ✧ ✦</span>
          <h2 id="form-gift-title">進化おめでとうございます！</h2>
          <p>{firstFormGift.formName}の初回ボーナス</p>
          <div className="form-gift-art"><img src={`${process.env.PUBLIC_URL}/${firstFormGift.image}`} alt="" /></div>
          <strong>{firstFormGift.name}</strong>
          <p>このフォルムで使える記念エフェクトをプレゼントしました。</p>
          <button type="button" onClick={() => setFirstFormGift(null)}>受け取る</button>
        </section>
      </div>}
      {pendingPage && <div className="navigation-dialog-backdrop">
        <section role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="navigation-dialog">
          <h2 id="unsaved-title">未保存のコーデがあります</h2>
          <button type="button" autoFocus onClick={() => { if (saveOutfit(draft)) { commitNavigation(pendingPage); setPendingPage(null); } else setAppearanceMessage('保存できませんでした。'); }}>保存して移動</button>
          <button type="button" onClick={() => { setDraft(outfitView(appearance,displayForm.id)); commitNavigation(pendingPage); setPendingPage(null); }}>保存せず移動</button>
          <button type="button" onClick={() => setPendingPage(null)}>編集を続ける</button>
          {appearanceMessage && <p role="status">{appearanceMessage}</p>}
        </section>
      </div>}
    </main>
  );
}

