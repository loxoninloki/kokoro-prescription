import {calculateLogin,syncLogin,CHECKIN_KEY} from './loginStamp';
import {EMPTY_REWARDS,REWARD_KEY,readRewards,tokyoDay} from './rewardLedger';
import {EMPTY_ROOM,ROOM_KEY} from './interior';
beforeEach(()=>localStorage.clear());
const history=(n:number)=>Array.from({length:n},(_,i)=>new Date(Date.UTC(2025,0,1+i)).toISOString().slice(0,10));
test('245件の実績を保持し、履歴を創作せず当日だけ追加する',()=>{
 const days=history(245);const wallet={...EMPTY_REWARDS,loginDays:2,tickets:0,lastLoginDate:'2026-11-06'};
 const next=calculateLogin(wallet,days,EMPTY_ROOM,'2026-11-07',{});
 expect(next.wallet.loginDays).toBe(246);expect(next.days).toEqual([...days,'2026-11-07']);
 expect(next.wallet.tickets).toBe(0);expect(next.wallet.earned).toBe(2460);
 expect(calculateLogin(next.wallet,next.days,next.room,'2026-11-07',{}).wallet).toEqual(next.wallet);
});
test('旧方式で今日のログインだけ付与済みなら加算せずチェックインXPのみ付与',()=>{
 const next=calculateLogin({...EMPTY_REWARDS,loginDays:7,tickets:1,lastLoginDate:'2026-11-07'},[],EMPTY_ROOM,'2026-11-07',{});
 expect(next.wallet.loginDays).toBe(7);expect(next.wallet.tickets).toBe(1);expect(next.receipt).toMatchObject({xp:10,tickets:0});
 const again=calculateLogin(next.wallet,next.days,next.room,'2026-11-07',{});expect(again.stamped).toBe(false);expect(again.receipt.xp).toBe(0);
});
test('履歴に当日があれば旧台帳の日数不足を補正しても二重に数えない',()=>{
 const next=calculateLogin(EMPTY_REWARDS,['2026-11-07'],EMPTY_ROOM,'2026-11-07',{});
 expect(next.wallet.loginDays).toBe(1);expect(next.stamped).toBe(false);
});
test('欠席・時計の巻戻し・7日境界・家具の二重付与',()=>{
 const wallet={...EMPTY_REWARDS,loginDays:6,lastLoginDate:'2026-11-01'};
 const next=calculateLogin(wallet,['2026-11-01'],EMPTY_ROOM,'2026-11-07',{});
 expect(next.wallet).toMatchObject({loginDays:7,tickets:1});expect(next.receipt.tickets).toBe(1);
 const rewind=calculateLogin(next.wallet,next.days,next.room,'2026-11-02',{});
 expect(rewind.wallet).toEqual(next.wallet);expect(rewind.stamped).toBe(false);expect(rewind.receipt.furnitureIds).toEqual([]);
 expect(tokyoDay(new Date('2026-11-07T15:00:00Z'))).toBe('2026-11-08');
});
test('同時起動でもXP・マカロン・日数は1回、スタンプ通知も片方だけ',async()=>{
 const result=await Promise.all([syncLogin('2026-11-07',()=>({})),syncLogin('2026-11-07',()=>({}))]);
 expect(result.filter(r=>r.stamped)).toHaveLength(1);expect(readRewards()).toMatchObject({loginDays:1,earned:10});
 expect(JSON.parse(localStorage.getItem(CHECKIN_KEY)!)).toEqual(['2026-11-07']);
});
test.each([1,2,3,4])('書き込み段階%iの失敗で全状態を戻し、安全に再試行',async failAt=>{
 const native=Storage.prototype.setItem;let count=0;
 const fail=jest.spyOn(Storage.prototype,'setItem').mockImplementation(function(this:Storage,key,value){if(++count===failAt)throw new Error('quota');native.call(this,key,value);});
 await expect(syncLogin('2026-11-07',()=>({}))).rejects.toThrow('quota');fail.mockRestore();
 for(const key of [CHECKIN_KEY,REWARD_KEY,ROOM_KEY])expect(localStorage.getItem(key)).toBeNull();
 const retry=await syncLogin('2026-11-07',()=>({}));expect(retry.wallet).toMatchObject({loginDays:1,earned:10});
});
test('壊れたログイン履歴を上書きせず失敗する',async()=>{
 localStorage.setItem(CHECKIN_KEY,'broken');await expect(syncLogin('2026-11-07',()=>({}))).rejects.toThrow();expect(localStorage.getItem(CHECKIN_KEY)).toBe('broken');expect(localStorage.getItem(REWARD_KEY)).toBeNull();
});
test('中断された保存を旧状態へ復旧してから当日分だけを確定する',async()=>{
 localStorage.setItem('kokoro-login-pending-v1',JSON.stringify([null,null,null]));
 localStorage.setItem(CHECKIN_KEY,JSON.stringify(['2026-11-07']));
 const next=await syncLogin('2026-11-07',()=>({}));expect(next.stamped).toBe(true);expect(next.wallet.loginDays).toBe(1);expect(localStorage.getItem('kokoro-login-pending-v1')).toBeNull();
});
