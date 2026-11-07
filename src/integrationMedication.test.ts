import { medicationExperience, MedicationData } from './MedicationTracker';
import { creditXp, EMPTY_REWARDS, REWARD_KEY } from './rewardLedger';
import { makeMedicationPolicy } from './medicationRewardPolicy';

beforeEach(() => { localStorage.clear(); localStorage.setItem('kokoro-medication-reward-policy-v2','2026-11-08'); });
test('統合回帰 旧確定XPは記録解除後も維持する', () => {
 const paid={...EMPTY_REWARDS,earned:20,creditedXp:{'medication:2026-11-07|a':10,'medication:2026-11-07|b':10}};
 localStorage.setItem(REWARD_KEY,JSON.stringify(paid));
 const data:MedicationData={medicines:[{id:'a',name:'薬',time:'08:00'},{id:'b',name:'薬',time:'20:00'}],taken:{}};
 const policy=makeMedicationPolicy(data,paid.creditedXp,'2026-11-08');
 expect(medicationExperience(data,policy,paid.creditedXp)).toBe(20);
});
test('統合回帰 日次報酬の後に旧イベントを復元しても二重払いしない',()=>{
 const paid=creditXp(EMPTY_REWARDS,{'medication-day:2026-11-09':10});
 expect(creditXp(paid,{'medication:2026-11-09|a':10}).earned).toBe(10);
});
test('統合回帰 同一バッチに旧新イベントが混在しても二重払いしない',()=>{
 const paid=creditXp(EMPTY_REWARDS,{'medication:2026-11-09|a':10,'medication-day:2026-11-09':10});
 expect(paid.earned).toBe(10);
});
