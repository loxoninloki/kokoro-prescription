import React, { useEffect, useRef, useState } from 'react';

export type MeditationEntries = Record<string, boolean>;
const KEY = 'kokoro-meditation-v1';
export const MEDITATION_XP = 10;

export function readMeditation(): MeditationEntries {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean: MeditationEntries = {};
    for (const [day, done] of Object.entries(raw)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && done === true) clean[day] = true;
    }
    return clean;
  } catch { return {}; }
}

export function meditationExperience(entries: MeditationEntries): number {
  return Object.values(entries).filter(Boolean).length * MEDITATION_XP;
}

interface Props {
  today: string;
  entries: MeditationEntries;
  setEntries: React.Dispatch<React.SetStateAction<MeditationEntries>>;
}

export default function Meditation({ today, entries, setEntries }: Props) {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const deadline = useRef<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* storage unavailable */ }
  }, [entries]);

  useEffect(() => {
    if (!running || deadline.current === null) return;
    const tick = () => {
      if (deadline.current === null) return;
      const seconds = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        deadline.current = null;
        setRunning(false);
        setFinished(true);
        const completedDay = new Date().toLocaleDateString('sv-SE');
        setEntries(previous => ({ ...previous, [completedDay]: true }));
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running, setEntries]);

  const start = () => {
    deadline.current = Date.now() + remaining * 1000;
    setFinished(false);
    setRunning(true);
  };
  const stop = () => {
    deadline.current = null;
    setRunning(false);
    setRemaining(duration);
    setFinished(false);
  };
  const changeDuration = (seconds: number) => {
    setDuration(seconds);
    setRemaining(seconds);
    setFinished(false);
  };

  return <section style={{ marginTop: 26, padding: 18, borderRadius: 24, background: '#f2ecff', textAlign: 'center' }}>
    <h2>🌙 ひとやすみ瞑想</h2>
    <p>ゆっくり呼吸して、少しだけ自分の時間を。</p>
    <label>時間を選ぶ
      <select disabled={running} value={duration} onChange={e => changeDuration(Number(e.target.value))}
        style={{ display: 'block', margin: '10px auto', padding: 10, borderRadius: 10 }}>
        <option value={60}>1分</option>
        <option value={180}>3分</option>
        <option value={300}>5分</option>
      </select>
    </label>
    <div role="timer" aria-label="残り時間" style={{ fontSize: 40, fontWeight: 700, margin: '16px 0' }}>
      {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
    </div>
    <p>{running ? '息をゆっくり吸って、ゆっくり吐きましょう。' : finished ? 'お疲れさま。少し休めましたね 💜' : '途中でやめても大丈夫です。'}</p>
    {!running ? <button type="button" onClick={start} style={{ padding: '12px 24px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>{remaining === duration ? '瞑想を始める' : '続きを始める'}</button> :
      <button type="button" onClick={stop} style={{ padding: '12px 24px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>終了する</button>}
    {entries[today] && <p>本日の瞑想記録 ✓</p>}
    <p style={{ fontSize: 12, color: '#766b82' }}>1日1回、完了すると+10EXP。BGMは今後追加します。画面を閉じている間はタイマーの完了処理が遅れる場合があります。</p>
  </section>;
}
