import React, { useState } from 'react';
import { Appearance, CATEGORIES, Category, ITEMS, toggleItem } from './appearance';
import { MATURE_FORM } from './evolution';
import RokiCharacter from './RokiCharacter';

export default function DressUp({ saved, onSave, rewardDays }: {
  saved: Appearance;
  rewardDays: number;
  onSave: (appearance: Appearance) => boolean;
}) {
  const [draft, setDraft] = useState(saved);
  const [category, setCategory] = useState<Category>('hats');
  const [message, setMessage] = useState('');
  const items = ITEMS.filter(item => item.category === category);

  return <section className="growth-card roki-wardrobe" aria-labelledby="wardrobe-title">
    <h2 id="wardrobe-title">ちびろきの着せ替え</h2>
    <RokiCharacter form={MATURE_FORM} size={244} equipped={draft.equipped} />
    {saved.mode === 'human' && <p>ホームではヒューマンフォルムを表示中です。</p>}
    <div className="wardrobe-options" role="group" aria-label="着せ替えカテゴリ">
      {(Object.keys(CATEGORIES) as Category[]).map(key =>
        <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>
          {CATEGORIES[key].name}
        </button>)}
    </div>
    <div className="wardrobe-options" role="group" aria-label={`${CATEGORIES[category].name}のアイテム`}>
      {items.length === 0 && <p>初期装備を表示しています。このカテゴリの着せ替え素材は準備中です。</p>}
      {items.map(item => {
        const requiredDays = item.requiredRecordDays ?? 0;
        const locked = rewardDays < requiredDays;
        return <button type="button" key={item.id} aria-pressed={draft.equipped.includes(item.id)}
          disabled={locked}
          onClick={() => { setDraft(previous => toggleItem(previous, item)); setMessage(''); }}>
          <img src={`${process.env.PUBLIC_URL}/${item.layers[0].image}`} alt="" width={36} height={36} />
          <span>{item.name}{locked && <small className="wardrobe-lock">累計 {rewardDays} / {requiredDays}日</small>}</span>
        </button>;
      })}
    </div>
    <div className="wardrobe-options">
      <button type="button" disabled={draft.equipped.length === 0} onClick={() => {
        setDraft(previous => ({ ...previous, equipped: [] }));
        setMessage('初期装備をプレビューしています。変更を確定するには保存してください。');
      }}>初期装備に戻す</button>
      <button className="wardrobe-save" type="button" onClick={() => {
        setMessage(onSave(draft) ? 'コーデを保存しました。' : 'コーデを保存できませんでした。端末の保存設定をご確認ください。');
      }}>コーデを保存</button>
    </div>
    <p role="status">{message}</p>
  </section>;
}
