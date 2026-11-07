import { ITEMS } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import { updateRewards } from './rewardLedger';
export interface OperatorPresent {id:string;title:string;startsAt:string;endsAt?:string;macarons:number;tickets:number;itemIds:string[]}
export function parseOperatorPresents(raw:unknown):OperatorPresent[] {
 const source=raw as {version:number;gifts:OperatorPresent[]};
 if(!source||source.version!==1||!Array.isArray(source.gifts)||source.gifts.length>1000)throw new Error('配布一覧を読み込めませんでした。');
 const ids=new Set<string>();
 source.gifts.forEach(g=>{if(!g||typeof g.id!=='string'||!/^[a-z0-9_-]{1,80}$/.test(g.id)||ids.has(g.id)||typeof g.title!=='string'||!g.title.trim()||g.title.length>100||typeof g.startsAt!=='string'||!Number.isFinite(Date.parse(g.startsAt))||(g.endsAt!==undefined&&(typeof g.endsAt!=='string'||!Number.isFinite(Date.parse(g.endsAt))||Date.parse(g.endsAt)<=Date.parse(g.startsAt)))||![g.macarons,g.tickets].every(n=>Number.isSafeInteger(n)&&n>=0&&n<=100000)||!Array.isArray(g.itemIds)||g.itemIds.length>100||!g.itemIds.every(id=>ITEMS.some(i=>i.id===id)||INTERIOR_ITEMS.some(i=>i.id===id))||(!g.macarons&&!g.tickets&&!g.itemIds.length))throw new Error('配布内容が不正です。');ids.add(g.id);});
 return source.gifts;
}
export async function loadOperatorPresents():Promise<OperatorPresent[]> {
 const response=await fetch(`${process.env.PUBLIC_URL}/presents.json`,{cache:'no-store'});
 if(!response.ok)throw new Error('運営からの配布一覧を取得できませんでした。');
 return parseOperatorPresents(await response.json());
}
export const presentAvailable=(g:OperatorPresent,now=Date.now())=>Date.parse(g.startsAt)<=now&&(!g.endsAt||Date.parse(g.endsAt)>now);
export async function claimOperatorPresent(id:string) {
 // Re-read the operator's current manifest before spending the one-time claim.
 const gift=(await loadOperatorPresents()).find(g=>g.id===id);
 if(!gift||!presentAvailable(gift))throw new Error('この特典は現在受け取れません。');
 return updateRewards(current=>{
  if(current.presentClaims?.includes(id))return current;
  const next={...current,earned:current.earned+gift.macarons,tickets:current.tickets+gift.tickets,presentTicketCredit:(current.presentTicketCredit??0)+gift.tickets,presentClaims:[...(current.presentClaims??[]),id],presentClaimDates:{...current.presentClaimDates,[id]:new Date().toISOString()},ownedItemIds:Array.from(new Set([...current.ownedItemIds,...gift.itemIds]))};
  if(!Number.isSafeInteger(next.earned)||!Number.isSafeInteger(next.tickets)||next.presentClaims.length>10000)throw new Error('受取情報を保存できません。');
  return next;
 });
}
export function operatorPresentDescription(g:OperatorPresent) {
 return [...(g.macarons?['マカロン '+g.macarons+'個']:[]),...(g.tickets?['処方箋チケット '+g.tickets+'枚']:[]),...g.itemIds.map(id=>ITEMS.find(i=>i.id===id)?.name??INTERIOR_ITEMS.find(i=>i.id===id)?.name??id)].join('・');
}
