import {GachaAudio,readGachaAudio,saveGachaAudio,GACHA_AUDIO_KEY} from './gachaAudio';
const original=window.AudioContext;
afterEach(()=>{window.AudioContext=original;jest.restoreAllMocks();localStorage.clear();});
test('効果音は初期OFF、ON/OFFを保存し、保存不可を通知可能にする',()=>{
 expect(readGachaAudio()).toBe(false);expect(saveGachaAudio(true)).toBe(true);expect(readGachaAudio()).toBe(true);
 expect(saveGachaAudio(false)).toBe(true);expect(localStorage.getItem(GACHA_AUDIO_KEY)).toBe('off');
 jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});expect(saveGachaAudio(true)).toBe(false);
});
test('音源がない端末でも安全に完了する',()=>{
 window.AudioContext=undefined as any;const audio=new GachaAudio();expect(()=>{audio.unlock();audio.play('highest');audio.stop();audio.dispose();}).not.toThrow();
});
test('ユーザー操作で起動し、GIF同期で予約してOFF・破棄で全て止める',()=>{
 const voices:any[]=[];
 const close=jest.fn().mockResolvedValue(undefined),resume=jest.fn().mockResolvedValue(undefined);
 const mock={currentTime:10,state:'running',destination:{},resume,close,
  createOscillator:()=>{const v={frequency:{value:0},type:'sine',connect:jest.fn(),disconnect:jest.fn(),start:jest.fn(),stop:jest.fn(),onended:null};voices.push(v);return v;},
  createGain:()=>({gain:{setValueAtTime:jest.fn(),linearRampToValueAtTime:jest.fn(),exponentialRampToValueAtTime:jest.fn()},connect:jest.fn(),disconnect:jest.fn()})};
 window.AudioContext=jest.fn().mockImplementation(()=>mock);
 const audio=new GachaAudio();audio.unlock();expect(resume).toHaveBeenCalledTimes(1);audio.play('highest');
 const startTimes=voices.slice(1).map(v=>v.start.mock.calls[0][0]);
 expect(startTimes).toContain(10.02+1.92);expect(startTimes).toContain(10.02+2.88);
 const before=voices.map(v=>v.stop.mock.calls.length);audio.stop();voices.forEach((v,i)=>expect(v.stop.mock.calls.length).toBeGreaterThanOrEqual(before[i]));
 audio.dispose();expect(close).toHaveBeenCalledTimes(1);
});
