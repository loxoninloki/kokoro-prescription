import { APPEARANCE_KEY, readAppearance } from './appearance';
import { parseBackup, restoreBackup } from './BackupRestore';
import { makeBackup } from './BackupExport';

const sample = () => makeBackup({
  checkins: ['2026-11-06'],
  diary: { '2026-11-06': { mood: 4, text: '穏やかな日' } },
  medication: { medicines: [{ id: 'med-1', name: '朝のお薬', time: '08:00' }], taken: { '2026-11-06|med-1': true } },
  steps: { '2026-11-06': 1200 },
  meditation: { '2026-11-06': true },
});

describe('バックアップ復元', () => {
  beforeEach(() => localStorage.clear());

  test('書き出した記録を読み込み、保存できる', () => {
    const backup = parseBackup(JSON.stringify(sample()));
    restoreBackup(backup);
    expect(JSON.parse(localStorage.getItem('kokoro-diary-v1') || '{}')['2026-11-06'].text).toBe('穏やかな日');
    expect(JSON.parse(localStorage.getItem('kokoro-steps-v1') || '{}')['2026-11-06']).toBe(1200);
    expect(JSON.parse(localStorage.getItem('kokoro-medication-v1') || '{}').taken['2026-11-06|med-1']).toBe(true);
  });

  test('コーデを復元し、旧バックアップでは現在のコーデを保持する', () => {
    const appearance = { version: 1, mode: 'human', equipped: ['moon-sparkles'] };
    restoreBackup(parseBackup(JSON.stringify({ ...sample(), appearance })));
    expect(readAppearance()).toEqual(appearance);
    restoreBackup(parseBackup(JSON.stringify(sample())));
    expect(readAppearance()).toEqual(appearance);
  });

  test('古いコーデの復元でも報酬の到達日数を保持する', () => {
    const appearance = { version: 1, mode: 'chibi', equipped: ['moon-sparkles'] };
    restoreBackup(parseBackup(JSON.stringify({ ...sample(), appearance: { ...appearance, rewardDays: 30 } })));
    restoreBackup(parseBackup(JSON.stringify({ ...sample(), appearance: { ...appearance, rewardDays: 5 } })));
    expect(readAppearance()).toEqual({ ...appearance, rewardDays: 30 });
  });

  test('不正なコーデを拒否し、壊れた保存値で起動できる', () => {
    const appearance = { version: 1, mode: 'human', equipped: ['../invalid'] };
    expect(() => parseBackup(JSON.stringify({ ...sample(), appearance }))).toThrow();
    localStorage.setItem(APPEARANCE_KEY, '{broken');
    expect(readAppearance()).toEqual({ version: 1, mode: 'chibi', equipped: [] });
    expect(localStorage.getItem(APPEARANCE_KEY)).toBe('{broken');
  });

  test('破損ファイルや未知のバージョンを拒否する', () => {
    expect(() => parseBackup('{broken')).toThrow();
    expect(() => parseBackup(JSON.stringify({ ...sample(), version: 999 }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ ...sample(), steps: { '2026-11-06': -1 } }))).toThrow();
  });

  test('書き込み失敗時は元の記録を戻す', () => {
    localStorage.setItem('kokoro-checkins-v1', '["old"]');
    localStorage.setItem('kokoro-diary-v1', '{"old":true}');
    const original = Storage.prototype.setItem;
    let failures = 0;
    const mock = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key: string, value: string) {
      if (key === 'kokoro-medication-v1' && failures++ === 0) throw new Error('quota');
      original.call(localStorage, key, value);
    });
    try {
      expect(() => restoreBackup(sample())).toThrow();
      expect(localStorage.getItem('kokoro-checkins-v1')).toBe('["old"]');
      expect(localStorage.getItem('kokoro-diary-v1')).toBe('{"old":true}');
    } finally {
      mock.mockRestore();
    }
  });
});
