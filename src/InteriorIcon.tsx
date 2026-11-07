import React from 'react';
const paths:Record<string,React.ReactNode>={
 all:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 wallpaper:<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v18M16 3v18M3 9h18M3 16h18"/></>,
 floor:<><path d="m3 17 5-10h13l-5 10H3ZM6 12h12M12 7 7 17M17 7l-5 10"/></>,
 bed:<><path d="M3 8v13M21 13v8M3 17h18V11a3 3 0 0 0-3-3h-7v9M3 13h8"/><path d="M5 8h4v4H5z"/></>,
 desk:<><path d="M3 10h18v4H3zM5 14v7M19 14v7M6 6h6v4M7 3h4v3"/></>,
 rug:<><ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="6" ry="3"/></>,
 lamp:<><path d="m7 3-3 9h16l-3-9H7ZM12 12v9M7 21h10"/></>,
 furniture:<><path d="M6 11V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M3 10h4v6h10v-6h4v10H3V10ZM6 20v2M18 20v2"/></>,
};
export default function InteriorIcon({name}:{name:string}) {return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]||paths.all}</svg>;}
