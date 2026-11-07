import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import RoomStage from './RoomStage';
import InteriorIcon from './InteriorIcon';
import { INTERIOR_ITEMS, RoomState, updateRoom } from './interior';
import { itemQuantity } from './rewardLedger';
type Props = {level:number;form:{name:string;image:string}} & {equipped?:string[]; room:RoomState; onChange:(room:RoomState)=>void; ownedItemIds?:string[];itemCounts?:Record<string,number>};
export default function RokiRoom({level,form,equipped,room,onChange,ownedItemIds=[],itemCounts}:Props) {
 const [editing,setEditing]=useState(false);
 const [draft,setDraft]=useState(room.layout);
 const [category,setCategory]=useState('内装');
 const [slot,setSlot]=useState('すべて');
 const [message,setMessage]=useState('');
 const dirty=editing&&JSON.stringify(draft)!==JSON.stringify(room.layout);
 useEffect(()=>{ const guard=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',guard); return()=>window.removeEventListener('beforeunload',guard);},[dirty]);
 // Capture navigation before the common bar handles it; the app's history remains intact.
 useEffect(()=>{if(!dirty)return; const guard=(e:MouseEvent)=>{ const target=e.target as HTMLElement;if(target.closest('.app-bottom-navigation')&&!window.confirm('編集中の模様替えを保存せず移動しますか？')){e.preventDefault();e.stopPropagation();}};document.addEventListener('click',guard,true);return()=>document.removeEventListener('click',guard,true);},[dirty]);
 const layout=editing?draft:room.layout;
 const selected=form;
 const save=async()=>{try{onChange(await updateRoom(s=>({...s,layout:draft,updatedAt:new Date().toISOString()})));setEditing(false);setMessage('ルームを保存しました。');}catch{setMessage('保存できませんでした。編集内容は残っています。');}};
 return <section className="roki-room" data-editing={editing || undefined}><header className="roki-room-header"><h1><Icon name="growth"/> ろきちゃんのルーム</h1><p>Lv.{level} · {selected.name}</p></header>
 <RoomStage layout={layout} form={selected} equipped={equipped} animated={!editing} />
<p className="interior-note">固定位置に配置 · 家具は仮素材（正式画像は準備中）</p>
 {!editing?<div className="room-actions"><button onClick={()=>{setDraft(room.layout);setMessage('');setEditing(true);}}>模様替え</button></div>:<div className="interior-editor">
 <div role="tablist" aria-label="インテリアカテゴリ" className="interior-tabs">{['内装','家具','雑貨'].map(c=><button role="tab" aria-selected={category===c} key={c} onClick={()=>{setCategory(c);setSlot('すべて');}}><InteriorIcon name={c==='内装'?'wallpaper':c==='家具'?'furniture':'lamp'}/><span>{c}</span></button>)}</div>
 <div className="interior-tabs" aria-label="詳細カテゴリ">{['すべて',...Array.from(new Set(INTERIOR_ITEMS.filter(i=>i.category===category).map(i=>i.slot)))].map(s=><button key={s} aria-pressed={slot===s} onClick={()=>setSlot(s)}><InteriorIcon name={s==='すべて'?'all':s}/>{({wallpaper:'壁紙',floor:'床',desk:'机',bed:'ベッド',rug:'ラグ',lamp:'ランプ'} as Record<string,string>)[s]||s}</button>)}</div>
 <div className="interior-grid" role="region" aria-label="インテリアアイテム一覧" tabIndex={0}>{INTERIOR_ITEMS.filter(i=>i.category===category&&(slot==='すべて'||i.slot===slot)).map(i=><button disabled={!room.ownedItemIds.includes(i.id)} key={i.id} aria-pressed={draft[i.slot]===i.id} onClick={()=>setDraft({...draft,[i.slot]:draft[i.slot]===i.id?null:i.id})}><span className="interior-thumbnail" style={{background:i.color}}><InteriorIcon name={i.slot}/></span><small>{i.name}{room.ownedItemIds.includes(i.id) && ` ×${Math.max(itemQuantity({ownedItemIds,itemCounts},i.id),1)}`}</small>{!room.ownedItemIds.includes(i.id)&&<small>累積{i.day}日で獲得</small>}<b>{draft[i.slot]===i.id?'選択中 ✓':'配置する'}</b>{room.layout[i.slot]===i.id&&<small>保存中の配置</small>}</button>)}{!INTERIOR_ITEMS.some(i=>i.category===category&&(slot==='すべて'||i.slot===slot)&&room.ownedItemIds.includes(i.id))&&<p>この分類の家具は、これからのログイン報酬で届きます。</p>}</div>
 <div className="room-actions"><button onClick={()=>setDraft(room.layout)}>リセット</button><button aria-label="初期状態へ戻す" onClick={()=>setDraft({})}>初期状態</button><button onClick={()=>{if(!dirty||window.confirm('変更を保存せず閉じますか？'))setEditing(false);}}>キャンセル</button><button aria-label="インテリアを保存" onClick={()=>void save()}>保存</button></div></div>}
 {message && <p role="status">{message}</p>}</section>;
}

