import type { StampReceipt } from './loginStamp';
import React, { useEffect, useRef, useState } from 'react';
import { INTERIOR_ITEMS, INTERIOR_REWARDS, RoomState } from './interior';
import InteriorIcon from './InteriorIcon';
export default function LoginRewards({days,room,onClose,stampDay=null,receipt}:{days:number;room:RoomState;onClose:()=>void;stampDay?:number|null;receipt?:StampReceipt|null}) {
 const [block,setBlock]=useState(Math.floor(Math.max(0,(stampDay||days)-1)/30));
 const [selectedDay,setSelectedDay]=useState<number|null>(null);
 const root=useRef<HTMLElement>(null);
 const next=INTERIOR_REWARDS.find(r=>r.day>days);
 const first=block*30+1;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const key=(e:KeyboardEvent)=>{
  if(e.key==='Escape')onClose();
  if(e.key==='Tab'){const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);if(!buttons.length)return;const begin=buttons[0],end=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===begin){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();begin.focus();}}
 };document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[onClose]);
 return <div className="interior-modal stamp-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><section ref={root}>
 <header className="stamp-heading"><h2 id="login-title">ログインスタンプ帳</h2><button type="button" onClick={onClose} autoFocus>閉じる</button></header>
 <div className="stamp-summary"><strong>累積 {days}日</strong><span>次のチケットまで <b>{7-days%7}日</b></span></div>
 {stampDay&&<div className="stamp-receipt" role="status"><strong>本日 {stampDay}日目のログイン完了</strong><span>{receipt&&receipt.xp>0?`EXP +${receipt.xp} · マカロン +${receipt.xp}`:'EXP・マカロンは反映済み'}{receipt&&receipt.tickets>0?` · 処方箋チケット +${receipt.tickets}`:''}</span>{!!receipt?.furnitureIds.length&&<span>{receipt.furnitureIds.map(id=>INTERIOR_ITEMS.find(i=>i.id===id)?.name||id).join('・')} を獲得</span>}</div>}
 <div className="stamp-next"><span>{next?`次の特別報酬：${INTERIOR_ITEMS.filter(i=>i.day===next.day).map(i=>i.name).join('・')}（あと${next.day-days}日）`:'家具は全て獲得済み。チケットは7ログインごと。'}</span></div>
 <nav className="stamp-pagination" aria-label="スタンプの期間"><button disabled={block===0} onClick={()=>{setBlock(block-1);setSelectedDay(null);}}>前の30日</button><b>{first}〜{first+29}日</b><button onClick={()=>{setBlock(block+1);setSelectedDay(null);}}>次の30日</button></nav>
 <div className="stamp-calendar">{Array.from({length:30},(_,index)=>{const day=first+index;const reward=INTERIOR_REWARDS.find(r=>r.day===day);const item=INTERIOR_ITEMS.find(i=>i.day===day);const names=INTERIOR_ITEMS.filter(i=>i.day===day).map(i=>i.name).join('・');const description=`累積${day}日目：${names||'通常ログイン報酬'}${day%7===0?'・処方箋チケット1枚':''}${day<=days?'（押印済み）':'（累積ログインで獲得）'}${reward?(room.claimedRewardIds.includes(reward.id)?' 家具受取済み':' 特別報酬'):''}`;return <article key={day} data-today={stampDay===day||undefined} data-special={!!reward||undefined} data-stamped={day<=days||undefined}>
 <small>{day}日目</small><span className="stamp-art">{item?<InteriorIcon name={item.slot}/>:day%7===0?'券':'♡'}</span>{day<=days&&<b className="stamp-seal">済</b>}<span className="stamp-gift">{reward?'家具':day%7===0?'チケット':'ログイン'}{reward&&day%7===0?'＋券':''}</span>
 <button type="button" className="stamp-info" aria-label={description} aria-expanded={selectedDay===day} onClick={()=>setSelectedDay(selectedDay===day?null:day)} title={description}/>
 </article>;})}</div>
 {selectedDay!==null&&<div className="stamp-detail" role="status"><span>累積{selectedDay}日目：{INTERIOR_ITEMS.filter(i=>i.day===selectedDay).map(i=>i.name).join('・')||'通常ログイン報酬'}{selectedDay%7===0?'・処方箋チケット1枚':''}。{selectedDay<=days?'押印済みです。':`累積${selectedDay}日ログインで獲得できます。`}{INTERIOR_REWARDS.some(r=>r.day===selectedDay&&room.claimedRewardIds.includes(r.id))?' 家具受取済み。':''}</span><button type="button" onClick={()=>setSelectedDay(null)} aria-label="報酬詳細を閉じる">×</button></div>}
 <p className="stamp-footnote">累積の順番です（連続日数・日付ではありません）。各マスで報酬詳細。</p>
 </section></div>;
}
