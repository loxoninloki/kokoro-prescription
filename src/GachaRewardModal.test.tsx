import React,{act} from 'react';
import {createRoot,Root} from 'react-dom/client';
import GachaRewardModal from './GachaRewardModal';
let host:HTMLDivElement,root:Root;
const form={id:'tablet' as const,name:'錠剤フォルム',image:'lv1_tablet.webp'};
const render=async(itemId:string,testMode=false,onEquip=jest.fn().mockResolvedValue(undefined))=>{await act(async()=>root.render(<GachaRewardModal itemId={itemId} form={form} equipped={[]} roomLayout={{}} busy={false} error="" onClose={jest.fn()} testMode={testMode} ownedItemIds={[itemId]} onEquip={onEquip}/>));return onEquip;};
const click=async(selector:string)=>{await act(async()=>host.querySelector<HTMLButtonElement>(selector)!.click());};
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;window.matchMedia=jest.fn().mockReturnValue({matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()});host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();jest.restoreAllMocks();});
test('錠剤でも星ピンを単体表示・拡大でき、試着・着用は拒否する',async()=>{
 await render('lavender-star-clip');expect(host.querySelector('.gacha-item-art img')?.getAttribute('src')).toContain('lavender_star_clip.svg');
 expect(host.querySelector<HTMLButtonElement>('.gacha-reward-actions button')!.disabled).toBe(true);expect(host.querySelector('.gacha-wear')).toBeNull();
 await click('.gacha-prize-zoom');expect(host.querySelector('.gacha-prize-large')).not.toBeNull();
});
test('複数レイヤーのエフェクトは全画像を表示する',async()=>{
 await render('moon-sparkles');expect(host.querySelectorAll('.gacha-item-art-layer')).toHaveLength(2);expect(host.querySelector('.gacha-item-art-symbol')).toBeNull();
});
test('正式所持エフェクトは試着から保存でき、連打は1回に制限する',async()=>{
 let finish!:()=>void;const onEquip=jest.fn(()=>new Promise<void>(resolve=>{finish=resolve;}));await render('lavender-bloom',false,onEquip);
 await click('.gacha-reward-actions button');const wear=host.querySelector<HTMLButtonElement>('.gacha-wear')!;
 await act(async()=>{wear.click();wear.click();});expect(onEquip).toHaveBeenCalledTimes(1);expect(onEquip).toHaveBeenCalledWith('lavender-bloom','tablet');
 await act(async()=>finish());expect(host.textContent).toContain('着用しました！');
});
test('テスト所持品には保存ボタンを出さない',async()=>{
 await render('lavender-bloom',true);await click('.gacha-reward-actions button');expect(host.querySelector('.gacha-wear')).toBeNull();expect(host.textContent).toContain('テスト中は保存できません');
});
test('保存失敗はエラーを表示し、成功通知を出さない',async()=>{
 await render('lavender-bloom',false,jest.fn().mockRejectedValue(new Error('保存できませんでした')));await click('.gacha-reward-actions button');await click('.gacha-wear');expect(host.textContent).toContain('保存できませんでした');expect(host.textContent).not.toContain('着用しました！');
});
