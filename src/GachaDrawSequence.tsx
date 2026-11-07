import React from 'react';
import { GACHA_ANIMATION } from './gachaAnimation';
import { GachaAudio } from './gachaAudio';
import { GachaRarity, RARITY_PRESENTATION } from './gachaRarity';
import { useGachaModal,useReducedMotion } from './useGachaModal';
export default function GachaDrawSequence({drawId,rarity,audio,soundOn,onSoundChange,onComplete}:{drawId:string;rarity:GachaRarity;audio:GachaAudio;soundOn:boolean;onSoundChange:()=>void;onComplete:()=>void}) {
 const reduced=useReducedMotion(),root=useGachaModal();
 const sound=React.useRef(soundOn);sound.current=soundOn;
 const [loaded,setLoaded]=React.useState(false),[phase,setPhase]=React.useState('preparing');
 const completed=React.useRef(false),callback=React.useRef(onComplete);callback.current=onComplete;
 const finish=React.useCallback(()=>{if(completed.current)return;completed.current=true;audio.stop();callback.current();},[audio]);
 React.useEffect(()=>{
  if(reduced){if(sound.current)audio.play(rarity,true);const timer=window.setTimeout(finish,350);return()=>{clearTimeout(timer);audio.stop();};}
  if(loaded)return;
  const timeout=window.setTimeout(finish,GACHA_ANIMATION.loadTimeoutMs);
  return()=>clearTimeout(timeout);
 },[reduced,loaded,finish,audio,rarity]); // Sound is only started with the picture, never midway through it.
 React.useEffect(()=>{if(!soundOn)audio.stop();},[soundOn,audio]);
 React.useEffect(()=>{
  if(!loaded||reduced)return;
  const start=Date.now();setPhase('start');if(sound.current)audio.play(rarity);
  const timers=Object.entries(GACHA_ANIMATION.stages).map(([name,ms])=>window.setTimeout(()=>setPhase(name),ms));
  timers.push(window.setTimeout(finish,GACHA_ANIMATION.durationMs));
  const visibility=()=>{if(document.hidden)audio.stop();else if(Date.now()-start>=GACHA_ANIMATION.durationMs)finish();};
  document.addEventListener('visibilitychange',visibility);
  return()=>{timers.forEach(clearTimeout);audio.stop();document.removeEventListener('visibilitychange',visibility);};
 },[loaded,reduced,rarity,audio,finish]);
 return <div className="gacha-confirm-backdrop"><section ref={root} tabIndex={-1} className="gacha-confirm gacha-sequence" role="dialog" aria-modal="true" aria-labelledby="gacha-sequence-title" data-rarity={rarity} data-phase={phase} data-reduced={reduced}>
  <h2 id="gacha-sequence-title">癒しのカプセルを開封中…</h2>
  <button className="gacha-sound-toggle" type="button" aria-pressed={soundOn} onClick={onSoundChange}>効果音 {soundOn?'ON':'OFF'}</button>
  {reduced?<div className="gacha-quiet-cross" aria-hidden="true">✚</div>:<div className="gacha-sequence-scene">
   <img className="gacha-reveal-animation" src={`${process.env.PUBLIC_URL}/${GACHA_ANIMATION.path}?draw=${encodeURIComponent(drawId)}`} width={309} height={307}
    alt="紫のガチャマシンからカプセルが出て左右に開き、医療十字が光ります" onLoad={()=>setLoaded(true)} onError={finish}/>
   <span className="gacha-rarity-halo" aria-hidden="true"/>
   <span className="gacha-rarity-particles" aria-hidden="true">{Array.from({length:rarity==='highest'?12:rarity==='rare'?8:4},(_,i)=><i key={i} style={{'--particle':i} as React.CSSProperties}>{RARITY_PRESENTATION[rarity].motif}</i>)}</span>
  </div>}
  <p role="status">{reduced?'動きを抑えて獲得結果を表示します。':phase==='glow'?`${RARITY_PRESENTATION[rarity].label} · ${RARITY_PRESENTATION[rarity].announcement}`:'獲得アイテムは保存済みです。'}</p>
 </section></div>;
}
