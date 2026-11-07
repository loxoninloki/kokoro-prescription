import { ITEMS } from './appearance';
import { INTERIOR_ITEMS } from './interior';
import { trialEquipment, trialLayout } from './gachaTryOn';

test('試着は元の装備を変更せず、同じカテゴリだけ仮で差し替える', () => {
  const effect = ITEMS.find(item => item.id === 'moon-sparkles')!;
  const original = ['lavender-bloom'];
  const trial = trialEquipment(original, effect, 'tablet');
  expect(trial).toEqual(['lavender-bloom', 'moon-sparkles']);
  expect(original).toEqual(['lavender-bloom']);
  expect(trialEquipment(trial!, effect, 'tablet')).toEqual(trial);
  const hat = ITEMS.find(item => item.id === 'night-beret')!;
  expect(trialEquipment([], hat, 'tablet')).toBeNull();
  expect(trialEquipment([], hat, 'mature')).toEqual(['night-beret']);
});

test('ルームお試しは同じスロットだけ仮変更し、保存済みの配置を維持する', () => {
  const original: Record<string, string | null> = {
    wallpaper: 'wall-basic', floor: 'floor-basic', desk: 'desk-basic',
  };
  const wall = INTERIOR_ITEMS.find(item => item.id === 'wall-night')!;
  const trial = trialLayout(original, wall);
  expect(trial).toEqual({ ...original, wallpaper: 'wall-night' });
  expect(original.wallpaper).toBe('wall-basic');
  expect(trialLayout(trial, INTERIOR_ITEMS.find(item => item.id === 'lamp-soft')!))
    .toMatchObject({ wallpaper: 'wall-night', floor: 'floor-basic', desk: 'desk-basic', lamp: 'lamp-soft' });
});
