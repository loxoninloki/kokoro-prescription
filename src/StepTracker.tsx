import { Icon } from './Icon';
import React, { useEffect, useState } from 'react';

export type StepEntries = Record<string, number>;
const KEY = 'kokoro-steps-v1';

export function readSteps(): StepEntries {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const result: StepEntries = {};
    for (const [day, count] of Object.entries(raw)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= 100000) result[day] = count;
    }
    return result;
  } catch { return {}; }
}

export function stepsExperience(entries: StepEntries): number {
  return Object.values(entries).reduce((total, steps) =>
    total + (steps >= 1000 ? 5 : 0) + (steps >= 3000 ? 10 : 0) + (steps >= 5000 ? 15 : 0), 0);
}

export function encouragement(steps: number | undefined): string {
  if (steps === undefined) return '歩数を記録したら、ろきちゃんが応援します。';
  if (steps === 0) return '今日はゆっくり休も。休む日も大切だよ。';
  if (steps >= 5000) return 'たくさん歩いたね！頑張ったね。ゆっくり休んでね。';
  if (steps >= 3000) return 'いっぱい歩けたね！お疲れさま。';
  if (steps >= 1000) return '今日も歩けたね。えらいよ！';
  return '少しでも歩けたね。自分のペースで大丈夫だよ。';
}

interface Props {
  entries: StepEntries;
  setEntries: React.Dispatch<React.SetStateAction<StepEntries>>;
  today: string;
}

export default function StepTracker({ entries, setEntries, today }: Props) {
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(entries[selected] === undefined ? '' : String(entries[selected]));
  }, [selected, entries]);

  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [entries]);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selected) || selected > today || !/^\d{1,6}$/.test(draft)) return;
    const steps = Number(draft);
    if (steps > 100000) return;
    setEntries(previous => ({ ...previous, [selected]: steps }));
    setSaved(true);
  };

  return (
    <section style={{ marginTop: 26, padding: 18, borderRadius: 24, background: '#f4efff' }}>
      <h2><Icon name="steps" /> 今日の歩数</h2>
      <p className="step-count">{entries[today] === undefined ? '未記録' : `${entries[today].toLocaleString()} 歩`}</p>
      <p style={{ fontSize: 13 }}>iPhoneのヘルスケアで確認した歩数を入力できます。自動取得は将来のiPhoneアプリ版で検討します。</p>
      <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
        <label>記録する日
          <input type="date" value={selected} max={today} onChange={event => { setSelected(event.target.value); setSaved(false); }} required style={{ display: 'block', marginTop: 6, padding: 10 }} />
        </label>
        <label>歩数
          <input type="number" inputMode="numeric" min={0} max={100000} step={1} required value={draft}
            onChange={event => { setDraft(event.target.value); setSaved(false); }}
            placeholder="0" style={{ display: 'block', boxSizing: 'border-box', width: '100%', padding: 12, marginTop: 6, borderRadius: 10, border: '1px solid #c9b9dc' }} />
        </label>
        <button type="submit" style={{ padding: 12, border: 0, borderRadius: 20, color: '#fff', background: '#7653a6' }}>歩数を保存</button>
      </form>
      <p role="status" style={{ fontWeight: 600, marginTop: 16 }}>{encouragement(entries[selected])}</p>
      {saved && !storageError && <p>歩数を保存しました 💜</p>}
      <p style={{ fontSize: 12, color: '#766b82' }}>0歩でも大丈夫。経験値は1,000歩で+5、3,000歩で合計+15、5,000歩で合計+30。歩数の編集で重複加算されません。</p>
      {storageError && <p role="alert">端末に保存できませんでした。空き容量やブラウザの設定をご確認ください。</p>}
    </section>
  );
}
