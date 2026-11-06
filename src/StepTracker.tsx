import { Capacitor } from '@capacitor/core';
import { Icon } from './Icon';
import React, { useEffect, useState } from 'react';

export type StepEntries = Record<string, number>;
const KEY = 'kokoro-steps-v1';

export type StepImport = { day: string; count: number };

export function parseStepImport(params: URLSearchParams, today: string): StepImport | null {
  const day = params.get('date') ?? today;
  const value = params.get('steps') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > today || !/^\d{1,6}$/.test(value)) return null;
  const date = new Date(day + 'T00:00:00Z');
  const count = Number(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day || count > 100000) return null;
  return { day, count };
}

export function readSteps(): StepEntries {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const result: StepEntries = {};
    for (const [day, count] of Object.entries(raw)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= 100000) result[day] = count;
    }
    return result;
  } catch { return {}; }
}

export function stepsExperience(entries: StepEntries): number {
  return Object.values(entries).reduce((total, steps) =>
    total + (steps >= 1000 ? 5 : 0) + (steps >= 3000 ? 10 : 0) + (steps >= 5000 ? 15 : 0), 0);
}

export function encouragement(steps: number | undefined): string {
  if (steps === undefined) return '歩数を記録したら、ろきちゃんが応援します。';
  if (steps === 0) return '今日はゆっくり休も。休む日も大切だよ。';
  if (steps >= 5000) return 'たくさん歩いたね！頑張ったね。ゆっくり休んでね。';
  if (steps >= 3000) return 'いっぱい歩けたね！お疲れさま。';
  if (steps >= 1000) return '今日も歩けたね。えらいよ！';
  return '少しでも歩けたね。自分のペースで大丈夫だよ。';
}

interface Props {
  entries: StepEntries;
  setEntries: React.Dispatch<React.SetStateAction<StepEntries>>;
  today: string;
  incoming: StepImport | 'invalid' | null;
  clearIncoming: () => void;
}

