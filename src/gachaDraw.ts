import { drawItem, updateRewards, PendingGachaResult } from './rewardLedger';
import { drawCandidates, equalWeightPool, GachaType } from './gachaCatalog';
export async function confirmGachaDraw(gacha:GachaType,payment:'ticket'|'macaron',roomOwned:readonly string[]) {
 let saved:PendingGachaResult|null=null;
 const wallet=await updateRewards(current=>{
  if(current.pendingGachaResult)throw new Error('前回の獲得結果を確認してから、次のガチャを引いてください。');
  const available=drawCandidates(gacha,Array.from(new Set([...current.ownedItemIds,...roomOwned])));
  if(!available.length)throw new Error('このガチャのアイテムはすべて所持しています。');
  const result=drawItem(current,{macaronCost:gacha.macaronCost,pool:equalWeightPool(available),resolveDuplicate:()=>{throw new Error('抽選対象が更新されました。');}},payment);
  const id=typeof window.crypto?.randomUUID==='function'?window.crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  saved={id,itemId:result.itemId,gachaId:gacha.id,payment,amount:payment==='ticket'?1:gacha.macaronCost,confirmedAt:new Date().toISOString()};
  // Currency, ownership, and the single unacknowledged result share ONE atomic write.
  return {...result.state,pendingGachaResult:saved};
 });
 return {wallet,result:saved!};
}
export function acknowledgeGachaResult(id:string) {
 return updateRewards(current=>{
  if(current.pendingGachaResult?.id!==id)return current;
  const {pendingGachaResult,...rest}=current;return rest;
 });
}
