import React, { useCallback, useEffect, useState } from 'react';
import { CHECKIN_XP, evolutionFromXp, FORM_STAGES, HUMAN_FORM, MATURE_FORM } from './evolution';
import DiaryCalendar, { diaryExperience, DiaryEntries, readDiary } from './DiaryCalendar';
import MedicationTracker, { MedicationData, medicationExperience, readMedication } from './MedicationTracker';
import StepTracker, { StepEntries, readSteps, stepsExperience, parseStepImport, StepImport } from './StepTracker';
import Meditation, { MeditationEntries, readMeditation, meditationExperience } from './Meditation';
import BackupExport from './BackupExport';
import { APPEARANCE_KEY, Appearance, readAppearance } from './appearance';
import DressUp from './DressUp';
import { countRecordDays } from './recordDays';
import RokiCharacter from './RokiCharacter';
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

function streakFor(days: string[]): number {
  const dates = new Set(days);
  const cursor = new Date();
  if (!dates.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (dates.has(localDay(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
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
  const [page, setPage] = useState<'home' | 'diary' | 'medication' | 'steps' | 'meditation' | 'growth' | 'dressup' | 'backup'>('home');
  const navigate = (next: typeof page) => {
    if (next !== 'home') {
      setHeaderSticker(HEADER_STICKERS[Math.floor(Math.random() * HEADER_STICKERS.length)]);
      setHeaderStickerFailed(false);
    }
    if (next !== 'steps') setStepImport(null);
    setPage(next);
    window.scrollTo(0, 0);
  };

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

  const recordDays = countRecordDays(today, days, diary, medication, steps, meditation);
  const rewardDays = Math.max(recordDays, appearance.rewardDays ?? 0);
  const checkedIn = days.includes(today);
  const totalPoints = days.length * POINTS_PER_DAY + diaryExperience(diary) + medicationExperience(medication) + stepsExperience(steps) + meditationExperience(meditation);
  const streak = streakFor(days);
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

  const checkIn = () => {
    const current = localDay();
    setToday(current);
    setDays(previous => previous.includes(current) ? previous : [...previous, current].sort());
  };

  return (
    <main className="kokoro-app" data-page={page}>
      {page === 'home' && <>
        <header className="kokoro-header">
          <Icon name="brand" />
          <h1>こころの処方箋</h1>
        </header>
        <div className="kokoro-hero">
          <svg className="kokoro-hero-art" viewBox="0 0 1214 1295" role="img" aria-label="月夜の部屋でぬいぐるみとくつろぐろきちゃん">
            <defs>
              <image id="home-art-source" href={`${process.env.PUBLIC_URL}/home-hero.webp`} width="1214" height="1295" />
              <clipPath id="home-art-highlights">
                {/* These areas are inside the illustration, including its white highlights. */}
                <path d="M390 616 L515 494 L780 490 L908 600 L950 746 L1090 757 L1110 1095 L876 1172 L253 1185 L76 1082 L90 837 L227 732 Z" />
                <circle cx="186" cy="229" r="46" />
                <circle cx="286" cy="340" r="51" />
              </clipPath>
              <filter id="home-art-blend" colorInterpolationFilters="sRGB">
                {/* Blend the white paper into the room while retaining the original illustration. */}
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -4 -5 -3 1 11" />
              </filter>
            </defs>
            <use href="#home-art-source" filter="url(#home-art-blend)" />
            <use href="#home-art-source" clipPath="url(#home-art-highlights)" />
          </svg>
        </div>
        <nav className="kokoro-menu" aria-label="機能メニュー">
          {([
            ['diary', '気分・日記'],
            ['medication', 'お薬'],
            ['steps', '歩数'],
            ['meditation', '瞑想BGM'],
            ['growth', 'ろきちゃん育成'],
            ['backup', 'バックアップ'],
          ] as const).map(([target, title]) => (
            <button key={target} type="button" onClick={() => navigate(target)}>
              <Icon name={target} />
              {title}
            </button>
          ))}
        </nav>
        <section className="home-progress" aria-label="ろきちゃんの育成状態">
          <div className="home-form-avatar">{character(48)}</div>
          <div className="home-progress-content">
            <div className="progress-heading">
              <h2><Icon name="growth" /> ろきちゃん Lv.{evolution.level}</h2>
              <span>{displayForm.name}</span>
            </div>
            <label htmlFor="home-xp-progress">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp} EXP</label>
            <progress id="home-xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} />
            <p>{evolution.nextLevel ? `次の進化まで Lv.${evolution.nextLevel}` : '最終フォルムに到達！'}</p>
          </div>
        </section>
        <section className="kokoro-checkin" aria-label="今日のチェックイン">
          <div aria-label="記録の概要">累計 {days.length}日 · 連続 {streak}日 · {totalPoints} EXP</div>
          <button type="button" onClick={checkIn} disabled={checkedIn}>{checkedIn ? 'チェックイン済み ✓' : 'チェックイン'}</button>
        </section>
      </>}
      {page !== 'home' && <nav className="kokoro-back-nav" aria-label="画面移動" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 74 }}>
        <button type="button" onClick={() => navigate(page === 'dressup' ? 'growth' : 'home')} style={{ border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '10px 18px', fontSize: 14, flexShrink: 0 }}>{page === 'dressup' ? '← 育成に戻る' : '← ホームに戻る'}</button>
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
            <button className="wardrobe-save" type="button" onClick={() => navigate('dressup')}>着せ替えを開く</button>
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
      {page === 'dressup' && mature && <DressUp saved={appearance} onSave={saveAppearance} rewardDays={rewardDays} />}
      {page === 'diary' && <DiaryCalendar entries={diary} setEntries={setDiary} checkins={days} today={today} steps={steps} medicationTaken={medication.taken} />}
      {page === 'medication' && <MedicationTracker data={medication} setData={setMedication} today={today} />}
      {page === 'steps' && <StepTracker entries={steps} setEntries={setSteps} today={today} incoming={stepImport} clearIncoming={() => setStepImport(null)} />}
      {page === 'meditation' && <Meditation entries={meditation} setEntries={setMeditation} today={today} />}
      {page === 'backup' && <BackupExport checkins={days} diary={diary} medication={medication} steps={steps} meditation={meditation} appearance={appearance} />}
      {page !== 'home' && <p style={{ fontSize: 12, color: '#766b82', marginTop: 24 }}>記録はこの端末のブラウザに保存されます。ブラウザのデータを削除すると記録も消える場合があります。</p>}
    </main>
  );
}
