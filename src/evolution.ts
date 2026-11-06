export const FORM_STAGES = [
  { id: 'tablet', level: 1, name: '錠剤フォルム', image: 'lv1_tablet.webp' },
  { id: 'development', level: 10, name: '発育フォルム', image: 'lv10_birth.webp' },
  { id: 'birth', level: 20, name: '誕生フォルム', image: 'lv20_awake.webp' },
  { id: 'growth', level: 30, name: '成長フォルム', image: 'lv30_growth.webp' },
  { id: 'mature', level: 50, name: '成熟フォルム', image: 'lv50_mature.webp' },
] as const;

export const MATURE_FORM = FORM_STAGES[4];
export const HUMAN_FORM = { name: 'ヒューマンフォルム', image: 'lv50_human.webp' };

export const CHECKIN_XP = 10;
export const XP_PER_LEVEL = 50;

export function evolutionFromXp(xp: number) {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const nextIndex = FORM_STAGES.findIndex(form => form.level > level);
  const form = nextIndex === -1 ? MATURE_FORM : FORM_STAGES[nextIndex - 1];

  return {
    level,
    form,
    nextLevel: FORM_STAGES[nextIndex]?.level ?? null,
    currentLevelXp: safeXp % XP_PER_LEVEL,
    requiredLevelXp: XP_PER_LEVEL,
  };
}
