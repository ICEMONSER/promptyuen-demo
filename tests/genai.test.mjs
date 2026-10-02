import {test} from 'node:test';
import assert from 'node:assert/strict';
import {genAIRequest,parseGenAIReply} from '../assets/genai-core.js';
import {createBrowserGenAI} from '../assets/browser-genai.js';
const input={details:'ผมจอดรถอยู่แล้วมีรถมาชนไฟท้ายเสีย',eventPlace:'ถนนทดสอบ',nationalId:'secret'};
const reply={choices:[{finish_reason:'stop',message:{content:JSON.stringify({formalNarrative:'ขณะรถยนต์ของข้าพเจ้าจอดอยู่ ได้มีรถอีกคันมาชน ไฟท้ายรถยนต์ได้รับความเสียหาย',missingQuestions:['เหตุเกิดวันและเวลาใด']})}}]};
test('GenAI request includes only incident facts, no identity, and instructions separate from evidence',()=>{
 const request=genAIRequest(input);
 assert.equal(request.messages[0].role,'system');
 assert.equal(JSON.parse(request.messages[1].content).details,input.details);
 assert.ok(!JSON.stringify(request).includes('secret'));
 assert.throws(()=>genAIRequest({details:'ก'.repeat(1801)}));
});
test('model response must be complete valid Thai JSON; original facts remain available',()=>{
 const result=parseGenAIReply(reply,input);
 assert.equal(result.knownFacts[0].quote,input.details);
 assert.match(result.formalNarrative,/ข้าพเจ้า/);
 assert.throws(()=>parseGenAIReply({choices:[{...reply.choices[0],finish_reason:'length'}]},input));
 assert.throws(()=>parseGenAIReply({choices:[{finish_reason:'stop',message:{content:'not json'}}]},input));
});
test('unsupported devices never download the runtime or call a paid fallback',async()=>{
 let created=false;
 const service=createBrowserGenAI({gpu:null,workerFactory:()=>{created=true;}});
 await assert.rejects(service.generate(input),/WebGPU/);assert.equal(created,false);
});
test('worker generation, cancellation and fresh retry release pending work',async()=>{
 const workers=[];
 const service=createBrowserGenAI({gpu:{},workerFactory:()=>{const w={postMessage(){},terminate(){this.terminated=true;}};workers.push(w);return w;}});
 const first=service.generate(input);
 await assert.rejects(service.generate(input),/กำลังทำงาน/);
 service.cancel();await assert.rejects(first,/ยกเลิก/);assert.ok(workers[0].terminated);
 const second=service.generate(input);workers[1].onmessage({data:{type:'result',reply}});
 assert.match((await second).formalNarrative,/ข้าพเจ้า/);service.cancel();
});
test('runtime failure clears the lock, preserves useful error and allows retry',async()=>{
 let worker;
 const service=createBrowserGenAI({gpu:{},workerFactory:()=>worker={postMessage(){},terminate(){}}});
 const first=service.generate(input);
 worker.onerror();await assert.rejects(first,/โหลด GenAI ไม่สำเร็จ/);
 const second=service.generate(input);
 worker.onmessage({data:{type:'error',message:'หน่วยความจำไม่พอ'}});
 await assert.rejects(second,/หน่วยความจำไม่พอ/);
 const third=service.generate(input);worker.onmessage({data:{type:'result',reply}});
 await third;service.cancel();
});
test('preload is shared and generation waits without loading another worker',async()=>{
 let worker,created=0;const messages=[];
 const service=createBrowserGenAI({gpu:{},workerFactory:()=>{created++;return worker={postMessage:m=>messages.push(m),terminate(){}};}});
 const load=service.preload();const same=service.preload();assert.equal(load,same);
 const generation=service.generate(input);
 assert.equal(messages.length,1);assert.equal(messages[0].request,null);
 worker.onmessage({data:{type:'ready'}});await load;await Promise.resolve();
 assert.equal(created,1);assert.equal(messages.length,2);
 worker.onmessage({data:{type:'result',reply}});await generation;
 await service.preload();assert.equal(messages.length,2);service.cancel();
});
test('cancelled preload rejects queued generation and can be retried',async()=>{
 let worker;const service=createBrowserGenAI({gpu:{},workerFactory:()=>worker={postMessage(){},terminate(){}}});
 const load=service.preload();const generation=service.generate(input);service.cancel();
 await assert.rejects(load,/ยกเลิก/);await assert.rejects(generation,/ยกเลิก/);
 const retry=service.preload();worker.onmessage({data:{type:'ready'}});await retry;service.cancel();
});
test('factual audit rejects negative, malformed and truncated decisions',async()=>{
 const {auditRequest,validateAudit}=await import('../assets/genai-core.js');
 const request=auditRequest(genAIRequest(input),reply);
 assert.equal(JSON.parse(request.messages[1].content).source.details,input.details);
 for(const [finish_reason,content] of [['stop','{"supported":false}'],['length','{"supported":true}'],['stop','{}'],['stop','bad']])assert.throws(()=>validateAudit({choices:[{finish_reason,message:{content}}]}),/ไม่ผ่าน/);
 validateAudit({choices:[{finish_reason:'stop',message:{content:'{"supported":true}'}}]});
});
