import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderReport} from '../assets/report.js';
import {legalDraftSource} from '../assets/reasoning.js';
const input={details:'รถถูกชน ไฟท้ายแตก',eventDate:'2026-10-02',eventPlace:'ถนนทดสอบ'};
const record={service:'accident',updatedAt:'2026-10-02T08:00:00Z',station:{name:'สถานีทดสอบ'},fields:Object.fromEntries(Object.entries({...input,fullName:'ผู้แจ้งทดสอบ',address:'ที่อยู่ทดสอบ'}).map(([k,value])=>[k,{value}])),evidence:[]};
test('letter uses reviewed narrative in body without the original account annex',()=>{
 const draft={formalNarrative:'ผู้แจ้งให้ข้อมูลว่า รถยนต์ของข้าพเจ้าถูกชน',knownFacts:[{field:'details',quote:input.details}],missingQuestions:['เหตุเกิดเวลาใด'],source:legalDraftSource(input),reviewed:true};
 const html=renderReport({...record,legalDraft:draft},{short:'แจ้งเหตุ'},{});
 assert.ok(html.includes('ขอแสดงความนับถือ'));
 assert.ok(html.indexOf(draft.formalNarrative)<html.indexOf('<section class="letter-annex">'));
 assert.ok(!html.includes(input.details));
 assert.ok(html.includes('พนักงานสอบสวน สถานีทดสอบ'));
 assert.ok(!html.includes('ระบุสังกัด'));
 assert.ok(!html.includes('ระบุตำแหน่ง'));
 assert.ok(!html.includes('สิ่งที่ส่งมาด้วย'));
 assert.ok(html.includes('alt="ตราครุฑตามแบบฟอร์ม"'));
 assert.ok(html.includes('contenteditable="true"'));
 assert.ok(!html.includes('โทรสาร'));
 assert.ok(!html.includes('ระบุผู้รับสำเนา'));
 assert.ok(html.includes('ไปรษณีย์อิเล็กทรอนิกส์'));
});
test('attachments and letter fields are escaped; stale drafts cannot print',()=>{
 const html=renderReport({...record,station:{name:'<script>bad</script>'},legalDraft:{reviewed:true,source:'stale',formalNarrative:'STALE'}},{short:'แจ้งเหตุ'},{},[{name:'<b>copy</b>',image:'data:image/png;base64,AA'}]);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('STALE'));
 assert.ok(!html.includes('copy&lt;'));
 assert.ok(html.includes('สำเนาเอกสาร 1'));
 assert.ok(html.includes('data:image/png;base64,AA'));
});

test('current location links use incident coordinates and preserve evidence without filenames',()=>{
 const item={...record,location:{lat:13.75,lon:100.5},fields:{...record.fields,eventPlace:{value:'ตำแหน่งปัจจุบัน'},details:{value:'อยู่ที่ตำแหน่งปัจจุบัน <script>bad</script>'}},evidence:[{name:'private-file.jpg',image:'data:image/jpeg;base64,AA'}]};
 const html=renderReport(item,{short:'แจ้งเหตุ'},{},[{kind:'identity',name:'private-id.png',image:'data:image/jpeg;base64,BB'}]);
 assert.equal((html.match(/<strong>ตำแหน่งปัจจุบัน<\/strong>/g)||[]).length,2);
 assert.ok(html.includes('query=13.75%2C100.5'));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('private-file'));assert.ok(!html.includes('private-id'));
 assert.ok(html.includes('สำเนาบัตรประจำตัวประชาชน'));
 assert.ok(html.includes('data:image/jpeg;base64,AA'));assert.ok(html.includes('data:image/jpeg;base64,BB'));
 const missing=renderReport({...item,location:null},{short:'แจ้งเหตุ'},{});
 assert.ok(!missing.includes('maps/search'));assert.ok(missing.includes('<strong>ตำแหน่งปัจจุบัน</strong>'));
});
