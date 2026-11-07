import { FORM_STAGES, HUMAN_FORM } from './evolution';
import { CHIBI_GACHA_ITEMS, CHIBI_GACHA_ASSETS_READY } from './chibiGachaCatalog';
export const ALL_FORM_IDS = [...FORM_STAGES.map(form=>form.id), 'human'] as const;
export const APPEARANCE_KEY = 'kokoro-roki-appearance-v1';

export const CATEGORIES = {
  hair: { name: '髪型', multiple: false },
  eyes: { name: '目', multiple: false },
  tops: { name: '上着', multiple: false },
  bottoms: { name: 'ボトムス', multiple: false },
  shoes: { name: '靴', multiple: false },
  accessories: { name: 'アクセサリー', multiple: true },
  hats: { name: '帽子', multiple: false },
  effects: { name: 'エフェクト', multiple: true },
} as const;

export type Category = keyof typeof CATEGORIES;

interface OutfitLayer {
  image: string;
  order: number;
  // Small overlays use percentages of the square portrait canvas.
  position?: { left: number; top: number; width: number; rotation?: number };
  portraitClip?: string;
  clipPath?: string;
  /** Tile index of a 4x3 square, transparent sprite atlas. */
  atlasIndex?: number;
}

export interface DressUpItem {
  id: string;
  category: Category;
  name: string;
  requiredRecordDays?: number;
  supportedForms: readonly FormId[];
  // Layers share a canvas. A hairstyle can contribute both back and front layers.
  layers: readonly OutfitLayer[];
  /** Use the matching tile in the icon atlas for the gacha prize image. */
  previewAtlasIndex?: number;
}

export const ITEMS: readonly DressUpItem[] = [
  ...(CHIBI_GACHA_ASSETS_READY ? CHIBI_GACHA_ITEMS : []),
  {
    id: 'growth-gift-development', name: '芽吹きのひかり', category: 'effects', supportedForms: ALL_FORM_IDS,
    layers: [{ image: 'dressup/form_gift_sprout_back.svg', order: 12 }, { image: 'dressup/form_gift_sprout_front.svg', order: 24 }],
  },
  {
    id: 'growth-gift-birth', name: '誕生のきらめき', category: 'effects', supportedForms: ALL_FORM_IDS,
    layers: [{ image: 'dressup/form_gift_birth_back.svg', order: 12 }, { image: 'dressup/form_gift_birth_front.svg', order: 24 }],
  },
  {
    id: 'growth-gift-growth', name: '成長の星めぐり', category: 'effects', supportedForms: ALL_FORM_IDS,
    layers: [{ image: 'dressup/form_gift_growth_back.svg', order: 12 }, { image: 'dressup/form_gift_growth_front.svg', order: 24 }],
  },
  {
    id: 'growth-gift-mature', name: '成熟の月光', category: 'effects', supportedForms: ALL_FORM_IDS,
    layers: [{ image: 'dressup/form_gift_mature_back.svg', order: 12 }, { image: 'dressup/form_gift_mature_front.svg', order: 24 }],
  },
  {
    id: 'growth-gift-human', name: 'ヒューマンの祝福', category: 'effects', supportedForms: ALL_FORM_IDS,
    layers: [{ image: 'dressup/form_gift_human.svg', order: 12 }],
  },
  {
    id: 'night-beret',
    category: 'hats',
    supportedForms: ['mature'],
    name: '星夜のベレー帽',
    layers: [{
      image: 'dressup/night_beret.webp',
      order: 30,
      position: { left: 10, top: -3, width: 72, rotation: -7 },
      portraitClip: 'polygon(0 9%, 18% 9%, 21% 20%, 27% 21%, 32% 18%, 39% 9%, 100% 9%, 100% 100%, 0 100%)',
      // Follow the front seam so the underside of the beret stays hidden.
      clipPath: 'polygon(0 0, 100% 0, 100% 69%, 83% 69%, 81% 68%, 78% 66%, 74% 65%, 69% 64%, 63% 64%, 57% 64.5%, 50% 66%, 44% 68%, 38% 71%, 32% 74%, 26% 79%, 23% 81%, 0 81%)',
    }],
  },
  {
    id: 'lavender-star-clip',
    category: 'accessories',
    supportedForms: ['mature'],
    name: 'ラベンダーの星ピン',
    layers: [{
      image: 'dressup/lavender_star_clip.svg',
      order: 25,
      position: { left: 18, top: 28, width: 12 },
    }],
  },
  {
    id: 'lavender-bloom',
    category: 'effects',
    supportedForms: ['tablet','development','birth','growth','mature','human'],
    name: 'ラベンダーの花あかり',
    requiredRecordDays: 30,
    layers: [{ image: 'dressup/lavender_bloom.svg', order: 11 }],
  },
  {
    id: 'moon-sparkles',
    category: 'effects',
    supportedForms: ['tablet','development','birth','growth','mature','human'],
    name: '月夜のきらめき',
    layers: [
      { image: 'dressup/moon_sparkles_floor.svg', order: 10 },
      { image: 'dressup/moon_ring_front.svg', order: 21 },
    ],
  },
];

