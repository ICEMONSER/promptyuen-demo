// Local simulated submission only; never communicates with an agency.
export const EVIDENCE_LIMIT = 5;
export function bangkokDateTime(now = new Date()) {
  return new Intl.DateTimeFormat('th-TH', {dateStyle:'long',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(now);
}
export function makeAccident(input, documents, now = new Date()) {
  if (!['now','past'].includes(input.when)) throw Error('เลือกช่วงเวลาเกิดเหตุ');
  if (!input.details?.trim() || input.details.length>4000) throw Error('กรอกรายละเอียดเหตุการณ์ไม่เกิน 4,000 ตัวอักษร');
  if (!Array.isArray(input.evidence) || !input.evidence.length || input.evidence.length>EVIDENCE_LIMIT) throw Error('แนบภาพหรือวิดีโอ 1–5 ไฟล์');
  for (const item of input.evidence) if (!/^data:(image\/jpeg|video\/(mp4|webm));base64,[A-Za-z0-9+/=]+$/.test(item.image||'') || item.image.length>23000000) throw Error('ไฟล์หลักฐานไม่ถูกต้องหรือใหญ่เกินกำหนด');
  let date = bangkokDateTime(now), place = input.eventPlace?.trim();
  if (input.when==='past') {
    const parsed=new Date(input.eventDate);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input.eventDate||'') || !Number.isFinite(parsed.getTime()) || parsed>now) throw Error('ระบุวันเวลาเกิดเหตุย้อนหลังให้ถูกต้อง');
    date=bangkokDateTime(parsed);
  }
  if (!place) throw Error('ยังไม่มีจุดเกิดเหตุ กรุณาอนุญาตตำแหน่งหรือระบุสถานที่เอง');
  const allowed=['fullName','nationalId','birthDate','address'];
  const identity=documents.find(d=>d.kind==='identity'&&d.verified);
  const fields={};
  for(const key of allowed) if(identity?.fields[key]) fields[key]={value:identity.fields[key],source:identity.name+' · สำเนาข้อมูล ณ วันที่ส่ง'};
  fields.details={value:input.details.trim(),source:'ผู้แจ้งระบุ'};
  fields.eventDate={value:date,source:input.when==='now'?'เวลาอุปกรณ์ ณ วันที่ส่ง':'ผู้แจ้งระบุ'};
  fields.eventPlace={value:place,source:input.point?'ตำแหน่งอุปกรณ์ที่ผู้ใช้อนุญาต':'ผู้แจ้งระบุ'};
  const id=crypto.randomUUID(), stamp=now.toISOString();
  return {id,service:'accident',status:'simulated',fields,messages:[],documentIds:identity?[identity.id]:[],evidence:input.evidence.map(e=>({...e,label:'หลักฐานที่ผู้ใช้แนบ · ยังไม่ได้วิเคราะห์',analysis:null})),station:input.station||null,location:input.point||null,reference:'DEMO-'+id.slice(0,8).toUpperCase(),revision:0,createdAt:stamp,updatedAt:stamp,governmentSubmitted:false,quickAccident:true,identityMissing:!identity,submittedAt:stamp};
}
export function trackingSteps(record) {
  return [
    {title:'บันทึกคำขอในเครื่อง',done:record.status==='simulated',detail:record.status==='simulated'?'พร้อมเปิดเอกสารสรุป':'ยังเป็นฉบับร่าง'},
    {title:'ส่งถึงสถานีตำรวจ',done:false,detail:'ยังไม่ส่ง · ระบบหน่วยงานยังไม่เชื่อมต่อ'},
    {title:'เจ้าหน้าที่รับเรื่อง',done:false,detail:'ยังไม่มีสถานะจากหน่วยงาน'},
    {title:'ดำเนินการเสร็จสิ้น',done:false,detail:'รอระบบหน่วยงานในอนาคต'},
  ];
}
