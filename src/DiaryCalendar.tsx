import { Icon, MoodIcon } from './Icon';
import React, { useEffect, useRef, useState } from 'react';
import StepHistoryChart from './StepHistoryChart';

export interface DiaryEntry { mood: number | null; text: string }
export type DiaryEntries = Record<string, DiaryEntry>;
const MOOD_REPLIES = {
  difficult: { image: '03_yoshiyoshi.png', title: 'よしよし♡', message: '今日はゆっくりで大丈夫' },
  neutral: { image: '02_otsukare.png', title: 'おつかれ！', message: '今日も記録できましたね' },
  good: { image: '05_yattane.png', title: 'やったね！', message: 'いい気分を残せましたね' },
};

const MOOD_LABELS = ['とてもつらい', 'つらい', 'ふつう', 'すこしよい', 'とてもよい'];

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
  const [view, setView] = useState<'diary' | 'calendar'>('diary');
  const [calendarView, setCalendarView] = useState<'calendar' | 'steps'>('calendar');
  const [monthly, setMonthly] = useState(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const hasMedication = (day: string) => Object.keys(medicationTaken).some(key => medicationTaken[key] && key.startsWith(day + '|'));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [draft, setDraft] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const selectedEntry = entries[selected];
  const reply = mood === null ? null : MOOD_REPLIES[mood <= 2 ? 'difficult' : mood === 3 ? 'neutral' : 'good'];

  useEffect(() => {
    setDraft(entries[selected]?.text || '');
    setMood(entries[selected]?.mood || null);
  }, [selected, entries]);

  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const dates = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : `${month}-${String(i - firstDay + 1).padStart(2, '0')}`);

  const showYear = calendarView === 'steps' && monthly;
  const changePeriod = (delta: number) => {
    const date = showYear
      ? new Date(year + delta, monthNumber - 1, 1)
      : new Date(year, monthNumber - 1 + delta, 1);
    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMonth(nextMonth > today.slice(0, 7) ? today.slice(0, 7) : nextMonth);
  };

  const save = () => {
    if (selected > today) return;
    const nextEntries = { ...entries, [selected]: { mood, text: draft.slice(0, 2000) } };
    try {
      localStorage.setItem(KEY, JSON.stringify(nextEntries));
    } catch {
      setStorageError(true);
      setSaved(false);
      return;
    }
    setEntries(nextEntries);
    setStorageError(false);
    setSaved(true);
  };

  return (
    <section style={{ marginTop: 28, padding: 18, borderRadius: 24, background: '#faf5ff' }}>
      <h2><Icon name="diary" /> 気分・日記</h2>
      <div className="diary-switch" role="group" aria-label="記録画面">
        <button type="button" aria-pressed={view === 'diary'} onClick={() => setView('diary')}>日記</button>
        <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>カレンダー</button>
      </div>
      {view === 'diary' ? <>
        <p style={{ fontSize: 13 }}>書けない日があっても大丈夫。自分のペースで記録しましょう。</p>
        <div className="diary-entry">
          <h3>{selected} の記録</h3>
          <p style={{ fontSize: 13 }}>歩数：{steps[selected] === undefined ? '未記録' : `${steps[selected].toLocaleString()}歩`} ／ 服薬：{hasMedication(selected) ? '記録あり' : '記録なし'}</p>
          <p>この日の気分はいかがでしたか？</p>
          <div className="mood-options" role="group" aria-label="5段階の気分">
            {MOOD_LABELS.map((label, index) =>
              <button key={label} type="button" aria-pressed={mood === index + 1} onClick={() => { setMood(index + 1); setSaved(false); }}><MoodIcon index={index} /><span>{label}</span>
              </button>)}
          </div>
          <label htmlFor="diary-text" style={{ display: 'block', marginTop: 16, marginBottom: 6 }}>日記（任意）</label>
          <textarea id="diary-text" value={draft} maxLength={2000} onChange={event => { setDraft(event.target.value); setSaved(false); }}
            placeholder="今日の出来事や気持ちを、自由に書いてください。" rows={5}
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid #cab8da', padding: 12, font: 'inherit' }} />
          <button type="button" onClick={save} style={{ marginTop: 10, border: 0, borderRadius: 999, background: '#7653a6', color: '#fff', padding: '12px 24px' }}>記録を保存</button>
          <div role="status">
            {saved && (reply ? (
              <div className="diary-mood-reply">
                <img src={`${process.env.PUBLIC_URL}/stickers/${reply.image}`} alt="" width="80" height="80" />
                <div>
                  <span>保存しました</span>
                  <strong>{reply.title}</strong>
                  <p>{reply.message}</p>
                </div>
              </div>
            ) : <p>保存しました。今日もお疲れさまです 💜</p>)}
          </div>
        </div>
      </> : <>
        <div className="diary-switch" role="group" aria-label="カレンダー内の表示">
          <button type="button" aria-pressed={calendarView === 'calendar'} onClick={() => setCalendarView('calendar')}>記録カレンダー</button>
          <button type="button" aria-pressed={calendarView === 'steps'} onClick={() => setCalendarView('steps')}>歩数グラフ</button>
        </div>
        <p className="diary-swipe-hint">{calendarView === 'calendar' ? '左にスワイプで歩数グラフ →' : '← 右にスワイプで記録カレンダー'}</p>
        <div className="diary-swipe-panel"
          onTouchStart={event => {
            const touch = event.touches[0];
            swipeStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
          }}
          onTouchCancel={() => { swipeStart.current = null; }}
          onTouchEnd={event => {
            const start = swipeStart.current;
            swipeStart.current = null;
            if (!start) return;
            const touch = event.changedTouches[0];
            if (!touch) return;
            const dx = touch.clientX - start.x;
            const dy = touch.clientY - start.y;
            if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy) * 1.5) setCalendarView(dx < 0 ? 'steps' : 'calendar');
          }}>
          {calendarView === 'steps' && <div className="diary-switch" role="group" aria-label="歩数の集計">
            <button type="button" aria-pressed={!monthly} onClick={() => setMonthly(false)}>日ごと</button>
            <button type="button" aria-pressed={monthly} onClick={() => setMonthly(true)}>月ごと</button>
          </div>}
          <div className="diary-period">
            <button type="button" onClick={() => changePeriod(-1)} aria-label={showYear ? '前の年' : '前の月'}>‹</button>
            <strong>{year}年{showYear ? '' : ` ${monthNumber}月`}</strong>
            <button type="button" onClick={() => changePeriod(1)}
              disabled={showYear ? year >= Number(today.slice(0, 4)) : month >= today.slice(0, 7)}
              aria-label={showYear ? '次の年' : '次の月'}>›</button>
          </div>
          {calendarView === 'steps' ? <StepHistoryChart steps={steps} month={month} monthly={monthly} today={today} /> : <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4, textAlign: 'center' }}>
              {['日','月','火','水','木','金','土'].map(day => <strong key={day} style={{ fontSize: 12 }}>{day}</strong>)}
              {dates.map((date, index) => date ?
                <button type="button" key={date} aria-label={date} onClick={() => { setSelected(date); setSaved(false); }} aria-pressed={selected === date} disabled={date > today}
                  style={{ minHeight: 48, padding: '4px 0', borderRadius: 10, border: selected === date ? '2px solid #7950a8' : '1px solid #e5d7f1', background: selected === date ? '#e9d8fd' : '#fff', opacity: date > today ? 0.45 : 1, color: '#392b4d' }}>
                  <span>{Number(date.slice(-2))}</span>
                  <span style={{ display: 'block', fontSize: 11 }}>{checkins.includes(date) ? '✓' : ''}{entries[date]?.mood ? '♥' : ''}{entries[date]?.text?.trim() ? '✎' : ''}{steps[date] !== undefined ? '👟' : ''}{hasMedication(date) ? '💊' : ''}</span>
                </button> :
                <span key={`empty-${index}`} />
              )}
            </div>
            <p style={{ fontSize: 12 }}>✓ チェックイン　♥ 気分　✎ 日記　👟 歩数　💊 服薬</p>
            {selected.startsWith(month + '-') && <div className="diary-entry">
              <h3>{selected} の記録</h3>
              <p>歩数：{steps[selected] === undefined ? '未記録' : `${steps[selected].toLocaleString()}歩`} ／ 服薬：{hasMedication(selected) ? '記録あり' : '記録なし'}</p>
              {checkins.includes(selected) && <p>チェックイン済み ✓</p>}
              {selectedEntry?.mood && <p>気分：{MOOD_LABELS[selectedEntry.mood - 1]}</p>}
              {selectedEntry?.text && <p className="diary-preview-text">{selectedEntry.text}</p>}
              <button type="button" onClick={() => setView('diary')}>この日の日記を開く</button>
            </div>}
          </>}
        </div>
      </>}
      {storageError && <p role="alert">端末に保存できませんでした。空き容量やブラウザの設定をご確認ください。</p>}
    </section>
  );
}
