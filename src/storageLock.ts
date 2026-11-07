// Web Locks on current Safari; IndexedDB serialises synchronous writes on older browsers.
export async function withStorageLock<T>(change: () => T): Promise<T> {
 if (navigator.locks) return navigator.locks.request('kokoro-rewards-v1', change);
 return new Promise<T>((resolve,reject) => {
  const open=indexedDB.open('kokoro-storage-lock',1);
  open.onupgradeneeded=()=>open.result.createObjectStore('mutex');
  open.onerror=()=>reject(new Error('保存用ロックを開けませんでした。'));
  open.onsuccess=()=>{ const db=open.result; const tx=db.transaction('mutex','readwrite'); let value:T;
   const request=tx.objectStore('mutex').get('lock');
   request.onsuccess=()=>{try { value=change(); } catch(e) {tx.abort();reject(e);} };
   tx.oncomplete=()=>{db.close();resolve(value);};
   tx.onabort=tx.onerror=()=>{db.close();reject(new Error('保存を完了できませんでした。'));};
  };
 });
}
