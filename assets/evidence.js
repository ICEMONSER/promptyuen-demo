import {D as React} from './shared-ui.js';
import {downscalePhoto} from './vision.js';
const h=React.createElement;
export function EvidencePanel({record,onAttach,onRemove}){
 const [image,setImage]=React.useState(''),[busy,setBusy]=React.useState(false),[message,setMessage]=React.useState('');
 async function run(task){setBusy(true);setMessage('');try{await task();}catch(e){setMessage(e.message);}finally{setBusy(false);}}
 return h('section',{className:'assistant-panel'},h('h3',null,'ภาพหลักฐานอุบัติเหตุ'),h('p',null,'โหมดฟรี: เก็บภาพในเครื่อง ไม่มีการวิเคราะห์ภาพด้วย AI หรือส่งไปยังบริการภายนอก'),
 h('input',{type:'file',accept:'image/jpeg,image/png,image/webp',disabled:busy,onChange:e=>{const file=e.target.files?.[0];if(file)run(async()=>setImage(await downscalePhoto(file)));}}),
 image&&h('img',{src:image,className:'evidence-preview',alt:'ภาพที่เลือก'}),
 h('button',{type:'button',disabled:busy||!image,onClick:()=>run(async()=>{await onAttach({id:crypto.randomUUID(),image,analysis:null,label:'หลักฐานที่ผู้แจ้งแนบ · ยังไม่ได้วิเคราะห์',createdAt:new Date().toISOString()});setImage('');})},'แนบภาพเป็นหลักฐาน'),
 h('p',{role:'status'},message),...(record.evidence||[]).map(item=>h('article',{key:item.id},h('img',{src:item.image,className:'evidence-preview',alt:'ภาพหลักฐาน'}),h('p',null,item.label),h('button',{type:'button',disabled:busy,onClick:()=>run(()=>onRemove(item.id))},'นำภาพนี้ออก'))));
}
