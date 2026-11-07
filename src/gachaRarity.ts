/** Presentation only. This metadata never participates in the draw pool or weights. */
export type GachaRarity = 'normal' | 'rare' | 'highest';
export const RARITY_PRESENTATION = {
 normal: { label: '通常', motif: '♡', announcement: 'やさしい紫の光' },
 rare: { label: 'レア', motif: '✦', announcement: '青紫の星の光' },
 highest: { label: '最高レア', motif: '✧', announcement: '虹色の祝福の光' },
} as const;
// Intentionally empty until item-by-item classification is approved by the owner.
export const APPROVED_ITEM_RARITIES: Readonly<Record<string,GachaRarity>> = Object.freeze({});
export function gachaRarity(itemId:string, approved:Readonly<Record<string,GachaRarity>>=APPROVED_ITEM_RARITIES):GachaRarity {
 const value=approved[itemId];
 return value==='rare'||value==='highest'?value:'normal';
}
