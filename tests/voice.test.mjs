import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createThaiDictation} from '../assets/voice-core.js';
import {generateLegalDraft} from '../assets/reasoning.js';
class Recognition {
 constructor(){Recognition.latest=this;}
 start(){this.started=true;}
 stop(){this.onend();}
 abort(){this.onend();}
}
const result=(text,isFinal)=>Object.assign([{transcript:text}],{isFinal});
test('Thai dictation appends final results once, excludes interim, starts only on request',()=>{
 let completed;
 const session=createThaiDictation(Recognition,{base:'ข้อความเดิม',onComplete:(...args)=>completed=args});
 const r=Recognition.latest;
 assert.equal(r.lang,'th-TH');assert.equal(r.started,undefined);session.start();
 r.onresult({results:[result('รถผมโดนชน',true),result('ยังพูดไม่จบ',false)]});
 r.onresult({results:[result('รถผมโดนชน',true),result('ไฟท้ายแตก',true)]});
 session.stop();r.onend();
 assert.deepEqual(completed,['ข้อความเดิม\nรถผมโดนชน ไฟท้ายแตก',true]);
});
test('errors preserve original; disposed sessions cannot overwrite text',()=>{
 let completed, error;
 const session=createThaiDictation(Recognition,{base:'เดิม',onComplete:(...args)=>completed=args,onError:code=>error=code});
 Recognition.latest.onerror({error:'not-allowed'});session.stop();
 assert.equal(error,'not-allowed');assert.deepEqual(completed,['เดิม',false]);
 completed=null;
 const other=createThaiDictation(Recognition,{onComplete:()=>completed=true});other.dispose();Recognition.latest.onend();assert.equal(completed,null);
});
test('Thai collision sample produces formal facts without invented vehicle details',async()=>{
 const draft=await generateLegalDraft({details:'รถผมเพิ่งโดนชน ไฟท้ายแตก',eventDate:'2 ตุลาคม 2569 เวลา 10:00 น.',eventPlace:'ถนนทดสอบ'});
 assert.match(draft.formalNarrative,/ได้รับความเสียหายบริเวณไฟท้าย/);
 assert.doesNotMatch(draft.formalNarrative,/ด้านซ้าย|ด้านขวา|ชนท้าย|ไม่ทราบทะเบียน/);
 assert.ok(draft.missingQuestions.some(q=>q.includes('ทะเบียน')));
 const negative='รถผมไม่ได้โดนชน ไฟท้ายไม่ได้แตก';
 assert.ok((await generateLegalDraft({details:negative})).formalNarrative.includes(negative));
});

test('requested spoken phrase becomes a structured draft with explicit missing fields',async()=>{
 const draft=await generateLegalDraft({details:'ตอนนี้รถผมโดนชน ไฟท้ายพัง',eventDate:'2 ตุลาคม 2569 เวลา 14:00',eventPlace:'ถนนทดสอบ'});
 assert.match(draft.formalNarrative,/ข้าพเจ้าจึงประสงค์แจ้งความลงบันทึกประจำวัน/);
 assert.match(draft.formalNarrative,/2 ตุลาคม 2569 เวลา 14:00/);
 assert.match(draft.formalNarrative,/ถนนทดสอบ/);
 assert.match(draft.formalNarrative,/\[ระบุเลขทะเบียนรถ\]/);
 assert.doesNotMatch(draft.formalNarrative,/ชนแล้วหนี|ด้านท้ายรถ|ด้านซ้าย|ด้านขวา/);
});
