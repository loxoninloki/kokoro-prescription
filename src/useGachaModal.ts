import React from 'react';
export function useGachaModal(onEscape?:()=>void) {
 const root=React.useRef<HTMLElement>(null);
 const escape=React.useRef(onEscape);escape.current=onEscape;
 React.useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  root.current?.focus();
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();escape.current?.();}
   if(event.key!=='Tab')return;
   const buttons=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')||[]);
   const first=buttons[0],last=buttons[buttons.length-1];
   if(!first){event.preventDefault();root.current?.focus();return;}
   if(!root.current?.contains(document.activeElement)){event.preventDefault();first.focus();}
   else if(event.shiftKey&&(document.activeElement===first||document.activeElement===root.current)){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
 },[]);
 return root;
}
export function useReducedMotion() {
 const [reduced,setReduced]=React.useState(()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
 React.useEffect(()=>{
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');if(!media)return;
  const change=()=>setReduced(media.matches);change();
  media.addEventListener?.('change',change);return()=>media.removeEventListener?.('change',change);
 },[]);
 return reduced;
}
