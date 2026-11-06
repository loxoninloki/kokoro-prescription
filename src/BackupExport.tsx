import { Icon } from './Icon';
import React, { useRef, useState } from 'react';
import { parseBackup, restoreBackup } from './BackupRestore';
import type { DiaryEntries } from './DiaryCalendar';
import type { MedicationData } from './MedicationTracker';
import type { StepEntries } from './StepTracker';
import type { MeditationEntries } from './Meditation';

export interface BackupData {
  version: 1;
  exportedAt: string;
  checkins: string[];
  diary: DiaryEntries;
  medication: MedicationData;
  steps: StepEntries;
  meditation: MeditationEntries;
}

interface Props {
  checkins: string[];
  diary: DiaryEntries;
  medication: MedicationData;
  steps: StepEntries;
  meditation: MeditationEntries;
}

export function makeBackup(data: Props): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    checkins: data.checkins,
    diary: data.diary,
    medication: data.medication,
    steps: data.steps,
    meditation: data.meditation,
  };
}

const QR_URL = 'https://kokoro-prescription-preview.pages.dev/';

export default function BackupExport(data: Props) {
  const [message, setMessage] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const shareInput = useRef<HTMLInputElement>(null);
  const shareUrl = window.location.origin + window.location.pathname;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('紹介リンクをコピーしました。');
    } catch {
      shareInput.current?.focus();
      shareInput.current?.select();
      setShareMessage('表示されたURLを長押ししてコピーしてください。');
    }
  };

  const shareApp = async () => {
    setShareMessage('');
    try {
      await navigator.share({
        title: 'こころの処方箋',
        text: '気分や日記を記録できる「こころの処方箋」です。リンクを開いて使ってみてください。',
        url: shareUrl,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setShareMessage('共有メニューを開けませんでした。「リンクをコピー」をお使いください。');
      }
    }
  };

  const importBackup = async (file?: File) => {
    if (!file) return;
    setMessage('');
    if (file.size > 2000000) {
      setMessage('ファイルが大きすぎます。');
      return;
    }
    setRestoring(true);
    try {
      const backup = parseBackup(await file.text());
      const confirmed = window.confirm('現在の記録が上書きされます。復元しますか？');
      if (!confirmed) return;
      restoreBackup(backup);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '復元に失敗しました。');
    } finally {
      setRestoring(false);
    }
  };
  const exportBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(makeBackup(data), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kokoro-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('バックアップファイルの保存を開始しました。iPhoneの「ファイル」アプリ等で保存先をご確認ください。');
    } catch {
      setMessage('書き出しに失敗しました。ブラウザの空き容量や設定をご確認ください。');
    }
  };
  return <section style={{ marginTop: 26, padding: 18, borderRadius: 24, background: '#f7f3ff' }}>
    <h2><Icon name="backup" /> 記録のバックアップ</h2>
    <p style={{ fontSize: 13 }}>チェックイン、日記、気分、お薬、歩数、瞑想の記録をJSONファイルに書き出します。</p>
    <button type="button" onClick={exportBackup} style={{ padding: '12px 20px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>バックアップを書き出す</button>
    <label style={{ display: 'block', marginTop: 18 }}>
      バックアップから復元
      <input type="file" accept=".json,application/json" disabled={restoring}
        onChange={event => { void importBackup(event.target.files?.[0]); event.target.value = ''; }}
        style={{ display: 'block', marginTop: 8, maxWidth: '100%' }} />
    </label>
    <p role="status" style={{ fontSize: 13 }}>{message}</p>
    <p style={{ fontSize: 12, color: '#766b82' }}>このファイルには日記や服薬情報などの個人情報が含まれます。共有せず安全な場所に保管してください。復元すると現在の記録を上書きします。復元前に現在の記録もバックアップしてください。</p>
    <section className="diary-entry" aria-labelledby="app-invite-title" style={{ marginTop: 20 }}>
      <h3 id="app-invite-title">こころの処方箋を紹介する</h3>
      <p>相手はリンクを開くだけで、自分の記録を始められます。</p>
      <input ref={shareInput} aria-label="紹介リンク" value={shareUrl} readOnly
        onFocus={event => event.currentTarget.select()} style={{ width: '100%' }} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {typeof navigator.share === 'function' && <button type="button" onClick={shareApp}>アプリを紹介する</button>}
        <button type="button" onClick={copyLink}>リンクをコピー</button>
      </div>
      {shareUrl === QR_URL && <details style={{ marginTop: 12 }}>
        <summary>QRコードで紹介する</summary>
        <p>相手のスマホのカメラで読み取ってもらってください。</p>
        <img src={`${process.env.PUBLIC_URL}/app-invite-qr.svg`} alt="こころの処方箋を開くQRコード"
          width="216" height="216" loading="lazy" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </details>}
      <p role="status" style={{ fontSize: 13 }}>{shareMessage}</p>
    </section>
  </section>;
}
