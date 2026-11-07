/** One-time cutover: retain historical per-dose XP without reducing existing levels.
 * If a dose has already been recorded today, begin the capped policy tomorrow
 * so the current day's already-earned XP is not unexpectedly removed.
 */
const POLICY_KEY = 'kokoro-medication-reward-policy-v2';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function tokyoDay(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
function followingDay(day: string): string {
  const next = new Date(day + 'T00:00:00Z');
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
export function medicationRewardCutover(taken: Readonly<Record<string, boolean>>): string {
  const saved = localStorage.getItem(POLICY_KEY);
  if (saved && DATE_RE.test(saved)) return saved;
  const today = tokyoDay();
  const hasToday = Object.entries(taken).some(([key, value]) => value && key.startsWith(today + '|'));
  const cutover = hasToday ? followingDay(today) : today;
  localStorage.setItem(POLICY_KEY, cutover);
  return cutover;
}
