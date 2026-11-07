import React from 'react';
import { CATEGORIES, ITEMS, FormId } from './appearance';
import { RoomState } from './interior';
import { gachaItemName,isInteriorPrize } from './gachaCatalog';
import { gachaRarity,RARITY_PRESENTATION } from './gachaRarity';
import GachaPrizeArt from './GachaPrizeArt';
import GachaTryOn,{canTryOn} from './GachaTryOn';
import { useGachaModal,useReducedMotion } from './useGachaModal';
export default function GachaRewardModal({itemId,form,equipped,roomLayout,busy,error,onClose,testMode=false,ownedItemIds=[],quantity=1,onEquip}:{itemId:string;quantity?:number;testMode?:boolean;ownedItemIds?:readonly string[];onEquip?:(itemId:string,formId:FormId)=>Promise<void>;form:{id:FormId;name:string;image:string};equipped:readonly string[];roomLayout:Readonly<RoomState['layout']>;busy:boolean;error:string;onClose:()=>void}) {
 const [trying,setTrying]=React.useState(false),[applied,setApplied]=React.useState(true);
 const [artExpanded,setArtExpanded]=React.useState(false);
 const [equipping,setEquipping]=React.useState(false),[equipMessage,setEquipMessage]=React.useState('');
 const equipLock=React.useRef(false);
 const wear=async()=>{if(equipLock.current||testMode||!onEquip)return;equipLock.current=true;setEquipping(true);setEquipMessage('');try{await onEquip(itemId,form.id);setEquipMessage('着用しました！');}catch(reason){setEquipMessage(reason instanceof Error?reason.message:'コーデを保存できませんでした。');}finally{equipLock.current=false;setEquipping(false);}};
 const root=useGachaModal(()=>{if(!busy&&!equipLock.current)onClose();}),reduced=useReducedMotion();
 const garment=ITEMS.find(item=>item.id===itemId);
 const rarity=gachaRarity(itemId),interior=isInteriorPrize(itemId),supported=canTryOn(itemId,form.id);
 return <div className="gacha-confirm-backdrop"><section ref={root} tabIndex={-1} className="gacha-confirm gacha-reward-modal" role="dialog" aria-modal="true" aria-labelledby="gacha-reward-title" data-rarity={rarity} data-reduced={reduced}>
  <span className="gacha-rarity-badge">{RARITY_PRESENTATION[rarity].label}</span>
  <h2 id="gacha-reward-title">アイテムを獲得しました！</h2>
  {!trying?<>
   <div className={artExpanded ? "gacha-reveal-prize gacha-prize-large" : "gacha-reveal-prize"} aria-label="獲得アイテム単体のプレビュー"><GachaPrizeArt id={itemId}/></div>
   <button type="button" className="gacha-prize-zoom" aria-pressed={artExpanded} onClick={()=>setArtExpanded(value=>!value)}>{artExpanded ? "元の大きさに戻す" : "アイテム画像を拡大"}</button>
  </>:<>
   <span className="gacha-tryon-badge">{equipMessage==='着用しました！'?'保存したコーデ':applied?'お試し中 · 保存されません':'元の状態'}</span>
   <GachaTryOn itemId={itemId} form={form} equipped={equipped} roomLayout={roomLayout} applied={applied}/>
  </>}
  <strong className="gacha-reveal-name">{gachaItemName(itemId)} ×{quantity}</strong>
  <p className="gacha-reward-kind">種類：{interior?'家具・インテリア':garment?CATEGORIES[garment.category].name:'アイテム'} ／ {RARITY_PRESENTATION[rarity].label}</p>
  {!supported&&<p className="gacha-tryon-unsupported">現在の{form.name}ではお試しできません。対応フォルムになるとお試しできます。アイテム単体の画像はいつでも確認できます。</p>}
  {trying&&<p className="gacha-tryon-notice">{equipMessage==='着用しました！'?'現在のフォルムのコーデに保存しました。':'現在のコーデ・ルームへの仮表示です。保存状態は変わりません。'}</p>}
  {error&&<p role="alert">{error}</p>}{equipMessage&&<p role="status">{equipMessage}</p>}{trying&&testMode&&<p className="gacha-tryon-notice">仮着用です。テスト中は保存できません。</p>}
  <div className="gacha-reward-actions">
   {!trying?<button type="button" disabled={busy||equipping||!supported} onClick={()=>setTrying(true)}>お試しする</button>:<>
    <button type="button" disabled={busy||equipping} onClick={()=>setApplied(value=>!value)}>{applied?'元に戻す':'もう一度お試し'}</button>
    <button type="button" disabled={busy||equipping} onClick={()=>setTrying(false)}>獲得結果に戻る</button>
   </>}
   {trying&&supported&&garment&&!testMode&&ownedItemIds.includes(itemId)&&onEquip&&<button type="button" className="gacha-wear" disabled={busy||equipping||!applied||equipMessage==='着用しました！'} onClick={()=>void wear()}>{equipping?'保存中…':equipMessage==='着用しました！'?'着用済み':'このまま着用する'}</button>}
   <button type="button" className="gacha-reward-ok" disabled={busy||equipping} onClick={onClose}>{busy?'確認中…':'OK'}</button>
  </div>
  <p className="gacha-reward-saved">{testMode ? '🧪 テスト結果です。アイテムと残高は実際の所持品には反映されません。' : '獲得アイテムは所持品に保存されています。'}</p>
 </section></div>;
}
