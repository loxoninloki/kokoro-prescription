import React,{act,useState} from 'react';
import {createRoot,Root} from 'react-dom/client';
import DiaryCalendar,{DiaryEntries} from './DiaryCalendar';
import StepTracker,{StepEntries} from './StepTracker';
import MedicationTracker,{MedicationData} from './MedicationTracker';
import {EMPTY_REWARDS,REWARD_KEY} from './rewardLedger';
let host:HTMLDivElement,root:Root;
const click=async(text:string)=>{const el=Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(b=>b.textContent===text);expect(el).toBeDefined();await act(async()=>el!.click());};
const input=async(el:HTMLInputElement|HTMLTextAreaElement,value:string)=>{await act(async()=>{Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value')!.set!.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));});};
beforeEach(()=>{(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;localStorage.clear();localStorage.setItem(REWARD_KEY,JSON.stringify(EMPTY_REWARDS));host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();jest.restoreAllMocks();});
function DiaryHarness(){const [entries,setEntries]=useState<DiaryEntries>({'2026-11-08':{mood:3,text:'残したい文章'},'2026-11-07':{mood:1,text:'前日の記録'}});return <DiaryCalendar entries={entries} setEntries={setEntries} checkins={['2026-11-08']} today="2026-11-08" steps={{'2026-11-08':0}} medicationTaken={{'2026-11-08|a':true}} medicines={[{id:'a',name:'登録済みのお薬',time:'08:00'}]}/>;}
test('既存日記を表示し、入力補助は追記だけで自動保存せず、気分・編集を同じ保存形式で記録する',async()=>{
 await act(async()=>root.render(<DiaryHarness/>));const before=localStorage.getItem(REWARD_KEY);
 expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('残したい文章');
 await click('ほっとした');expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('残したい文章\nほっとした');expect(localStorage.getItem('kokoro-diary-v1')).toBeNull();
 await click('すこしよい');await click('記録を保存');
 expect(JSON.parse(localStorage.getItem('kokoro-diary-v1')!)['2026-11-08']).toEqual({mood:4,text:'残したい文章\nほっとした'});
 await input(host.querySelector('textarea')!,'編集した日記');await click('記録を保存');expect(JSON.parse(localStorage.getItem('kokoro-diary-v1')!)['2026-11-08'].text).toBe('編集した日記');
 expect(localStorage.getItem(REWARD_KEY)).toBe(before);
});
test('カレンダーの4種類の記録・0歩・薬名を表示し、月切替と日記への復帰ができる',async()=>{
 await act(async()=>root.render(<DiaryHarness/>));await click('カレンダー');
 expect(host.querySelector('.care-month-count')?.textContent).toContain('2日');
 expect(host.querySelector('[aria-label="2026-11-08"] .care-record-dots')?.children).toHaveLength(4);
 expect(host.querySelector('.care-day-records')?.textContent).toContain('0歩');expect(host.textContent).toContain('登録済みのお薬');
 await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="前の月"]')!.click());expect(host.querySelector('.care-period')?.textContent).toContain('10月');
 await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="次の月"]')!.click());
 await act(async()=>host.querySelector<HTMLButtonElement>('[aria-label="2026-11-07"]')!.click());await click('この日の日記を開く');expect(host.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('前日の記録');
});
test('空データは架空の記録を生成せず、最近の日記は3件まで',async()=>{
 const set=jest.fn(),entries=Object.fromEntries([1,2,3,4,5].map(d=>[`2026-11-0${d}`,{mood:3,text:'記録'+d}]));
 await act(async()=>root.render(<DiaryCalendar entries={entries} setEntries={set} checkins={[]} today="2026-11-08" steps={{}} medicationTaken={{}}/>));expect(host.querySelectorAll('.care-recent li')).toHaveLength(3);
 await click('カレンダー');expect(host.querySelector('.care-day-records')?.textContent).toContain('記録なし');expect(set).not.toHaveBeenCalled();
});
function StepsHarness({incoming=null}:{incoming?:{day:string;count:number}|null}){const [entries,setEntries]=useState<StepEntries>({'2026-11-07':0});return <StepTracker entries={entries} setEntries={setEntries} today="2026-11-08" incoming={incoming} clearIncoming={()=>{}}/>;}
test('未取得と0歩を区別し、週・日・月グラフを維持してショートカット取込を確認保存する',async()=>{
 await act(async()=>root.render(<StepsHarness incoming={{day:'2026-11-08',count:4280}}/>));const before=localStorage.getItem(REWARD_KEY);
 expect(host.querySelector('.care-step-number')?.textContent).toBe('未取得');expect(host.querySelector('[aria-label="2026-11-07 0歩"]')).not.toBeNull();expect(host.querySelector('[aria-label="2026-11-08 未取得"]')).not.toBeNull();
 expect(localStorage.getItem('kokoro-steps-v1')).toBeNull();await click('この歩数を保存');expect(JSON.parse(localStorage.getItem('kokoro-steps-v1')!)).toEqual({'2026-11-07':0,'2026-11-08':4280});
 await click('日ごと');expect(host.querySelector('svg.step-history-chart')?.getAttribute('aria-label')).toContain('日ごと');await click('月ごと');expect(host.querySelector('svg.step-history-chart')?.getAttribute('aria-label')).toContain('月ごと');expect(localStorage.getItem(REWARD_KEY)).toBe(before);
});
function MedicineHarness({today='2026-11-08'}:{today?:string}){const [data,setData]=useState<MedicationData>({medicines:[{id:'a',name:'登録A',time:'08:00'},{id:'b',name:'登録B',time:'13:00'}],taken:{'2026-11-07|a':true}});return <MedicationTracker data={data} setData={setData} today={today}/>;}
test('登録薬を時刻順に表示し、服薬記録・名称編集・非表示でも過去記録を保持する',async()=>{
 await act(async()=>root.render(<MedicineHarness/>));const before=localStorage.getItem(REWARD_KEY);expect(Array.from(host.querySelectorAll('.medication-dose time')).map(e=>e.textContent)).toEqual(['08:00','13:00']);
 await act(async()=>host.querySelector<HTMLInputElement>('input[type=checkbox]')!.click());expect(JSON.parse(localStorage.getItem('kokoro-medication-v1')!).taken).toEqual({'2026-11-07|a':true,'2026-11-08|a':true});
 await click('編集');await input(host.querySelector<HTMLInputElement>('input[maxlength="80"]')!,'登録Aの表示名');await click('登録内容を保存');expect(JSON.parse(localStorage.getItem('kokoro-medication-v1')!).medicines[0]).toEqual({id:'a',name:'登録Aの表示名',time:'08:00'});
 jest.spyOn(window,'confirm').mockReturnValue(true);await click('一覧から非表示');const data=JSON.parse(localStorage.getItem('kokoro-medication-v1')!);expect(data.medicines[0].archived).toBe(true);expect(data.taken['2026-11-07|a']).toBe(true);expect(localStorage.getItem(REWARD_KEY)).toBe(before);expect(host.textContent).not.toContain('飲み忘れ');
});
test('日本時間の日付変更後は今日の服薬欄へ移り、前日の記録を変更しない',async()=>{
 await act(async()=>root.render(<MedicineHarness/>));await act(async()=>host.querySelector<HTMLInputElement>('input[type=checkbox]')!.click());
 await act(async()=>root.render(<MedicineHarness today="2026-11-09"/>));expect(host.querySelector<HTMLInputElement>('input[type=date]')!.value).toBe('2026-11-09');expect(host.querySelector<HTMLInputElement>('input[type=checkbox]')!.checked).toBe(false);expect(JSON.parse(localStorage.getItem('kokoro-medication-v1')!).taken['2026-11-08|a']).toBe(true);
});
test('お薬の新規登録は従来のID・名前・時刻形式で保存し、既存記録を保持する',async()=>{
 await act(async()=>root.render(<MedicineHarness/>));
 await input(host.querySelector<HTMLInputElement>('input[maxlength="80"]')!,'追加した登録薬');
 await input(host.querySelector<HTMLInputElement>('input[type=time]')!,'18:30');await click('お薬を登録');
 const data=JSON.parse(localStorage.getItem('kokoro-medication-v1')!);expect(data.medicines).toHaveLength(3);expect(data.medicines[2]).toEqual({id:expect.any(String),name:'追加した登録薬',time:'18:30'});expect(data.taken).toEqual({'2026-11-07|a':true});
});
test('手入力の0歩は未取得に戻らず保存され、報酬台帳を直接変更しない',async()=>{
 await act(async()=>root.render(<StepsHarness/>));const before=localStorage.getItem(REWARD_KEY);
 await input(host.querySelector<HTMLInputElement>('input[type=number]')!,'0');await act(async()=>host.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(JSON.parse(localStorage.getItem('kokoro-steps-v1')!)['2026-11-08']).toBe(0);expect(host.querySelector('.care-step-number')?.textContent).toBe('0歩');expect(localStorage.getItem(REWARD_KEY)).toBe(before);
});
test('日記の保存失敗で既存データと画面の読み込み値を上書きしない',async()=>{
 const saved=JSON.stringify({'2026-11-08':{mood:3,text:'元の保存データ'}});localStorage.setItem('kokoro-diary-v1',saved);
 await act(async()=>root.render(<DiaryHarness/>));await input(host.querySelector('textarea')!,'保存に失敗する編集');
 jest.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});await click('記録を保存');
 expect(host.querySelector('[role=alert]')?.textContent).toContain('保存できません');expect(localStorage.getItem('kokoro-diary-v1')).toBe(saved);
});
