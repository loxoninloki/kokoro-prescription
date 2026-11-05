import React, { useState } from 'react';
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

export default function BackupExport(data: Props) {
  const [message, setMessage] = useState('');
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
    <h2>🗂 記録のバックアップ</h2>
    <p style={{ fontSize: 13 }}>チェックイン、日記、気分、お薬、歩数、瞑想の記録をJSONファイルに書き出します。</p>
    <button type="button" onClick={exportBackup} style={{ padding: '12px 20px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>バックアップを書き出す</button>
    <p role="status" style={{ fontSize: 13 }}>{message}</p>
    <p style={{ fontSize: 12, color: '#766b82' }}>このファイルには日記や服薬情報などの個人情報が含まれます。共有せず安全な場所に保管してください。復元機能は準備中です。</p>
  </section>;
}
