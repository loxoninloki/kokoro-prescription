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
  const baseImage = 'forms/' + form.image;
  const layers = [
    { image: baseImage, order: 20, position: undefined },
    ...ITEMS.filter(item => equipped.includes(item.id)).flatMap(item => item.layers),
  ].sort((a, b) => a.order - b.order);

  return <span className="roki-character" style={{ width: size }} role="img" aria-label={`ろきちゃん：${form.name}`}>
    {failed
      ? <span className="character-fallback" aria-hidden="true"><Icon name="growth" /></span>
      : layers.map(({ image, position }) => <img key={image} src={`${process.env.PUBLIC_URL}/${image}`}
          alt="" decoding="async"
          style={position && { inset: 'auto', left: `${position.left}%`, top: `${position.top}%`, width: `${position.width}%`, height: 'auto' }}
          onError={event => {
            if (image === baseImage) setFailed(true);
            else event.currentTarget.hidden = true;
          }} />)}
  </span>;
}
