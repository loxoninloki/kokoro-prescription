import React from 'react';
import { FormId, ITEMS } from './appearance';
import { INTERIOR_ITEMS, RoomState } from './interior';
import RokiCharacter from './RokiCharacter';
import RoomStage from './RoomStage';
import { trialEquipment, trialLayout } from './gachaTryOn';

type Form = { id: FormId; name: string; image: string };
type Props = { itemId: string; form: Form; equipped: readonly string[]; roomLayout: Readonly<RoomState['layout']>; applied: boolean };

export default function GachaTryOn({ itemId, form, equipped, roomLayout, applied }: Props) {
  const garment = ITEMS.find(item => item.id === itemId);
  if (garment) {
    const withGarment = trialEquipment(equipped, garment, form.id);
    const unsupported = withGarment === null;
    return <>
      <div className="gacha-tryon-stage gacha-tryon-character" role="group"
        aria-label={applied && !unsupported ? '試着中のろきちゃん' : '保存中のろきちゃん'}>
        <RokiCharacter key={form.image} form={form} size={220}
          equipped={applied && withGarment ? withGarment : [...equipped]} />
      </div>
      {unsupported && <p className="gacha-tryon-unsupported" role="status">
        この衣装は現在のフォルムに対応していません。対応する姿に進化してから試着できます。
        アイテム単体の画像はひとつ前の画面で確認できます。
      </p>}
    </>;
  }

  const furnishing = INTERIOR_ITEMS.find(item => item.id === itemId);
  if (furnishing) {
    return <div className="gacha-tryon-stage gacha-tryon-room" role="group"
      aria-label={applied ? '仮配置中のルーム' : '保存済みのルーム'}>
      <RoomStage layout={applied ? trialLayout(roomLayout, furnishing) : { ...roomLayout }}
        form={form} equipped={[...equipped]} animated={false} />
    </div>;
  }

  return <p role="status">このアイテムは現在お試しできません。</p>;
}

export function canTryOn(itemId: string, formId: FormId): boolean {
  const garment = ITEMS.find(item => item.id === itemId);
  if (garment) return garment.supportedForms.includes(formId);
  return INTERIOR_ITEMS.some(item => item.id === itemId);
}
