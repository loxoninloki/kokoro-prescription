import React from 'react';
import type { StepEntries } from './StepTracker';
import {shiftDay} from './selfcareView';

interface Props {
  steps: StepEntries;
  month: string;
  monthly: boolean;
  today: string;
  weekStart?: string;
  selectedDay?: string;
  onSelectDay?: (day:string)=>void;
}

export default function StepHistoryChart({ steps, month, monthly, today,weekStart,selectedDay,onSelectDay }: Props) {
  if(weekStart){
    const week=Array.from({length:7},(_,i)=>{const day=shiftDay(weekStart,i);return {day,label:['月','火','水','木','金','土','日'][i],count:day<=today?steps[day]:undefined};});
    const peak=Math.max(1,...week.map(v=>v.count??0));
    return <div className="care-week-chart" role="group" aria-label="月曜日から日曜日の歩数">{week.map(({day,label,count})=><button key={day} type="button" disabled={day>today} aria-pressed={day===selectedDay} aria-label={`${day} ${count===undefined?'未取得':count+'歩'}`} onClick={()=>onSelectDay?.(day)}><strong>{count===undefined?'—':count.toLocaleString('ja-JP')}</strong><span className="care-week-bar-track"><span className="care-week-bar" style={{height:count===undefined?'0%':`${Math.max(3,95*count/peak)}%`}} data-empty={count===undefined}/></span><span>{label}</span><small>{Number(day.slice(-2))}日</small></button>)}</div>;
  }
  const [year, monthNumber] = month.split('-').map(Number);
  const totals = new Map<string, number>();
  const prefix = monthly ? String(year) : month;
  for (const [day, count] of Object.entries(steps)) {
    if (!day.startsWith(prefix + '-') || day > today) continue;
    const key = monthly ? day.slice(0, 7) : day;
    totals.set(key, (totals.get(key) ?? 0) + count);
  }

  const periods = Array.from({ length: monthly ? 12 : new Date(year, monthNumber, 0).getDate() }, (_, index) => {
    const number = index + 1;
    const key = prefix + '-' + String(number).padStart(2, '0');
    return { key, number, label: number + (monthly ? '月' : '日'), count: totals.get(key) };
  });
  const recorded = periods.filter(period => period.count !== undefined);
  if (!recorded.length) return <p>この期間の歩数はまだ記録されていません。</p>;

  const counts = Array.from(totals.values());
  const maximum = Math.max(1, ...counts);
  const total = counts.reduce((sum, count) => sum + count, 0);
  const spacing = 300 / periods.length;

  return <>
    <p><strong>合計 {total.toLocaleString()} 歩</strong></p>
    <svg className="step-history-chart" viewBox="0 0 316 132" role="img"
      aria-label={monthly ? `${year}年の月ごとの歩数` : `${monthNumber}月の日ごとの歩数`}>
      <defs><linearGradient id={`step-bars-${monthly?'year':'month'}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9cb8e8"/><stop offset="100%" stopColor="#7754a8"/></linearGradient></defs>
      <line x1="8" y1="106" x2="308" y2="106" stroke="#c5b3d3" />
      {periods.map(({ key, number, label, count }) => {
        const height = count === undefined ? 0 : Math.max(2, 96 * count / maximum);
        const x = 8 + (number - 0.5) * spacing;
        return <g key={key}>
          {count !== undefined && <rect x={x - spacing * 0.32} y={106 - height} width={spacing * 0.64} height={height} rx="2" fill={`url(#step-bars-${monthly?'year':'month'})`}>
            <title>{label} {count.toLocaleString()}歩</title>
          </rect>}
          {(monthly || number === 1 || number % 5 === 0) &&
            <text x={x} y="123" textAnchor="middle" fill="#54406f" fontSize="10">{number}</text>}
        </g>;
      })}
    </svg>
    <details>
      <summary>歩数の内訳を見る</summary>
      <dl className="step-history-values">
        {recorded.map(({ key, label, count }) => <React.Fragment key={key}>
          <dt>{label}</dt><dd>{count?.toLocaleString()} 歩</dd>
        </React.Fragment>)}
      </dl>
    </details>
  </>;
}
