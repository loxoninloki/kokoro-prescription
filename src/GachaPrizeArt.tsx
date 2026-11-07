import React from 'react';
import { ITEMS, DressUpItem } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import InteriorIcon from './InteriorIcon';
import ChibiAtlasTile from './ChibiAtlasTile';
import { CHIBI_GACHA_ICON_ATLAS } from './chibiGachaCatalog';

/**
 * Prize artwork is intentionally independent of the current evolution form.
 * For effects, render EVERY source layer, not just layers[0] (some effects
 * have a separate foreground layer and otherwise appear almost invisible).
 * The wearer-specific preview is GachaTryOn and has its own form restrictions.
 */
function GarmentArt({ item }: { item: DressUpItem }) {
  const [failed, setFailed] = React.useState<string[]>([]);
  if (item.previewAtlasIndex !== undefined) return <span className="gacha-item-art" role="img" aria-label={item.name}>
    <ChibiAtlasTile image={CHIBI_GACHA_ICON_ATLAS} index={item.previewAtlasIndex} className="gacha-chibi-icon-tile" />
  </span>;
  const visible = item.layers.filter(layer => !failed.includes(layer.image));
  return <span className={`gacha-item-art gacha-item-art--${item.category}`}
    role="img" aria-label={item.name}>
    {visible.map((layer, index) =>
      <img key={layer.image} className="gacha-item-art-layer"
        src={`${process.env.PUBLIC_URL}/${layer.image}`} alt=""
        draggable={false} loading="eager" decoding="async"
        style={{ zIndex: layer.order * 10 + index }}
        onError={() => setFailed(old => [...old, layer.image])}/>
    )}
    {!visible.length && <span className="gacha-art-fallback" aria-hidden="true">
      画像を読み込めませんでした
    </span>}
  </span>;
}

/** Shared by the lineup, the item details and the obtained-item popup. */
export default function GachaPrizeArt({ id }: { id: string }) {
  const garment = ITEMS.find(item => item.id === id);
  if (garment) return <GarmentArt key={id} item={garment}/>;
  const furnishing = INTERIOR_ITEMS.find(item => item.id === id);
  if (furnishing) return <span className="gacha-furniture-icon"
    style={{ backgroundColor: furnishing.color }} role="img" aria-label={furnishing.name}>
    <InteriorIcon name={furnishing.slot}/>
  </span>;
  return <span className="gacha-art-fallback" role="img" aria-label="アイテム画像は準備中です">✦</span>;
}
