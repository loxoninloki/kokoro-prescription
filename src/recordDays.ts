import type { DiaryEntries } from './DiaryCalendar';
import type { MedicationData } from './MedicationTracker';
import type { MeditationEntries } from './Meditation';
import type { StepEntries } from './StepTracker';

export function countRecordDays(
  today: string,
  checkins: string[],
  diary: DiaryEntries,
  medication: MedicationData,
  steps: StepEntries,
  meditation: MeditationEntries
): number {
  const dates = new Set(checkins);
  const medicineIds = new Set(medication.medicines.map(medicine => medicine.id));

  for (const [date, entry] of Object.entries(diary)) {
    if (entry.mood !== null || entry.text.trim()) dates.add(date);
  }
  for (const [key, taken] of Object.entries(medication.taken)) {
    if (taken && medicineIds.has(key.slice(11))) dates.add(key.slice(0, 10));
  }
  Object.keys(steps).forEach(date => dates.add(date));
  for (const [date, done] of Object.entries(meditation)) {
    if (done) dates.add(date);
  }

  return Array.from(dates).filter(date => {
    const timestamp = Date.parse(date + 'T00:00:00Z');
    return date <= today && Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date;
  }).length;
}
