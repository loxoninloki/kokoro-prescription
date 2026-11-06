import React, { useEffect, useState } from 'react';
import { CHECKIN_XP, evolutionFromXp, XP_PER_LEVEL } from './evolution';
import DiaryCalendar, { diaryExperience, DiaryEntries, readDiary } from './DiaryCalendar';
import MedicationTracker, { MedicationData, medicationExperience, readMedication } from './MedicationTracker';
import StepTracker, { StepEntries, readSteps, stepsExperience } from './StepTracker';
import Meditation, { MeditationEntries, readMeditation, meditationExperience } from './Meditation';
import BackupExport from './BackupExport';
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
  const [meditation, setMeditation] = useState<MeditationEntries>(readMeditation);
  const [today, setToday] = useState(localDay);
  const [headerSticker, setHeaderSticker] = useState<string | null>(null);
  const [headerStickerFailed, setHeaderStickerFailed] = useState(false);
  const [page, setPage] = useState<'home' | 'diary' | 'medication' | 'steps' | 'meditation' | 'growth' | 'backup'>('home');
  const navigate = (next: typeof page) => {
    if (next !== 'home') {
      setHeaderSticker(HEADER_STICKERS[Math.floor(Math.random() * HEADER_STICKERS.length)]);
      setHeaderStickerFailed(false);
    }
    setPage(next);
    window.scrollTo(0, 0);
  };

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

  const checkedIn = days.includes(today);
  const totalPoints = days.length * POINTS_PER_DAY + diaryExperience(diary) + medicationExperience(medication) + stepsExperience(steps) + meditationExperience(meditation);
  const streak = streakFor(days);
  const evolution = evolutionFromXp(totalPoints);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const formImage = { tablet: 'lv1_tablet.webp', birth: 'lv10_birth.webp', awakening: 'lv20_awake.webp', chibi: 'lv30_chibi.webp', human: 'lv50_human.webp' }[evolution.stage];
  useEffect(() => setImageUnavailable(false), [formImage]);
  const character = (size: number) => imageUnavailable
    ? <span className="character-fallback" role="img" aria-label={evolution.stageName}><Icon name={evolution.stage === 'tablet' ? 'medication' : 'growth'} /></span>
    : <img src={`${process.env.PUBLIC_URL}/forms/${formImage}`} alt={`ろきちゃん：${evolution.stageName}`} decoding="async" onError={() => setImageUnavailable(true)} style={{ width: size, height: size, maxWidth: '100%', objectFit: 'contain', borderRadius: 12 }} />;

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
          <div className="kokoro-home-character">{character(160)}</div>
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
          <div className="progress-heading">
            <h2><Icon name="growth" /> ろきちゃん Lv.{evolution.level}</h2>
            <span>{evolution.stageName}</span>
          </div>
          <label htmlFor="home-xp-progress">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp} EXP</label>
          <progress id="home-xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} />
          <p>{evolution.nextLevel ? `次の進化まで Lv.${evolution.nextLevel}` : '最終フォルムに到達！'}</p>
        </section>
        <section className="kokoro-checkin" aria-label="今日のチェックイン">
          <div aria-label="記録の概要">累計 {days.length}日 · 連続 {streak}日 · {totalPoints} EXP</div>
          <button type="button" onClick={checkIn} disabled={checkedIn}>{checkedIn ? 'チェックイン済み ✓' : 'チェックイン'}</button>
        </section>
      </>}
      {page !== 'home' && <nav className="kokoro-back-nav" aria-label="画面移動" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 74 }}>
        <button type="button" onClick={() => navigate('home')} style={{ border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '10px 18px', fontSize: 14, flexShrink: 0 }}>← ホームに戻る</button>
        {headerSticker && !headerStickerFailed && <img src={`${process.env.PUBLIC_URL}/stickers/${headerSticker}`} alt="" aria-hidden="true" onError={() => setHeaderStickerFailed(true)} style={{ width: 84, height: 74, maxWidth: '35%', objectFit: 'contain', objectPosition: 'center', pointerEvents: 'none' }} />}
      </nav>}
      {page === 'growth' && <>
        <section className="growth-card" aria-label="ろきちゃんの成長" style={{ padding: 20, borderRadius: 20, background: '#f8f1ff', textAlign: 'center' }}>
          <div style={{ display: "flex", justifyContent: "center" }}>{character(220)}</div>
          <h2><Icon name="growth" /> ろきちゃん Lv.{evolution.level}</h2>
          <p>{evolution.stageName}</p>
          <label htmlFor="xp-progress">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp}</label>
          <progress id="xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} style={{ display: 'block', width: '100%', marginTop: 8, accentColor: '#7653a6' }} />
          <p>{evolution.nextLevel ? `Lv.${evolution.nextLevel}で次のフォルムに進化！` : 'ヒューマンフォルムに到達しました！'}</p>
          <ol className="evolution-stages" aria-label="進化の5段階">
            {([1, 10, 20, 30, 50]).map(level => {
              const form = evolutionFromXp((level - 1) * XP_PER_LEVEL);
              return <li key={level} aria-current={form.stage === evolution.stage ? 'step' : undefined}>
                <span>Lv.{level}〜</span> {form.stageName}
              </li>;
            })}
          </ol>
        </section>
        <section style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18 }}>チェックイン履歴</h2>
          {days.length === 0 ? <p>最初のチェックインをお待ちしています。</p> :
            <ul>{[...days].reverse().slice(0, 14).map(day => <li key={day}>{day} ✓</li>)}</ul>}
        </section>
      </>}
      {page === 'diary' && <DiaryCalendar entries={diary} setEntries={setDiary} checkins={days} today={today} steps={steps} medicationTaken={medication.taken} />}
      {page === 'medication' && <MedicationTracker data={medication} setData={setMedication} today={today} />}
      {page === 'steps' && <StepTracker entries={steps} setEntries={setSteps} today={today} />}
      {page === 'meditation' && <Meditation entries={meditation} setEntries={setMeditation} today={today} />}
      {page === 'backup' && <BackupExport checkins={days} diary={diary} medication={medication} steps={steps} meditation={meditation} />}
      {page !== 'home' && <p style={{ fontSize: 12, color: '#766b82', marginTop: 24 }}>記録はこの端末のブラウザに保存されます。ブラウザのデータを削除すると記録も消える場合があります。</p>}
    </main>
  );
}
