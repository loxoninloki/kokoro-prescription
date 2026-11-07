import { CHECKIN_XP } from './evolution';
import { DIARY_XP, MOOD_XP, type DiaryEntries } from './DiaryCalendar';
import { MEDICATION_XP, type MedicationData } from './MedicationTracker';
import { medicationRewardCutover } from './medicationRewardPolicy';
import { MEDITATION_XP, type MeditationEntries } from './Meditation';
import { stepDayExperience, type StepEntries } from './StepTracker';

export function collectXpEvents(
  checkins: string[], diary: DiaryEntries, medication: MedicationData,
  steps: StepEntries, meditation: MeditationEntries,
): Record<string, number> {
  const events: Record<string, number> = {};
  for (const day of checkins) events['checkin:' + day] = CHECKIN_XP;
  for (const [day, entry] of Object.entries(diary)) {
    if (entry.mood) events['mood:' + day] = MOOD_XP;
    if (entry.text.trim()) events['diary:' + day] = DIARY_XP;
  }
  const medicineIds = new Set(medication.medicines.map(medicine => medicine.id));
  const cutover = medicationRewardCutover(medication.taken);
  for (const [key, taken] of Object.entries(medication.taken)) {
    if (!taken || !medicineIds.has(key.slice(11))) continue;
    const day = key.slice(0, 10);
    if (day < cutover) events['medication:' + key] = MEDICATION_XP;
    else events['medication-day:' + day] = MEDICATION_XP;
  }
  for (const [day, count] of Object.entries(steps)) {
    const xp = stepDayExperience(count);
    if (xp) events['steps:' + day] = xp;
  }
  for (const [day, done] of Object.entries(meditation)) {
    if (done) events['meditation:' + day] = MEDITATION_XP;
  }
  return events;
}
