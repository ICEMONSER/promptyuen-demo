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
