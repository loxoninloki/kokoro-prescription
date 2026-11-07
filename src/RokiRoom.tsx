import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import RokiCharacter from './RokiCharacter';
import { FORM_STAGES, MATURE_FORM, evolutionFromXp } from './evolution';
import { INTERIOR_ITEMS, RoomState, updateRoom } from './interior';
type Props = Pick<ReturnType<typeof evolutionFromXp>, 'level' | 'form'> & {equipped?:string[]; room:RoomState; onChange:(room:RoomState)=>void; onRewards:()=>void};
export default function RokiRoom({level,form,equipped,room,onChange,onRewards}:Props) {
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState(room.layout);
 const [category,setCategory]=useState('内装');
 const [slot,setSlot]=useState('すべて');
 const [message,setMessage]=useState('');
 const [position,setPosition]=useState({x:50,y:82});
 const dirty=editing&&JSON.stringify(draft)!==JSON.stringify(room.layout);
 useEffect(()=>{ const timer=window.setInterval(()=>{if(!editing&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setPosition({x:40+Math.random()*20,y:79+Math.random()*6});},4200); return()=>window.clearInterval(timer); },[editing]);
 useEffect(()=>{ const guard=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard); return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
 // Capture navigation before the common bar handles it; the app's history remains intact.
 useEffect(()=>{if(!dirty)return; const guard=(e:MouseEvent)=>{ const target=e.target as HTMLElement;if(target.closest('.app-bottom-navigation')&&!window.confirm('編集中の模様替えを保存せず移動しますか？')){e.preventDefault();e.stopPropagation();}};document.addEventListener('click',guard,true);return()=>document.removeEventListener('click',guard,true);},[dirty]);
 const layout=editing?draft:room.layout;
 const selected=FORM_STAGES.find(f=>f.id===room.selectedFormId&&f.level<=level)||form;
 const wallpaper=INTERIOR_ITEMS.find(i=>i.id===layout.wallpaper)?.color||'#eee3f6';
 const floor=INTERIOR_ITEMS.find(i=>i.id===layout.floor)?.color||'#dfd2e6';
 const save=async()=>{try{onChange(await updateRoom(s=>({...s,layout:draft,updatedAt:new Date().toISOString()})));setEditing(false);setMessage('ルームを保存しました。');}catch{setMessage('保存できませんでした。編集内容は残っています。');}};
 return <section className="roki-room" data-editing={editing || undefined}><header className="roki-room-header"><h1><Icon name="growth"/> ろきちゃんのルーム</h1><p>Lv.{level} · {selected.name}</p></header>
 <div className="roki-room-stage interior-stage" style={{background:wallpaper}}>
 <div className="interior-floor" style={{background:floor}}/>
 {INTERIOR_ITEMS.filter(i=>layout[i.slot]===i.id&&!['wallpaper','floor'].includes(i.slot)).map(i=><div key={i.id} className={'interior-object interior-'+i.slot} aria-label={i.name} style={{background:i.color}}>{i.symbol}</div>)}
 <div className="roki-room-actor" style={{left:`${editing?50:position.x}%`,top:`${editing?82:position.y}%`,zIndex:5}}><RokiCharacter form={selected} equipped={selected.id===MATURE_FORM.id?equipped:undefined} size={116}/></div>
 </div><p className="interior-note">家具は仮デザインです。正式な透過素材に差し替え予定です。</p>
 {!editing?<div className="room-actions"><button onClick={()=>{setDraft(room.layout);setEditing(true);}}>模様替え</button><button onClick={onRewards}>ログイン報酬</button></div>:<div className="interior-editor">
 <div role="tablist" aria-label="インテリアカテゴリ" className="interior-tabs">{['内装','家具','雑貨'].map(c=><button role="tab" aria-selected={category===c} key={c} onClick={()=>{setCategory(c);setSlot('すべて');}}>{c}</button>)}</div>
 <div className="interior-tabs" aria-label="詳細カテゴリ">{['すべて',...Array.from(new Set(INTERIOR_ITEMS.filter(i=>i.category===category).map(i=>i.slot)))].map(s=><button key={s} aria-pressed={slot===s} onClick={()=>setSlot(s)}>{({wallpaper:'壁紙',floor:'床',desk:'机',bed:'ベッド',rug:'ラグ',lamp:'ランプ'} as Record<string,string>)[s]||s}</button>)}</div>
 <div className="interior-grid">{INTERIOR_ITEMS.filter(i=>i.category===category&&(slot==='すべて'||i.slot===slot)&&room.ownedItemIds.includes(i.id)).map(i=><button key={i.id} aria-pressed={draft[i.slot]===i.id} onClick={()=>setDraft({...draft,[i.slot]:draft[i.slot]===i.id?null:i.id})}><span style={{background:i.color}}>{i.symbol}</span><small>{i.name}</small><b>{draft[i.slot]===i.id?'配置中 ✓':'配置する'}</b></button>)}{!INTERIOR_ITEMS.some(i=>i.category===category&&(slot==='すべて'||i.slot===slot)&&room.ownedItemIds.includes(i.id))&&<p>この分類の家具は、これからのログイン報酬で届きます。</p>}</div>
 <div className="room-actions"><button onClick={()=>setDraft(room.layout)}>リセット</button><button onClick={()=>{if(!dirty||window.confirm('変更を保存せず閉じますか？'))setEditing(false);}}>キャンセル</button><button onClick={()=>void save()}>インテリアを保存</button></div></div>}
 <label className="room-form-select">お部屋で過ごすフォルム<select value={selected.id} onChange={e=>{const id=e.target.value;void updateRoom(s=>({...s,selectedFormId:id})).then(onChange).catch(()=>setMessage('フォルムを保存できませんでした。'));}}>{FORM_STAGES.filter(f=>f.level<=level).map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label><p role="status">{message}</p></section>;
}
