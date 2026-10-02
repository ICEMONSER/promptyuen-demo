import {PORTAL_CONFIG as config} from './portal-config.js';
export const portalEnabled=()=>!!(config.supabaseUrl&&config.publishableKey);
export const statusLabels={verifying:'กำลังตรวจสอบข้อมูล',verified:'ตรวจสอบข้อมูลแล้ว',in_progress:'กำลังดำเนินการ',completed:'ดำเนินการเสร็จสิ้น',additional_info:'ขอข้อมูลเพิ่มเติม'};
async function rpc(name,args){if(!portalEnabled())throw Error('ระบบหน่วยงานยังไม่ได้เชื่อมต่อ');const res=await fetch(config.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(args)});const data=await res.json();if(!res.ok)throw Error(data.message||'เชื่อมต่อหน่วยงานไม่สำเร็จ');return data;}
export function prepareRemote(record){record.remote||={requestKey:crypto.randomUUID(),token:Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join(''),uploaded:[]};return record;}
export async function submitRemote(record,documents){
 if(!portalEnabled())return record;
 prepareRemote(record);if(!record.remote.consent){if(!window.confirm('ส่งชื่อ ข้อมูลติดต่อ รายละเอียด และเอกสารที่เลือกไปยังระบบเจ้าหน้าที่ต้นแบบของพร้อมยื่น? การส่งนี้ยังไม่ใช่การแจ้งความอย่างเป็นทางการ'))throw Error('ยกเลิกการส่ง ข้อมูลยังเก็บในเครื่อง');record.remote.consent=true;}const v=k=>String(record.fields?.[k]?.value||'');
 if(!record.remote.id){record.remote.id=await rpc('submit_case',{p_request_key:record.remote.requestKey,p_token:record.remote.token,p_unit:record.station?.manual?'other':record.station?.id||'other',p_name:v('fullName'),p_phone:v('phone'),p_email:v('email'),p_details:[v('details'),'วันเวลาเกิดเหตุ: '+v('eventDate'),'สถานที่: '+v('eventPlace'),'หน่วยงานที่ระบุ: '+(record.station?.name||''),record.legalDraft?.narrative||record.legalDraft?.text||''].filter(Boolean).join('\n\n')});}
 record.reference=record.remote.id;record.remote.submitted=true;
 const files=[...(record.evidence||[]),...documents.filter(d=>record.documentIds?.includes(d.id))];
 for(const f of files){const key=f.id||f.name;if(record.remote.uploaded.includes(key)||!f.image)continue;const blob=await(await fetch(f.image)).blob();await uploadRemote(record,new File([blob],f.name||'เอกสารแนบ',{type:blob.type}),key);record.remote.uploaded.push(key);}
 return record;
}
export async function uploadRemote(record,file,stableId){const safe=file.name.replace(/[\/\\]/g,'_').slice(0,180);const path=[record.remote.id,record.remote.token,stableId||crypto.randomUUID(),safe].map(encodeURIComponent).join('/');const res=await fetch(config.supabaseUrl.replace(/\/$/,'')+'/storage/v1/object/case-documents/'+path,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':file.type,'x-upsert':'false'},body:file});if(!res.ok){const d=await res.json().catch(()=>({}));if(res.status===409||d.statusCode==='409')return;throw Error(d.message||'ส่งไฟล์ไม่สำเร็จ กรุณาลองใหม่');}}
export async function trackRemote(record){return rpc('track_case',{p_id:record.remote.id,p_token:record.remote.token});}
export async function replyRemote(record,message){return rpc('reply_case',{p_id:record.remote.id,p_token:record.remote.token,p_message:message});}
