import { useEffect, useRef, useState } from 'react';
import { EMPTY_REWARDS, readRewards, tokyoDay } from './rewardLedger';
import { syncLogin, StampReceipt } from './loginStamp';
import type { RoomState } from './interior';
export default function useRewards(readXp:()=>Record<string,number>,xpEvents:Readonly<Record<string,number>>, onSync:(days:string[],room:RoomState)=>void) {
 const [wallet,setWallet]=useState(()=>{try{return readRewards();}catch{return EMPTY_REWARDS;}});
 const [walletError,setWalletError]=useState(false);
 const [stampDay,setStampDay]=useState<number|null>(null);
 const pendingStamp=useRef<{day:number;receipt:StampReceipt}|null>(null);
 const [receipt,setReceipt]=useState<StampReceipt|null>(null);
 const callback=useRef(onSync);callback.current=onSync;
 useEffect(()=>{
  let active=true;let running=false;
  const sync=()=>{if(document.hidden||running)return;running=true;
   void syncLogin(tokyoDay(),readXp).then(next=>{if(next.stamped)pendingStamp.current={day:next.wallet.loginDays,receipt:next.receipt};if(active){setWallet(next.wallet);setWalletError(false);callback.current(next.days,next.room);if(pendingStamp.current){setStampDay(pendingStamp.current.day);setReceipt(pendingStamp.current.receipt);}}})
    .catch(()=>{if(active)setWalletError(true);}).finally(()=>{running=false;});
  };
  const storage=(e:StorageEvent)=>{if(e.key==='kokoro-rewards-v1'||e.key==='kokoro-checkins-v1')sync();};
  sync();const timer=window.setInterval(sync,60000);document.addEventListener('visibilitychange',sync);window.addEventListener('focus',sync);window.addEventListener('storage',storage);
  return()=>{active=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',sync);window.removeEventListener('focus',sync);window.removeEventListener('storage',storage);};
 },[readXp,xpEvents]);
 return {wallet,walletError,setWallet,stampDay,receipt,clearStamp:()=>{pendingStamp.current=null;setStampDay(null);setReceipt(null);}};
}

