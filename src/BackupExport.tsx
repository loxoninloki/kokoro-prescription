import { RoomState, readRoom } from './interior';
import { RewardState, readRewards } from './rewardLedger';
import { Icon } from './Icon';
import React, { useState } from 'react';
import type { Appearance } from './appearance';
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
  room?: RoomState;
  rewards?: RewardState;
  appearance?: Appearance;
}

interface Props {
  checkins: string[];
  diary: DiaryEntries;
  medication: MedicationData;
  steps: StepEntries;
  meditation: MeditationEntries;
  appearance?: Appearance;
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
    appearance: data.appearance,
    room: readRoom(),
    rewards: readRewards(),
  };
}

export default function BackupExport(data: Props) {
  const [message, setMessage] = useState('');
  const [restoring, setRestoring] = useState(false);
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
    <p style={{ fontSize: 13 }}>チェックイン、日記、気分、お薬、歩数、瞑想の記録、コーデ、ルーム、累積ログイン報酬をJSONファイルに書き出します。</p>
    <button type="button" onClick={exportBackup} style={{ padding: '12px 20px', borderRadius: 22, border: 0, color: '#fff', background: '#7653a6' }}>バックアップを書き出す</button>
    <label style={{ display: 'block', marginTop: 18 }}>
      バックアップから復元
      <input type="file" accept=".json,application/json" disabled={restoring}
        onChange={event => { void importBackup(event.target.files?.[0]); event.target.value = ''; }}
        style={{ display: 'block', marginTop: 8, maxWidth: '100%' }} />
    </label>
    <p role="status" style={{ fontSize: 13 }}>{message}</p>
    <p style={{ fontSize: 12, color: '#766b82' }}>このファイルには日記や服薬情報などの個人情報が含まれます。共有せず安全な場所に保管してください。復元すると現在の記録を上書きします。復元前に現在の記録もバックアップしてください。</p>
  </section>;
}
