import React, { useEffect, useState } from 'react';

export interface Medicine { id: string; name: string; time: string }
export interface MedicationData { medicines: Medicine[]; taken: Record<string, boolean> }
const KEY = 'kokoro-medication-v1';
export const MEDICATION_XP = 10;
export const doseKey = (date: string, id: string) => date + '|' + id;

export function readMedication(): MedicationData {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    const medicines = Array.isArray(data.medicines) ? data.medicines.filter((m: any) =>
      m && typeof m.id === 'string' && typeof m.name === 'string' && typeof m.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)
    ).map((m: Medicine) => ({ id: m.id, name: m.name.slice(0, 80), time: m.time })) : [];
    const taken: Record<string, boolean> = {};
    if (data.taken && typeof data.taken === 'object') {
      for (const [key, value] of Object.entries(data.taken)) {
        if (value === true && /^\d{4}-\d{2}-\d{2}\|/.test(key)) taken[key] = true;
      }
    }
    return { medicines, taken };
  } catch { return { medicines: [], taken: {} }; }
}

export function medicationExperience(data: MedicationData): number {
  const ids = new Set(data.medicines.map(m => m.id));
  return Object.entries(data.taken).filter(([key, taken]) => taken && ids.has(key.slice(11))).length * MEDICATION_XP;
}

interface Props {
  data: MedicationData;
  setData: React.Dispatch<React.SetStateAction<MedicationData>>;
  today: string;
}

export default function MedicationTracker({ data, setData, today }: Props) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('08:00');
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage may be unavailable */ }
  }, [data]);

  const addMedicine = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !/^([01]\\d|2[0-3]):[0-5]\\d$/.test(time)) return;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    setData(previous => ({ ...previous, medicines: [...previous.medicines, { id, name: name.trim().slice(0, 80), time }] }));
    setName('');
  };

  const toggleTaken = (id: string) => {
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(selectedDate) || selectedDate > today || !data.medicines.some(m => m.id === id)) return;
    const key = doseKey(selectedDate, id);
    setData(previous => {
      const taken = { ...previous.taken };
      if (taken[key]) delete taken[key];
      else taken[key] = true;
      return { ...previous, taken };
    });
  };

  const removeMedicine = (id: string) => {
    if (!window.confirm('このお薬の登録を削除しますか？過去の記録も育成経験値の対象外になります。')) return;
    setData(previous => ({ ...previous, medicines: previous.medicines.filter(m => m.id !== id) }));
  };

  return (
    <section style={{ marginTop: 26, padding: 18, borderRadius: 24, background: '#f5efff' }}>
      <h2>💊 お薬の記録</h2>
      <p style={{ fontSize: 13 }}>処方されたお薬と時刻を登録できます。服薬量や時刻は医師・薬剤師の指示に従ってください。</p>
      <form onSubmit={addMedicine} style={{ display: 'grid', gap: 10 }}>
        <label>お薬の名前<input required maxLength={80} value={name} onChange={e => setName(e.target.value)} placeholder="例：朝のお薬" style={{ display: 'block', boxSizing: 'border-box', width: '100%', padding: 12, borderRadius: 10, border: '1px solid #c9b9dc' }} /></label>
        <label>服薬予定時刻<input required type="time" value={time} onChange={e => setTime(e.target.value)} style={{ display: 'block', padding: 10, borderRadius: 10, border: '1px solid #c9b9dc' }} /></label>
        <button type="submit" style={{ padding: 12, border: 0, borderRadius: 20, color: '#fff', background: '#7653a6' }}>お薬を登録</button>
      </form>
      <label style={{ display: 'block', marginTop: 18 }}>記録する日付
        <input type="date" value={selectedDate} max={today} min="2000-01-01" onChange={e => setSelectedDate(e.target.value)} style={{ display: 'block', padding: 9, marginTop: 5 }} />
      </label>
      {data.medicines.length === 0 ? <p>お薬はまだ登録されていません。</p> :
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {[...data.medicines].sort((a, b) => a.time.localeCompare(b.time)).map(m => {
            const checked = !!data.taken[doseKey(selectedDate, m.id)];
            return <li key={m.id} style={{ background: '#fff', padding: 12, borderRadius: 12, marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={checked} disabled={selectedDate > today} onChange={() => toggleTaken(m.id)} />
                <span><strong>{m.time} {m.name}</strong><span style={{ display: 'block', fontSize: 12 }}>{checked ? '服薬済み ✓' : '未記録'}</span></span>
              </label>
              <button type="button" onClick={() => removeMedicine(m.id)} style={{ marginTop: 8, background: 'transparent', border: 0, color: '#775d8c', textDecoration: 'underline' }}>登録を削除</button>
            </li>;
          })}
        </ul>}
      <p style={{ fontSize: 12, color: '#766b82' }}>チェックは服薬した事実の記録です。通知機能ではありません。経験値のために余分に服用しないでください。</p>
    </section>
  );
}
