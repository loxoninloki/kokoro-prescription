import {DEFAULT_APPEARANCE,parseAppearance,equipmentForForm,saveFormEquipment,selectedForm} from './appearance';
test('旧成熟コーデを保持し、錠剤のエフェクトを独立保存',()=>{
 const original={...DEFAULT_APPEARANCE,equipped:['night-beret']};
 const next=saveFormEquipment(original,'tablet',['moon-sparkles','night-beret']);
 expect(equipmentForForm(next,'tablet')).toEqual(['moon-sparkles']);expect(equipmentForForm(next,'mature')).toEqual(['night-beret']);
 expect(parseAppearance(JSON.parse(JSON.stringify(next)))).toEqual(next);
});
test('解放条件・旧ルーム選択・ヒューマンを共通で判定',()=>{
 expect(selectedForm({...DEFAULT_APPEARANCE,selectedFormId:'mature'},1).id).toBe('tablet');
 expect(selectedForm(DEFAULT_APPEARANCE,50,'growth').id).toBe('growth');
 expect(selectedForm({...DEFAULT_APPEARANCE,mode:'human'},50).id).toBe('human');
 expect(selectedForm({...DEFAULT_APPEARANCE,selectedFormId:'birth'},50,'mature').id).toBe('birth');
});
test('不正フォルムと装備マップを拒否する',()=>{
 expect(()=>parseAppearance({...DEFAULT_APPEARANCE,selectedFormId:'fake'})).toThrow();expect(()=>parseAppearance({...DEFAULT_APPEARANCE,formEquipment:{tablet:['../bad']}})).toThrow();
});
