import {D as React} from './shared-ui.js';
import {makePacketBody,encodePacket} from './case-packet.js';
const h=React.createElement;
export function PacketExport({record,documents=[]}){
 const[error,setError]=React.useState(''),[busy,setBusy]=React.useState(false);
 async function save(){setBusy(true);setError('');try{const data=await encodePacket(makePacketBody(record,documents));const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='promptyuen-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(e.message);}finally{setBusy(false);}}
 return h('section',{className:'packet-notice'},h('strong',null,'ชุดตรวจสำหรับต้นแบบการแข่งขัน'),h('p',null,'ดาวน์โหลดข้อมูลเคสเพื่อเปิดในเว็บเจ้าหน้าที่ได้โดยไม่ใช้ฐานข้อมูล ไฟล์มีชื่อ คำบอกเล่า ข้อมูลที่เลือก และผลตรวจ ไม่ดึงภาพเอกสาร ช่องเลขบัตร รหัสติดตาม หรือลายเซ็นมาแนบ โปรดตรวจว่าคำบอกเล่าไม่มีข้อมูลที่ไม่ต้องการส่ง'),h('p',null,'ใช้ข้อมูลสมมติในการสาธิต การส่งออกไม่ได้ส่งเรื่องถึงตำรวจ'),h('button',{type:'button',disabled:busy,onClick:save},busy?'กำลังสร้างชุดตรวจ…':'ดาวน์โหลดชุดข้อมูลสำหรับเจ้าหน้าที่'),h('p',null,h('a',{href:'https://icemonser.github.io/promptyuen-officer/',target:'_blank',rel:'noopener noreferrer'},'เปิดเว็บเจ้าหน้าที่เพื่อเลือกไฟล์ชุดตรวจ')),error&&h('p',{role:'alert'},error));
}
