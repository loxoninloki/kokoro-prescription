import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CHECKIN_XP, evolutionFromXp, FORM_STAGES, HUMAN_FORM, MATURE_FORM } from './evolution';
import DiaryCalendar, { diaryExperience, DiaryEntries, readDiary } from './DiaryCalendar';
import MedicationTracker, { MedicationData, medicationExperience, readMedication } from './MedicationTracker';
import StepTracker, { StepEntries, readSteps, stepsExperience, parseStepImport, StepImport } from './StepTracker';
import Meditation, { MeditationEntries, readMeditation, meditationExperience } from './Meditation';
import BackupExport from './BackupExport';
import AppInvite from './AppInvite';
import { APPEARANCE_KEY, Appearance, readAppearance } from './appearance';
import DressUp from './DressUp';
import { countRecordDays } from './recordDays';
import RokiCharacter from './RokiCharacter';
import RokiRoom from './RokiRoom';
import HomePage from './HomePage';
import BottomNavigation from './BottomNavigation';
import RewardPanel from './RewardPanel';
import { collectXpEvents } from './xpEvents';
import useRewards from './useRewards';
import { Icon } from './Icon';

const STORAGE_KEY = 'kokoro-checkins-v1';
const POINTS_PER_DAY = CHECKIN_XP;
const HEADER_STICKERS = ['01_erai.png', '02_otsukare.png', '03_yoshiyoshi.png', '04_hitoyasumi.png', '05_yattane.png'] as const;


function localDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function loadCheckins(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved)
      ? Array.from(new Set<string>(saved.filter((value): value is string =>
          typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ))).sort()
      : [];
  } catch {
    return [];
  }
}

function readSavedXp() {
  return collectXpEvents(loadCheckins(), readDiary(), readMedication(), readSteps(), readMeditation());
}

