import type { BackupData } from './BackupExport';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export function parseBackup(text: string): BackupData {
  if (text.length > 2_000_000) throw new Error('ファイルが大きすぎます（最大2MB）。');
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('JSON形式のファイルではありません。'); }
  if (!object(raw) || raw.version !== 1 || typeof raw.exportedAt !== 'string' ||
      !Array.isArray(raw.checkins) || !object(raw.diary) || !object(raw.medication) ||
      !object(raw.steps) || !object(raw.meditation)) {
    throw new Error('対応していないバックアップ形式です。');
  }
  if (raw.checkins.length > 20000 || Object.keys(raw.diary).length > 20000 ||
      Object.keys(raw.steps).length > 20000 || Object.keys(raw.meditation).length > 20000) {
    throw new Error('記録件数が上限を超えています。');
  }
  if (!raw.checkins.every(v => typeof v === 'string' && datePattern.test(v))) throw new Error('チェックイン記録が不正です。');
  for (const [day, entry] of Object.entries(raw.diary)) {
    if (!datePattern.test(day) || !object(entry) ||
        !(entry.mood === null || (typeof entry.mood === 'number' && Number.isInteger(entry.mood) && entry.mood >= 1 && entry.mood <= 5)) ||
        typeof entry.text !== 'string' || entry.text.length > 2000) throw new Error('日記データが不正です。');
  }
  for (const [day, steps] of Object.entries(raw.steps)) {
    if (!datePattern.test(day) || typeof steps !== 'number' || !Number.isInteger(steps) || steps < 0 || steps > 100000) throw new Error('歩数データが不正です。');
  }
  for (const [day, done] of Object.entries(raw.meditation)) {
    if (!datePattern.test(day) || typeof done !== 'boolean') throw new Error('瞑想データが不正です。');
  }
  if (!Array.isArray(raw.medication.medicines) || !object(raw.medication.taken) ||
      raw.medication.medicines.length > 1000 || Object.keys(raw.medication.taken).length > 200000) {
    throw new Error('服薬データが不正です。');
  }
  if (!raw.medication.medicines.every((m: unknown) => object(m) &&
      typeof m.id === 'string' && m.id.length > 0 && m.id.length <= 150 &&
      typeof m.name === 'string' && m.name.length <= 80 &&
      typeof m.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(m.time))) {
    throw new Error('お薬の登録情報が不正です。');
  }
  if (!Object.entries(raw.medication.taken).every(([key, value]) =>
      /^\d{4}-\d{2}-\d{2}\|[^|]+$/.test(key) && value === true)) {
    throw new Error('服薬チェックの情報が不正です。');
  }
  return raw as unknown as BackupData;
}

export function restoreBackup(backup: BackupData): void {
  const keys = ['kokoro-checkins-v1', 'kokoro-diary-v1', 'kokoro-medication-v1', 'kokoro-steps-v1', 'kokoro-meditation-v1'];
  const values = [backup.checkins, backup.diary, backup.medication, backup.steps, backup.meditation];
  let previous: Array<string | null>;
  try {
    previous = keys.map(key => localStorage.getItem(key));
  } catch {
    throw new Error('保存領域にアクセスできません。ブラウザ設定をご確認ください。');
  }
  try {
    keys.forEach((key, i) => localStorage.setItem(key, JSON.stringify(values[i])));
  } catch {
    keys.forEach((key, i) => {
      try {
        if (previous[i] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, previous[i] as string);
      } catch { /* best-effort rollback */ }
    });
    throw new Error('保存できませんでした。端末の空き容量やブラウザ設定をご確認ください。');
  }
}
