import React, { useEffect, useState } from 'react';
import { CHECKIN_XP, evolutionFromXp } from './evolution';
import DiaryCalendar, { diaryExperience, DiaryEntries, readDiary } from './DiaryCalendar';
import MedicationTracker, { MedicationData, medicationExperience, readMedication } from './MedicationTracker';
import StepTracker, { StepEntries, readSteps, stepsExperience } from './StepTracker';
import Meditation, { MeditationEntries, readMeditation, meditationExperience } from './Meditation';
import BackupExport from './BackupExport';

const STORAGE_KEY = 'kokoro-checkins-v1';
const POINTS_PER_DAY = CHECKIN_XP;

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
  const [page, setPage] = useState<'home' | 'diary' | 'medication' | 'steps' | 'meditation' | 'growth' | 'backup'>('home');
  const navigate = (next: typeof page) => { setPage(next); window.scrollTo(0, 0); };

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
  const formSymbol = { tablet: '💊', awakening: '✨', chibi: '💜', human: '🧑' }[evolution.stage];

  const checkIn = () => {
    const current = localDay();
    setToday(current);
    setDays(previous => previous.includes(current) ? previous : [...previous, current].sort());
  };

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px', fontFamily: 'system-ui, sans-serif', color: '#38294d' }}>
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 36 }} aria-hidden="true">💜</span>
        <h1>こころの処方箋</h1>
        <p>今日も来てくれて、ありがとう。</p>
      </header>
      {(page === 'home' || page === 'growth') && <section aria-label="ろきちゃんの成長" style={{ padding: 24, borderRadius: 24, background: '#f8f1ff', textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontSize: 56 }} aria-hidden="true">{formSymbol} 🐹</div>
        <h2 style={{ marginBottom: 4 }}>ろきちゃん Lv.{evolution.level}</h2>
        <p style={{ marginTop: 0 }}>{evolution.stageName} ＆ もるすけ</p>
        <label htmlFor="xp-progress">経験値 {evolution.currentLevelXp} / {evolution.requiredLevelXp}</label>
        <progress id="xp-progress" value={evolution.currentLevelXp} max={evolution.requiredLevelXp} style={{ display: 'block', width: '100%', marginTop: 8, accentColor: '#7653a6' }} />
        <p style={{ fontSize: 13 }}>{evolution.nextLevel ? `Lv.${evolution.nextLevel}で次のフォルムに進化！` : 'ヒューマンフォルムに到達しました！'}</p>
        <p style={{ fontSize: 12, color: '#766b82' }}>キャラクター画像は準備中です。現在は仮アイコンで表示しています。</p>
      </section>}
      {page === 'home' && <section style={{ padding: 24, borderRadius: 24, background: '#f3eaff', textAlign: 'center' }}>
        <h2>今日のチェックイン</h2>
        <p>{checkedIn ? '今日も会えてうれしいです。ゆっくり過ごしましょう。' : '頑張る日も、休む日も。ここに来ただけで十分です。'}</p>
        <button onClick={checkIn} disabled={checkedIn} style={{ background: checkedIn ? '#a59ab2' : '#7653a6', color: 'white', border: 0, borderRadius: 999, padding: '14px 28px', fontSize: 16 }}>
          {checkedIn ? '本日のチェックイン完了 ✓' : '今日のチェックインをする'}
        </button>
      </section>}
      {page === 'home' && <section aria-label="チェックインの記録" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18, textAlign: 'center' }}>
        <div><strong>{days.length}</strong><p>累計日数</p></div>
        <div><strong>{streak}</strong><p>連続日数</p></div>
        <div><strong>{totalPoints}</strong><p>経験値</p></div>
      </section>}
      {page === 'home' && <section aria-label="機能メニュー" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 19, marginBottom: 12 }}>メニュー</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          {([
            ['diary', '📅', '日記・気分'],
            ['medication', '💊', 'お薬'],
            ['steps', '👟', '歩数'],
            ['meditation', '🌙', '瞑想'],
            ['growth', '💜', 'ろきちゃん'],
            ['backup', '🗂️', 'バックアップ']
          ] as const).map(([target, symbol, title]) => (
            <button key={target} type="button" onClick={() => navigate(target)}
              style={{ minHeight: 100, padding: 12, border: '1px solid #e6d8f4', borderRadius: 18, background: '#f8f2ff', color: '#38294d', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              <span aria-hidden="true" style={{ display: 'block', fontSize: 28, marginBottom: 6 }}>{symbol}</span>{title}
            </button>
          ))}
        </div>
      </section>}
      {page !== 'home' && <nav aria-label="画面移動" style={{ marginTop: 20 }}>
        <button type="button" onClick={() => navigate('home')}
          style={{ border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '12px 22px', fontSize: 16 }}>← ホームに戻る</button>
      </nav>}
      {page === 'diary' && <DiaryCalendar entries={diary} setEntries={setDiary} checkins={days} today={today} steps={steps} medicationTaken={medication.taken} />}
      {page === 'medication' && <MedicationTracker data={medication} setData={setMedication} today={today} />}
      {page === 'steps' && <StepTracker entries={steps} setEntries={setSteps} today={today} />}
      {page === 'meditation' && <Meditation entries={meditation} setEntries={setMeditation} today={today} />}
      {page === 'backup' && <BackupExport checkins={days} diary={diary} medication={medication} steps={steps} meditation={meditation} />}
      {page === 'growth' && <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18 }}>チェックイン履歴</h2>
        {days.length === 0 ? <p>最初のチェックインをお待ちしています。</p> :
          <ul>{[...days].reverse().slice(0, 14).map(day => <li key={day}>{day} ✓</li>)}</ul>}
      </section>}
      {page !== 'home' && <button type="button" onClick={() => navigate('home')} style={{ marginTop: 24, border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '12px 22px', fontSize: 16 }}>← ホームに戻る</button>}
      <p style={{ fontSize: 12, color: '#766b82', marginTop: 32 }}>記録はこの端末のブラウザに保存されます。ブラウザのデータを削除すると記録も消える場合があります。</p>
    </main>
  );
}
