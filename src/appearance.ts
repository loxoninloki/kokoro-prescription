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
  position?: { left: number; top: number; width: number };
}

export interface DressUpItem {
  id: string;
  category: Category;
  name: string;
  requiredRecordDays?: number;
  // Layers share a canvas. A hairstyle can contribute both back and front layers.
  layers: readonly OutfitLayer[];
}

export const ITEMS: readonly DressUpItem[] = [
  {
    id: 'night-beret',
    category: 'hats',
    name: '星夜のベレー帽',
    layers: [{
      image: 'dressup/night_beret.webp',
      order: 30,
      position: { left: 48, top: 3, width: 40 },
    }],
  },
  {
    id: 'lavender-star-clip',
    category: 'accessories',
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
    name: 'ラベンダーの花あかり',
    requiredRecordDays: 30,
    layers: [{ image: 'dressup/lavender_bloom.svg', order: 11 }],
  },
  {
    id: 'moon-sparkles',
    category: 'effects',
    name: '月夜のきらめき',
    layers: [{ image: 'dressup/moon_sparkles.svg', order: 10 }],
  },
];

export interface Appearance {
  version: 1;
  mode: 'chibi' | 'human';
  equipped: string[];
  rewardDays?: number;
}

export const DEFAULT_APPEARANCE: Appearance = { version: 1, mode: 'chibi', equipped: [] };

export function parseAppearance(value: unknown): Appearance {
  if (typeof value !== 'object' || value === null) throw new Error('コーデのデータが不正です。');
  const { version, mode, equipped, rewardDays } = value as Partial<Appearance>;
  if (version !== 1 || (mode !== 'chibi' && mode !== 'human') || !Array.isArray(equipped) ||
      (rewardDays !== undefined && (!Number.isSafeInteger(rewardDays) || rewardDays < 0)) ||
      equipped.length > 128 || !equipped.every(id => typeof id === 'string' && /^[a-z0-9_-]{1,64}$/.test(id))) {
    throw new Error('コーデのデータが不正です。');
  }
  return { version, mode, equipped: Array.from(new Set(equipped)), ...(rewardDays === undefined ? {} : { rewardDays }) };
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
