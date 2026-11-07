import type {Medicine,MedicationData} from './MedicationTracker';
import type {StepEntries} from './StepTracker';
/** Calendar strings already represent Tokyo dates; UTC arithmetic prevents host-zone drift. */
export function shiftDay(day:string,delta:number):string {const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10);}
export function mondayOf(day:string):string {const weekday=new Date(day+'T12:00:00Z').getUTCDay();return shiftDay(day,-((weekday+6)%7));}
export function displayDay(day:string,year=false):string {if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(new Date(day+'T12:00:00Z').getTime()))return '日付を確認してください';return new Intl.DateTimeFormat('ja-JP',{timeZone:'UTC',...(year?{year:'numeric' as const}:{}),month:'long',day:'numeric',weekday:'short'}).format(new Date(day+'T12:00:00Z'));}
export function stepMonthSummary(entries:StepEntries,month:string,today:string) {
 const recorded=Object.entries(entries).filter(([day])=>day.startsWith(month+'-')&&day<=today).sort(([a],[b])=>a.localeCompare(b));
 const total=recorded.reduce((sum,[,value])=>sum+value,0);
 const best=recorded.reduce<[string,number]|null>((top,item)=>!top||item[1]>top[1]?item:top,null);
 return {total,average:recorded.length?Math.round(total/recorded.length):null,best,days:recorded.length};
}
export function tokyoMinutes(now:Date) {
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 return Number(p.find(v=>v.type==='hour')?.value)*60+Number(p.find(v=>v.type==='minute')?.value);
}
export function nextMedicine(data:MedicationData,today:string,now:Date):{medicine:Medicine;minutes:number;tomorrow:boolean}|null {
 const active=data.medicines.filter(m=>!m.archived&&/^([01]\d|2[0-3]):[0-5]\d$/.test(m.time)).sort((a,b)=>a.time.localeCompare(b.time));
 if(!active.length)return null;
 const minute=tokyoMinutes(now);if(!Number.isFinite(minute))return null;
 const time=(m:Medicine)=>Number(m.time.slice(0,2))*60+Number(m.time.slice(3));
 const future=active.find(m=>time(m)>=minute&&!data.taken[today+'|'+m.id]);
 return future?{medicine:future,minutes:time(future)-minute,tomorrow:false}:{medicine:active[0],minutes:1440-minute+time(active[0]),tomorrow:true};
}
