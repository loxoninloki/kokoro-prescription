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
  const [readyFit, setReadyFit] = useState<string>();
  const baseImage = 'forms/' + form.image;
  const layers = [
    { image: baseImage, order: 20, position: undefined, portraitClip: undefined, underlay: undefined },
    ...ITEMS.filter(item => equipped.includes(item.id)).flatMap(item => item.layers),
  ].sort((a, b) => a.order - b.order);

  const activeFit = layers.find(layer => layer.portraitClip && layer.image === readyFit);
  const asset = (image: string) => `${process.env.PUBLIC_URL}/${image}`;

  return <span className="roki-character" style={{ width: size }} role="img" aria-label={`ろきちゃん：${form.name}`}>
    {failed
      ? <span className="character-fallback" aria-hidden="true"><Icon name="growth" /></span>
      : layers.map(({ image, position, portraitClip, underlay }) => {
        const style: React.CSSProperties | undefined = position
          ? { inset: 'auto', left: `${position.left}%`, top: `${position.top}%`, width: `${position.width}%`, height: 'auto' }
          : image === baseImage ? { clipPath: activeFit?.portraitClip } : undefined;
        return <React.Fragment key={image}>
          {underlay && image === readyFit && <img src={asset(underlay)} alt="" style={style}
            onError={event => { event.currentTarget.hidden = true; }} />}
          <img src={asset(image)} alt="" decoding="async" style={style}
            onLoad={portraitClip ? () => setReadyFit(image) : undefined}
            onError={event => {
              if (image === baseImage) setFailed(true);
              else {
                event.currentTarget.hidden = true;
                if (portraitClip) setReadyFit(undefined);
              }
            }} />
        </React.Fragment>;
      })}
  </span>;
}
