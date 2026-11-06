import React, { useEffect, useState } from 'react';
import { CHECKIN_XP, evolutionFromXp } from './evolution';
import DiaryCalendar, { diaryExperience, DiaryEntries, readDiary } from './DiaryCalendar';
import MedicationTracker, { MedicationData, medicationExperience, readMedication } from './MedicationTracker';
import StepTracker, { StepEntries, readSteps, stepsExperience } from './StepTracker';
import Meditation, { MeditationEntries, readMeditation, meditationExperience } from './Meditation';
import BackupExport from './BackupExport';

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
  const formSymbol = { tablet: '💊', birth: '🌱', awakening: '✨', chibi: '💜', human: '🧑' }[evolution.stage];
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const formImage = { tablet: 'lv1_tablet.png', birth: 'lv10_birth.png', awakening: 'lv20_awake.png', chibi: 'lv30_chibi.png', human: 'lv50_human.png' }[evolution.stage];
  useEffect(() => setImageUnavailable(false), [formImage]);
  const character = (size: number) => imageUnavailable
    ? <span aria-hidden="true" style={{ fontSize: size * 0.55 }}>{formSymbol} 🐹</span>
    : <img src={`${process.env.PUBLIC_URL}/${formImage}`} alt={`ろきちゃん：${evolution.stageName}`} onError={() => setImageUnavailable(true)} style={{ width: size, height: size, maxWidth: '100%', objectFit: 'contain', borderRadius: 12 }} />;

  const checkIn = () => {
    const current = localDay();
    setToday(current);
    setDays(previous => previous.includes(current) ? previous : [...previous, current].sort());
  };

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: page === 'home' ? '18px 16px' : '20px 16px', fontFamily: 'system-ui, sans-serif', color: '#38294d' }}>
      <header style={{ textAlign: 'center', marginBottom: page === 'home' ? 16 : 20 }}>
        <h1 style={{ fontSize: page === 'home' ? 24 : 26, margin: '4px 0' }}>💜 こころの処方箋</h1>
      </header>
      <style>{`
        @keyframes kokoroFloat {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
        }
        .kokoro-home-character {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transform-origin: center center;
          animation: kokoroFloat 4.5s ease-in-out infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .kokoro-home-character { animation: none; }
        }
      `}</style>
      {page === 'home' && <>
        <section aria-label="ろきちゃんの育成状態" style={{ padding: '18px 16px', border: '1px solid #e6d8f4', borderRadius: 18, background: '#f8f1ff', textAlign: 'center' }}>
          <div style={{ minHeight: 124, display: "flex", alignItems: "center", justifyContent: "center" }}><div className="kokoro-home-character">{character(116)}</div></div>
          <h2 style={{ fontSize: 20, margin: '8px 0 4px' }}>ろきちゃん Lv.{evolution.level}</h2>
          <p style={{ fontSize: 14, margin: '0 0 10px' }}>現在のフォルム：{evolution.stageName}</p>
          <label htmlFor="home-xp-progress" style={{ display: 'block', fontSize: 13 }}>経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp} EXP</label>
          <progress id="home-xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} style={{ display: 'block', width: '100%', height: 12, marginTop: 7, accentColor: '#7653a6' }} />
          <p style={{ fontSize: 12, margin: '8px 0 0' }}>{evolution.nextLevel ? `次の進化：Lv.${evolution.nextLevel}` : '最終フォルムに到達！'}</p>
        </section>
        <section style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '14px 14px', background: '#f3eaff', borderRadius: 14 }}>
          <span style={{ flex: 1, fontSize: 13 }}>{checkedIn ? '本日のチェックイン完了 ✓' : '今日もゆっくり、一歩ずつ。'}</span>
          <button onClick={checkIn} disabled={checkedIn} style={{ background: checkedIn ? '#a59ab2' : '#7653a6', color: 'white', border: 0, borderRadius: 999, padding: '12px 16px', fontSize: 14, whiteSpace: 'nowrap' }}>{checkedIn ? '完了 ✓' : 'チェックイン'}</button>
        </section>
        <div aria-label="記録の概要" style={{ display: 'flex', justifyContent: 'space-around', margin: '14px 0', fontSize: 13, textAlign: 'center' }}>
          <span>累計 <strong>{days.length}日</strong></span><span>連続 <strong>{streak}日</strong></span><span>EXP <strong>{totalPoints}</strong></span>
        </div>
        <section aria-label="機能メニュー" style={{ marginTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 11 }}>
            {([
              ['diary', '📅', '日記・気分'],
              ['medication', '💊', 'お薬'],
              ['steps', '👟', '歩数'],
              ['meditation', '🌙', '瞑想'],
              ['growth', '💜', 'ろきちゃん'],
              ['backup', '🗂️', 'バックアップ']
            ] as const).map(([target, symbol, title]) => (
              <button key={target} type="button" onClick={() => navigate(target)}
                style={{ minHeight: 83, padding: '12px 7px', border: '1px solid #e6d8f4', borderRadius: 14, background: '#f8f2ff', color: '#38294d', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                <span aria-hidden="true" style={{ display: 'block', fontSize: 27, marginBottom: 3 }}>{symbol}</span>{title}
              </button>
            ))}
          </div>
        </section>
      </>}
      {page !== 'home' && <nav aria-label="画面移動" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 74 }}>
        <button type="button" onClick={() => navigate('home')} style={{ border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '10px 18px', fontSize: 14, flexShrink: 0 }}>← ホームに戻る</button>
        {headerSticker && !headerStickerFailed && <img src={`${process.env.PUBLIC_URL}/stickers/${headerSticker}`} alt="" aria-hidden="true" onError={() => setHeaderStickerFailed(true)} style={{ width: 84, height: 74, maxWidth: '35%', objectFit: 'contain', objectPosition: 'center', pointerEvents: 'none' }} />}
      </nav>}
      {page === 'growth' && <>
        <section aria-label="ろきちゃんの成長" style={{ padding: 20, borderRadius: 20, background: '#f8f1ff', textAlign: 'center' }}>
          <div style={{ display: "flex", justifyContent: "center" }}>{character(220)}</div>
          <h2>ろきちゃん Lv.{evolution.level}</h2>
          <p>{evolution.stageName}{evolution.stage === 'chibi' ? ' ＆ もるすけ' : ''}</p>
          <label htmlFor="xp-progress">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp}</label>
          <progress id="xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} style={{ display: 'block', width: '100%', marginTop: 8, accentColor: '#7653a6' }} />
          <p>{evolution.nextLevel ? `Lv.${evolution.nextLevel}で次のフォルムに進化！` : 'ヒューマンフォルムに到達しました！'}</p>
          <p style={{ fontSize: 12 }}>5段階の進化で、ろきちゃんが成長します。</p>
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
