import React, { useEffect, useState } from 'react';
import { INTERIOR_ITEMS, RoomState } from './interior';
import InteriorIcon from './InteriorIcon';
import RokiCharacter from './RokiCharacter';

type Props = {
  layout: RoomState['layout'];
  form: { name: string; image: string };
  equipped?: string[];
  animated?: boolean;
  compact?: boolean;
};

/** Common room renderer, used by both the editable room page and the home preview. */
export default function RoomStage({ layout, form, equipped, animated = true, compact = false }: Props) {
  const [position, setPosition] = useState({ x: 50, y: 82 });
  useEffect(() => {
    if (!animated) return;
    const timer = window.setInterval(() => {
      if (document.hidden || (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      setPosition({ x: 40 + Math.random() * 20, y: 79 + Math.random() * 6 });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [animated]);

  const wallpaper = INTERIOR_ITEMS.find(item => item.id === layout.wallpaper)?.color || '#eee3f6';
  const floor = INTERIOR_ITEMS.find(item => item.id === layout.floor)?.color || '#dfd2e6';
  const actor = animated ? position : { x: 50, y: 82 };

  return <div
    className={compact ? 'roki-room-stage interior-stage avatar-room-preview' : 'roki-room-stage interior-stage'}
    role={compact ? 'group' : undefined}
    aria-label={compact ? '現在のルームのプレビュー' : undefined}
    style={{ background: wallpaper }}>
    <div className="interior-floor" style={{ background: floor }} />
    {INTERIOR_ITEMS.filter(item => layout[item.slot] === item.id && !['wallpaper', 'floor'].includes(item.slot))
      .map(item => <div title="固定の配置位置" key={item.id}
        className={'interior-object interior-' + item.slot} aria-label={item.name}
        style={{ background: item.color }}><InteriorIcon name={item.slot} /></div>)}
    <div className="roki-room-actor" style={{ left: `${actor.x}%`, top: `${actor.y}%`, zIndex: 5 }}>
      <RokiCharacter form={form} equipped={equipped} size={116} />
    </div>
  </div>;
}
