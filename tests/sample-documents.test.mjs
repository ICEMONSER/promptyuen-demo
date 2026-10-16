import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadSampleDocuments} from '../assets/sample-documents.js';
test('sample documents load distinct existing images and select stable categories',async()=>{
 const docs=await loadSampleDocuments(async url=>({ok:true,blob:async()=>new Blob([await readFile(url)])}));
 assert.deepEqual(docs.map(d=>d.id),['identity','license','vehicle']);
 assert.equal(new Set(docs.map(d=>d.size)).size,3);
 assert.ok(docs.every(d=>d.demo&&d.verified&&d.blob.size>0));
 assert.deepEqual(docs[2].fields,{});
});
test('missing sample fails rather than silently claiming documents exist',async()=>{
 await assert.rejects(loadSampleDocuments(async()=>({ok:false})),/โหลดเอกสารตัวอย่างไม่สำเร็จ/);
});
