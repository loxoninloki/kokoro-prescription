import React,{act} from 'react';
import {createRoot,Root} from 'react-dom/client';
import RewardPanel from './RewardPanel';
import {EMPTY_REWARDS,REWARD_KEY,readRewards} from './rewardLedger';
import {GACHA_ANIMATION} from './gachaAnimation';
import {GACHA_AUDIO_KEY} from './gachaAudio';
import {ROOM_KEY} from './interior';
import {APPEARANCE_KEY} from './appearance';
import GachaDrawSequence from './GachaDrawSequence';
import {GachaAudio} from './gachaAudio';
let host:HTMLDivElement,root:Root;
const originalMatchMedia=window.matchMedia;
const click=async(selector:string)=>{const el=host.querySelector<HTMLButtonElement>(selector);expect(el).not.toBeNull();await act(async()=>el!.click());};
const start=async(payment=0)=>{await click('.gacha-banner-main');await click(`.gacha-actions button:nth-child(${payment+1})`);await click('.gacha-confirm-buttons button:last-child');};
const render=async()=>{const onWalletChange=jest.fn();await act(async()=>root.render(<RewardPanel wallet={readRewards()} error={false} section="gacha" roomOwnedItemIds={[]} onWalletChange={onWalletChange} previewForm={{id:'tablet',name:'錠剤フォルム',image:'lv1_tablet.webp'}} previewEquipment={[]} roomLayout={{}}/>));return onWalletChange;};
beforeEach(()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;jest.useFakeTimers();localStorage.clear();
 localStorage.setItem(REWARD_KEY,JSON.stringify({...EMPTY_REWARDS,earned:200,tickets:2,loginDays:14}));
 window.matchMedia=jest.fn().mockReturnValue({matches:false,addEventListener:jest.fn(),removeEventListener:jest.fn()});
 host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();window.matchMedia=originalMatchMedia;jest.useRealTimers();jest.restoreAllMocks();});
