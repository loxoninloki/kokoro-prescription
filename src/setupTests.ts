// Deterministic Web Locks model for multi-call storage transaction tests.
let queue:Promise<unknown>=Promise.resolve();
Object.defineProperty(navigator,'locks',{configurable:true,value:{request:(_name:string,change:()=>unknown)=>{
 const result=queue.then(change);queue=result.catch(()=>undefined);return result;
}}});
