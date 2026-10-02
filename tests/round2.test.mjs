import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeAccident,trackingSteps,bangkokDateTime} from '../assets/accident-core.js';
import {renderReport} from '../assets/report.js';
import {legalDraftSource} from '../assets/reasoning.js';
import {legalInputFromRecord,reviewedLegalDraft} from '../assets/legal-review.js';
const now=new Date('2026-10-01T10:00:00Z');
const input={station:{id:'test-station',name:'สถานีทดสอบ',manual:true},when:'now',details:'ข้อมูลทดสอบการชน',eventPlace:'สถานที่ทดสอบ',evidence:[{name:'test.jpg',mime:'image/jpeg',image:'data:image/jpeg;base64,YQ=='}]};
const reviewedDocuments=()=>[
  {id:'identity',kind:'identity',verified:true,name:'บัตรตัวอย่าง',fields:{fullName:'นาย ทดสอบ ระบบ',phone:'0812345678',email:'test@gmail.com'}},
  {id:'license',kind:'license',verified:true,name:'ใบขับขี่ตัวอย่าง',fields:{licenseNumber:'TEST-LICENSE'}},
  {id:'vehicle',kind:'vehicle',verified:true,name:'ทะเบียนรถตัวอย่าง',fields:{plate:'TEST-PLATE'}},
];
const reviewedDraftFor=source=>({formalNarrative:'ผู้แจ้งให้ข้อมูลว่า มีเหตุรถชนตามคำบอกเล่าที่ระบุ',knownFacts:[{field:'details',quote:source.details}],missingQuestions:['เกิดเหตุในลักษณะใด'],source:legalDraftSource(source),reviewed:true,reviewedAt:now.toISOString()});
test('one-step case is only local, with honest tracking',()=>{const r=makeAccident(input,reviewedDocuments(),now);assert.equal(r.status,'simulated');assert.equal(r.governmentSubmitted,false);assert.equal(r.identityMissing,false);assert.equal(trackingSteps(r).filter(x=>x.done).length,1);assert.equal(r.fields.eventDate.value,bangkokDateTime(now));assert.deepEqual(r.documentIds,['identity','license','vehicle']);assert.match(r.reference,/^DEMO-/);});
test('all required documents must be present, selected and verified',()=>{
  assert.throws(()=>makeAccident(input,[],now),/เอกสารจำเป็น/);
  for(const kind of ['identity','license','vehicle']){
    const docs=reviewedDocuments();
    assert.throws(()=>makeAccident(input,docs.filter(doc=>doc.kind!==kind),now),/เอกสารจำเป็น/);
    assert.throws(()=>makeAccident({...input,documentIds:docs.filter(doc=>doc.kind!==kind).map(doc=>doc.id)},docs,now),/เอกสารจำเป็น/);
    docs.find(doc=>doc.kind===kind).verified=false;
    assert.throws(()=>makeAccident(input,docs,now),/เอกสารจำเป็น/);
  }
});
test('identity snapshot excludes unverified docs and unrelated fields',()=>{
  const docs=reviewedDocuments();
  docs.unshift({id:'unverified',kind:'identity',verified:false,name:'ยังไม่ตรวจ',fields:{fullName:'ไม่ควรนำมาใช้'}});
  const r=makeAccident(input,docs,now);
  assert.equal(r.fields.fullName.value,'นาย ทดสอบ ระบบ');
  assert.equal(r.fields.fullName.documentId,undefined);
  assert.equal(r.fields.phone.value,'0812345678');
  assert.equal(r.fields.email.value,'test@gmail.com');
  assert.ok(!r.documentIds.includes('unverified'));
  docs.find(doc=>doc.id==='identity').fields.fullName='changed';
  assert.equal(r.fields.fullName.value,'นาย ทดสอบ ระบบ');
});
test('requires evidence, details, location and valid past time',()=>{for(const delta of [{evidence:[]},{details:''},{eventPlace:''},{when:'past',eventDate:'bad'},{when:'past',eventDate:'2099-01-01T10:00'}])assert.throws(()=>makeAccident({...input,...delta},reviewedDocuments(),now));});
test('video evidence accepted, arbitrary data URL refused',()=>{assert.equal(makeAccident({...input,evidence:[{mime:'video/mp4',image:'data:video/mp4;base64,YQ=='}]},reviewedDocuments(),now).evidence.length,1);assert.throws(()=>makeAccident({...input,evidence:[{image:'data:text/html;base64,YQ=='}]},reviewedDocuments(),now));});
test('print escapes injected text and clearly labels simulated record',()=>{const r=makeAccident({...input,details:'<script>alert(1)</script>'},reviewedDocuments(),now);const html=renderReport(r,{label:'อุบัติเหตุ',short:'อุบัติเหตุ',note:'ยังไม่ส่งให้รัฐ'},{});assert.ok(!html.includes('<script>alert'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('ไม่ใช่เอกสารที่ออกหรือรับรอง'));});
test('legal draft input excludes identity documents and evidence',()=>{
  const r=makeAccident(input,reviewedDocuments(),now);
  assert.deepEqual(legalInputFromRecord(r),{details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace});
});
test('reviewed legal drafts accept review metadata and reject stale facts',()=>{
  const source={details:'โดนรถชน',eventDate:'1 ตุลาคม 2569',eventPlace:'ถนนทดสอบ'};
  const draft=reviewedDraftFor(source);
  const reviewed=reviewedLegalDraft(draft,source);
  assert.equal(reviewed?.formalNarrative,draft.formalNarrative);
  assert.equal(reviewed?.reviewedAt,now.toISOString());
  assert.equal(reviewedLegalDraft({...draft,reviewed:false},source),null);
  for(const field of ['details','eventDate','eventPlace']) assert.equal(reviewedLegalDraft(draft,{...source,[field]:'เปลี่ยนข้อมูล'}),null);
  assert.equal(reviewedLegalDraft({...draft,knownFacts:[{field:'details',quote:'ข้อมูลที่ไม่ได้บอก'}]},source),null);
});
test('accident submission preserves a reviewed narrative and its original facts',()=>{
  const source={details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace};
  const legalDraft=reviewedDraftFor(source);
  const record=makeAccident({...input,legalDraft},reviewedDocuments(),now);
  assert.deepEqual(record.legalDraft,legalDraft);
  assert.equal(record.fields.details.value,input.details);
  legalDraft.knownFacts[0].quote='changed after save';
  assert.equal(record.legalDraft.knownFacts[0].quote,input.details);
});
test('accident submission refuses unreviewed or stale legal drafts',()=>{
  const source={details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace};
  const legalDraft=reviewedDraftFor(source);
  assert.throws(()=>makeAccident({...input,legalDraft:{...legalDraft,reviewed:false}},reviewedDocuments(),now),/ร่างสำนวน/);
  assert.throws(()=>makeAccident({...input,details:'แก้ไขคำบอกเล่า',legalDraft},reviewedDocuments(),now),/ร่างสำนวน/);
});
test('incident time stays fixed while the user reviews an AI draft',()=>{
  const source={details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace};
  const submittedAt=new Date(now.getTime()+600000);
  const record=makeAccident({...input,incidentAt:now.toISOString(),legalDraft:reviewedDraftFor(source)},reviewedDocuments(),submittedAt);
  assert.equal(record.fields.eventDate.value,source.eventDate);
  assert.equal(record.submittedAt,submittedAt.toISOString());
  assert.equal(record.legalDraft.source,legalDraftSource(source));
  assert.throws(()=>makeAccident({...input,incidentAt:'invalid'},reviewedDocuments(),submittedAt),/วันเวลา/);
  assert.throws(()=>makeAccident({...input,incidentAt:new Date(submittedAt.getTime()+60000).toISOString()},reviewedDocuments(),submittedAt),/วันเวลา/);
});
test('printed police and accident reports retain reviewed narrative without AI notes or follow-up questions',()=>{
  const source={details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace};
  const legalDraft=reviewedDraftFor(source);
  const r=makeAccident({...input,legalDraft},reviewedDocuments(),now);
  const service={label:'อุบัติเหตุ',short:'อุบัติเหตุ',note:'ยังไม่ส่งให้รัฐ'};
  for(const kind of ['accident','police']){
    const html=renderReport({...r,service:kind},service,{});
    assert.ok(html.includes(legalDraft.formalNarrative));
    assert.ok(!html.includes(legalDraft.missingQuestions[0]));
    assert.ok(!html.includes('ประเด็นที่ยังต้องสอบถามเพิ่มเติม'));
    assert.ok(!html.includes('ร่างเรียบเรียงด้วย AI'));
    assert.ok(!html.includes('ผู้แจ้งตรวจข้อความแล้ว'));
    assert.ok(!html.includes('คำบอกเล่าต้นฉบับ'));
  }
});
test('reports never print stale or unreviewed AI text',()=>{
  const source={details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace};
  const legalDraft=reviewedDraftFor(source);
  const r=makeAccident({...input,legalDraft},reviewedDocuments(),now);
  const service={label:'อุบัติเหตุ',short:'อุบัติเหตุ',note:'ยังไม่ส่งให้รัฐ'};
  for(const record of [
    {...r,legalDraft:{...r.legalDraft,reviewed:false}},
    {...r,fields:{...r.fields,eventPlace:{value:'สถานที่ใหม่'}}},
  ]){
    const html=renderReport(record,service,{});
    assert.ok(!html.includes(legalDraft.formalNarrative));
    assert.ok(!html.includes(legalDraft.missingQuestions[0]));
  }
});
test('report escapes AI narrative and omits follow-up questions',()=>{
  const source={details:input.details,eventDate:bangkokDateTime(now),eventPlace:input.eventPlace};
  const legalDraft={...reviewedDraftFor(source),formalNarrative:'ผู้แจ้งให้ข้อมูลว่า <img src=x onerror=alert(1)>',missingQuestions:['พบพยานหรือไม่ <script>alert(1)</script>']};
  const r=makeAccident({...input,legalDraft},reviewedDocuments(),now);
  const html=renderReport(r,{label:'อุบัติเหตุ',short:'อุบัติเหตุ',note:'ยังไม่ส่งให้รัฐ'},{});
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<img src=x'));
  assert.ok(!html.includes('<script>'));
});

test('submission requires destination and retains retrieved station',()=>{assert.throws(()=>makeAccident({...input,station:null},reviewedDocuments(),now),/สถานีตำรวจ/);const station={id:'google-test',name:'สถานีผลค้นหา',provider:'google',distance:0.2,incident:{lat:13,lon:100}};const r=makeAccident({...input,station},reviewedDocuments(),now);assert.equal(r.station.id,'google-test');assert.ok(renderReport(r,{label:'ทดสอบ',short:'ทดสอบ'},{}).includes('พนักงานสอบสวน สถานีผลค้นหา'));});