test('同じ確認ボタンの連打でも抽選1回、onLoadから3840ms後に確定アイテム表示、試着は保存しない',async()=>{
 jest.spyOn(Math,'random').mockReturnValue(.99);const updated=await render();
 await click('.gacha-banner-main');await click('.gacha-actions button');
 const confirm=host.querySelector<HTMLButtonElement>('.gacha-confirm-buttons button:last-child')!;
 await act(async()=>{confirm.click();confirm.click();});
 expect(updated).toHaveBeenCalledTimes(1);expect(readRewards().spent).toBe(50);
 expect(host.querySelector('.gacha-sequence')).not.toBeNull();expect(host.textContent).not.toContain('演出をスキップ');
 expect(Array.from(host.querySelectorAll<HTMLButtonElement>('.gacha-actions button')).every(b=>b.disabled)).toBe(true);
 await act(async()=>{host.querySelector('img.gacha-reveal-animation')!.dispatchEvent(new Event('load'));});
 await act(async()=>jest.advanceTimersByTime(GACHA_ANIMATION.durationMs-1));expect(host.querySelector('.gacha-reward-modal')).toBeNull();
 await act(async()=>jest.advanceTimersByTime(1));expect(host.querySelector('.gacha-reward-modal')).not.toBeNull();
 const saved=readRewards(),winner=saved.pendingGachaResult!.itemId;
 expect(host.querySelector('.gacha-reveal-name')?.textContent).toBe('癒しの夕空');expect(saved.ownedItemIds).toContain(winner);
 const room=localStorage.getItem(ROOM_KEY),appearance=localStorage.getItem(APPEARANCE_KEY);
 await click('.gacha-reward-actions button');expect(host.querySelector('[aria-label="仮配置中のルーム"]')).not.toBeNull();
 expect(localStorage.getItem(ROOM_KEY)).toBe(room);expect(localStorage.getItem(APPEARANCE_KEY)).toBe(appearance);
 await click('.gacha-reward-ok');expect(host.querySelector('.gacha-reward-modal')).toBeNull();expect(readRewards().pendingGachaResult).toBeUndefined();expect(readRewards().ownedItemIds).toContain(winner);
});
test.each(['error','timeout'] as const)('GIF %sでも再消費せず保存結果を表示する',async mode=>{
 await render();await start(1);expect(readRewards().tickets).toBe(1);
 await act(async()=>{if(mode==='error')host.querySelector('.gacha-reveal-animation')!.dispatchEvent(new Event('error'));else jest.advanceTimersByTime(GACHA_ANIMATION.loadTimeoutMs);});
 expect(host.querySelector('.gacha-reward-modal')).not.toBeNull();expect(readRewards().tickets).toBe(1);
});
test('音声OFFは永続化され、動き軽減時はGIFを読み込まず結果を表示する',async()=>{
 window.matchMedia=jest.fn().mockReturnValue({matches:true,addEventListener:jest.fn(),removeEventListener:jest.fn()});
 await render();expect(host.querySelector('.gacha-sound-toggle')?.textContent).toContain('OFF');
 await click('.gacha-sound-toggle');expect(localStorage.getItem(GACHA_AUDIO_KEY)).toBe('on');
 await click('.gacha-sound-toggle');expect(localStorage.getItem(GACHA_AUDIO_KEY)).toBe('off');
 await start();expect(host.querySelector('.gacha-reveal-animation')).toBeNull();
 await act(async()=>jest.advanceTimersByTime(350));expect(host.querySelector('.gacha-reward-modal')).not.toBeNull();
});
test('離脱・再マウントで未確認結果を再抽選せず復元し、未対応フォルムを明示する',async()=>{
 jest.spyOn(Math,'random').mockReturnValue(0);await render();await start();
 const before=localStorage.getItem(REWARD_KEY);
 await act(async()=>root.unmount());root=createRoot(host);await render();
 expect(host.querySelector('.gacha-sequence')).toBeNull();expect(host.querySelector('.gacha-reward-modal')).not.toBeNull();
 expect(host.textContent).toContain('現在の錠剤フォルムではお試しできません');
 expect(host.querySelector<HTMLButtonElement>('.gacha-reward-actions button')!.disabled).toBe(true);
 expect(localStorage.getItem(REWARD_KEY)).toBe(before);
});
test('保存失敗では演出を開始しない',async()=>{
 await render();const set=jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('保存失敗');});
 await start();expect(host.querySelector('.gacha-sequence')).toBeNull();expect(host.textContent).toContain('保存失敗');set.mockRestore();expect(readRewards().spent).toBe(0);
});
test.each(['normal','rare','highest'] as const)('%sは表示用レアリティの文字と演出を使う',async rarity=>{
 const complete=jest.fn(),audio=new GachaAudio();
 await act(async()=>root.render(<GachaDrawSequence drawId="test" rarity={rarity} audio={audio} soundOn={false} onSoundChange={jest.fn()} onComplete={complete}/>));
 expect(host.querySelector('.gacha-sequence')?.getAttribute('data-rarity')).toBe(rarity);
 await act(async()=>host.querySelector('.gacha-reveal-animation')!.dispatchEvent(new Event('load')));
 await act(async()=>jest.advanceTimersByTime(3360));expect(host.textContent).toContain(rarity==='highest'?'最高レア':rarity==='rare'?'レア':'通常');
 await act(async()=>jest.advanceTimersByTime(480));expect(complete).toHaveBeenCalledTimes(1);
});
test('OKの保存失敗では結果を残し、再試行しても所持・残高を変えない',async()=>{
 await render();await start();await act(async()=>host.querySelector('.gacha-reveal-animation')!.dispatchEvent(new Event('error')));
 const saved=readRewards(),set=jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
 await click('.gacha-reward-ok');expect(host.querySelector('.gacha-reward-modal')).not.toBeNull();expect(host.textContent).toContain('もう一度OK');
 set.mockRestore();expect(readRewards()).toEqual(saved);await click('.gacha-reward-ok');expect(readRewards().spent).toBe(saved.spent);expect(readRewards().ownedItemIds).toEqual(saved.ownedItemIds);
});
