import React from 'react';
import type { Category } from './appearance';

const artwork: Record<Category, React.ReactNode> = {
  hair: <>
    <path d="M4 15c-1-4 1-9 5-10l2-2 1 2c4-2 8 1 8 5l1 4-3-1-1 4-4-3-3 3-2-3-3 3v-3Z" />
    <path d="M9 9c1 2 2 3 4 4M15 7l2 2" fill="none" />
  </>,
  eyes: <>
    <path d="M3 12c3-4 6-5 9-5s6 1 9 5c-3 4-6 5-9 5s-6-1-9-5Z" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <circle cx="13" cy="11" r=".9" fill="#fff" stroke="none" />
  </>,
  tops: <>
    <path d="m8 5-5 3 2 5 3-1v7h8v-7l3 1 2-5-5-3c-1 3-7 3-8 0Z" />
    <path d="M11 12v4m-2-2h4" fill="none" />
  </>,
  bottoms: <>
    <path d="M6 5h12l2 14h-6l-2-7-2 7H4L6 5Z" />
    <path d="M6 8h12m-6 0v2" fill="none" />
  </>,
  shoes: <>
    <path d="M5 7h5l2 4 6 2c2 0 3 1 3 3v2H3v-5l2-6Z" />
    <path d="M4 15h16m-8-4-1 2m4-1-1 2" fill="none" />
  </>,
  accessories: <>
    <path d="M5 11 19 7c1 0 2 1 2 2s-1 2-2 2L6 15c-2 1-4-3-1-4Z" />
    <path d="M8 4c1 3 2 4 5 5-3 1-4 2-5 5-1-3-2-4-5-5 3-1 4-2 5-5Z" fill="none" />
  </>,
  hats: <>
    <path d="M3 15c0-5 4-8 9-9 4-1 8 1 9 5 0 2-2 3-4 4L6 18c-2 0-3-1-3-3Z" />
    <path d="M11 6l1-2m-8 12 15-4" fill="none" />
  </>,
  effects: <>
    <path d="M11 3c1 5 3 7 8 8-5 1-7 3-8 8-1-5-3-7-8-8 5-1 7-3 8-8Z" />
    <path d="M19 14v5m-2.5-2.5h5" fill="none" />
  </>,
};

export default function WardrobeIcon({ category }: { category: Category }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round">{artwork[category]}</svg>;
}
