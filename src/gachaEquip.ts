import { APPEARANCE_KEY, DEFAULT_APPEARANCE, FormId, ITEMS, equipmentForForm, parseAppearance, saveFormEquipment, selectedForm } from './appearance';
import { readRewards } from './rewardLedger';
import { readRoom } from './interior';
import { trialEquipment } from './gachaTryOn';
import { withStorageLock } from './storageLock';

/** Only real ownership can cross from a preview into the saved outfit. */
export async function equipGachaPrize(itemId: string, expectedForm: FormId, level: number, testMode: boolean) {
  if (testMode) throw new Error('テスト中は保存できません。');
  return withStorageLock(() => {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    const current = raw === null ? DEFAULT_APPEARANCE : parseAppearance(JSON.parse(raw));
    const form = selectedForm(current, level, readRoom().selectedFormId);
    const item = ITEMS.find(candidate => candidate.id === itemId);
    if (form.id !== expectedForm || !item?.supportedForms.includes(form.id))
      throw new Error('現在のフォルムでは着用できません。');
    if (!readRewards().ownedItemIds.includes(itemId)) throw new Error('正式な所持状態を確認できません。');
    const equipped = trialEquipment(equipmentForForm(current, form.id), item, form.id)!;
    const next = saveFormEquipment(current, form.id, equipped);
    const serialized = JSON.stringify(next);
    localStorage.setItem(APPEARANCE_KEY, serialized);
    if (localStorage.getItem(APPEARANCE_KEY) !== serialized) throw new Error('コーデの保存を確認できませんでした。');
    return next;
  });
}
