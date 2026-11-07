import {EMPTY_ROOM,grantInterior,parseRoom} from './interior';
import {EMPTY_REWARDS,registerLogin} from './rewardLedger';
test('家具は累積日数で一度だけ付与され、財布は変わらない',()=>{
 const wallet={...EMPTY_REWARDS,loginDays:13,tickets:1,earned:90};
 const next=registerLogin(wallet,'2026-11-07');
 const room=grantInterior(EMPTY_ROOM,next.loginDays);
 expect(room.ownedItemIds).toContain('bed-lavender');
 expect(grantInterior(room,14)).toBe(room);
 expect(grantInterior(room,2)).toBe(room);
 expect(next.tickets).toBe(2);expect(next.earned).toBe(90);
 expect(registerLogin(next,'2026-11-07')).toBe(next);
 expect(grantInterior(room,40).ownedItemIds).toContain('wall-special');
});
test('未所持・異なるスロットの配置を拒否する',()=>{
 expect(()=>parseRoom({...EMPTY_ROOM,layout:{bed:'bed-lavender'}})).toThrow();
 expect(()=>parseRoom({...EMPTY_ROOM,ownedItemIds:['bed-lavender'],layout:{lamp:'bed-lavender'}})).toThrow();
});
