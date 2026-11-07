import { equipGachaPrize } from './gachaEquip';
import { APPEARANCE_KEY, DEFAULT_APPEARANCE, readAppearance } from './appearance';
import { EMPTY_REWARDS, REWARD_KEY } from './rewardLedger';
import { EMPTY_ROOM, ROOM_KEY } from './interior';
beforeEach(()=>{localStorage.clear();localStorage.setItem(APPEARANCE_KEY,JSON.stringify({...DEFAULT_APPEARANCE,selectedFormId:'mature',formEquipment:{human:['growth-gift-human'],mature:['night-beret']}}));localStorage.setItem(REWARD_KEY,JSON.stringify({...EMPTY_REWARDS,ownedItemIds:['lavender-star-clip','night-beret','moon-sparkles']}));localStorage.setItem(ROOM_KEY,JSON.stringify(EMPTY_ROOM));});
afterEach(()=>jest.restoreAllMocks());
test('正式所持品を現在フォルムに保存し、他フォルム・報酬台帳・ルームを維持する',async()=>{
 const wallet=localStorage.getItem(REWARD_KEY),room=localStorage.getItem(ROOM_KEY);
 const result=await equipGachaPrize('lavender-star-clip','mature',50,false);
 expect(result.formEquipment?.mature).toEqual(['night-beret','lavender-star-clip']);
 expect(result.formEquipment?.human).toEqual(['growth-gift-human']);expect(readAppearance()).toEqual(result);
 expect(localStorage.getItem(REWARD_KEY)).toBe(wallet);expect(localStorage.getItem(ROOM_KEY)).toBe(room);
});
test.each([
 ['lavender-star-clip','mature',50,true],
 ['lavender-bloom','mature',50,false],
 ['lavender-star-clip','tablet',1,false],
 ['wall-night','mature',50,false],
] as const)('テスト・未所持・非対応・家具の誤保存を拒否する: %s',async(id,form,level,testMode)=>{
 const before=localStorage.getItem(APPEARANCE_KEY);await expect(equipGachaPrize(id,form,level,testMode)).rejects.toThrow();expect(localStorage.getItem(APPEARANCE_KEY)).toBe(before);
});
test('確認画面後にフォルムが変わった場合、着用を拒否する',async()=>{
 localStorage.setItem(APPEARANCE_KEY,JSON.stringify({...DEFAULT_APPEARANCE,selectedFormId:'human'}));
 await expect(equipGachaPrize('lavender-star-clip','mature',50,false)).rejects.toThrow('現在のフォルム');
});
test('保存失敗を成功扱いせず、既存コーデを保持する',async()=>{
 const before=localStorage.getItem(APPEARANCE_KEY);jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('保存失敗');});
 await expect(equipGachaPrize('lavender-star-clip','mature',50,false)).rejects.toThrow('保存失敗');expect(localStorage.getItem(APPEARANCE_KEY)).toBe(before);
});
test('並行した着用も最新のコーデに適用し、追加カテゴリを失わない',async()=>{
 await Promise.all([equipGachaPrize('lavender-star-clip','mature',50,false),equipGachaPrize('moon-sparkles','mature',50,false)]);
 expect(readAppearance().formEquipment?.mature).toEqual(['night-beret','lavender-star-clip','moon-sparkles']);
});
