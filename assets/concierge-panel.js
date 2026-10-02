import {D as React} from './shared-ui.js';
import {buildSources,sourceKey,planCase,FACT_LABELS} from './concierge-core.js';
import {caseAI} from './browser-genai.js?v=20261003-concierge';
const h=React.createElement;
export function ConciergePanel({input,documents,selected,station,value,onChange,disabled,onBusyChange}) {
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState(''),[progress,setProgress]=React.useState(''),[answer,setAnswer]=React.useState('');
 const generation=React.useRef(0);let sources=[],sourceError='';try{sources=buildSources(input,documents,selected);}catch(e){sourceError=e.message;}
 const key=sourceKey(sources),latest=React.useRef(key);latest.current=key;
 const memory=value?.source===key?value:null;
 React.useEffect(()=>{setAnswer('');setError('');if(value&&value.source!==key)onChange(null);},[key]);
 React.useEffect(()=>()=>{generation.current++;caseAI().cancel();},[]);
 const tasks=planCase({sources,facts:memory?.facts||[],answers:memory?.answers||{},documents,selected,station});
 const next=tasks.find(t=>!t.resolved&&['question','conflict'].includes(t.type));
 React.useEffect(()=>setAnswer(''),[next?.id]);
 const base=()=>memory||{version:1,source:key,facts:[],answers:{},model:'ไม่ได้ใช้ AI',reviewedAt:null};
 async function analyze(){
  const ticket=++generation.current;setBusy(true);onBusyChange?.(true);setError('');setProgress('กำลังเตรียม AI ในเครื่อง…');
  try{const result=await caseAI().generate({sources},setProgress,'concierge');if(ticket===generation.current&&latest.current===key)onChange({...result,answers:memory?.answers||{}});}
  catch(e){if(ticket===generation.current)setError(e.message);}
  finally{if(ticket===generation.current){setBusy(false);onBusyChange?.(false);}}
 }
 return h('section',{className:'assistant-panel concierge-panel','aria-label':'ผู้ช่วยตรวจข้อมูลเคส'},
  h('h3',null,'ผู้ช่วยตรวจข้อมูลเคส'),
  h('p',{className:'small-note'},'AI จัดหมวดหมู่คำบอกเล่าพร้อมข้อความต้นทาง คุณตรวจยืนยันก่อนใช้ ระบบไม่ตัดสินว่าใครผิด'),
  h('p',{className:'small-note'},'ไม่มีค่า API · ครั้งแรกดาวน์โหลดโมเดลหลาย GB และต้องใช้ WebGPU · เอกสารไม่ถูกส่งให้ผู้ให้บริการ AI'),
  h('button',{type:'button',disabled:disabled||busy||!!sourceError||!input.details?.trim(),onClick:analyze},'วิเคราะห์เคสด้วย AI ในเครื่อง'),
  busy&&h(React.Fragment,null,h('p',{role:'status'},progress),h('button',{type:'button',onClick:()=>caseAI().cancel()},'ยกเลิกการวิเคราะห์')),
  (error||sourceError)&&h('p',{role:'alert',className:'quick-error'},error||sourceError),
  !busy&&error&&h('p',{className:'small-note'},'ยังไม่ได้ใช้ผล AI คุณตรวจข้อมูลตามรายการด้านล่างต่อได้ โดยระบบจะระบุว่าไม่ได้ใช้ AI'),
  memory?.model!=='ไม่ได้ใช้ AI'&&memory?.facts.length===0&&h('p',null,'AI ไม่พบข้อเท็จจริงที่อ้างต้นฉบับได้ กรุณาตอบข้อมูลที่ทราบด้านล่าง'),
  memory?.facts.map(f=>h('div',{key:f.id,className:'concierge-fact'},h('strong',null,FACT_LABELS[f.field]),h('span',{className:'small-note'},' · '+({stated:'ผู้แจ้งกล่าวถึง',denied:'ผู้แจ้งปฏิเสธ',uncertain:'ยังไม่แน่ชัด'}[f.state])),h('blockquote',null,f.quote),h('details',null,h('summary',null,'ดูต้นทางและบริบท'),h('p',null,sources.find(s=>s.id===f.sourceId)?.text)),h('label',null,h('input',{type:'checkbox',checked:f.confirmed,disabled:disabled||busy,onChange:e=>onChange({...base(),facts:memory.facts.map(x=>x.id===f.id?{...x,confirmed:e.target.checked}:x),reviewedAt:new Date().toISOString()})}),'ตรวจแล้วว่าหมวดหมู่และความหมายตรงต้นฉบับ'),h('button',{type:'button',disabled:disabled||busy,onClick:()=>onChange({...base(),facts:memory.facts.filter(x=>x.id!==f.id)})},'ไม่ใช้ข้อสรุปนี้'))),
  h('h4',null,'ขั้นตอนถัดไป — ตรวจด้วยกฎจากข้อมูลเคส'),
  h('ul',null,...tasks.filter(t=>['document','station','review'].includes(t.type)).map(t=>h('li',{key:t.id},t.label))),
  next&&h('div',{className:'location-note'},h('label',{htmlFor:'concierge-answer'},next.label),...next.sourceIds.map(id=>sources.find(s=>s.id===id)).filter(Boolean).map(s=>h('p',{className:'small-note',key:s.id},`${s.label}: ${s.text}`)),h('textarea',{id:'concierge-answer',value:answer,maxLength:700,rows:2,disabled:disabled||busy,onChange:e=>setAnswer(e.target.value),placeholder:'ตอบตามที่ทราบ หรือระบุว่ายังไม่ทราบ'}),h('button',{type:'button',disabled:disabled||busy||!answer.trim(),onClick:()=>{onChange({...base(),answers:{...base().answers,[next.id]:answer.trim()}});setAnswer('');}},'บันทึกคำตอบและไปข้อต่อไป')),
  ...tasks.filter(t=>t.resolved).map(t=>h('details',{key:t.id},h('summary',null,'ตอบแล้ว: '+t.label),h('p',null,t.answer),h('button',{type:'button',disabled:disabled||busy,onClick:()=>{const answers={...base().answers};delete answers[t.id];onChange({...base(),answers});}},'แก้คำตอบ'))),
  !tasks.some(t=>!t.resolved)&&h('p',{role:'status'},'ตรวจรายการเตรียมข้อมูลครบแล้ว — ไม่ใช่การยืนยันความถูกต้องทางกฎหมาย'),
  h('p',{className:'small-note'},'คำถามและรายการตรวจอยู่ในขั้นตอนเตรียมเคสเท่านั้น ไม่เพิ่มหัวข้อคำถามในเอกสารพิมพ์'));
}