export default function StepTracker({ entries, setEntries, today, incoming, clearIncoming }: Props) {
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(entries[selected] === undefined ? '' : String(entries[selected]));
  }, [selected, entries]);

  const [storageError, setStorageError] = useState(false);

  const persist = (day: string, count: number) => {
    const updated = { ...entries, ...readSteps(), [day]: count };
    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      setStorageError(true);
      setSaved(false);
      return false;
    }
    setEntries(updated);
    setStorageError(false);
    setSaved(true);
    return true;
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const record = parseStepImport(new URLSearchParams({ date: selected, steps: draft }), today);
    if (record) persist(record.day, record.count);
  };

  const confirmImport = (record: StepImport) => {
    if (!persist(record.day, record.count)) return;
    setSelected(record.day);
    clearIncoming();
  };

  return (
    <section style={{ marginTop: 26, padding: 18, borderRadius: 24, background: '#f4efff' }}>
      <h2><Icon name="steps" /> 今日の歩数</h2>
      <p className="step-count">{entries[today] === undefined ? '未記録' : `${entries[today].toLocaleString()} 歩`}</p>
      {Capacitor.isNativePlatform() ? (
        <p style={{ fontSize: 13 }}>この試作版では、iPhoneのヘルスケアで確認した歩数を手入力できます。</p>
      ) : <>
        <p style={{ fontSize: 13 }}>初回設定のあとは、ショートカットを開いて今日の歩数を保存できます。</p>
        <p><a href={`shortcuts://run-shortcut?name=${encodeURIComponent('こころの歩数')}`}>iPhoneから歩数を取り込む</a></p>
      </>}
      {incoming === 'invalid' && <p role="alert">歩数を取り込めませんでした。ショートカットの日付と歩数をご確認ください。</p>}
      {incoming && incoming !== 'invalid' && (
        <div className="diary-entry">
          <p>{incoming.day} の歩数を受け取りました。<strong>{incoming.count.toLocaleString()} 歩</strong></p>
          {entries[incoming.day] !== undefined && <p>この日の記録（{entries[incoming.day].toLocaleString()} 歩）を置き換えます。</p>}
          <button type="button" onClick={() => confirmImport(incoming)}>この歩数を保存</button>
          {' '}
          <button type="button" onClick={clearIncoming}>キャンセル</button>
        </div>
      )}
      {!Capacitor.isNativePlatform() && (
        <details style={{ marginBottom: 14, fontSize: 13 }}>
          <summary>初回だけ · ショートカットを作る</summary>
          <p>「ショートカット」アプリで、<strong>こころの歩数</strong>という名前で作ります。すでに作った方は、同じショートカットを開いて編集してください。</p>
          <p><a href="shortcuts://create-shortcut">ショートカット作成画面を開く</a></p>
  
          <h3>歩数を取得する</h3>
          <ol>
            <li>「ヘルスケアサンプルを検索」を追加し、種類を「歩数（Steps）」、開始日を「今日である」、グループ分けを「日」にします。iPhoneだけの歩数を取り込む場合は、ソースをiPhoneに絞ります。</li>
            <li>「ヘルスケアサンプルの詳細を取得」を追加し、検索したサンプルから「値」を取得します。</li>
          </ol>
          <figure style={{ margin: '12px 0' }}>
            <figcaption>完成イメージ① · 歩数の検索と「値」の取得</figcaption>
            <img src={`${process.env.PUBLIC_URL}/step-guide/search.webp`} alt="歩数を今日の日付で検索し、日ごとにグループ分けして値を取得する画面" width="800" height="1279" loading="lazy" style={{ width: '100%', maxWidth: 420, height: 'auto', borderRadius: 10 }} />
          </figure>
  
          <h3>日付を整えてアプリに送る</h3>
          <ol start={3}>
            <li>「日付」アクションを追加し、青い項目を「現在の日付」にします。</li>
            <li>「日付をフォーマット」を追加し、入力に手順3の「日付」を選びます。青い矢印で詳細を開き、日付の形式を「カスタム」、書式を <code>yyyy-MM-dd</code> にします。</li>
            <li>最後に「URLを開く」を追加します。下のURLを貼り、末尾に手順2の青い「値」を入れます。その直後に <code>&amp;date=</code> と入力し、続けて青い「フォーマット済みの日付」を入れます。</li>
          </ol>
          <input aria-label="ショートカットに貼るURL" readOnly value={window.location.origin + window.location.pathname + '#steps='} onFocus={event => event.currentTarget.select()} style={{ width: '100%' }} />
          <p>URLの末尾は <code style={{ overflowWrap: 'anywhere' }}>#steps=［値］&amp;date=［フォーマット済みの日付］</code> の並びです。角括弧の部分には青い変数を入れます。</p>
          <figure style={{ margin: '12px 0' }}>
            <figcaption>完成イメージ② · 日付を整えて「URLを開く」まで</figcaption>
            <img src={`${process.env.PUBLIC_URL}/step-guide/date.webp`} alt="値の取得、現在の日付、日付の書式設定、URLを開くの順に並んだ画面" width="800" height="889" loading="lazy" style={{ width: '100%', maxWidth: 420, height: 'auto', borderRadius: 10 }} />
            <p>画像の青い「値」と「フォーマット済みの日付」の間に、<strong><code>&amp;date=</code></strong> を入れて完成です。</p>
          </figure>
  
          <h3>実行して保存する</h3>
          <ol start={6}>
            <li>右下の「▶︎」で実行します。初回はヘルスケアの歩数の読み取りを許可してください。</li>
            <li>「こころの処方箋」が開いたら、日付と歩数を確認して「この歩数を保存」を押します。次回からは歩数画面の「iPhoneから歩数を取り込む」で起動できます。</li>
          </ol>
          <p>日付を送らない設定では、歩数は今日の分として取り込まれます。過去の歩数を送る場合は、検索対象の日と送る日付を同じ日にしてください。</p>
        </details>
      )}
      <form onSubmit={save} style={{ display: 'grid', gap: 12 }}>
        <label>記録する日
          <input type="date" value={selected} max={today} onChange={event => { setSelected(event.target.value); setSaved(false); }} required style={{ display: 'block', marginTop: 6, padding: 10 }} />
        </label>
        <label>歩数
          <input type="number" inputMode="numeric" min={0} max={100000} step={1} required value={draft}
            onChange={event => { setDraft(event.target.value); setSaved(false); }}
            placeholder="0" style={{ display: 'block', boxSizing: 'border-box', width: '100%', padding: 12, marginTop: 6, borderRadius: 10, border: '1px solid #c9b9dc' }} />
        </label>
        <button type="submit" style={{ padding: 12, border: 0, borderRadius: 20, color: '#fff', background: '#7653a6' }}>歩数を保存</button>
      </form>
      <p role="status" style={{ fontWeight: 600, marginTop: 16 }}>{encouragement(entries[selected])}</p>
      {saved && !storageError && <p>歩数を保存しました 💜</p>}
      <p style={{ fontSize: 12, color: '#766b82' }}>0歩でも大丈夫。経験値は1,000歩で+5、3,000歩で合計+15、5,000歩で合計+30。歩数の編集で重複加算されません。</p>
      {storageError && <p role="alert">端末に保存できませんでした。空き容量やブラウザの設定をご確認ください。</p>}
    </section>
  );
}
