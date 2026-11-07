import React from 'react';

const paths = {
  diary: 'M5 4h13v16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM7 4v16m3-11h5m-5 4h5',
  medication: 'M5.1 12.2 12.2 5.1a4.7 4.7 0 0 1 6.7 6.7l-7.1 7.1a4.7 4.7 0 0 1-6.7-6.7Zm3.6-3.5 6.6 6.6',
  steps: 'M3 14h4l3-6 3 3 2 1 5 1a2 2 0 0 1 2 2v3H3Zm0 1v-1m7-1 2 1m1-3 2 1',
  meditation: 'M19.6 15.6A8 8 0 0 1 8.4 4.4a8 8 0 1 0 11.2 11.2ZM16 3v6m-3-3h6',
  growth: 'M12 20 4.6 12.5a4.5 4.5 0 1 1 7.4-5 4.5 4.5 0 1 1 7.4 5Z',
  home: 'M3 11 12 3l9 8M5 10v11h14V10m-10 11v-7h6v7',
  dressup: 'M9 6a3 3 0 1 1 5 2l-2 2v2l9 6a1 1 0 0 1-1 2H4a1 1 0 0 1-1-2l9-6',
  gacha: 'M7 16a7 7 0 1 1 10 0l2 5H5l2-5Zm0 0h10M10 4h4m-2 9v4m-2-2h4',
  scene: 'M3 4h18v16H3Zm0 12 6-6 4 4 3-3 5 5M16 7h1',
  rewards: 'M4 10h16v10H4Zm-1 0 2-6h14l2 6M8 10V8m8 2V8m-6 12v-6h4v6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  invite: 'M12 15V3m-4 4 4-4 4 4M7 10H4v10h16V10h-3',
  backup: 'M4 8h16v12H4ZM3 4h18v4H3Zm6 8h6',
  brand: 'M3 12h4l2-4 3 8 2-4h7M3 10a4.5 4.5 0 0 1 9-2 4.5 4.5 0 0 1 9 2c0 4-4 7-9 11-5-4-9-7-9-11Z',
};

export function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="kokoro-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">
    <path d={paths[name]} />
  </svg>;
}

const mouths = ['M8 16q4-5 8 0', 'M8 15q4-3 8 0', 'M9 15h6', 'M8 14q4 5 8 0', 'M8 14h8q-4 8-8 0'];

export function MoodIcon({ index }: { index: number }) {
  return <svg className="mood-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d={index === 4 ? 'M6.5 10q1.5-2 3 0m5 0q1.5-2 3 0' : 'M8 9.5v.5m8-.5v.5'} />
    <path d={mouths[index]} />
  </svg>;
}
