import { ITEMS } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import { FIRST_GIFT_IDS } from './formFirstGifts';

export interface GachaType {
  id: 'standard' | 'outfit' | 'interior';
  name: string;
  description: string;
  icon: string;
  itemIds: readonly string[];
  macaronCost: number;
}

const clothing = ITEMS.filter(item => !FIRST_GIFT_IDS.includes(item.id)).map(item => item.id);
const furniture = INTERIOR_ITEMS.map(item => item.id);

// Adding a gacha category only requires adding another entry here.
export const GACHA_TYPES: readonly GachaType[] = [
  { id: 'standard', name: '通常ガチャ', description: '衣装・インテリアの両方が登場します。', icon: '✦', itemIds: [...clothing, ...furniture], macaronCost: 50 },
  { id: 'outfit', name: 'ファッションセレクトガチャ', description: '衣装・髪型・メイク・アクセサリーが登場します。', icon: '♧', itemIds: clothing, macaronCost: 50 },
  { id: 'interior', name: 'インテリアセレクトガチャ', description: 'ルーム用の家具・内装だけが登場します。', icon: '⌂', itemIds: furniture, macaronCost: 50 },
];

export function drawCandidates(type: GachaType, owned: readonly string[]): string[] {
  return type.itemIds.filter(id => !owned.includes(id));
}

export function equalWeightPool(itemIds: readonly string[]): {id:string;weight:number}[] {
  if (!itemIds.length || itemIds.length > 10000) throw new Error('抽選対象がありません。');
  const each = Math.floor(10000 / itemIds.length);
  const extra = 10000 % itemIds.length;
  return itemIds.map((id, index) => ({ id, weight: each + (index < extra ? 1 : 0) }));
}

export function gachaItemName(id: string): string {
  return ITEMS.find(item => item.id === id)?.name ??
    INTERIOR_ITEMS.find(item => item.id === id)?.name ?? id;
}

export function isInteriorPrize(id: string): boolean {
  return INTERIOR_ITEMS.some(item => item.id === id);
}
