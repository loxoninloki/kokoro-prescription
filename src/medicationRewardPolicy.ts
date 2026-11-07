import type { MedicationData } from './MedicationTracker';
export const MEDICATION_DAILY_XP = 10;
export interface MedicationRewardPolicy { version:1; effectiveDate:string; legacyDayXp:Record<string,number>; }
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function medicationDayXp(taken:boolean):number {return taken?MEDICATION_DAILY_XP:0;}
export function legacyMedicationEvents(data:MedicationData):Record<string,number> {
 const ids=new Set(data.medicines.map(m=>m.id));const events:Record<string,number>={};
 for(const [key,taken] of Object.entries(data.taken)) if(taken&&/^\d{4}-\d{2}-\d{2}\|[^|]+$/.test(key)&&ids.has(key.slice(11))) events['medication:'+key]=MEDICATION_DAILY_XP;
 return events;
}
export function medicationDays(data:MedicationData):string[] {return Array.from(new Set(Object.keys(legacyMedicationEvents(data)).map(id=>id.slice(11,21))));}
export function legacyCreditsByDay(credits:Readonly<Record<string,number>>):Record<string,number> {
 const result:Record<string,number>={};
 for(const [id,xp] of Object.entries(credits)){const m=/^medication:(\d{4}-\d{2}-\d{2})\|[^|]+$/.exec(id);if(m&&xp>0)result[m[1]]=(result[m[1]]||0)+xp;}
 return result;
}
export function makeMedicationPolicy(data:MedicationData,credits:Readonly<Record<string,number>>,adoptionDay:string):MedicationRewardPolicy {
 const recorded=legacyCreditsByDay(legacyMedicationEvents(data));const legacyDayXp=legacyCreditsByDay(credits);
 for(const [day,xp] of Object.entries(recorded)){const daily=credits['medication-day:'+day]||0;legacyDayXp[day]=Math.max(daily>0?Math.min(daily,10):xp,legacyDayXp[day]||0);}
 // Pin to the actual approved release day when supplied; otherwise record this device's first adoption day.
 const releaseDay=process.env.REACT_APP_MEDICATION_REWARD_RELEASE_DAY;
 return {version:1,effectiveDate:releaseDay&&datePattern.test(releaseDay)?releaseDay:adoptionDay,legacyDayXp};
}
export function parseMedicationPolicy(raw:unknown):MedicationRewardPolicy {
 const p=raw as MedicationRewardPolicy;
 if(!p||p.version!==1||!datePattern.test(p.effectiveDate)||!p.legacyDayXp||typeof p.legacyDayXp!=='object'||Array.isArray(p.legacyDayXp)||!Object.entries(p.legacyDayXp).every(([day,xp])=>datePattern.test(day)&&Number.isSafeInteger(xp)&&xp>=0))throw new Error('服薬報酬の移行情報が不正です。');
 return p;
}
export function medicationTotalXp(data:MedicationData,policy?:MedicationRewardPolicy,credits:Readonly<Record<string,number>>={}):number {
 const byDay:Record<string,number>={...policy?.legacyDayXp};
 for(const day of medicationDays(data))if(byDay[day]===undefined)byDay[day]=10;
 for(const [id,xp] of Object.entries(credits)){const m=/^medication-day:(\d{4}-\d{2}-\d{2})$/.exec(id);if(m&&xp>0&&byDay[m[1]]===undefined)byDay[m[1]]=Math.min(xp,10);}
 return Object.values(byDay).reduce((a,b)=>a+b,0);
}
export function hasMedicationCredit(credits:Readonly<Record<string,number>>,day:string):boolean {
 return (credits['medication-day:'+day]||0)>0||Object.entries(credits).some(([id,xp])=>id.startsWith('medication:'+day+'|')&&xp>0);
}
