export type FormStage = 'tablet' | 'birth' | 'awakening' | 'chibi' | 'human';

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
  const stage: FormStage = level >= 50 ? 'human' : level >= 30 ? 'chibi' : level >= 20 ? 'awakening' : level >= 10 ? 'birth' : 'tablet';
  const stageName: Record<FormStage, string> = {
    tablet: '錠剤フォルム',
    birth: '誕生フォルム',
    awakening: '覚醒フォルム',
    chibi: 'ちびろきフォルム',
    human: 'ヒューマンフォルム',
  };
  const nextLevel = level < 10 ? 10 : level < 20 ? 20 : level < 30 ? 30 : level < 50 ? 50 : null;
  return { level, stage, stageName: stageName[stage], nextLevel, currentLevelXp: safeXp % XP_PER_LEVEL, requiredLevelXp: XP_PER_LEVEL };
}
