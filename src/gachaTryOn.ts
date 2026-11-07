import { CATEGORIES, DressUpItem, FormId, ITEMS } from './appearance';
import { INTERIOR_ITEMS, RoomState } from './interior';

/** These draft previews are pure functions: never grant ownership or write to storage. */
export function trialEquipment(current: readonly string[], item: DressUpItem, formId: FormId): string[] | null {
  if (!item.supportedForms.includes(formId)) return null;
  if (current.includes(item.id)) return [...current];
  const otherItems = CATEGORIES[item.category].multiple
    ? [...current]
    : current.filter(id => ITEMS.find(owned => owned.id === id)?.category !== item.category);
  return [...otherItems, item.id];
}

export function trialLayout(current: Readonly<RoomState['layout']>, item: typeof INTERIOR_ITEMS[number]): RoomState['layout'] {
  return { ...current, [item.slot]: item.id };
}
