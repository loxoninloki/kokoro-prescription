import React, { useState } from 'react';
import { ITEMS } from './appearance';
import { Icon } from './Icon';

interface Props {
  form: { name: string; image: string };
  size: number;
  equipped?: string[];
}

export default function RokiCharacter({ form, size, equipped = [] }: Props) {
  const [failed, setFailed] = useState(false);
  const layers = [
    { image: 'forms/' + form.image, order: 20 },
    ...ITEMS.filter(item => equipped.includes(item.id)).flatMap(item => item.layers),
  ].sort((a, b) => a.order - b.order);

  return <span className="roki-character" style={{ width: size }} role="img" aria-label={`ろきちゃん：${form.name}`}>
    {failed
      ? <span className="character-fallback" aria-hidden="true"><Icon name="growth" /></span>
      : layers.map(({ image }) => <img key={image} src={`${process.env.PUBLIC_URL}/${image}`}
          alt="" decoding="async" onError={image === 'forms/' + form.image ? () => setFailed(true) : undefined} />)}
  </span>;
}
