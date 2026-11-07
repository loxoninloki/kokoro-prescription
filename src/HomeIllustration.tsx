import React from 'react';

export default function HomeIllustration() {
  return (
          <svg className="kokoro-hero-art" viewBox="0 0 1214 1295" role="img" aria-label="月夜の部屋でぬいぐるみとくつろぐろきちゃん">
            <defs>
              <image id="home-art-source" href={`${process.env.PUBLIC_URL}/home-hero.webp`} width="1214" height="1295" />
              <clipPath id="home-art-highlights">
                {/* These areas are inside the illustration, including its white highlights. */}
                <path d="M390 616 L515 494 L780 490 L908 600 L950 746 L1090 757 L1110 1095 L876 1172 L253 1185 L76 1082 L90 837 L227 732 Z" />
                <circle cx="186" cy="229" r="46" />
                <circle cx="286" cy="340" r="51" />
              </clipPath>
              <filter id="home-art-blend" colorInterpolationFilters="sRGB">
                {/* Blend the white paper into the room while retaining the original illustration. */}
                <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -4 -5 -3 1 11" />
              </filter>
            </defs>
            <use href="#home-art-source" filter="url(#home-art-blend)" />
            <use href="#home-art-source" clipPath="url(#home-art-highlights)" />
          </svg>
  );
}
