import { FORM_STAGES } from './evolution';
import { FORM_CHOICES } from './appearance';
import { isFormLocked, visibleFormName } from './formVisibility';

describe('未解放フォルムの表示', () => {
  it('レベル到達前は全フォルムが非公開、到達後に名称を表示する', () => {
    for (const form of FORM_CHOICES) {
      expect(isFormLocked(form.level, form.level - 1)).toBe(true);
      expect(visibleFormName(form.name, true)).toBe('？？？');
      expect(isFormLocked(form.level, form.level)).toBe(false);
      expect(visibleFormName(form.name, false)).toBe(form.name);
    }
  });

  it('Lv.1, 10, 20, 30, 50の既存解放条件とヒューマンを維持する', () => {
    expect(FORM_STAGES.map(stage => stage.level)).toEqual([1, 10, 20, 30, 50]);
    expect(FORM_CHOICES.find(form => form.id === 'human')?.level).toBe(50);
    expect(FORM_CHOICES.filter(form => !isFormLocked(form.level, 1)).map(form => form.id)).toEqual(['tablet']);
    expect(FORM_CHOICES.filter(form => !isFormLocked(form.level, 50))).toHaveLength(6);
  });
});
