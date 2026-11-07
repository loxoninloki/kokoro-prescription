import React from 'react';
import { ITEMS } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import InteriorIcon from './InteriorIcon';
/** The same item drawing used by the catalog and result: never the GIF's artwork. */
export default function GachaPrizeArt({id}:{id:string}) {
 const garment=ITEMS.find(item=>item.id===id);
 const [failed,setFailed]=React.useState(false);
 if(garment&&!failed)return <img src={`${process.env.PUBLIC_URL}/${garment.layers[0].image}`} alt={garment.name} onError={()=>setFailed(true)}/>;
 const furnishing=INTERIOR_ITEMS.find(item=>item.id===id);
 if(furnishing)return <span className="gacha-furniture-icon" style={{backgroundColor:furnishing.color}}><InteriorIcon name={furnishing.slot}/></span>;
 return <span className="gacha-art-fallback" role="img" aria-label={garment?`${garment.name}（画像を表示できません）`:'アイテム'}>✦</span>;
}
