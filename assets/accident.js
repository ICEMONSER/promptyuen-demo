import {D as React} from './shared-ui.js';
import {imageCanvas} from './import-document.js';
import {toDataURL} from './store.js';
import {nearestStations, findIncidentPlace} from './station-core.js';
import {EVIDENCE_LIMIT, trackingSteps} from './accident-core.js';
import {thaiDate} from './report.js';
const h=React.createElement;
export function AccidentFlow({documents,onSubmit,onClose}) {
 const [when,setWhen]=React.useState('now'),[details,setDetails]=React.useState(''),[eventDate,setDate]=React.useState(''),[eventPlace,setPlace]=React.useState(''),[evidence,setEvidence]=React.useState([]),[point,setPoint]=React.useState(null),[consent,setConsent]=React.useState(false),[busy,setBusy]=React.useState(''),[error,setError]=React.useState('');
 const guard=React.useRef(false);
 const fileInput=React.useRef(null);
 async function locate(){if(!navigator.geolocation){setError('อุปกรณ์ไม่รองรับตำแหน่ง กรุณาพิมพ์สถานที่เอง');return;}setBusy('กำลังหาตำแหน่ง');setError('');try{const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:0}));const p={lat:position.coords.latitude,lon:position.coords.longitude,accuracy:position.coords.accuracy};setPoint(p);setPlace(`พิกัด ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)} (คลาดเคลื่อนประมาณ ${Math.round(p.accuracy)} เมตร)`);}catch{setError('ไม่ได้รับตำแหน่ง กรุณาอนุญาตหรือพิมพ์สถานที่เกิดเหตุด้านล่าง');}finally{setBusy('');}}
 async function files(event){const incoming=Array.from(event.target.files||[]);event.target.value='';if(incoming.length+evidence.length>EVIDENCE_LIMIT){setError('แนบได้สูงสุด 5 ไฟล์');return;}setBusy('กำลังเตรียมหลักฐาน');setError('');try{const next=[];for(const file of incoming){if(!['image/jpeg','image/png','video/mp4','video/webm'].includes(file.type)||file.size>16*1024*1024)throw Error('ใช้ JPG, PNG, MP4 หรือ WebM ขนาดไม่เกิน 16 MB ต่อไฟล์');const image=file.type.startsWith('image/')?(await imageCanvas(file,1600)).toDataURL('image/jpeg',.82):await toDataURL(file);next.push({id:crypto.randomUUID(),name:file.name,mime:file.type.startsWith('image/')?'image/jpeg':file.type,image});}setEvidence(current=>[...current,...next]);}catch(e){setError(e.message);}finally{setBusy('');}}
 async function submit(event){event.preventDefault();if(guard.current)return;guard.current=true;setError('');setBusy('กำลังจัดเตรียมคำขอ');try{let station=null,loc=point;if(consent){setBusy('กำลังค้นหาสถานีใกล้จุดเกิดเหตุ');try{if(!loc)loc=await findIncidentPlace(eventPlace);station=(await nearestStations(loc))[0];}catch{/* Preserve the report if the public map service is unavailable. */}}await onSubmit({when,details,eventDate,eventPlace,evidence,point,station});}catch(e){setError(e.message);}finally{guard.current=false;setBusy('');}}
 const missing=!documents.some(d=>d.kind==='identity'&&d.verified);
 return h('section',{className:'quick-flow',role:'region','aria-label':'แจ้งอุบัติเหตุทางรถ'},
  h('button',{className:'text-action',onClick:onClose,disabled:!!busy},'← กลับหน้าหลัก'),
  h('span',{className:'login-step'},'แจ้งเหตุให้น้อยขั้นตอนที่สุด'),h('h1',null,'อุบัติเหตุทางรถ'),h('p',null,'เล่าเหตุการณ์ แนบหลักฐาน แล้วรับเอกสารสรุปได้ทันที'),
  h('p',{className:'quick-notice'},'ต้นแบบไม่ใช่ช่องทางฉุกเฉินและยังไม่ส่งถึงตำรวจ หากมีอันตรายเร่งด่วน โทร 191 หรือ 1669'),
  h('form',{onSubmit:submit},
   h('fieldset',{disabled:!!busy,className:'when-picker'},h('legend',null,'เหตุเกิดเมื่อไร'),...['now','past'].map(v=>h('label',{key:v,className:when===v?'selected':''},h('input',{type:'radio',name:'incident-when',value:v,checked:when===v,onChange:()=>{setWhen(v);setPoint(null);setPlace('');setError('');}}),v==='now'?'เกิดเหตุตอนนี้':'แจ้งย้อนหลัง'))),
   when==='now'?h('div',{className:'location-note'},h('strong',null,'วันเวลา: บันทึกอัตโนมัติเมื่อส่ง'),h('p',null,'ใช้ตำแหน่งนี้เฉพาะเมื่อคุณอยู่ ณ จุดเกิดเหตุ'),h('button',{type:'button',disabled:!!busy,onClick:locate},point?'อัปเดตตำแหน่งจุดเกิดเหตุ':'ใช้ตำแหน่งปัจจุบัน'),h('small',null,'เบราว์เซอร์จะขออนุญาต ไม่ใช้ IP ระบุจุดเกิดเหตุ')):h('label',null,'วันและเวลาเกิดเหตุ',h('input',{type:'datetime-local',required:true,value:eventDate,disabled:!!busy,onChange:e=>setDate(e.target.value)})),
   h('label',null,when==='now'?'จุดเกิดเหตุ (เติมจากตำแหน่ง หรือพิมพ์เองเมื่อใช้ตำแหน่งไม่ได้)':'สถานที่เกิดเหตุ',h('input',{required:true,value:eventPlace,maxLength:500,disabled:!!busy,placeholder:'ชื่อสถานที่ พร้อมเขต / อำเภอและจังหวัด',onChange:e=>{setPlace(e.target.value);setPoint(null);}})),
   h('label',null,'1. รายละเอียดเหตุการณ์',h('textarea',{required:true,value:details,maxLength:4000,rows:4,disabled:!!busy,placeholder:'เกิดอะไรขึ้น รถที่เกี่ยวข้อง และความเสียหายที่พบ',onChange:e=>setDetails(e.target.value)})),
   h('label',{className:'evidence-upload'},'2. ภาพหรือวิดีโอหลักฐาน',h('input',{ref:fileInput,type:'file',accept:'image/jpeg,image/png,video/mp4,video/webm',multiple:true,disabled:!!busy,onChange:files}),h('small',null,'ไม่เกิน 5 ไฟล์ · 16 MB ต่อไฟล์ · เก็บเฉพาะในเครื่อง')),
   h('div',{className:'evidence-grid'},...evidence.map(item=>h('figure',{key:item.id},item.mime.startsWith('video/')?h('video',{src:item.image,controls:true,preload:'metadata'}):h('img',{src:item.image,alt:'หลักฐานที่แนบ'}),h('figcaption',null,item.name),h('button',{type:'button',disabled:!!busy,onClick:()=>setEvidence(all=>all.filter(e=>e.id!==item.id))},'นำไฟล์นี้ออก')))),
   h('p',{className:'small-note'},missing?'ยังไม่มีข้อมูลบัตรที่ยืนยันแล้ว ระบบจะไม่แต่งข้อมูลผู้แจ้ง สามารถเพิ่มบัตรในคลังได้ภายหลัง':'ใช้ข้อมูลบัตรที่คุณยืนยันแล้วโดยอัตโนมัติ ไม่ต้องกรอกซ้ำ'),
   h('label',{className:'map-consent'},h('input',{type:'checkbox',checked:consent,disabled:!!busy,onChange:e=>setConsent(e.target.checked)}),'อนุญาตส่งเฉพาะพิกัดหรือชื่อสถานที่ให้ OpenStreetMap เพื่อเลือกสถานีใกล้ที่สุด (ไม่ส่งรายละเอียดหรือหลักฐาน)'),
   h('p',{className:'small-note'},'เมื่อกดส่ง ระบบจะบันทึกในเครื่องและแสดงผลทันที ไม่มีหน้าตรวจร่างซ้ำ ยังไม่มีการส่งให้หน่วยงานจริง'),
   error&&h('p',{role:'alert',className:'quick-error'},error),
   h('button',{className:'quick-submit',type:'submit',disabled:!!busy||!evidence.length},busy||'ส่งคำขอจำลองและสร้างเอกสาร →')));
}
export function CaseTracking({record,onPrint,onClose}) {
 return h('div',{className:'tracking-backdrop'},h('section',{className:'tracking-card',role:'dialog','aria-modal':true,'aria-label':'ติดตามคำขอ'},
  h('button',{className:'text-action',onClick:onClose,autoFocus:true},'ปิด'),h('span',{className:'login-step'},'ติดตามคำขอของคุณ'),h('h2',null,record.status==='simulated'?'บันทึกคำขอจำลองแล้ว':'คำขอนี้ยังเป็นฉบับร่าง'),h('p',null,record.reference||'ยังไม่มีเลขคำขอ'),
  h('ol',{className:'tracking-steps'},...trackingSteps(record).map((step,i)=>h('li',{key:step.title,className:step.done?'done':''},h('span',null,step.done?'✓':i+1),h('div',null,h('strong',null,step.title),h('p',null,step.detail))))),
  h('div',{className:'location-note'},h('strong',null,record.station?.name||'ยังไม่ได้ระบุสถานี'),h('p',null,record.station?`แนะนำจากข้อมูลแผนที่ ไม่ยืนยันเขตรับผิดชอบ${Number.isFinite(record.station.distance)?` · ${record.station.distance.toFixed(1)} กม.`:''}`:'ยังค้นหาสถานีไม่ได้ หรือไม่ได้อนุญาตใช้แผนที่ ไม่มีการสุ่มเลือกสถานี'),h('small',null,'ตำแหน่งใกล้ที่สุดไม่จำเป็นต้องเป็นสถานีที่มีอำนาจรับผิดชอบ')),
  record.identityMissing&&h('p',{className:'quick-notice'},'เอกสารสรุปยังไม่มีข้อมูลผู้แจ้ง เนื่องจากยังไม่มีบัตรที่ตรวจแล้ว'),
  h('p',null,'วันที่บันทึก '+thaiDate(record.updatedAt)),h('p',{className:'quick-notice'},'ตำรวจยังไม่ได้รับเรื่อง ระบบจะไม่สร้างสถานะว่าเจ้าหน้าที่รับหรือดำเนินการเสร็จเอง'),
  h('button',{className:'quick-submit',onClick:onPrint},'เปิดเอกสารสรุป / พิมพ์ PDF')));
}
