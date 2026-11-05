import React, { useEffect, useRef, useState } from 'react';
type MeditationTrack = 'ambient' | 'floating' | 'relaxing';
const TRACKS: Record<MeditationTrack, string> = {
  ambient: 'quietphase-ambient-meditation-485723.mp3',
  floating: 'leberch-meditation-ambient-375361.mp3',
  relaxing: 'danamusic-meditation-relaxing-music-293922.mp3',
};

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
  const sound = useRef<HTMLAudioElement | null>(null);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [soundscape, setSoundscape] = useState<MeditationTrack>('ambient');
  const [audioError, setAudioError] = useState('');

  const stopAudio = () => {
    const audio = sound.current;
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); sound.current = null; }
  };
  useEffect(() => () => { sound.current?.pause(); }, []);

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
        stopAudio();
        setFinished(true);
        const now = new Date();
        const completedDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setEntries(previous => ({ ...previous, [completedDay]: true }));
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [running, setEntries]);

  const start = () => {
    setAudioError('');
    if (bgmEnabled) {
      stopAudio();
      const audio = new Audio(`${process.env.PUBLIC_URL}/music/${TRACKS[soundscape]}`);
      audio.loop = true;
      audio.volume = 0.35;
      sound.current = audio;
      void audio.play().catch(() => {
        if (sound.current === audio) {
          stopAudio();
          setAudioError('音を再生できませんでした。無音でも瞑想できます。');
        }
      });
    }
    const seconds = remaining > 0 ? remaining : duration;
    setRemaining(seconds);
    deadline.current = Date.now() + seconds * 1000;
    setFinished(false);
    setRunning(true);
  };
  const stop = () => {
    stopAudio();
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
    <label style={{ display: 'block', marginTop: 12 }}><input type="checkbox" checked={bgmEnabled} disabled={running} onChange={e => setBgmEnabled(e.target.checked)} /> リラックスBGMを流す</label>
    {bgmEnabled && <label style={{ display: 'block', marginTop: 12 }}>BGMの種類
      <select disabled={running} value={soundscape} onChange={e => setSoundscape(e.target.value as MeditationTrack)}
        style={{ display: 'block', margin: '10px auto', padding: 10, borderRadius: 10 }}>
        <option value="ambient">✨ Ambient Meditation</option>
        <option value="floating">🌙 Meditation Ambient</option>
        <option value="relaxing">💜 Meditation Relaxing Music</option>
      </select>
    </label>}
    {audioError && <p role="status">{audioError}</p>}
    <div role="timer" aria-label="残り時間" style={{ fontSize: 40, fontWeight: 700, margin: '16px 0' }}>
      {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
    </div>
    <p>{running ? '息をゆっくり吸って、ゆっくり吐きましょう。' : finished ? 'お疲れさま。少し休めましたね 💜' : '途中でやめても大丈夫です。'}</p>
    {!running ? <button type="button" onClick={start} style={{ padding: '12px 24px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>{remaining === duration ? '瞑想を始める' : '続きを始める'}</button> :
      <button type="button" onClick={stop} style={{ padding: '12px 24px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>終了する</button>}
    {entries[today] && <p>本日の瞑想記録 ✓</p>}
    <p style={{ fontSize: 12, color: '#766b82' }}>1日1回、完了すると+10EXP。音量に注意してください。BGMは画面ロック時に停止する場合があります。画面を閉じている間はタイマーの完了処理が遅れる場合があります。</p>
  </section>;
}
