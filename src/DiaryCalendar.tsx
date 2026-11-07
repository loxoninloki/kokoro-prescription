import { Icon, MoodIcon } from './Icon';
import React, { useEffect, useRef, useState } from 'react';
import StepHistoryChart from './StepHistoryChart';
import {CareHeading,CareSection} from './SelfcareUI';
import {displayDay} from './selfcareView';
import type {Medicine} from './MedicationTracker';

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
  medicines?: readonly Medicine[];
}

export default function DiaryCalendar({ entries, setEntries, checkins, today, steps, medicationTaken, medicines=[] }: Props) {
  const [selected, setSelected] = useState(today);
  const previousToday=useRef(today);
  useEffect(()=>{const prior=previousToday.current;previousToday.current=today;setSelected(value=>value===prior?today:value);},[today]);
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
  const recent=Object.keys(entries).filter(day=>day<=today&&(entries[day].mood||entries[day].text.trim())).sort().reverse().slice(0,3);
  const recordedInMonth=datesForMonth(entries,steps,medicationTaken,month,today);
  const savedMood=selectedEntry?.mood;
  const selectedDoses=Object.keys(medicationTaken).filter(key=>medicationTaken[key]&&key.startsWith(selected+'|'));
  const openDiary=(day:string)=>{setSelected(day);setSaved(false);setView('diary');};

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

  return <section className={'selfcare-page diary-care'+(view==='diary'?' care-compact':'')} data-view={view} aria-label={view==='diary'?'日記':'カレンダー'}>
    <CareHeading icon="diary" title={view==='diary'?'日記':'カレンダー'} note="小さな気持ちも、あなたの大切な記録。"/>
    <div className="care-segment diary-switch" role="group" aria-label="記録画面">
      <button type="button" aria-pressed={view==='diary'} onClick={()=>setView('diary')}>日記</button>
      <button type="button" aria-pressed={view==='calendar'} onClick={()=>setView('calendar')}>カレンダー</button>
    </div>
    {view==='diary'?<>
      <section className="care-card care-diary-editor" aria-label="気分と日記の入力">
        <div className="care-diary-date"><label className="care-date-label">記録日<input type="date" value={selected} max={today} onChange={e=>{if(e.target.value){setSelected(e.target.value);setSaved(false);}}}/></label><span className="care-saved-mood">{savedMood?MOOD_LABELS[savedMood-1]:'気分を選択'}</span></div>
        <div className="mood-options care-moods" role="group" aria-label="5段階の気分">{MOOD_LABELS.map((label,index)=><button key={label} type="button" aria-pressed={mood===index+1} onClick={()=>{setMood(index+1);setSaved(false);}}><MoodIcon index={index}/><span>{label}</span></button>)}</div>
        <label className="care-field" htmlFor="diary-text">日記（任意）</label>
        <textarea id="diary-text" value={draft} maxLength={2000} rows={4} onChange={e=>{setDraft(e.target.value);setSaved(false);}} placeholder="今日の気持ちを、ひとことから。"/>
        <div className="care-input-meta"><span>自分のペースで、大丈夫。</span><span>{draft.length} / 2000</span></div>
        <button className="care-primary" type="button" onClick={save} disabled={selected>today}><Icon name="diary"/>記録を保存</button>
        <div role="status">{saved&&<p className="care-saved">保存しました。{reply?reply.message:'今日もお疲れさまです。'}</p>}</div>
        <details className="care-inline-disclosure"><summary>書き出しのヒント</summary><div className="care-prompt-chips" role="group" aria-label="日記の入力補助">{['ほっとした','疲れた','がんばった','不安だった','楽しかった'].map(chip=><button key={chip} type="button" disabled={draft.length+chip.length+(draft?1:0)>2000} onClick={()=>{setDraft(value=>value+(value?'\n':'')+chip);setSaved(false);}}>{chip}</button>)}</div></details>
      </section>
      <details className="care-disclosure"><summary>最近の日記・履歴</summary><CareSection title="最近の日記" action={<button type="button" className="care-text-button" onClick={()=>{setMonth(today.slice(0,7));setView('calendar');setCalendarView('calendar');}}>もっと見る ›</button>}>
        {recent.length?<ul className="care-recent">{recent.map(day=><li key={day}><button type="button" onClick={()=>openDiary(day)}><Icon name="diary"/><span><time dateTime={day}>{displayDay(day)}</time><span>{entries[day].text.trim()||(entries[day].mood?MOOD_LABELS[entries[day].mood!-1]:'記録なし')}</span></span><b aria-hidden="true">›</b></button></li>)}</ul>:<p className="care-empty">日記はまだありません。ひとことからでも大丈夫。</p>}
      </CareSection></details>
    </>:<>
      <div className="care-segment diary-switch" role="group" aria-label="カレンダー内の表示"><button type="button" aria-pressed={calendarView==='calendar'} onClick={()=>setCalendarView('calendar')}>記録カレンダー</button><button type="button" aria-pressed={calendarView==='steps'} onClick={()=>setCalendarView('steps')}>歩数グラフ</button></div>
      <p className="diary-swipe-hint">{calendarView==='calendar'?'左にスワイプで歩数グラフ →':'← 右にスワイプで記録カレンダー'}</p>
      <div className="care-card diary-swipe-panel" onTouchStart={event=>{const touch=event.touches[0];swipeStart.current=event.touches.length===1?{x:touch.clientX,y:touch.clientY}:null;}} onTouchCancel={()=>{swipeStart.current=null;}} onTouchEnd={event=>{const start=swipeStart.current;swipeStart.current=null;const touch=event.changedTouches[0];if(!start||!touch)return;const dx=touch.clientX-start.x,dy=touch.clientY-start.y;if(Math.abs(dx)>=55&&Math.abs(dx)>Math.abs(dy)*1.5)setCalendarView(dx<0?'steps':'calendar');}}>
        {calendarView==='steps'&&<div className="care-segment diary-switch" role="group" aria-label="歩数の集計"><button type="button" aria-pressed={!monthly} onClick={()=>setMonthly(false)}>日ごと</button><button type="button" aria-pressed={monthly} onClick={()=>setMonthly(true)}>月ごと</button></div>}
        <div className="care-period diary-period"><button type="button" onClick={()=>changePeriod(-1)} aria-label={showYear?'前の年':'前の月'}>‹</button><strong>{year}年{showYear?'':` ${monthNumber}月`}</strong><button type="button" onClick={()=>changePeriod(1)} disabled={showYear?year>=Number(today.slice(0,4)):month>=today.slice(0,7)} aria-label={showYear?'次の年':'次の月'}>›</button></div>
        {calendarView==='steps'?<StepHistoryChart steps={steps} month={month} monthly={monthly} today={today}/>:<>
          <p className="care-month-count">この月の記録 <strong>{recordedInMonth}日</strong></p>
          <div className="care-calendar-grid">{['日','月','火','水','木','金','土'].map(day=><span className="care-weekday" key={day}>{day}</span>)}{dates.map((date,index)=>date?<button type="button" key={date} aria-label={date} aria-pressed={selected===date} aria-current={date===today?'date':undefined} disabled={date>today} onClick={()=>{setSelected(date);setSaved(false);}}><span>{Number(date.slice(-2))}</span><span className="care-record-dots">{entries[date]?.text?.trim()&&<i className="care-dot-diary" aria-label="日記の記録あり"/>}{entries[date]?.mood&&<i className="care-dot-mood" aria-label="気分の記録あり"/>}{hasMedication(date)&&<i className="care-dot-medicine" aria-label="服薬の記録あり"/>}{steps[date]!==undefined&&<i className="care-dot-steps" aria-label="歩数の記録あり"/>}</span>{checkins.includes(date)&&<span className="care-checkin-mark" aria-label="チェックイン済み">✓</span>}</button>:<span key={'empty'+index}/>)}</div>
          <div className="care-calendar-legend"><span><i className="care-dot-diary"/>日記</span><span><i className="care-dot-mood"/>気分</span><span><i className="care-dot-medicine"/>服薬</span><span><i className="care-dot-steps"/>歩数</span><span>✓ ログイン</span></div>
        </>}
      </div>
      {calendarView==='calendar'&&selected.startsWith(month+'-')&&<CareSection title={`${displayDay(selected)} の記録`}>
        <dl className="care-day-records"><div><dt><Icon name="growth"/>気分</dt><dd>{selectedEntry?.mood?MOOD_LABELS[selectedEntry.mood-1]:'記録なし'}</dd></div><div><dt><Icon name="diary"/>日記</dt><dd>{selectedEntry?.text?.trim()?<span className="diary-preview-text">{selectedEntry.text}</span>:'記録なし'}</dd></div><div><dt><Icon name="medication"/>服薬</dt><dd>{selectedDoses.length?<><span>{selectedDoses.length}件の記録</span><ul>{selectedDoses.map(key=><li key={key}>{medicines.find(m=>m.id===key.slice(selected.length+1))?.name||'登録情報が見つからないお薬の記録'}</li>)}</ul></>:'記録なし'}</dd></div><div><dt><Icon name="steps"/>歩数</dt><dd>{steps[selected]===undefined?'記録なし':`${steps[selected].toLocaleString('ja-JP')}歩`}</dd></div></dl>
        <button className="care-secondary" type="button" onClick={()=>openDiary(selected)}>この日の日記を開く</button>
      </CareSection>}
    </>}
    {storageError&&<p role="alert">端末に保存できませんでした。空き容量やブラウザの設定をご確認ください。</p>}
  </section>;
}

function datesForMonth(entries:DiaryEntries,steps:Record<string,number>,taken:Record<string,boolean>,month:string,today:string) {
 const dates=new Set<string>();
 Object.entries(entries).forEach(([day,e])=>{if(e.mood||e.text.trim())dates.add(day);});Object.keys(steps).forEach(day=>dates.add(day));Object.keys(taken).forEach(key=>{if(taken[key])dates.add(key.split('|')[0]);});
 return Array.from(dates).filter(day=>day.startsWith(month+'-')&&day<=today).length;
}
