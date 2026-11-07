import React from 'react';
import { createPortal } from 'react-dom';
import { useGachaModal } from './useGachaModal';
import { RewardState, updateRewards, tokyoDay } from './rewardLedger';
import { RoomState, INTERIOR_ITEMS } from './interior';
import { ITEMS } from './appearance';
import { loadOperatorPresents,claimOperatorPresent,operatorPresentDescription,presentAvailable,OperatorPresent } from './operatorPresents';
import { FORM_FIRST_GIFTS } from './formFirstGifts';
import { FORM_CHOICES } from './appearance';

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
export function syncPresentReceipts(wallet:RewardState,room:RoomState,level=1):Inbox {
 const current=readInbox(),incoming:PresentReceipt[]=[];
 if(wallet.loginDays>0&&wallet.lastLoginDate){
  const furniture=INTERIOR_ITEMS.filter(i=>i.day===wallet.loginDays&&room.ownedItemIds.includes(i.id));
  const parts=[...(wallet.loginDays%7===0?['処方箋チケット 1枚']:[]),...furniture.map(i=>i.name)];
  if(parts.length)incoming.push({id:'login:'+wallet.loginDays,title:'累積'+wallet.loginDays+'日目のログインボーナス',date:wallet.lastLoginDate,description:parts.join('・')});
 }
 // Unlock notifications are queued at the required level; the actual item is granted only when claimed.
 const giftIds=new Set<string>();
 FORM_CHOICES.filter(form=>form.level<=level).forEach(form=>{
   const id=FORM_FIRST_GIFTS[form.id];
   if(!id||giftIds.has(id))return;
   giftIds.add(id);
   incoming.push({id:'form:'+id,title:'Lv.'+form.level+'達成のお祝い',date:tokyoDay(),description:ITEMS.find(i=>i.id===id)?.name??id});
 });
 // Already owned gifts belong in history and must never be granted a second time.
 Object.values(FORM_FIRST_GIFTS).forEach(id=>{
   if(id&&!giftIds.has(id)&&wallet.ownedItemIds.includes(id)){
     incoming.push({id:'form:'+id,title:'進化のお祝い',date:'',description:ITEMS.find(i=>i.id===id)?.name??id});
   }
 });
 const entries=[...current.entries];
 incoming.forEach(e=>{if(current.deleted.includes(e.id))return;const index=entries.findIndex(old=>old.id===e.id);if(index<0)entries.push(e.id.startsWith('form:') && wallet.ownedItemIds.includes(e.id.slice(5)) ? {...e,receivedAt:new Date().toISOString()} : e);else entries[index]={...e,receivedAt:entries[index].receivedAt ?? (e.id.startsWith('form:') && wallet.ownedItemIds.includes(e.id.slice(5)) ? new Date().toISOString() : undefined)};});
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
export default function PresentBox({wallet,room,level,onWalletChange}:{wallet:RewardState;room:RoomState;level:number;onWalletChange:(wallet:RewardState)=>void}) {
 const [inbox,setInbox]=React.useState<Inbox>({version:1,entries:[],deleted:[]}),[error,setError]=React.useState(''),[confirm,setConfirm]=React.useState(false);
 React.useEffect(()=>{const sync=()=>{try{setInbox(syncPresentReceipts(wallet,room,level));setError('');}catch{setError('プレゼントの記録を読み込み・保存できませんでした。');}};sync();const changed=(e:StorageEvent)=>{if(e.key===PRESENT_KEY)sync();};window.addEventListener('storage',changed);return()=>window.removeEventListener('storage',changed);},[wallet,room,level]);
 const visible=inbox.entries.map(e=>e.id.startsWith('login:')?{...e,description:e.description.split('・').filter(part=>!part.startsWith('マカロン ')).join('・')}:e).filter(e=>e.description);
 const [gifts,setGifts]=React.useState<OperatorPresent[]>([]),[loading,setLoading]=React.useState(false),[claiming,setClaiming]=React.useState(false);
 const claimLock=React.useRef(false);
 const refresh=React.useCallback(async()=>{setLoading(true);try{setGifts(await loadOperatorPresents());setError('');}catch{setError('運営の配布一覧を取得できませんでした。再読み込みをお試しください。');}finally{setLoading(false);}},[]);
 const claim=async(g:OperatorPresent)=>{if(claimLock.current)return;claimLock.current=true;setClaiming(true);try{const next=await claimOperatorPresent(g.id);onWalletChange(next);const saved=readInbox();const id='operator:'+g.id;if(!saved.deleted.includes(id)&&!saved.entries.some(e=>e.id===id)){saved.entries.push({id,title:g.title,date:'',description:operatorPresentDescription(g),receivedAt:next.presentClaimDates?.[g.id]??new Date().toISOString()});localStorage.setItem(PRESENT_KEY,JSON.stringify(saved));}setInbox(saved);setError('');}catch(reason){setError(reason instanceof Error?reason.message:'受け取れませんでした。');}finally{claimLock.current=false;setClaiming(false);}};
 React.useEffect(()=>{try{const saved=readInbox();let changed=false;gifts.filter(g=>wallet.presentClaims?.includes(g.id)).forEach(g=>{const id='operator:'+g.id;if(!saved.deleted.includes(id)&&!saved.entries.some(e=>e.id===id)){saved.entries.push({id,title:g.title,date:'',description:operatorPresentDescription(g),receivedAt:wallet.presentClaimDates?.[g.id]??new Date().toISOString()});changed=true;}});if(changed){localStorage.setItem(PRESENT_KEY,JSON.stringify(saved));setInbox(saved);}}catch{setError('受取履歴を保存できませんでした。配布一覧を更新して再試行してください。');}},[gifts,wallet]);
 const [claimingLevel,setClaimingLevel]=React.useState(false);
 const levelClaimLock=React.useRef(false);
 const claimLevelGift=async(e:PresentReceipt)=>{
   if(levelClaimLock.current)return;
   const itemId=e.id.slice('form:'.length);
   const form=FORM_CHOICES.find(candidate=>FORM_FIRST_GIFTS[candidate.id]===itemId);
   if(!form||level<form.level){setError('この報酬の受取条件を満たしていません。');return;}
   levelClaimLock.current=true;setClaimingLevel(true);
   try{
     const next=await updateRewards(current=>current.ownedItemIds.includes(itemId)?current:{
       ...current,ownedItemIds:[...current.ownedItemIds,itemId],
     });
     onWalletChange(next);
     setInbox(receivePresent(e.id));
     setError('');
   }catch{setError('受け取りを保存できませんでした。もう一度お試しください。');}
   finally{levelClaimLock.current=false;setClaimingLevel(false);}
 };
 const available=gifts.filter(g=>presentAvailable(g)&&!wallet.presentClaims?.includes(g.id));
 const pending=visible.filter(e=>!e.receivedAt),history=visible.filter(e=>e.receivedAt).reverse();
 const [opened,setOpened]=React.useState(false);
 React.useEffect(()=>{void refresh();},[refresh]);
 const mutate=(action:()=>Inbox)=>{try{setInbox(action());setError('');setConfirm(false);}catch{setError('保存できませんでした。もう一度お試しください。');}};
 return <><button type="button" className="present-icon-button" aria-label={`プレゼントボックスを開く${pending.length+available.length?'、新着'+(pending.length+available.length)+'件':''}`} onClick={()=>{setOpened(true);void refresh();}}>
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 11h16v10H4zM3 7h18v4H3zM12 7v14"/><path d="M12 7C3 8 5 0 9 3l3 4c9 1 7-7 3-4l-3 4Z"/></svg><span>プレゼント</span>{pending.length+available.length>0&&<b className="present-count">{pending.length+available.length}</b>}
 </button>{opened&&createPortal(<PresentDialog onClose={()=>setOpened(false)}>
  <h2 id="present-title">プレゼントボックス</h2>
   <button type="button" disabled={loading||claiming} onClick={()=>void refresh()}>{loading?'受信中…':'配布一覧を更新'}</button>
   {available.length>0&&<ul>{available.map(g=><li key={g.id}><strong>{g.title}</strong><span>{operatorPresentDescription(g)}</span><button type="button" disabled={claiming} onClick={()=>void claim(g)}>{claiming?'受取中…':'受け取る'}</button></li>)}</ul>}
   <p>家具・コーデなどの特典が届くボックスです。ログイン時のマカロンはここには入りません。ログイン特典は自動付与されます。レベル達成の記念品は「受け取る」で所持品へ入ります。</p>
   {pending.length?<ul>{pending.map(e=><li key={e.id}><strong>{e.title}</strong>{e.date&&<time>{e.date}</time>}<span>{e.description}</span>{e.id.startsWith('form:')?<button type="button" disabled={claimingLevel} onClick={()=>void claimLevelGift(e)}>{claimingLevel?'受取中…':'受け取る'}</button>:<button type="button" onClick={()=>mutate(()=>receivePresent(e.id))}>確認する</button>}</li>)}</ul>:<p>自動付与済みの特典のお知らせはありません。</p>}
   <details className="present-history"><summary>受取履歴（{history.length}件）</summary>{history.length?<><ul>{history.map(e=><li key={e.id}><strong>{e.title}</strong><span>{e.description}</span><time>{new Date(e.receivedAt!).toLocaleString('ja-JP')}</time></li>)}</ul>{!confirm?<button className="present-delete" type="button" onClick={()=>setConfirm(true)}>受取履歴を削除</button>:<div><p>表示履歴だけ削除します。残高・所持品は変わりません。</p><button type="button" onClick={()=>mutate(deletePresentHistory)}>履歴を削除する</button><button type="button" onClick={()=>setConfirm(false)}>やめる</button></div>}</>:<p>受取履歴はまだありません。</p>}</details>
  {error&&<p role="alert">{error}</p>}
 </PresentDialog>,document.body)}</>;
}
function PresentDialog({onClose,children}:{onClose:()=>void;children:React.ReactNode}) {
 const root=useGachaModal(onClose);
 return <div className="present-dialog-backdrop"><section ref={root} tabIndex={-1} className="home-present-card present-dialog" role="dialog" aria-modal="true" aria-labelledby="present-title"><button className="present-close" type="button" onClick={onClose}>閉じる</button>{children}</section></div>;
}
