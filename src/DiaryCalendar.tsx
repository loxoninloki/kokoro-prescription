import { Icon, MoodIcon } from './Icon';
import React, { useEffect, useState } from 'react';

export interface DiaryEntry { mood: number | null; text: string }
export type DiaryEntries = Record<string, DiaryEntry>;
const KEY = 'kokoro-diary-v1';
export const DIARY_XP = 5;
export const MOOD_XP = 5;

export function readDiary(): DiaryEntries {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const clean: DiaryEntries = {};
    for (const [date, value] of Object.entries(raw)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !value || typeof value !== 'object') continue;
      const record = value as { mood?: unknown; text?: unknown };
      clean[date] = {
        mood: typeof record.mood === 'number' && Number.isInteger(record.mood) && record.mood >= 1 && record.mood <= 5 ? record.mood : null,
        text: typeof record.text === 'string' ? record.text.slice(0, 2000) : '',
      };
    }
    return clean;
  } catch { return {}; }
}

export function diaryExperience(entries: DiaryEntries): number {
  return Object.values(entries).reduce((xp, entry) => xp + (entry.mood ? MOOD_XP : 0) + (entry.text.trim() ? DIARY_XP : 0), 0);
}

interface Props {
  entries: DiaryEntries;
  setEntries: React.Dispatch<React.SetStateAction<DiaryEntries>>;
  checkins: string[];
  today: string;
  steps: Record<string, number>;
  medicationTaken: Record<string, boolean>;
}

export default function DiaryCalendar({ entries, setEntries, checkins, today, steps, medicationTaken }: Props) {
  const [selected, setSelected] = useState(today);
  const hasMedication = (day: string) => Object.keys(medicationTaken).some(key => medicationTaken[key] && key.startsWith(day + '|'));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [draft, setDraft] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(entries[selected]?.text || '');
    setMood(entries[selected]?.mood || null);
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

  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const dates = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : `${month}-${String(i - firstDay + 1).padStart(2, '0')}`);

  const changeMonth = (delta: number) => {
    const date = new Date(year, monthNumber - 1 + delta, 1);
    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (nextMonth <= today.slice(0, 7)) setMonth(nextMonth);
  };

  const save = () => {
    if (selected > today) return;
    setEntries(previous => ({ ...previous, [selected]: { mood, text: draft.slice(0, 2000) } }));
    setSaved(true);
  };

  return (
    <section style={{ marginTop: 28, padding: 18, borderRadius: 24, background: '#faf5ff' }}>
      <h2><Icon name="diary" /> カレンダーと日記</h2>
      <p style={{ fontSize: 13 }}>書けない日があっても大丈夫。自分のペースで記録しましょう。</p>
      <div className="diary-entry">
        <h3>{selected} の記録</h3>
        <p style={{ fontSize: 13 }}>歩数：{steps[selected] === undefined ? '未記録' : `${steps[selected].toLocaleString()}歩`} ／ 服薬：{hasMedication(selected) ? '記録あり' : '記録なし'}</p>
        <p>この日の気分はいかがでしたか？</p>
        <div className="mood-options" role="group" aria-label="5段階の気分">
          {['とてもつらい','つらい','ふつう','すこしよい','とてもよい'].map((label, index) =>
            <button key={label} type="button" aria-pressed={mood === index + 1} onClick={() => { setMood(index + 1); setSaved(false); }}><MoodIcon index={index} /><span>{label}</span>
            </button>)}
        </div>
        <label htmlFor="diary-text" style={{ display: 'block', marginTop: 16, marginBottom: 6 }}>日記（任意）</label>
        <textarea id="diary-text" value={draft} maxLength={2000} onChange={event => { setDraft(event.target.value); setSaved(false); }}
          placeholder="今日の出来事や気持ちを、自由に書いてください。" rows={5}
          style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid #cab8da', padding: 12, font: 'inherit' }} />
        <button type="button" onClick={save} style={{ marginTop: 10, border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '12px 24px' }}>記録を保存</button>
        {saved && !storageError && <p role="status">保存しました。今日もお疲れさまです 💜</p>}
      </div>
      <h3 className="diary-history">記録カレンダー</h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={() => changeMonth(-1)} aria-label="前の月">‹</button>
        <strong>{year}年 {monthNumber}月</strong>
        <button type="button" onClick={() => changeMonth(1)} disabled={month >= today.slice(0, 7)} aria-label="次の月">›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, textAlign: 'center' }}>
        {['日','月','火','水','木','金','土'].map(day => <strong key={day} style={{ fontSize: 12 }}>{day}</strong>)}
        {dates.map((date, index) => date ?
          <button type="button" key={date} onClick={() => { setSelected(date); setSaved(false); }} aria-pressed={selected === date} disabled={date > today}
            style={{ minHeight: 48, padding: '4px 0', borderRadius: 10, border: selected === date ? '2px solid #7950a8' : '1px solid #e5d7f1', background: selected === date ? '#e9d8fd' : '#fff', opacity: date > today ? 0.45 : 1, color: '#392b4d' }}>
            <span>{Number(date.slice(-2))}</span>
            <span style={{ display: 'block', fontSize: 11 }}>{checkins.includes(date) ? '✓' : ''}{entries[date]?.mood ? '♥' : ''}{entries[date]?.text?.trim() ? '✎' : ''}{steps[date] !== undefined ? '👟' : ''}{hasMedication(date) ? '💊' : ''}</span>
          </button> :
          <span key={`empty-${index}`} />
        )}
      </div>
      <p style={{ fontSize: 12 }}>✓ チェックイン　♥ 気分　✎ 日記　👟 歩数　💊 服薬</p>
      {storageError && <p role="alert">端末に保存できませんでした。空き容量やブラウザの設定をご確認ください。</p>}
    </section>
  );
}
