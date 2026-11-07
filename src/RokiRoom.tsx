import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import RokiCharacter from './RokiCharacter';
import type { evolutionFromXp } from './evolution';

type RoomEvolution = Pick<ReturnType<typeof evolutionFromXp>, 'level' | 'form'>;

export default function RokiRoom({ level, form, equipped }: RoomEvolution & {
  equipped?: string[];
}) {
  const [position, setPosition] = useState({ x: 50, y: 77 });
  const [walking, setWalking] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop: number | undefined;
    const stroll = () => {
      if (document.hidden || reduceMotion.matches) return;
      setPosition({ x: 24 + Math.random() * 52, y: 66 + Math.random() * 19 });
      setWalking(true);
      stop = window.setTimeout(() => setWalking(false), 2200);
    };
    const interval = window.setInterval(stroll, 4200);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(stop);
    };
  }, []);

  return <section className="roki-room" aria-labelledby="room-title">
    <header className="roki-room-header">
      <h1 id="room-title"><Icon name="growth" /> ろきちゃんのルーム</h1>
      <p>Lv.{level} · {form.name}</p>
    </header>
    <div className="roki-room-stage">
      <div className="roki-room-actor" style={{ left: `${position.x}%`, top: `${position.y}%` }}>
        <div className="roki-room-sprite" data-walking={walking || undefined}>
          <RokiCharacter key={form.image} form={form} equipped={equipped} size={116} />
        </div>
      </div>
    </div>
  </section>;
}
