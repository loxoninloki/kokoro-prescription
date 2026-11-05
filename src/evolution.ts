export type FormStage = 'tablet' | 'awakening' | 'chibi' | 'human';

export interface Evolution {
  level: number;
  stage: FormStage;
  stageName: string;
  nextLevel: number | null;
  currentLevelXp: number;
  requiredLevelXp: number;
}

export const CHECKIN_XP = 10;
export const XP_PER_LEVEL = 50;

export function evolutionFromXp(xp: number): Evolution {
  const safeXp = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  const level = Math.floor(safeXp / XP_PER_LEVEL) + 1;
  const stage: FormStage = level >= 40 ? 'human' : level >= 20 ? 'chibi' : level >= 10 ? 'awakening' : 'tablet';
  const stageName = {
    tablet: '錠剤フォルム',
    awakening: '覚醒フォルム',
    chibi: 'ちびろきフォルム',
    human: 'ヒューマンフォルム',
  }[stage];
  const nextLevel = level < 10 ? 10 : level < 20 ? 20 : level < 40 ? 40 : null;
  return { level, stage, stageName, nextLevel, currentLevelXp: safeXp % XP_PER_LEVEL, requiredLevelXp: XP_PER_LEVEL };
}
