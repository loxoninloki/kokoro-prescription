import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import useRewards from './useRewards';
const read=()=>({});const events={};
function Harness(){const state=useRewards(read,events,()=>{});return <span>{state.wallet.loginDays}:{state.stampDay??'none'}</span>;}
test('StrictModeでの再実行でも通知は表示され、同日再起動では繰り返さない',async()=>{
 (globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();
 const div=document.createElement('div');document.body.appendChild(div);let root=createRoot(div);
 await act(async()=>{root.render(<React.StrictMode><Harness/></React.StrictMode>);});expect(div.textContent).toBe('1:1');
 await act(async()=>root.unmount());root=createRoot(div);
 await act(async()=>{root.render(<React.StrictMode><Harness/></React.StrictMode>);});expect(div.textContent).toBe('1:none');
 await act(async()=>root.unmount());div.remove();
});