export type FormId = typeof FORM_STAGES[number]['id'] | 'human';
export const FORM_CHOICES = [...FORM_STAGES, {id:'human' as const, level:50, ...HUMAN_FORM}];

export interface Appearance {
  version: 1;
  mode: 'chibi' | 'human';
  equipped: string[];
  rewardDays?: number;
  selectedFormId?: FormId;
  formEquipment?: Partial<Record<FormId, string[]>>;
}

export const DEFAULT_APPEARANCE: Appearance = { version: 1, mode: 'chibi', equipped: [] };

export function parseAppearance(value: unknown): Appearance {
  if (typeof value !== 'object' || value === null) throw new Error('コーデのデータが不正です。');
  const { version, mode, equipped, rewardDays, selectedFormId, formEquipment } = value as Partial<Appearance>;
  if (version !== 1 || (mode !== 'chibi' && mode !== 'human') || !Array.isArray(equipped) ||
      (rewardDays !== undefined && (!Number.isSafeInteger(rewardDays) || rewardDays < 0)) ||
      equipped.length > 128 || !equipped.every(id => typeof id === 'string' && /^[a-z0-9_-]{1,64}$/.test(id))) {
    throw new Error('コーデのデータが不正です。');
  }
  if (selectedFormId !== undefined && !FORM_CHOICES.some(f=>f.id===selectedFormId)) throw new Error('フォルムの選択が不正です。');
  if(formEquipment !== undefined && (!formEquipment || typeof formEquipment!=='object' || Array.isArray(formEquipment) ||
    !Object.entries(formEquipment).every(([form,ids])=>FORM_CHOICES.some(f=>f.id===form)&&Array.isArray(ids)&&ids.length<=128&&ids.every(id=>typeof id==='string'&&/^[a-z0-9_-]{1,64}$/.test(id))))) throw new Error('フォルム別コーデが不正です。');
  return { ...(selectedFormId===undefined?{}:{selectedFormId}), ...(formEquipment===undefined?{}:{formEquipment}), version, mode, equipped: Array.from(new Set(equipped)), ...(rewardDays === undefined ? {} : { rewardDays }) };
}

export function readAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    return raw ? parseAppearance(JSON.parse(raw)) : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function toggleItem(appearance: Appearance, item: DressUpItem): Appearance {
  const equipped = appearance.equipped.filter(id => id !== item.id);
  if (appearance.equipped.includes(item.id)) return { ...appearance, equipped };
  return {
    ...appearance,
    equipped: [
      ...equipped.filter(id => CATEGORIES[item.category].multiple ||
        !ITEMS.some(candidate => candidate.id === id && candidate.category === item.category)),
      item.id,
    ],
  };
}

export function selectedForm(a:Appearance, level:number, legacyRoomForm?:string|null) {
 const id=a.selectedFormId ?? (a.mode==='human'?'human':legacyRoomForm);
 return FORM_CHOICES.find(f=>f.id===id&&f.level<=level)||[...FORM_STAGES].reverse().find(f=>f.level<=level)||FORM_STAGES[0];
}
export function equipmentForForm(a:Appearance,id:FormId):string[] {
 return a.formEquipment?.[id] ?? (id==='mature'?a.equipped:[]);
}
export function outfitView(a:Appearance,id:FormId):Appearance {return {...a,equipped:equipmentForForm(a,id)};}
export function saveFormEquipment(a:Appearance,id:FormId,ids:string[]):Appearance {
 const supported=ids.filter(itemId=>ITEMS.some(i=>i.id===itemId&&i.supportedForms.includes(id)));
 return {...a,...(id==='mature'?{equipped:supported}:{}),formEquipment:{...a.formEquipment,[id]:supported}};
}

export const FORM_EFFECT_PLACEMENT: Record<FormId,{left:number;top:number;width:number;backOrder?:number;frontOrder?:number}> = {
 tablet:{left:4,top:-7,width:92}, development:{left:0,top:0,width:100},
 birth:{left:0,top:0,width:100},growth:{left:0,top:0,width:100},
 mature:{left:0,top:0,width:100},human:{left:0,top:0,width:100},
};
export function layersForForm(item:DressUpItem,form:FormId):readonly OutfitLayer[] {
 if(item.category!=='effects')return item.layers;
 const placement=FORM_EFFECT_PLACEMENT[form];
 return item.layers.map(layer=>({...layer,position:layer.position??placement,order:layer.order<20?(placement.backOrder??layer.order):(placement.frontOrder??layer.order)}));
}
