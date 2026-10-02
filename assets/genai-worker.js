import {MODEL} from './genai-core.js';
let engine;
self.onmessage = async ({data}) => {
  try {
    if(!engine) {
      const {CreateMLCEngine}=await import('https://esm.run/@mlc-ai/web-llm@0.2.85');
      engine=await CreateMLCEngine(MODEL,{
        initProgressCallback:report=>self.postMessage({type:'progress',progress:report.progress}),
        logLevel:'ERROR'
      },{context_window_size:4096});
    }
    self.postMessage({type:'generating'});
    const reply=await engine.chat.completions.create(data.request);
    self.postMessage({type:'result',reply});
  } catch {
    self.postMessage({type:'error',message:'เปิดหรือใช้งาน GenAI ไม่สำเร็จ อาจเกิดจากหน่วยความจำไม่พอ อุปกรณ์ไม่รองรับ หรือดาวน์โหลดโมเดลไม่ได้ ลองใช้ Chrome บนคอมพิวเตอร์และตรวจอินเทอร์เน็ต ข้อความต้นฉบับยังอยู่'});
  }
};
