import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {ITEMS,FORM_CHOICES,DEFAULT_APPEARANCE,saveFormEquipment,equipmentForForm,parseAppearance,layersForForm} from './appearance';
import RokiCharacter from './RokiCharacter';
import {giftForForm} from './formFirstGifts';
test('all effects are compatible with every existing form while acquisition remains gated',()=>{
 for(const item of ITEMS.filter(i=>i.category==='effects'))for(const form of FORM_CHOICES){expect(item.supportedForms).toContain(form.id);const saved=saveFormEquipment(DEFAULT_APPEARANCE,form.id,[item.id]);expect(equipmentForForm(saved,form.id)).toEqual([item.id]);expect(parseAppearance(JSON.parse(JSON.stringify(saved)))).toEqual(saved);}
 expect(giftForForm('growth',29)).toBeNull();expect(giftForForm('growth',30)?.item.id).toBe('growth-gift-growth');
});
test.each(FORM_CHOICES)('$id renders the same owned effect and removes it without changing the base',async form=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;const host=document.createElement('div');const root=createRoot(host);document.body.appendChild(host);
 try{await act(async()=>root.render(<RokiCharacter form={form} size={244} equipped={['growth-gift-birth']}/>));const imgs=Array.from(host.querySelectorAll('img'));expect(imgs).toHaveLength(3);expect(imgs[1].getAttribute('src')).toBe((process.env.PUBLIC_URL||'')+'/forms/'+form.image);expect(imgs[0].style.left).toBe(form.id==='tablet'?'4%':'0%');await act(async()=>root.render(<RokiCharacter form={form} size={244} equipped={[]}/>));expect(host.querySelectorAll('img')).toHaveLength(1);
 }finally{await act(async()=>root.unmount());host.remove();}
});
test('equipping a shared effect does not change another form or allow a hat on tablet',()=>{
 const current={...DEFAULT_APPEARANCE,formEquipment:{mature:['night-beret','growth-gift-mature']}};
 const next=saveFormEquipment(current,'tablet',['growth-gift-mature','night-beret']);expect(next.formEquipment?.mature).toEqual(current.formEquipment.mature);expect(next.formEquipment?.tablet).toEqual(['growth-gift-mature']);
 const hat=ITEMS.find(i=>i.id==='night-beret')!;expect(layersForForm(hat,'mature')).toBe(hat.layers);
});
