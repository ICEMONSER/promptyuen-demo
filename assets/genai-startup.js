import {browserGenAI} from './browser-genai.js?v=auto-ai2';
const banner=document.createElement('aside');
banner.setAttribute('aria-label','สถานะ GenAI');
banner.style.cssText='padding:8px 16px;background:#f0f5fc;color:#14263e;font-size:13px;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
const status=document.createElement('span');
status.setAttribute('role','status');
const button=document.createElement('button');
button.type='button';button.style.cssText='font:inherit;padding:4px 10px';
banner.append(status,button);document.body.prepend(banner);
let loading=false;
async function start(){
  loading=true;button.textContent='หยุดดาวน์โหลด';
  status.textContent='กำลังเตรียม GenAI ฟรีในเครื่อง ดาวน์โหลดโมเดลหลาย GB ครั้งแรก — กรอกข้อมูลระหว่างรอได้';
  try{
    await browserGenAI.preload(message=>{status.textContent=message+' · กรอกข้อมูลระหว่างรอได้';});
    status.textContent='GenAI พร้อมเรียบเรียงในเครื่อง · ตรวจข้อเท็จจริงก่อนใช้เอกสาร';button.hidden=true;
  }catch(error){status.textContent=error.message;button.textContent='ลองโหลดใหม่';}
  finally{loading=false;}
}
button.onclick=()=>loading?browserGenAI.cancel():start();
start();
