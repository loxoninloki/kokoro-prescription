import { medicationExperience, MedicationData } from './MedicationTracker';
import { collectXpEvents } from './xpEvents';
import { creditXp, EMPTY_REWARDS, migrateMedicationRewards } from './rewardLedger';

test.each([1,3,10])('統合した日次仕様は服薬%s件でも10EXP',count=>{
 const data:MedicationData={medicines:Array.from({length:count},(_,i)=>({id:String(i),name:'薬',time:'08:00'})),taken:Object.fromEntries(Array.from({length:count},(_,i)=>['2026-11-09|'+i,true]))};
 const events=collectXpEvents([],{},data,{},{});
 expect(events).toEqual({'medication-day:2026-11-09':10});
 expect(medicationExperience(data)).toBe(10);
 expect(creditXp(EMPTY_REWARDS,events).earned).toBe(10);
});
test('旧修正ブランチで使った日付キーから移行しても確定報酬を維持する',()=>{
 localStorage.setItem('kokoro-medication-reward-policy-v2','2026-11-08');
 const data:MedicationData={medicines:[{id:'a',name:'薬',time:'08:00'},{id:'b',name:'薬',time:'20:00'}],taken:{'2026-11-07|a':true,'2026-11-07|b':true}};
 const old={...EMPTY_REWARDS,earned:20,spent:5,creditedXp:{'medication:2026-11-07|a':10,'medication:2026-11-07|b':10}};
 const moved=migrateMedicationRewards(old,data,'2026-11-09');
 expect(moved.earned-moved.spent).toBe(15);
 expect(medicationExperience({...data,taken:{}},moved.medicationPolicy,moved.creditedXp)).toBe(20);
 expect(migrateMedicationRewards(moved,data,'2026-11-10')).toBe(moved);
});
