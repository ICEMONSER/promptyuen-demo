import test from 'node:test';
import assert from 'node:assert/strict';
import {changeAccidentStation} from '../assets/accident-core.js';
const record={quickAccident:true,revision:2,location:{lat:13.77,lon:100.68},fields:{eventPlace:{value:'จุดเกิดเหตุเดิม'}},evidence:[{id:'sample'}],legalDraft:{narrative_th:'ข้อมูลเดิม'},governmentSubmitted:false};
test('changing destination preserves incident location, evidence and reviewed draft',()=>{
 const next=changeAccidentStation(record,{id:'manual',name:'สถานีที่เลือกเอง',manual:true,incident:{lat:14,lon:101},mapUrl:'javascript:alert(1)'},2);
 assert.deepEqual(next.location,record.location);assert.deepEqual(next.fields,record.fields);assert.deepEqual(next.evidence,record.evidence);assert.deepEqual(next.legalDraft,record.legalDraft);
 assert.equal(next.governmentSubmitted,false);assert.equal(next.revision,3);assert.equal(record.revision,2);
 assert.match(next.station.mapUrl,/^https:\/\/www.google.com\/maps\//);assert.deepEqual(next.station.incident,record.location);
});
test('rejects stale revision and invalid destination',()=>{
 assert.throws(()=>changeAccidentStation(record,{name:'สถานี',manual:true},1),/โหลดใหม่/);
 for(const station of [null,{name:''},{name:'สถานี',lat:200,lon:100}])assert.throws(()=>changeAccidentStation(record,station,2),/เลือกสถานี/);
});
