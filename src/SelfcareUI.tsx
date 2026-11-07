import React from 'react';
import {Icon} from './Icon';
export function CareHeading({icon,title,note}:{icon:React.ComponentProps<typeof Icon>['name'];title:string;note:string}) {
 return <header className="care-heading"><span className="care-eyebrow">こころに、やさしいひととき</span><h1><Icon name={icon}/>{title}</h1><p>{note}</p></header>;
}
export function CareSection({title,children,action}:{title:string;children:React.ReactNode;action?:React.ReactNode}) {
 return <section className="care-card"><div className="care-section-title"><h2>{title}</h2>{action}</div>{children}</section>;
}
export function CareRing({value,max,label,children}:{value:number;max:number;label:string;children:React.ReactNode}) {
 const fraction=Math.min(1,Math.max(0,value/Math.max(1,max)));
 return <div className="care-ring" role="group" aria-label={label}><svg viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="59" className="care-ring-track"/><circle cx="70" cy="70" r="59" className="care-ring-value" pathLength="100" strokeDasharray={`${fraction*100} 100`} transform="rotate(-90 70 70)"/></svg><div>{children}</div></div>;
}
