import { medicationExperience, type MedicationData } from './MedicationTracker';
import { collectXpEvents } from './xpEvents';
import { creditXp, EMPTY_REWARDS, macaronBalance } from './rewardLedger';

const day = '2026-11-09';
const data: MedicationData = {
  medicines: [
    { id: 'a', name: '朝', time: '08:00' },
    { id: 'b', name: '夜', time: '20:00' },
    { id: 'c', name: '追加', time: '21:00' },
  ],
  taken: { [day + '|a']: true, [day + '|b']: true, [day + '|c']: true },
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('kokoro-medication-reward-policy-v2', '2026-11-08');
});

test('薬が何件あっても当日の経験値とマカロンは10まで', () => {
  expect(medicationExperience(data)).toBe(10);
  const events = collectXpEvents([], {}, data, {}, {});
  expect(events).toEqual({ ['medication-day:' + day]: 10 });
  const credited = creditXp(EMPTY_REWARDS, events);
  expect(macaronBalance(credited)).toBe(10);
  expect(creditXp(credited, events)).toBe(credited);
});

test('過去の服薬実績と既存マカロンを保護し、二重払いしない', () => {
  const oldDay = '2026-11-07';
  const legacy = { ...data, taken: { ...data.taken, [oldDay + '|a']: true, [oldDay + '|b']: true } };
  expect(medicationExperience(legacy)).toBe(30);
  const events = collectXpEvents([], {}, legacy, {}, {});
  expect(events['medication:' + oldDay + '|a']).toBe(10);
  expect(events['medication:' + oldDay + '|b']).toBe(10);
  expect(events['medication-day:' + day]).toBe(10);
  const old = { ...EMPTY_REWARDS, earned: 20, creditedXp: {
    ['medication:' + oldDay + '|a']: 10,
    ['medication:' + oldDay + '|b']: 10,
  } };
  expect(macaronBalance(creditXp(old, events))).toBe(30);
  const alreadyPaid = { ...old, creditedXp: { ...old.creditedXp, ['medication:' + day + '|a']: 10 }, earned: 30 };
  expect(macaronBalance(creditXp(alreadyPaid, events))).toBe(30);
});
