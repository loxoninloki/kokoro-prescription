import { countRecordDays } from './recordDays';
import { evolutionFromXp, XP_PER_LEVEL } from './evolution';
import { stepsExperience, encouragement } from './StepTracker';
import { diaryExperience } from './DiaryCalendar';
import { medicationExperience, doseKey } from './MedicationTracker';
import { meditationExperience } from './Meditation';

describe('ろきちゃんの成長', () => {
  test('レベルとフォルムの境界', () => {
    expect(evolutionFromXp(0)).toMatchObject({ level: 1, form: { id: 'tablet', name: '錠剤フォルム' } });
    expect(evolutionFromXp(9 * XP_PER_LEVEL)).toMatchObject({ level: 10, form: { id: 'development', name: '発育フォルム' } });
    expect(evolutionFromXp(19 * XP_PER_LEVEL)).toMatchObject({ level: 20, form: { id: 'birth', name: '誕生フォルム' } });
    expect(evolutionFromXp(29 * XP_PER_LEVEL)).toMatchObject({ level: 30, form: { id: 'growth', name: '成長フォルム' } });
    expect(evolutionFromXp(49 * XP_PER_LEVEL)).toMatchObject({ level: 50, form: { id: 'mature', name: '成熟フォルム' } });
  });
  test('不正な経験値を安全に扱う', () => {
    expect(evolutionFromXp(-100).level).toBe(1);
    expect(evolutionFromXp(Number.NaN).level).toBe(1);
  });
});

describe('日々の記録', () => {
  test('歩数の経験値は段階式で編集しても一日分だけ', () => {
    expect(stepsExperience({ '2026-11-06': 0 })).toBe(0);
    expect(stepsExperience({ '2026-11-06': 1000 })).toBe(5);
    expect(stepsExperience({ '2026-11-06': 3000 })).toBe(15);
    expect(stepsExperience({ '2026-11-06': 5000 })).toBe(30);
  });
  test('休む日のメッセージは責めない', () => {
    expect(encouragement(0)).toContain('休も');
  });
  test('日記と気分は各日1回分の経験値', () => {
    expect(diaryExperience({ '2026-11-06': { mood: 3, text: '今日の日記' } })).toBe(10);
    expect(diaryExperience({ '2026-11-06': { mood: null, text: '  ' } })).toBe(0);
  });
  test('非表示にしたお薬の過去の経験値は残る', () => {
    expect(medicationExperience({ medicines: [{ id: 'old', name: '以前のお薬', time: '08:00', archived: true }], taken: { '2026-11-06|old': true } })).toBe(10);
  });
  test('服薬チェックの経験値は重複せず登録済み薬だけ', () => {
    const key = doseKey('2026-11-06', 'medicine-1');
    expect(medicationExperience({ medicines: [{ id: 'medicine-1', name: '朝のお薬', time: '08:00' }], taken: { [key]: true, '2026-11-06|unknown': true } })).toBe(10);
  });
});


describe('瞑想の経験値', () => {
  test('1日1回のみ加算される', () => {
    expect(meditationExperience({ '2026-11-06': true })).toBe(10);
    expect(meditationExperience({ '2026-11-06': true, '2026-11-07': true })).toBe(20);
    expect(meditationExperience({ '2026-11-06': false })).toBe(0);
  });
});

test('累計記録日は機能をまたいで同じ日を1回と数え、未来と空欄を除く', () => {
  expect(countRecordDays('2026-11-06', ['2026-11-01', '2026-11-09', '2026-10-32'], {
    '2026-11-01': { mood: 1, text: '同じ日' },
    '2026-11-02': { mood: null, text: ' ' },
    '2026-11-04': { mood: 2, text: '' },
  }, {
    medicines: [{ id: 'med', name: 'お薬', time: '08:00', archived: true }],
    taken: { '2026-11-03|med': true, '2026-11-02|unknown': true },
  }, { '2026-11-01': 1200, '2026-11-05': 0 }, {
    '2026-11-01': true, '2026-11-02': false, '2026-11-06': true,
  })).toBe(5);
});
