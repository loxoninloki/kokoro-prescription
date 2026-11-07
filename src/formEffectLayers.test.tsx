import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import RokiCharacter from './RokiCharacter';
import {ITEMS,FORM_CHOICES,saveFormEquipment,DEFAULT_APPEARANCE} from './appearance';
import {giftForForm} from './formFirstGifts';
test.each(['development','birth','growth','mature'] as const)('%s keeps the original body between two removable effect layers',async id=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;const form=FORM_CHOICES.find(f=>f.id===id)!;const item=giftForForm(id,form.level)!.item;
 expect(item.layers.map(l=>l.order)).toEqual([12,24]);const host=document.createElement('div');document.body.appendChild(host);const root=createRoot(host);
 try{await act(async()=>root.render(<RokiCharacter form={form} size={244} equipped={[item.id]}/>));let images=Array.from(host.querySelectorAll('img'));expect(images).toHaveLength(3);expect(images[1].getAttribute('src')).toBe((process.env.PUBLIC_URL||'')+'/forms/'+form.image);expect(images[1].style.clipPath).toBe('');
 await act(async()=>root.render(<RokiCharacter form={form} size={244} equipped={[]}/>));images=Array.from(host.querySelectorAll('img'));expect(images).toHaveLength(1);expect(images[0].getAttribute('src')).toBe((process.env.PUBLIC_URL||'')+'/forms/'+form.image);
 const original={...DEFAULT_APPEARANCE,formEquipment:{human:['growth-gift-human']}};const next=saveFormEquipment(original,id,[item.id]);expect(next.formEquipment?.human).toEqual(['growth-gift-human']);expect(next.formEquipment?.[id]).toEqual([item.id]);
 }finally{await act(async()=>root.unmount());host.remove();}
});
test('human commemorative effect remains the original single layer',()=>{expect(ITEMS.find(i=>i.id==='growth-gift-human')?.layers).toEqual([{image:'dressup/form_gift_human.svg',order:12}]);});
