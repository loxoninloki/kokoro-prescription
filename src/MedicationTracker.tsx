import { MEDICATION_DAILY_XP, medicationTotalXp, MedicationRewardPolicy } from './medicationPolicy';
import { Icon } from './Icon';
import {CareHeading,CareSection} from './SelfcareUI';
import {nextMedicine} from './selfcareView';
import React, { useEffect, useRef, useState } from 'react';

export interface Medicine { id: string; name: string; time: string; archived?: boolean }
export interface MedicationData { medicines: Medicine[]; taken: Record<string, boolean> }
const KEY = 'kokoro-medication-v1';
export const MEDICATION_XP = MEDICATION_DAILY_XP;
export const doseKey = (date: string, id: string) => date + '|' + id;

export function readMedication(): MedicationData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    const medicines = Array.isArray(data.medicines) ? data.medicines.filter((m: any) =>
      m && typeof m.id === 'string' && typeof m.name === 'string' && typeof m.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)
    ).map((m: Medicine) => ({ id: m.id, name: m.name.slice(0, 80), time: m.time, archived: m.archived === true })) : [];
    const taken: Record<string, boolean> = {};
    if (data.taken && typeof data.taken === 'object') {
      for (const [key, value] of Object.entries(data.taken)) {
        if (value === true && /^\d{4}-\d{2}-\d{2}\|/.test(key)) taken[key] = true;
      }
    }
    return { medicines, taken };
  } catch { return { medicines: [], taken: {} }; }
}

export function medicationExperience(data:MedicationData,policy?:MedicationRewardPolicy,creditedXp?:Readonly<Record<string,number>>):number {
 return medicationTotalXp(data,policy,creditedXp);
}

interface Props {
  data: MedicationData;
  setData: React.Dispatch<React.SetStateAction<MedicationData>>;
  today: string;
  bonusEarned?: boolean;
}

export default function MedicationTracker({ data, setData, today, bonusEarned=false }: Props) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [selectedDate, setSelectedDate] = useState(today);
  const previousToday=useRef(today);
  useEffect(()=>{const prior=previousToday.current;previousToday.current=today;setSelectedDate(value=>value===prior?today:value);},[today]);
  const nameInput=useRef<HTMLInputElement>(null);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30_000);return()=>clearInterval(timer);},[]);
  const active=data.medicines.filter(m=>!m.archived).sort((a,b)=>a.time.localeCompare(b.time));
  const recorded=active.filter(m=>data.taken[doseKey(selectedDate,m.id)]).length;
  const upcoming=nextMedicine(data,today,now);
  const remaining=upcoming?upcoming.minutes===0?'予定時刻です':`${Math.floor(upcoming.minutes/60)?Math.floor(upcoming.minutes/60)+'時間':''}${upcoming.minutes%60}分後`:'';


  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [data]);

  const addMedicine = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;
    if(editingId){
      setData(previous=>({...previous,medicines:previous.medicines.map(m=>m.id===editingId?{...m,name:name.trim().slice(0,80),time}:m)}));
      setEditingId(null);setName('');return;
    }
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    setData(previous => ({ ...previous, medicines: [...previous.medicines, { id, name: name.trim().slice(0, 80), time }] }));
    setName('');
  };

  const toggleTaken = (id: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || selectedDate > today || !data.medicines.some(m => m.id === id && !m.archived)) return;
    const key = doseKey(selectedDate, id);
    setData(previous => {
      const taken = { ...previous.taken };
      if (taken[key]) delete taken[key];
      else taken[key] = true;
      return { ...previous, taken };
    });
  };

  const removeMedicine = (id: string) => {
    if (!window.confirm('このお薬を一覧から非表示にしますか？過去の服薬記録と経験値は残ります。')) return;
    setData(previous => ({ ...previous, medicines: previous.medicines.map(m => m.id === id ? { ...m, archived: true } : m) }));
  };

  return <section className="selfcare-page medication-care care-compact" aria-label="お薬">
    <CareHeading icon="medication" title="お薬" note="記録できたことを、ひとつずつ。"/>
    <div className="care-card care-next-compact" aria-label="次のお薬の予定">
      {upcoming?<div className="care-next-medicine"><span className="care-capsule"><Icon name="medication"/></span><div><span>{upcoming.tomorrow?'明日の登録時刻':'本日の登録時刻'}</span><strong>{upcoming.medicine.time}</strong><p>{upcoming.medicine.name}</p></div><span className="care-countdown">{remaining}</span></div>:<p className="care-empty">予定はまだありません。登録したお薬の時刻がここに表示されます。</p>}
    </div>
    <CareSection title={selectedDate===today?'今日のお薬':'選択日のお薬'} action={<span className="care-badge">{recorded}/{active.length}件 記録済み</span>}>
      <label className="care-date-label">記録する日付<input type="date" value={selectedDate} max={today} min="2000-01-01" onChange={e=>{if(e.target.value)setSelectedDate(e.target.value);}}/></label>

      {!active.length?<p className="care-empty">お薬はまだ登録されていません。</p>:<ul className="care-medicine-timeline">{active.map(m=>{
        const checked=!!data.taken[doseKey(selectedDate,m.id)];
        return <li key={m.id} className="medication-dose" data-taken={checked}><time>{m.time}</time><div><label><input type="checkbox" checked={checked} disabled={selectedDate>today} onChange={()=>toggleTaken(m.id)} aria-label={`${m.time} ${m.name}の服薬記録`}/><span><strong>{m.name}</strong><small>{checked?'記録済み ✓':'未記録'}</small></span></label><div className="care-dose-actions"><details className="care-dose-menu"><summary aria-label={`${m.name}の管理`}>⋯</summary><div><button type="button" onClick={()=>{setEditingId(m.id);setName(m.name);setTime(m.time);window.requestAnimationFrame(()=>{nameInput.current?.focus();nameInput.current?.scrollIntoView?.({block:'center'});});}}>編集</button><button type="button" onClick={()=>removeMedicine(m.id)}>一覧から非表示</button></div></details></div></div></li>;
      })}</ul>}
    </CareSection>
    {bonusEarned&&<p className="care-bonus-compact" role="status">今日の服薬記録ボーナスは獲得済み ✓</p>}
    <details className="care-disclosure care-medicine-editor" open={editingId!==null||undefined}><summary>お薬の登録・編集</summary>
    <CareSection title={editingId?'お薬の登録内容を編集':'お薬を登録'}>
      <form className="care-form" onSubmit={addMedicine}><label>お薬の名前<input ref={nameInput} required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="登録するお薬の名前"/></label><label>服薬予定時刻<input required type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><button className="care-primary" type="submit">{editingId?'登録内容を保存':'お薬を登録'}</button>{editingId&&<button className="care-secondary" type="button" onClick={()=>{setEditingId(null);setName('');}}>編集をやめる</button>}</form>
      <p className="care-help">チェックは服薬した事実の記録です。通知機能ではありません。経験値のために余分に服用しないでください。</p>
    </CareSection>
    </details>
    <details className="care-disclosure"><summary>記録・報酬について</summary><div className="care-disclosure-body"><p>未チェックは「未記録」です。服用していないとは限りません。</p><p className="medication-reward-explanation">服薬を記録すると、1日最大10 EXP＋10マカロンを獲得できます。お薬の種類や回数によって報酬は増えません。</p><p>服薬量や時刻は医師・薬剤師の指示に従ってください。</p></div></details>
    {storageError&&<p role="alert">端末に保存できませんでした。空き容量やブラウザの設定をご確認ください。</p>}
  </section>;
}
