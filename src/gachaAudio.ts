import { GACHA_ANIMATION } from './gachaAnimation';
import type { GachaRarity } from './gachaRarity';
export const GACHA_AUDIO_KEY='kokoro-gacha-audio-v1';
export function readGachaAudio():boolean {try{return localStorage.getItem(GACHA_AUDIO_KEY)==='on';}catch{return false;}}
export function saveGachaAudio(on:boolean):boolean {try{localStorage.setItem(GACHA_AUDIO_KEY,on?'on':'off');return true;}catch{return false;}}
/** Original oscillator scores by loxonin / LUX Works. No sampled/third-party audio. */
export class GachaAudio {
 private context:AudioContext|null=null;
 private voices=new Set<OscillatorNode>();
 private active=false;
 private tone(frequency:number,at:number,duration:number,level=.07,type:OscillatorType='sine',attack=.018) {
  const ctx=this.context;if(!ctx||!this.active)return;
  try {
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=type;osc.frequency.value=frequency;
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(level,at+Math.min(attack,duration/2));
   gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   osc.connect(gain);gain.connect(ctx.destination);this.voices.add(osc);
   osc.onended=()=>{this.voices.delete(osc);osc.disconnect();gain.disconnect();};
   osc.start(at);osc.stop(at+duration+.02);
  }catch{/* Audio failure never affects the saved draw. */}
 }
 // Called synchronously by the final draw button (or the explicit sound toggle).
 unlock() {
  try {
   this.active=true;
   const Constructor=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Constructor)return;
   this.context??=new Constructor();
   void this.context.resume().catch(()=>{});
   this.tone(440,this.context.currentTime,.025,0);
  }catch{this.active=false;}
 }
 play(rarity:GachaRarity,reduced=false) {
  this.stop();this.active=true;const ctx=this.context;if(!ctx||ctx.state!=='running')return;
  const base=ctx.currentTime+.02;
  if(reduced){this.chime(rarity,base);return;}
  // A quiet, original Cmaj9 pad lasts only for the 3.84s sequence; no loop or external samples.
  [261.63,329.63,392,493.88].forEach(hz=>this.tone(hz,base,3.72,.006,'sine',.4));
  // Soft bells and low-volume wooden ticks follow the approved GIF stage times.
  this.tone(523.25,base,.35,.022);this.tone(659.25,base+.13,.3,.018);
  for(let ms=GACHA_ANIMATION.stages.spin;ms<1440;ms+=120)this.tone(180+(ms%240),base+ms/1000,.07,.014,'sine');
  [1440,1620,1860].forEach((ms,i)=>this.tone(290-i*35,base+ms/1000,.1,.014,'sine'));
  this.tone(660,base+GACHA_ANIMATION.stages.eject/1000,.12,.03,'sine');
  [784,988,1175].forEach((hz,i)=>this.tone(hz,base+GACHA_ANIMATION.stages.open/1000+i*.075,.22,.02));
  this.chime(rarity,base+GACHA_ANIMATION.stages.glow/1000);
 }
 private chime(rarity:GachaRarity,at:number) {
  const notes=rarity==='highest'?[523.25,659.25,783.99,1046.5,1318.5]:rarity==='rare'?[587.33,739.99,880,1174.66]:[659.25,783.99];
  notes.forEach((hz,i)=>this.tone(hz,at+i*.07,.2,rarity==='normal'?.018:.025));
 }
 stop() {this.active=false;this.voices.forEach(osc=>{try{osc.stop();}catch{}});this.voices.clear();}
 dispose() {this.stop();const ctx=this.context;this.context=null;if(ctx)void ctx.close().catch(()=>{});}
}
