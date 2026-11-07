import React from 'react';

/** Select one independent transparent cell from a 4-column, 3-row atlas. */
export default function ChibiAtlasTile({
  image,
  index,
  className,
  style,
}: {
  image: string;
  index: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!Number.isInteger(index) || index < 0 || index >= 12) return null;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return <span
    aria-hidden="true"
    className={className}
    style={{
      display: 'block',
      backgroundImage: `url("${process.env.PUBLIC_URL}/${image}")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '400% 300%',
      backgroundPosition: `${col / 3 * 100}% ${row / 2 * 100}%`,
      ...style,
    }}
  />;
}
