import {genAIRequest,parseGenAIReply} from './genai-core.js';
export function createBrowserGenAI({workerFactory=()=>new Worker(new URL('./genai-worker.js',import.meta.url),{type:'module'}),gpu=globalThis.navigator?.gpu}={}) {
  let worker,pending;
  function cancel(message='ยกเลิก GenAI แล้ว ข้อความต้นฉบับยังอยู่') {
    worker?.terminate();worker=null;
    if(pending){clearTimeout(pending.timer);pending.reject(Error(message));pending=null;}
  }
  async function generate(input,onProgress=()=>{}) {
    if(pending)throw Error('GenAI กำลังทำงาน กรุณารอหรือกดยกเลิก');
    const request=genAIRequest(input);
    if(!gpu)throw Error('อุปกรณ์หรือเบราว์เซอร์นี้ไม่รองรับ WebGPU จึงใช้ GenAI ฟรีในเครื่องไม่ได้ กรุณาเปิดด้วยเบราว์เซอร์ที่รองรับ เช่น Chrome บนคอมพิวเตอร์');
    worker ||= workerFactory();
    return new Promise((resolve,reject)=>{
      pending={reject,timer:setTimeout(()=>cancel('ดาวน์โหลดโมเดลนานเกินกำหนด กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่'),10*60*1000)};
      const fail=message=>cancel(message);
      worker.onerror=()=>fail('โหลด GenAI ไม่สำเร็จ ตรวจอินเทอร์เน็ตและความสามารถของอุปกรณ์ แล้วลองใหม่');
      worker.onmessage=({data})=>{
        if(!pending)return;
        if(data.type==='progress')onProgress(`กำลังดาวน์โหลดและเตรียมโมเดล ${Math.round(Math.max(0,Math.min(1,data.progress||0))*100)}%`);
        if(data.type==='generating'){
          clearTimeout(pending.timer);pending.timer=setTimeout(()=>cancel('GenAI ใช้เวลานานเกินกำหนด กรุณาลองใหม่หรือใช้เครื่องที่มีหน่วยความจำมากขึ้น'),3*60*1000);
          onProgress('GenAI กำลังอ่านคำบอกเล่าและเขียนสำนวนใหม่…');
        }
        if(data.type==='error'){
          const current=pending;pending=null;clearTimeout(current.timer);worker.terminate();worker=null;current.reject(Error(data.message));
        }
        if(data.type==='result'){
          clearTimeout(pending.timer);pending=null;
          try{resolve(parseGenAIReply(data.reply,input));}catch(error){reject(error);}
        }
      };
      try{worker.postMessage({request});}catch{fail('ส่งข้อมูลให้ GenAI ในเครื่องไม่สำเร็จ กรุณาลองใหม่');}
    });
  }
  return {generate,cancel};
}
