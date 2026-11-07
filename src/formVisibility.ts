/** Display-only logic. Unlock requirements and stored evolution are unchanged. */
export function isFormLocked(requiredLevel: number, currentLevel: number): boolean {
  return currentLevel < requiredLevel;
}

export function visibleFormName(name: string, locked: boolean): string {
  return locked ? '？？？' : name;
}
