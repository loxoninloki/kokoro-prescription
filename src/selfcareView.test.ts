import {mondayOf,shiftDay,displayDay,stepMonthSummary,nextMedicine} from './selfcareView';
const medicine={id:'a',name:'登録済みA',time:'08:00'};
test('月曜始まりと月・年の境界を端末のタイムゾーンに依存せず計算する',()=>{
 expect(mondayOf('2026-11-08')).toBe('2026-11-02');expect(mondayOf('2026-11-09')).toBe('2026-11-09');expect(shiftDay('2026-12-31',1)).toBe('2027-01-01');expect(displayDay('2026-11-08')).toContain('日');expect(displayDay('')).toContain('確認');
});
test('0歩を含む記録日のみ集計し、未来データと他月を混ぜない',()=>{
 expect(stepMonthSummary({'2026-11-01':0,'2026-11-02':3000,'2026-11-09':9999,'2026-10-01':8000},'2026-11','2026-11-08')).toEqual({total:3000,average:1500,best:['2026-11-02',3000],days:2});
 expect(stepMonthSummary({},'2026-11','2026-11-08')).toEqual({total:0,average:null,best:null,days:0});
});
test('次の登録時刻は日本時間、記録済み・非表示薬は除外する',()=>{
 const data={medicines:[medicine,{id:'b',name:'登録済みB',time:'13:00'},{id:'x',name:'非表示',time:'07:30',archived:true}],taken:{}};
 expect(nextMedicine(data,'2026-11-08',new Date('2026-11-07T22:00:00Z'))).toMatchObject({medicine:{id:'a'},minutes:60,tomorrow:false});
 expect(nextMedicine({...data,taken:{'2026-11-08|a':true}},'2026-11-08',new Date('2026-11-07T22:00:00Z'))).toMatchObject({medicine:{id:'b'},minutes:360});
 expect(nextMedicine(data,'2026-11-08',new Date('2026-11-08T14:00:00Z'))).toMatchObject({medicine:{id:'a'},minutes:540,tomorrow:true});
 expect(nextMedicine({medicines:[],taken:{}},'2026-11-08',new Date())).toBeNull();
});
