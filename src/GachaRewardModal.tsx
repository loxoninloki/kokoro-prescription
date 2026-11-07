import React from 'react';
import { FormId } from './appearance';
import { RoomState } from './interior';
import { gachaItemName,isInteriorPrize } from './gachaCatalog';
import { gachaRarity,RARITY_PRESENTATION } from './gachaRarity';
import GachaPrizeArt from './GachaPrizeArt';
import GachaTryOn,{canTryOn} from './GachaTryOn';
import { useGachaModal,useReducedMotion } from './useGachaModal';
export default function GachaRewardModal({itemId,form,equipped,roomLayout,busy,error,onClose,testMode=false}:{itemId:string;testMode?:boolean;form:{id:FormId;name:string;image:string};equipped:readonly string[];roomLayout:Readonly<RoomState['layout']>;busy:boolean;error:string;onClose:()=>void}) {
 const [trying,setTrying]=React.useState(false),[applied,setApplied]=React.useState(true);
 const root=useGachaModal(()=>{if(!busy)onClose();}),reduced=useReducedMotion();
 const rarity=gachaRarity(itemId),interior=isInteriorPrize(itemId),supported=canTryOn(itemId,form.id);
 return <div className="gacha-confirm-backdrop"><section ref={root} tabIndex={-1} className="gacha-confirm gacha-reward-modal" role="dialog" aria-modal="true" aria-labelledby="gacha-reward-title" data-rarity={rarity} data-reduced={reduced}>
  <span className="gacha-rarity-badge">{RARITY_PRESENTATION[rarity].label}</span>
  <h2 id="gacha-reward-title">アイテムを獲得しました！</h2>
  {!trying?<div className="gacha-reveal-prize"><GachaPrizeArt id={itemId}/></div>:<>
   <span className="gacha-tryon-badge">{applied?'お試し中 · 保存されません':'元の状態'}</span>
   <GachaTryOn itemId={itemId} form={form} equipped={equipped} roomLayout={roomLayout} applied={applied}/>
  </>}
  <strong className="gacha-reveal-name">{gachaItemName(itemId)}</strong>
  <p className="gacha-reward-kind">種類：{interior?'家具・インテリア':'衣装・コーデ'} ／ {RARITY_PRESENTATION[rarity].label}</p>
  {!supported&&<p className="gacha-tryon-unsupported">現在の{form.name}では試着できません。対応フォルムに進化するとお試しできます。</p>}
  {trying&&<p className="gacha-tryon-notice">現在のコーデ・ルームへの仮表示です。保存状態は変わりません。</p>}
  {error&&<p role="alert">{error}</p>}
  <div className="gacha-reward-actions">
   {!trying?<button type="button" disabled={busy||!supported} onClick={()=>setTrying(true)}>お試しする</button>:<>
    <button type="button" disabled={busy} onClick={()=>setApplied(value=>!value)}>{applied?'元に戻す':'もう一度お試し'}</button>
    <button type="button" disabled={busy} onClick={()=>setTrying(false)}>獲得結果に戻る</button>
   </>}
   <button type="button" className="gacha-reward-ok" disabled={busy} onClick={onClose}>{busy?'確認中…':'OK'}</button>
  </div>
  <p className="gacha-reward-saved">{testMode ? '🧪 テスト結果です。アイテムと残高は実際の所持品には反映されません。' : '獲得アイテムは所持品に保存されています。'}</p>
 </section></div>;
}
