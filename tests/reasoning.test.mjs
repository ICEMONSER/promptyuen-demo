import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateLegalDraft,legalDraftSource,validateLegalDraft} from '../assets/reasoning.js';
test('free local draft works without credentials or network and does not invent injuries',async()=>{
 const old=globalThis.fetch;globalThis.fetch=()=>{throw Error('network forbidden');};try{const draft=await generateLegalDraft({details:'โดนรถชน'});assert.match(draft.formalNarrative,/ตนถูกรถชน/);assert.doesNotMatch(draft.formalNarrative,/ได้รับบาดเจ็บ|ประมาท/);assert.ok(draft.missingQuestions.length);assert.equal(draft.knownFacts[0].quote,'โดนรถชน');}finally{globalThis.fetch=old;}
});
test('arbitrary facts are preserved without unsupported transformation',async()=>{const input={details:'ไม่ได้โดนรถชน แต่โทรศัพท์หาย',eventPlace:'จุดทดสอบ'};const draft=await generateLegalDraft(input);assert.ok(draft.formalNarrative.includes(input.details));assert.deepEqual(validateLegalDraft(draft,input),draft);assert.equal(legalDraftSource({...input,nationalId:'private'}),legalDraftSource(input));await assert.rejects(generateLegalDraft({details:''}));});
