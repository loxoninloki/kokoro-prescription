import React from 'react';
import { RewardState } from './rewardLedger';
import { RoomState, INTERIOR_ITEMS } from './interior';
import { ITEMS } from './appearance';
import { FIRST_GIFT_IDS } from './formFirstGifts';

export const PRESENT_KEY='kokoro-present-receipts-v1';
export interface PresentReceipt {id:string;title:string;date:string;description:string;receivedAt?:string}
interface Inbox {version:1;entries:PresentReceipt[];deleted:string[]}
function readInbox():Inbox {
 const raw=localStorage.getItem(PRESENT_KEY);if(!raw)return {version:1,entries:[],deleted:[]};
 const value=JSON.parse(raw) as Inbox;
 if(value.version!==1||!Array.isArray(value.entries)||!Array.isArray(value.deleted)||!value.deleted.every(id=>typeof id==='string')||!value.entries.every(e=>e&&typeof e.id==='string'&&typeof e.title==='string'&&typeof e.date==='string'&&typeof e.description==='string'&&(e.receivedAt===undefined||typeof e.receivedAt==='string')))throw new Error('プレゼントの記録を読み込めませんでした。');
 return value;
}
/** Receipts only: rewards are already granted by the existing ledger. Never credits currency. */
export function syncPresentReceipts(wallet:RewardState,room:RoomState):Inbox {
 const current=readInbox(),incoming:PresentReceipt[]=[];
 if(wallet.loginDays>0&&wallet.lastLoginDate){
  const xp=wallet.creditedXp['checkin:'+wallet.lastLoginDate]??0;
  const furniture=INTERIOR_ITEMS.filter(i=>i.day===wallet.loginDays&&room.ownedItemIds.includes(i.id));
  const parts=[...(xp?['マカロン '+xp+'個']:[]),...(wallet.loginDays%7===0?['処方箋チケット 1枚']:[]),...furniture.map(i=>i.name)];
  if(parts.length)incoming.push({id:'login:'+wallet.loginDays,title:'累積'+wallet.loginDays+'日目のログインボーナス',date:wallet.lastLoginDate,description:parts.join('・')});
 }
 FIRST_GIFT_IDS.filter(id=>wallet.ownedItemIds.includes(id)).forEach(id=>incoming.push({id:'form:'+id,title:'進化のお祝い',date:'',description:ITEMS.find(i=>i.id===id)?.name??id}));
 const entries=[...current.entries];
 incoming.forEach(e=>{if(current.deleted.includes(e.id))return;const index=entries.findIndex(old=>old.id===e.id);if(index<0)entries.push(e);else entries[index]={...e,receivedAt:entries[index].receivedAt};});
 const next={...current,entries};if(JSON.stringify(next)!==JSON.stringify(current))localStorage.setItem(PRESENT_KEY,JSON.stringify(next));return next;
}
export function receivePresent(id:string):Inbox {
 const current=readInbox();const next={...current,entries:current.entries.map(e=>e.id===id&&!e.receivedAt?{...e,receivedAt:new Date().toISOString()}:e)};
 localStorage.setItem(PRESENT_KEY,JSON.stringify(next));return next;
}
export function deletePresentHistory():Inbox {
 const current=readInbox();const next={...current,entries:current.entries.filter(e=>!e.receivedAt),deleted:Array.from(new Set([...current.deleted,...current.entries.filter(e=>e.receivedAt).map(e=>e.id)]))};
 localStorage.setItem(PRESENT_KEY,JSON.stringify(next));return next;
}
export default function PresentBox({wallet,room}:{wallet:RewardState;room:RoomState}) {
 const [inbox,setInbox]=React.useState<Inbox>({version:1,entries:[],deleted:[]}),[error,setError]=React.useState(''),[confirm,setConfirm]=React.useState(false);
 React.useEffect(()=>{const sync=()=>{try{setInbox(syncPresentReceipts(wallet,room));setError('');}catch{setError('プレゼントの記録を読み込み・保存できませんでした。');}};sync();const changed=(e:StorageEvent)=>{if(e.key===PRESENT_KEY)sync();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[wallet,room]);
 const pending=inbox.entries.filter(e=>!e.receivedAt),history=inbox.entries.filter(e=>e.receivedAt).reverse();
 const mutate=(action:()=>Inbox)=>{try{setInbox(action());setError('');setConfirm(false);}catch{setError('保存できませんでした。もう一度お試しください。');}};
 return <section className="home-present-card" aria-label="プレゼント">
  <details><summary>🎁 プレゼント <span>{pending.length?pending.length+'件のお知らせ':'新着なし'}</span></summary>
   <p>報酬は残高・所持品へ自動反映済みです。「確認する」で受取履歴に移ります。</p>
   {pending.length?<ul>{pending.map(e=><li key={e.id}><strong>{e.title}</strong>{e.date&&<time>{e.date}</time>}<span>{e.description}</span><button type="button" onClick={()=>mutate(()=>receivePresent(e.id))}>確認する</button></li>)}</ul>:<p>新しいプレゼントのお知らせはありません。</p>}
   <details className="present-history"><summary>受取履歴（{history.length}件）</summary>{history.length?<><ul>{history.map(e=><li key={e.id}><strong>{e.title}</strong><span>{e.description}</span><time>{new Date(e.receivedAt!).toLocaleString('ja-JP')}</time></li>)}</ul>{!confirm?<button className="present-delete" type="button" onClick={()=>setConfirm(true)}>受取履歴を削除</button>:<div><p>表示履歴だけ削除します。残高・所持品は変わりません。</p><button type="button" onClick={()=>mutate(deletePresentHistory)}>履歴を削除する</button><button type="button" onClick={()=>setConfirm(false)}>やめる</button></div>}</>:<p>受取履歴はまだありません。</p>}</details>
  </details>{error&&<p role="alert">{error}</p>}
 </section>;
}
