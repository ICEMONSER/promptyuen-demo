import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderReport} from '../assets/report.js';
import {legalDraftSource} from '../assets/reasoning.js';
const input={details:'รถถูกชน ไฟท้ายแตก',eventDate:'2026-10-02',eventPlace:'ถนนทดสอบ'};
const record={service:'accident',updatedAt:'2026-10-02T08:00:00Z',station:{name:'สถานีทดสอบ'},fields:Object.fromEntries(Object.entries({...input,fullName:'ผู้แจ้งทดสอบ',address:'ที่อยู่ทดสอบ'}).map(([k,value])=>[k,{value}])),evidence:[]};
test('letter uses reviewed narrative in body and preserves source in separate annex',()=>{
 const draft={formalNarrative:'ผู้แจ้งให้ข้อมูลว่า รถยนต์ของข้าพเจ้าถูกชน',knownFacts:[{field:'details',quote:input.details}],missingQuestions:['เหตุเกิดเวลาใด'],source:legalDraftSource(input),reviewed:true};
 const html=renderReport({...record,legalDraft:draft},{short:'แจ้งเหตุ'},{});
 assert.ok(html.includes('ขอแสดงความนับถือ'));
 assert.ok(html.indexOf(draft.formalNarrative)<html.indexOf('<section class="letter-annex">'));
 assert.ok(html.indexOf(input.details)>html.indexOf('<section class="letter-annex">'));
 assert.ok(html.includes('พนักงานสอบสวน สถานีทดสอบ'));
 assert.ok(html.includes('ระบุสังกัด'));
 assert.ok(html.includes('alt="ตราครุฑตามแบบฟอร์ม"'));
 assert.ok(html.includes('contenteditable="true"'));
 assert.ok(html.includes('โทรสาร'));
 assert.ok(html.includes('ไปรษณีย์อิเล็กทรอนิกส์'));
});
test('attachments and letter fields are escaped; stale drafts cannot print',()=>{
 const html=renderReport({...record,station:{name:'<script>bad</script>'},legalDraft:{reviewed:true,source:'stale',formalNarrative:'STALE'}},{short:'แจ้งเหตุ'},{},[{name:'<b>copy</b>',image:'data:image/png;base64,AA'}]);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('STALE'));
 assert.ok(html.includes('&lt;b&gt;copy&lt;/b&gt;'));
});
