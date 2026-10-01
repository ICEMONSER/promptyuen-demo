import {D as React} from './shared-ui.js';
import {imageCanvas} from './import-document.js';
import {toDataURL} from './store.js';
import {parseIncidentPoint, parseCoordinateText, policeSearchUrl, incidentMapUrl} from './station-core.js';
import {LegalDraftPanel} from './legal-draft.js';
import {reviewedLegalDraft} from './legal-review.js';
import {EVIDENCE_LIMIT, trackingSteps, bangkokDateTime} from './accident-core.js';
import {thaiDate} from './report.js';
import {checklist, selectDocuments, DOCUMENT_LABELS} from './case-config.js';
import {DocumentChecklist} from './document-checklist.js';
const h=React.createElement;
export function AccidentFlow({documents,onSubmit,onClose}) {
 const [when,setWhen]=React.useState('now'),[details,setDetails]=React.useState(''),[eventDate,setDate]=React.useState(''),[eventPlace,setPlace]=React.useState(''),[evidence,setEvidence]=React.useState([]),[point,setPoint]=React.useState(null),[busy,setBusy]=React.useState(''),[error,setError]=React.useState('');
 const [latitude,setLatitude]=React.useState(''),[longitude,setLongitude]=React.useState(''),[stationName,setStationName]=React.useState(''),[legalDraft,setLegalDraft]=React.useState(null),[aiBusy,setAIBusy]=React.useState(false),[incidentNow,setIncidentNow]=React.useState(()=>new Date());
 const locked=!!busy||aiBusy;
 let currentPoint=null,coordinateError='',searchUrl='',mapUrl='';
 try { currentPoint=latitude.trim()||longitude.trim()?parseIncidentPoint(latitude,longitude):parseCoordinateText(eventPlace); } catch(e) { coordinateError=e.message; }
 if(!coordinateError&&(currentPoint||eventPlace.trim())) { searchUrl=policeSearchUrl(currentPoint,eventPlace); mapUrl=incidentMapUrl(currentPoint,eventPlace); }
 const parsedDate=new Date(eventDate);
 const draftInput={details,eventDate:when==='now'?bangkokDateTime(incidentNow):(Number.isFinite(parsedDate.getTime())?bangkokDateTime(parsedDate):''),eventPlace};
 const [documentIds,setDocumentIds]=React.useState(()=>selectDocuments('accident',documents));
 const requiredMissing=checklist('accident',documents,documentIds).some(d=>d.required&&!d.selected);
 const guard=React.useRef(false);
 const fileInput=React.useRef(null);
 async function locate(){if(!navigator.geolocation){setError('อุปกรณ์ไม่รองรับตำแหน่ง กรุณาพิมพ์สถานที่เอง');return;}setBusy('กำลังหาตำแหน่ง');setError('');try{const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:0}));const p={lat:position.coords.latitude,lon:position.coords.longitude,accuracy:position.coords.accuracy};setPoint(p);setLatitude(p.lat.toFixed(6));setLongitude(p.lon.toFixed(6));setStationName('');setPlace(`พิกัด ${p.lat.toFixed(6)}, ${p.lon.toFixed(6)} (คลาดเคลื่อนประมาณ ${Math.round(p.accuracy)} เมตร)`);}catch{setError('ไม่ได้รับตำแหน่ง กรุณาอนุญาตหรือพิมพ์สถานที่เกิดเหตุด้านล่าง');}finally{setBusy('');}}
 async function files(event){const incoming=Array.from(event.target.files||[]);event.target.value='';if(incoming.length+evidence.length>EVIDENCE_LIMIT){setError('แนบได้สูงสุด 5 ไฟล์');return;}setBusy('กำลังเตรียมหลักฐาน');setError('');try{const next=[];for(const file of incoming){if(!['image/jpeg','image/png','video/mp4','video/webm'].includes(file.type)||file.size>16*1024*1024)throw Error('ใช้ JPG, PNG, MP4 หรือ WebM ขนาดไม่เกิน 16 MB ต่อไฟล์');const image=file.type.startsWith('image/')?(await imageCanvas(file,1600)).toDataURL('image/jpeg',.82):await toDataURL(file);next.push({id:crypto.randomUUID(),name:file.name,mime:file.type.startsWith('image/')?'image/jpeg':file.type,image});}setEvidence(current=>[...current,...next]);}catch(e){setError(e.message);}finally{setBusy('');}}
 async function submit(event){
  event.preventDefault();if(guard.current||locked)return;guard.current=true;setError('');setBusy('กำลังจัดเตรียมคำขอ');
  try {
   if(coordinateError)throw Error(coordinateError);
   const reviewed=reviewedLegalDraft(legalDraft,draftInput);
   if(legalDraft&&!reviewed)throw Error('กรุณาตรวจและยืนยันร่างสำนวนก่อนบันทึก หรือยกเลิกร่าง AI เพื่อใช้คำบอกเล่าเดิม');
   const location=currentPoint?{...currentPoint,source:point?'geolocation':'coordinates'}:null;
   const station=stationName.trim()?{id:'manual',name:stationName.trim(),manual:true,incident:location,searchUrl}:null;
   await onSubmit({when,details,eventDate,eventPlace,evidence,point:location,station,documentIds,legalDraft:reviewed,incidentAt:incidentNow.toISOString()});
  }catch(e){setError(e.message);}finally{guard.current=false;setBusy('');}
 }
 const missing=!documents.some(d=>d.kind==='identity'&&d.verified);
 return h('section',{className:'quick-flow',role:'region','aria-label':'แจ้งอุบัติเหตุทางรถ'},
  h('button',{className:'text-action',onClick:onClose,disabled:locked},'← กลับหน้าหลัก'),
  h('span',{className:'login-step'},'แจ้งเหตุให้น้อยขั้นตอนที่สุด'),h('h1',null,'อุบัติเหตุทางรถ'),h('p',null,'เล่าเหตุการณ์ แนบหลักฐาน แล้วรับเอกสารสรุปได้ทันที'),
  h('p',{className:'quick-notice'},'ต้นแบบไม่ใช่ช่องทางฉุกเฉินและยังไม่ส่งถึงตำรวจ หากมีอันตรายเร่งด่วน โทร 191 หรือ 1669'),
  h('form',{onSubmit:submit},
   h('fieldset',{disabled:locked,className:'when-picker'},h('legend',null,'เหตุเกิดเมื่อไร'),...['now','past'].map(v=>h('label',{key:v,className:when===v?'selected':''},h('input',{type:'radio',name:'incident-when',value:v,checked:when===v,onChange:()=>{setWhen(v);setPoint(null);setLatitude('');setLongitude('');setStationName('');setPlace('');setIncidentNow(new Date());setError('');}}),v==='now'?'เกิดเหตุตอนนี้':'แจ้งย้อนหลัง'))),
   when==='now'?h('div',{className:'location-note'},h('strong',null,'วันเวลาเกิดเหตุ: '+bangkokDateTime(incidentNow)),h('p',null,'ใช้ตำแหน่งนี้เฉพาะเมื่อคุณอยู่ ณ จุดเกิดเหตุ'),h('button',{type:'button',disabled:locked,onClick:locate},point?'อัปเดตตำแหน่งจุดเกิดเหตุ':'ใช้ตำแหน่งปัจจุบัน'),h('small',null,'เบราว์เซอร์จะขออนุญาต ไม่ใช้ IP ระบุจุดเกิดเหตุ')):h('label',null,'วันและเวลาเกิดเหตุ',h('input',{type:'datetime-local',required:true,value:eventDate,disabled:locked,onChange:e=>setDate(e.target.value)})),
   h('label',null,when==='now'?'จุดเกิดเหตุ (เติมจากตำแหน่ง หรือพิมพ์เองเมื่อใช้ตำแหน่งไม่ได้)':'สถานที่เกิดเหตุ',h('input',{required:true,value:eventPlace,maxLength:500,disabled:locked,placeholder:'ชื่อสถานที่ พร้อมเขต / อำเภอและจังหวัด',onChange:e=>{setPlace(e.target.value);setPoint(null);setLatitude('');setLongitude('');setStationName('');}})),
   h('div',{className:'location-note'},
    h('strong',null,'ค้นหาสถานีตำรวจใกล้จุดเกิดเหตุ'),
    h('div',{className:'assistant-grid'},
     h('label',{className:'assistant-field'},'ละติจูด',h('input',{value:latitude,inputMode:'decimal',disabled:locked,placeholder:'เช่น 13.7563',onChange:e=>{setLatitude(e.target.value);setPoint(null);setStationName('');}})),
     h('label',{className:'assistant-field'},'ลองจิจูด',h('input',{value:longitude,inputMode:'decimal',disabled:locked,placeholder:'เช่น 100.5018',onChange:e=>{setLongitude(e.target.value);setPoint(null);setStationName('');}}))),
    h('small',null,'ใส่พิกัด หรือวางคู่ละติจูด, ลองจิจูดจาก Google Maps ในช่องสถานที่เกิดเหตุ หากไม่มีพิกัดจะใช้ชื่อสถานที่ที่ระบุ'),
    coordinateError&&h('p',{role:'alert'},coordinateError),
    searchUrl&&h('a',{href:searchUrl,target:'_blank',rel:'noopener noreferrer'},'ค้นหาสถานีตำรวจใกล้จุดเกิดเหตุใน Google Maps ↗'),
    mapUrl&&h('a',{href:mapUrl,target:'_blank',rel:'noopener noreferrer'},'ดูจุดเกิดเหตุใน Google Maps ↗'),
    h('small',null,'กดลิงก์เพื่อส่งเฉพาะพิกัดหรือชื่อสถานที่ไปยัง Google Maps แล้วกรอกชื่อสถานีที่เลือก ไม่ส่งคำบอกเล่าหรือหลักฐาน และผลค้นหาไม่ยืนยันเขตรับผิดชอบ'),
    h('label',{className:'assistant-field'},'ชื่อสถานีตำรวจที่เลือกจากผลค้นหา',h('input',{value:stationName,maxLength:150,disabled:locked,onChange:e=>setStationName(e.target.value),placeholder:'เช่น สถานีตำรวจ…'}))),
   h('label',null,'1. รายละเอียดเหตุการณ์',h('textarea',{required:true,value:details,maxLength:4000,rows:4,disabled:locked,placeholder:'เกิดอะไรขึ้น รถที่เกี่ยวข้อง และความเสียหายที่พบ',onChange:e=>setDetails(e.target.value)})),
   h(LegalDraftPanel,{input:draftInput,value:legalDraft,onChange:setLegalDraft,disabled:!!busy,onBusyChange:setAIBusy}),
   h('label',{className:'evidence-upload'},'2. ภาพหรือวิดีโอหลักฐาน',h('input',{ref:fileInput,type:'file',accept:'image/jpeg,image/png,video/mp4,video/webm',multiple:true,disabled:locked,onChange:files}),h('small',null,'ไม่เกิน 5 ไฟล์ · 16 MB ต่อไฟล์ · เก็บเฉพาะในเครื่อง')),
   h('div',{className:'evidence-grid'},...evidence.map(item=>h('figure',{key:item.id},item.mime.startsWith('video/')?h('video',{src:item.image,controls:true,preload:'metadata'}):h('img',{src:item.image,alt:'หลักฐานที่แนบ'}),h('figcaption',null,item.name),h('button',{type:'button',disabled:locked,onClick:()=>setEvidence(all=>all.filter(e=>e.id!==item.id))},'นำไฟล์นี้ออก')))),
   h(DocumentChecklist,{topic:'accident',documents,selected:documentIds,labels:DOCUMENT_LABELS,onChange:setDocumentIds}),
   requiredMissing&&h('p',{className:'quick-notice'},'เพิ่มเอกสารจำเป็นทั้ง 3 รายการในคลังเอกสารและตรวจยืนยันก่อนส่งคำขอ กรมธรรม์ประกันภัยไม่บังคับ'),
   h('p',{className:'small-note'},missing?'ยังไม่มีข้อมูลบัตรที่ยืนยันแล้ว ระบบจะไม่แต่งข้อมูลผู้แจ้ง กรุณาเพิ่มบัตรในคลังและตรวจยืนยันก่อนส่ง':'ใช้ข้อมูลบัตรที่คุณยืนยันแล้วโดยอัตโนมัติ ไม่ต้องกรอกซ้ำ'),
   h('p',{className:'small-note'},'ตรวจข้อความสำนวนด้านบนก่อนบันทึก ใบสรุปจะใช้ร่างที่คุณยืนยัน พร้อมคำบอกเล่าเดิมและข้อมูลที่ยังขาด บันทึกในเครื่อง ยังไม่ส่งให้หน่วยงานจริง'),
   error&&h('p',{role:'alert',className:'quick-error'},error),
   h('button',{className:'quick-submit',type:'submit',disabled:locked||!evidence.length||requiredMissing},busy||'ส่งคำขอจำลองและสร้างเอกสาร →')));
}
export function CaseTracking({record,onPrint,onClose}) {
 return h('div',{className:'tracking-backdrop'},h('section',{className:'tracking-card',role:'dialog','aria-modal':true,'aria-label':'ติดตามคำขอ'},
  h('button',{className:'text-action',onClick:onClose,autoFocus:true},'ปิด'),h('span',{className:'login-step'},'ติดตามคำขอของคุณ'),h('h2',null,record.status==='simulated'?'บันทึกคำขอจำลองแล้ว':'คำขอนี้ยังเป็นฉบับร่าง'),h('p',null,record.reference||'ยังไม่มีเลขคำขอ'),
  h('ol',{className:'tracking-steps'},...trackingSteps(record).map((step,i)=>h('li',{key:step.title,className:step.done?'done':''},h('span',null,step.done?'✓':i+1),h('div',null,h('strong',null,step.title),h('p',null,step.detail))))),
  h('div',{className:'location-note'},h('strong',null,record.station?.name||'ยังไม่ได้ระบุสถานี'),h('p',null,record.station?`สถานีที่ผู้แจ้งเลือก ไม่ยืนยันเขตรับผิดชอบ${Number.isFinite(record.station.distance)?` · ${record.station.distance.toFixed(1)} กม.`:''}`:'ยังไม่ได้กรอกชื่อสถานีที่เลือกจาก Google Maps'),h('small',null,'ตำแหน่งใกล้ที่สุดไม่จำเป็นต้องเป็นสถานีที่มีอำนาจรับผิดชอบ')),
  record.location&&h('a',{href:policeSearchUrl(record.location),target:'_blank',rel:'noopener noreferrer'},'ค้นหาสถานีตำรวจใกล้จุดเกิดเหตุใน Google Maps ↗'),
  record.legalDraft&&h('p',{className:'small-note'},'ใบสรุปมีร่างสำนวนที่คุณตรวจแล้ว พร้อมคำบอกเล่าต้นฉบับ'),
  record.identityMissing&&h('p',{className:'quick-notice'},'เอกสารสรุปยังไม่มีข้อมูลผู้แจ้ง เนื่องจากยังไม่มีบัตรที่ตรวจแล้ว'),
  h('p',null,'วันที่บันทึก '+thaiDate(record.updatedAt)),h('p',{className:'quick-notice'},'ตำรวจยังไม่ได้รับเรื่อง ระบบจะไม่สร้างสถานะว่าเจ้าหน้าที่รับหรือดำเนินการเสร็จเอง'),
  h('button',{className:'quick-submit',onClick:onPrint},'เปิดเอกสารสรุป / พิมพ์ PDF')));
}
