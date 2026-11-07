/**
 * Chibi Roki's 12-piece gacha collection.
 * Each item uses ONE tile in a 4-column / 3-row transparent WebP atlas.
 * Artwork is drawn on a full square character canvas to preserve alignment.
 *
 * IMPORTANT: switch ASSETS_READY to true ONLY AFTER both binary files exist
 * in public/dressup/chibi on this branch. Otherwise the gacha would award
 * blank images. User-uploaded files are required for the binary atlases.
 */
export const CHIBI_GACHA_ASSETS_READY = false;
export const CHIBI_GACHA_LAYER_ATLAS = 'dressup/chibi/chibi_layers_atlas.webp';
export const CHIBI_GACHA_ICON_ATLAS = 'dressup/chibi/chibi_icons_atlas.webp';

const pieces = [
  { id: 'chibi-doctor-coat', name: 'ドクターコートスタイル', category: 'tops', order: 24 },
  { id: 'chibi-cat-hoodie', name: 'ねこフードパーカー', category: 'tops', order: 24 },
  { id: 'chibi-ribbon-cape', name: 'リボンケープセット', category: 'tops', order: 24 },
  { id: 'chibi-airy-wolf', name: 'エアリーウルフ', category: 'hair', order: 29 },
  { id: 'chibi-sheer-mash', name: 'シースルーマッシュ', category: 'hair', order: 29 },
  { id: 'chibi-soft-updo', name: 'ゆるまとめヘア', category: 'hair', order: 29 },
  { id: 'chibi-soft-eyes', name: 'やさしい瞳', category: 'eyes', order: 31 },
  { id: 'chibi-star-eyes', name: '星きらめきアイ', category: 'eyes', order: 31 },
  { id: 'chibi-sleepy-eyes', name: 'とろみスリープアイ', category: 'eyes', order: 31 },
  { id: 'chibi-cat-headphones', name: 'ねこみみヘッドホン', category: 'hats', order: 35 },
  { id: 'chibi-capsule-pins', name: 'カプセルヘアピンセット', category: 'accessories', order: 36 },
  { id: 'chibi-nurse-beret', name: 'ナースベレー帽', category: 'hats', order: 35 },
] as const;

export const CHIBI_GACHA_IDS: readonly string[] = pieces.map(piece => piece.id);
export function isChibiGachaItem(id: string) {
  return CHIBI_GACHA_IDS.includes(id);
}

export const CHIBI_GACHA_ITEMS = pieces.map((piece, atlasIndex) => ({
  id: piece.id,
  name: piece.name,
  category: piece.category,
  supportedForms: ['mature'] as const,
  previewAtlasIndex: atlasIndex,
  layers: [{ image: CHIBI_GACHA_LAYER_ATLAS, atlasIndex, order: piece.order }],
}));
