import React, { useState } from 'react';
import { Appearance, CATEGORIES, Category, ITEMS, toggleItem } from './appearance';
import { MATURE_FORM } from './evolution';
import RokiCharacter from './RokiCharacter';
import WardrobeIcon from './WardrobeIcon';

const GROUPS: { name: string; icon: Category; categories: Category[] }[] = [
  { name: 'ファッション', icon: 'tops', categories: ['tops', 'bottoms', 'shoes'] },
  { name: 'ヘア', icon: 'hair', categories: ['hair'] },
  { name: 'メイク', icon: 'eyes', categories: ['eyes'] },
  { name: 'アクセサリー', icon: 'accessories', categories: ['hats', 'accessories'] },
  { name: 'エフェクト', icon: 'effects', categories: ['effects'] },
];

export default function DressUp({ saved, onSave, rewardDays, draft, setDraft, ownedItemIds }: {
  saved: Appearance;
  draft: Appearance;
  setDraft: React.Dispatch<React.SetStateAction<Appearance>>;
  rewardDays: number;
  ownedItemIds: string[];
  onSave: (appearance: Appearance) => boolean;
}) {
  const [group, setGroup] = useState(3);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  const current = GROUPS[group];
  const details = current.categories.filter(key => ITEMS.some(item => item.category === key));
  const owned = (item: typeof ITEMS[number]) => ownedItemIds.includes(item.id) ||
    rewardDays >= (item.requiredRecordDays ?? 0) || saved.equipped.includes(item.id);
  const items = ITEMS.filter(item => current.categories.includes(item.category) && (!category || item.category === category))
    .slice().sort((a, b) => Number(owned(b)) - Number(owned(a)));
  const dirty = JSON.stringify(draft.equipped) !== JSON.stringify(saved.equipped);

  return <section className="coordinate-page" aria-labelledby="wardrobe-title">
    <header className="coordinate-heading"><h2 id="wardrobe-title">ちびろきの着せ替え</h2><span>{dirty ? '編集中' : '保存済み'}</span></header>
    <div className="coordinate-preview">
      <RokiCharacter form={MATURE_FORM} size={244} equipped={draft.equipped} />
      <p>{saved.mode === 'human' ? 'ホームはヒューマン表示中です' : 'アイテムをタップして、自由にコーデ'}</p>
    </div>
    <div className="coordinate-tabs" role="group" aria-label="着せ替えカテゴリ">
      {GROUPS.map((entry, index) => <button type="button" key={entry.name} aria-pressed={group === index}
        onClick={() => { setGroup(index); setCategory(null); }}><WardrobeIcon category={entry.icon} /><span>{entry.name}</span></button>)}
    </div>
    <div className="coordinate-details" role="group" aria-label="詳細カテゴリ">
      <button type="button" aria-pressed={!category} onClick={() => setCategory(null)}><span aria-hidden="true">▦</span>すべて</button>
      {details.map(key => <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>
        <WardrobeIcon category={key} />{CATEGORIES[key].name}</button>)}
    </div>
    <div className="coordinate-inventory" aria-label={`${current.name}のアイテム`}>
      {items.length === 0 ? <div className="coordinate-empty"><WardrobeIcon category={current.icon} />
        <strong>{current.name}のパーツは準備中です</strong><p>初期の姿を表示しています。分離素材が揃うと、この一覧から着せ替えできます。</p></div> :
        <div className="coordinate-grid">{items.map(item => {
          const selected = draft.equipped.includes(item.id);
          const equipped = saved.equipped.includes(item.id);
          const locked = !owned(item);
          return <button type="button" key={item.id} aria-label={item.name} aria-pressed={selected} disabled={locked}
            className="coordinate-item" onClick={() => {
              if (!owned(item)) return;
              setDraft(previous => toggleItem(previous, item)); setMessage('');
            }}>
            <span className="coordinate-thumbnail"><img src={`${process.env.PUBLIC_URL}/${item.layers[0].image}`} alt="" loading="lazy"
              onError={event => { event.currentTarget.hidden = true; }} />
              {selected && <span className="coordinate-check" aria-hidden="true">✓</span>}</span>
            <span className="coordinate-item-name">{item.name}</span>
            <small>{locked ? `累計${rewardDays}/${item.requiredRecordDays}日` : selected ? '選択中・タップで外す' : equipped ? '装備中' : '所持済み'}</small>
          </button>;
        })}</div>}
    </div>
    <footer className="coordinate-controls">
      <p role="status">{message || (dirty ? '変更はまだ保存されていません' : '保存したコーデはホーム・ルームにも反映されます')}</p>
      <div><button type="button" disabled={!draft.equipped.length} onClick={() => {
        setDraft(previous => ({ ...previous, equipped: [] })); setMessage('初期装備をプレビュー中です');
      }}>初期装備に戻す</button>
      <button className="coordinate-save" type="button" onClick={() => {
        setMessage(onSave(draft) ? 'コーデを保存しました。' : '保存できませんでした。端末の保存設定をご確認ください。');
      }}>コーデを保存</button>
      <button type="button" disabled={!dirty} onClick={() => {
        setDraft({ ...saved, equipped: [...saved.equipped] }); setMessage('保存済みのコーデに戻しました');
      }}>リセット</button></div>
    </footer>
  </section>;
}
