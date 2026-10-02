import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateLegalDraft,legalDraftSource,validateLegalDraft} from '../assets/reasoning.js';
test('free local draft works without credentials or network and does not invent injuries',async()=>{
 const old=globalThis.fetch;globalThis.fetch=()=>{throw Error('network forbidden');};try{const draft=await generateLegalDraft({details:'โดนรถชน'});assert.match(draft.formalNarrative,/ตนถูกรถชน/);assert.doesNotMatch(draft.formalNarrative,/ได้รับบาดเจ็บ|ประมาท/);assert.ok(draft.missingQuestions.length);assert.equal(draft.knownFacts[0].quote,'โดนรถชน');}finally{globalThis.fetch=old;}
});
test('unsupported accounts fail explicitly without fabricating a formal narrative',async()=>{
 const input={details:'ไม่ได้โดนรถชน แต่โทรศัพท์หาย',eventPlace:'จุดทดสอบ'};
 await assert.rejects(generateLegalDraft(input),/ยังเรียบเรียง/);
 assert.equal(legalDraftSource({...input,nationalId:'private'}),legalDraftSource(input));
 await assert.rejects(generateLegalDraft({details:''}));
});