export default function App() {
  const [days, setDays] = useState<string[]>(loadCheckins);
  const [diary, setDiary] = useState<DiaryEntries>(readDiary);
  const [medication, setMedication] = useState<MedicationData>(readMedication);
  const [steps, setSteps] = useState<StepEntries>(readSteps);
  const [stepImport, setStepImport] = useState<StepImport | 'invalid' | null>(null);
  const [meditation, setMeditation] = useState<MeditationEntries>(readMeditation);
  const [appearance, setAppearance] = useState(readAppearance);
  const [appearanceMessage, setAppearanceMessage] = useState('');
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
  const dirty = page === 'dressup' && JSON.stringify(draft.equipped) !== JSON.stringify(appearance.equipped);
  const commitNavigation = (next: Page, push = true) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', next);
    if (push) window.history.pushState(null, '', url);
    setHeaderSticker(HEADER_STICKERS[Math.floor(Math.random() * HEADER_STICKERS.length)]);
    setHeaderStickerFailed(false);
    if (next !== 'steps') setStepImport(null);
    if (next === 'dressup') setDraft(appearance);
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
    } catch {
      // Storage can be blocked or full.
    }
  }, [days]);

  const xpEvents = useMemo(() => collectXpEvents(days, diary, medication, steps, meditation),
    [days, diary, medication, steps, meditation]);
  const { wallet, walletError } = useRewards(readSavedXp, xpEvents);
  const recordDays = countRecordDays(today, days, diary, medication, steps, meditation);
  const rewardDays = Math.max(recordDays, appearance.rewardDays ?? 0);
  const checkedIn = days.includes(today);
  const totalPoints = days.length * POINTS_PER_DAY + diaryExperience(diary) + medicationExperience(medication) + stepsExperience(steps) + meditationExperience(meditation);
  const evolution = evolutionFromXp(totalPoints);
  const mature = evolution.form.id === MATURE_FORM.id;
  const human = mature && appearance.mode === 'human';
  const displayForm = human ? HUMAN_FORM : evolution.form;
  const character = (size: number) => (
    <RokiCharacter key={displayForm.image} form={displayForm} size={size}
      equipped={mature && !human ? appearance.equipped : undefined} />
  );
  const saveAppearance = useCallback((next: Appearance) => {
    try {
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

  const switchForm = (mode: Appearance['mode']) => {
    const saved = saveAppearance({ ...appearance, mode });
    setAppearanceMessage(saved ? '' : '表示する姿を保存できませんでした。');
  };

  const backPage = (page === 'backup' || page === 'invite') ? 'menu' : 'home';
  const backLabel = { growth: '育成', menu: 'メニュー', home: 'ホーム' }[backPage];

  const checkIn = () => {
    const current = localDay();
    setToday(current);
    setDays(previous => previous.includes(current) ? previous : [...previous, current].sort());
  };

  return (
    <main className="kokoro-app" data-page={page}>
      {page === 'home' && <HomePage evolution={evolution} displayForm={displayForm}
        equipped={mature && !human ? appearance.equipped : undefined}
        wallet={wallet} walletError={walletError} totalPoints={totalPoints} checkedIn={checkedIn}
        checkinDays={days.length} onCheckIn={checkIn} onNavigate={navigate} />}
      {page === 'room' && <RokiRoom level={evolution.level} form={evolution.form}
        equipped={mature ? appearance.equipped : undefined} onBack={() => navigate('home')} />}
      {page !== 'home' && page !== 'room' && page !== 'dressup' && <nav className="kokoro-back-nav" aria-label="画面移動" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 74 }}>
        <button type="button" onClick={() => navigate(backPage)} style={{ border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '10px 18px', fontSize: 14, flexShrink: 0 }}>← {backLabel}に戻る</button>
        {headerSticker && !headerStickerFailed && <img src={`${process.env.PUBLIC_URL}/stickers/${headerSticker}`} alt="" aria-hidden="true" onError={() => setHeaderStickerFailed(true)} style={{ width: 84, height: 74, maxWidth: '35%', objectFit: 'contain', objectPosition: 'center', pointerEvents: 'none' }} />}
      </nav>}
      {page === 'growth' && <>
        <section className="growth-card" aria-label="ろきちゃんの成長" style={{ padding: 20, borderRadius: 20, background: '#f8f1ff', textAlign: 'center' }}>
          <div style={{ display: "flex", justifyContent: "center" }}>{character(220)}</div>
          <h2><Icon name="growth" /> ろきちゃん Lv.{evolution.level}</h2>
          <p>{displayForm.name}</p>
          <label htmlFor="xp-progress">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp}</label>
          <progress id="xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} style={{ display: 'block', width: '100%', marginTop: 8, accentColor: '#7653a6' }} />
          <p>{evolution.nextLevel ? `Lv.${evolution.nextLevel}で次のフォルムに進化！` : '成熟フォルムに到達しました！'}</p>
          {mature ? <>
            <div className="wardrobe-options" role="group" aria-label="表示する姿">
              <button type="button" aria-pressed={!human} onClick={() => switchForm('chibi')}>成熟フォルム</button>
              <button type="button" aria-pressed={human} onClick={() => switchForm('human')}>ヒューマンフォルム</button>
            </div>

            {appearanceMessage && <p role="status">{appearanceMessage}</p>}
          </> : <p>Lv.{MATURE_FORM.level}でちびろきの着せ替えが開きます。</p>}
          <ol className="evolution-stages" aria-label="進化の5段階">
            {FORM_STAGES.map(form => (
              <li key={form.id} aria-current={form.id === evolution.form.id ? 'step' : undefined}>
                <span>Lv.{form.level}〜</span> {form.name}
              </li>
            ))}
          </ol>
        </section>
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>チェックイン履歴</h2>
          {days.length === 0 ? <p>最初のチェックインをお待ちしています。</p> :
            <ul>{[...days].reverse().slice(0, 14).map(day => <li key={day}>{day} ✓</li>)}</ul>}
        </section>
      </>}
      {page === 'dressup' && mature && <DressUp saved={appearance} draft={draft} setDraft={setDraft} onSave={saveAppearance} rewardDays={rewardDays} />}
      {(page === 'rewards' || page === 'gacha') && <RewardPanel key={page} wallet={wallet} error={walletError} initialSection={page === 'gacha' ? 'gacha' : 'shop'} />}
      {page === 'dressup' && !mature && <section className="menu-panel"><h1>コーデ</h1><p>Lv.50の成熟フォルムで着せ替えが開きます。</p></section>}
      {page === 'diary' && <DiaryCalendar entries={diary} setEntries={setDiary} checkins={days} today={today} steps={steps} medicationTaken={medication.taken} />}
      {page === 'medication' && <MedicationTracker data={medication} setData={setMedication} today={today} />}
      {page === 'steps' && <StepTracker entries={steps} setEntries={setSteps} today={today} incoming={stepImport} clearIncoming={() => setStepImport(null)} />}
      {page === 'meditation' && <Meditation entries={meditation} setEntries={setMeditation} today={today} />}
      {page === 'menu' && <section className="menu-panel" aria-labelledby="menu-title">
        <h1 id="menu-title"><Icon name="menu" /> メニュー</h1>
        <nav className="menu-links" aria-label="メニュー項目">
          <button type="button" onClick={() => navigate('backup')}><Icon name="backup" /> バックアップ</button>
          <button type="button" onClick={() => navigate('invite')}><Icon name="invite" /> 紹介する</button>
        </nav>
      </section>}
      {page === 'invite' && <AppInvite />}
      {page === 'backup' && <BackupExport checkins={days} diary={diary} medication={medication} steps={steps} meditation={meditation} appearance={appearance} />}
      {page !== 'home' && page !== 'room' && <p style={{ fontSize: 12, color: '#766b82', marginTop: 24 }}>記録はこの端末のブラウザに保存されます。ブラウザのデータを削除すると記録も消える場合があります。</p>}
      <BottomNavigation page={page} onNavigate={navigate} />
      {pendingPage && <div className="navigation-dialog-backdrop">
        <section role="dialog" aria-modal="true" aria-labelledby="unsaved-title" className="navigation-dialog">
          <h2 id="unsaved-title">未保存のコーデがあります</h2>
          <button type="button" autoFocus onClick={() => { if (saveAppearance(draft)) { commitNavigation(pendingPage); setPendingPage(null); } else setAppearanceMessage('保存できませんでした。'); }}>保存して移動</button>
          <button type="button" onClick={() => { setDraft(appearance); commitNavigation(pendingPage); setPendingPage(null); }}>保存せず移動</button>
          <button type="button" onClick={() => setPendingPage(null)}>編集を続ける</button>
          {appearanceMessage && <p role="status">{appearanceMessage}</p>}
        </section>
      </div>}
    </main>
  );
}
