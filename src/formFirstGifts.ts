import { FormId, FORM_CHOICES, ITEMS } from './appearance';

/** One guaranteed commemorative outfit effect per unlocked evolution form. */
export const FORM_FIRST_GIFTS: Readonly<Partial<Record<FormId, string>>> = {
  development: 'growth-gift-development',
  birth: 'growth-gift-birth',
  growth: 'growth-gift-growth',
  mature: 'growth-gift-mature',
  human: 'growth-gift-human',
};

export const FIRST_GIFT_IDS = Object.values(FORM_FIRST_GIFTS).filter((id): id is string => !!id);

export function giftForForm(id: FormId, level: number) {
  const form = FORM_CHOICES.find(candidate => candidate.id === id && candidate.level <= level);
  if (!form) return null;
  const itemId = FORM_FIRST_GIFTS[id];
  if (!itemId) return null;
  const item = ITEMS.find(candidate => candidate.id === itemId && candidate.supportedForms.includes(id));
  return item ? { item, form } : null;
}
