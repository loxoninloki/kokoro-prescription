import type { StampReceipt } from './loginStamp';
import React, { useEffect, useRef, useState } from 'react';
import { INTERIOR_ITEMS, INTERIOR_REWARDS, RoomState } from './interior';
import InteriorIcon from './InteriorIcon';
export default function LoginRewards({days,room,onClose,stampDay=null,receipt}:{days:number;room:RoomState;onClose:()=>void;stampDay?:number|null;receipt?:StampReceipt|null}) {
 const [block,setBlock]=useState(Math.floor(Math.max(0,(stampDay||days)-1)/30));
 const root=useRef<HTMLElement>(null);
 const next=INTERIOR_REWARDS.find(r=>r.day>days);
 const first=block*30+1;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const key=(e:KeyboardEvent)=>{
  if(e.key==='Escape')onClose();
  if(e.key==='Tab'){const buttons=Array.from(root.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')||[]);if(!buttons.length)return;const begin=buttons[0],end=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===begin){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();begin.focus();}}
 };document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};},[onClose]);
 return <div className="interior-modal stamp-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><section ref={root}>
 <header className="stamp-heading"><span>こころの処方箋</span><button type="button" onClick={onClose} autoFocus>{stampDay?'スキップ・閉じる':'閉じる'}</button><h2 id="login-title">{stampDay?'今日のログインスタンプ':'ログインスタンプ帳'}</h2><strong>累積 {days}日</strong><p>お休みしても、これまでの日数はそのまま。</p></header>
 {stampDay&&<div className="stamp-receipt" role="status"><strong>{stampDay}日目のスタンプを保存しました。</strong><p>{receipt&&receipt.xp>0?`経験値 +${receipt.xp} · マカロン +${receipt.xp}`:'今日の経験値・マカロンは反映済みです。'}{receipt&&receipt.tickets>0?` · 処方箋チケット +${receipt.tickets}`:''}</p>{receipt?.furnitureIds.map(id=><p key={id}>{INTERIOR_ITEMS.find(i=>i.id===id)?.name} を獲得</p>)}</div>}

 <div className="stamp-next"><span>次のチケットまで <b>{7-days%7}日</b></span><span>{next?`次は ${INTERIOR_ITEMS.filter(i=>i.day===next.day).map(i=>i.name).join('・')}（あと${next.day-days}日）`:'家具を全て獲得。チケットは7ログインごとに続きます。'}</span></div>
 <nav className="stamp-pagination" aria-label="スタンプの期間"><button disabled={block===0} onClick={()=>setBlock(block-1)}>前の30日</button><b>{first}〜{first+29}日</b><button onClick={()=>setBlock(block+1)}>次の30日</button></nav>
 <div className="stamp-calendar">{Array.from({length:30},(_,index)=>{const day=first+index;const reward=INTERIOR_REWARDS.find(r=>r.day===day);const item=INTERIOR_ITEMS.find(i=>i.day===day);return <article key={day} data-today={stampDay===day||undefined} data-special={!!reward||undefined} data-stamped={day<=days||undefined} aria-label={`${day}日目${day<=days?' 押印済み':''}`}>
 <small>{day}日目</small><span className="stamp-art">{item?<InteriorIcon name={item.slot}/>:day%7===0?'券':'♡'}</span>{day<=days&&<b className="stamp-seal">済</b>}<span className="stamp-gift">{reward?INTERIOR_ITEMS.filter(i=>i.day===day).map(i=>i.name).join('・'):day%7===0?'処方箋チケット':'ログイン'}</span>{reward&&<em>{room.claimedRewardIds.includes(reward.id)?'受取済み':'特別報酬'}</em>}
 </article>;})}</div><p className="stamp-footnote">累積ログインの順番です。連続日数や実際の日付ではありません。</p>
 </section></div>;
}
