import React from 'react';
import { INTERIOR_ITEMS, INTERIOR_REWARDS, RoomState } from './interior';
export default function LoginRewards({days, room, onClose}: {days:number;room:RoomState;onClose:()=>void}) {
 const next=INTERIOR_REWARDS.find(r=>r.day>days);
 return <div className="interior-modal" role="dialog" aria-modal="true" aria-labelledby="login-title"><section>
 <button type="button" onClick={onClose} autoFocus>閉じる</button><h2 id="login-title">毎日の小さな贈りもの</h2>
 <strong>累積ログイン {days}日</strong><p>お休みしても、集めたものはそのまま。</p>
 <p>次の処方箋チケットまで {7-days%7}日</p><p>{next ? `次のインテリアまで ${next.day-days}日` : '家具をすべて獲得しました。チケットは7ログインごとに続きます。'}</p>
 <div className="login-reward-grid">{INTERIOR_REWARDS.map(r=><article key={r.id} data-claimed={room.claimedRewardIds.includes(r.id)}><strong>{r.day}日</strong><span aria-hidden="true">{INTERIOR_ITEMS.find(i=>i.day===r.day)?.symbol}</span><p>{INTERIOR_ITEMS.filter(i=>i.day===r.day).map(i=>i.name).join('・')}</p>{r.day%7===0&&<small>処方箋チケット（既存報酬）</small>}<b>{room.claimedRewardIds.includes(r.id)?'受け取り済み ✓':'これから'}</b></article>)}</div>
 </section></div>;
}
