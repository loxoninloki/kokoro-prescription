import React, { useState } from 'react';
import { Appearance, CATEGORIES, Category, ITEMS, toggleItem, FormId } from './appearance';
import RokiCharacter from './RokiCharacter';
import WardrobeIcon from './WardrobeIcon';
import { FIRST_GIFT_IDS } from './formFirstGifts';

const GROUPS: { name: string; icon: Category; categories: Category[] }[] = [
  { name: 'ファッション', icon: 'tops', categories: ['tops', 'bottoms', 'shoes'] },
  { name: 'ヘア', icon: 'hair', categories: ['hair'] },
  { name: 'メイク', icon: 'eyes', categories: ['eyes'] },
  { name: 'アクセサリー', icon: 'accessories', categories: ['hats', 'accessories'] },
  { name: 'エフェクト', icon: 'effects', categories: ['effects'] },
];

export default function DressUp({ saved, onSave, rewardDays, draft, setDraft, ownedItemIds, form }: {
  form: {id:FormId;name:string;image:string};
  saved: Appearance;
  draft: Appearance;
  setDraft: React.Dispatch<React.SetStateAction<Appearance>>;
  rewardDays: number;
  ownedItemIds: string[];
  onSave: (appearance: Appearance) => boolean;
}) {
  const [group, setGroup] = useState(4);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  const current = GROUPS[group];
  const details = current.categories.filter(key => ITEMS.some(item => item.category === key));
  const owned = (item: typeof ITEMS[number]) => ownedItemIds.includes(item.id) ||
    saved.equipped.includes(item.id) ||
    (!FIRST_GIFT_IDS.includes(item.id) && rewardDays >= (item.requiredRecordDays ?? 0));
  const items = ITEMS.filter(item => current.categories.includes(item.category) && (!category || item.category === category))
    .slice().sort((a, b) => Number(owned(b)) - Number(owned(a)));
  const dirty = JSON.stringify(draft.equipped) !== JSON.stringify(saved.equipped);

  return <section className="coordinate-page" aria-labelledby="wardrobe-title">
    <header className="coordinate-heading"><h2 id="wardrobe-title">コーデ</h2><span>{dirty ? '編集中' : '保存済み'}</span></header>
    <div className="coordinate-preview">
      <RokiCharacter form={form} size={244} equipped={draft.equipped} />
      <p>{form.name} · タップしてコーデ</p>
    </div>
    <div className="coordinate-tabs" role="group" aria-label="着せ替えカテゴリ">
      {GROUPS.map((entry, index) => <button type="button" key={entry.name} aria-pressed={group === index}
        onClick={() => { setGroup(index); setCategory(null); }}><WardrobeIcon category={entry.icon} /><span>{entry.name}</span></button>)}
    </div>
    <div className="coordinate-details" role="group" aria-label="詳細カテゴリ">
      <button type="button" aria-pressed={!category} onClick={() => setCategory(null)}><WardrobeIcon category={current.icon} />すべて</button>
      {details.map(key => <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>
        <WardrobeIcon category={key} />{CATEGORIES[key].name}</button>)}
    </div>
    <div className="coordinate-inventory" role="region" tabIndex={0} aria-label={`${current.name}のアイテム`}>
      {items.length === 0 ? <div className="coordinate-empty"><WardrobeIcon category={current.icon} />
        <strong>{current.name}のパーツは準備中です</strong><p>初期の姿を表示しています。分離素材が揃うと、この一覧から着せ替えできます。</p></div> :
        <div className="coordinate-grid">{items.map(item => {
          const selected = draft.equipped.includes(item.id);
          const equipped = saved.equipped.includes(item.id);
          const unsupported = !item.supportedForms.includes(form.id);
          const locked = !owned(item) || unsupported;
          return <button type="button" key={item.id} aria-label={item.name} aria-pressed={selected} disabled={locked}
            className="coordinate-item" onClick={() => {
              if (!owned(item) || unsupported) return;
              setDraft(previous => toggleItem(previous, item)); setMessage('');
            }}>
            <span className="coordinate-thumbnail"><img src={`${process.env.PUBLIC_URL}/${item.layers[0].image}`} alt="" loading="lazy"
              onError={event => { event.currentTarget.hidden = true; }} />
              {selected && <span className="coordinate-check" aria-hidden="true">✓</span>}</span>
            <span className="coordinate-item-name">{item.name}</span>
            <small>{unsupported ? 'このフォルムは非対応（位置合わせ素材待ち）' : !owned(item) ? `累計${rewardDays}/${item.requiredRecordDays}日` : selected ? '選択中 ✓' : '所持済み'}{equipped && <b>保存中の装備</b>}</small>
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

