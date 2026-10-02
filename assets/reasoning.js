import {formalizeIncident} from './incident-language.js';
const FIELDS = ["details", "eventDate", "eventPlace"];
const LIMITS = { details: 4000, eventDate: 80, eventPlace: 500 };
const RESPONSE_LIMIT = 64000;
const FORMAT_ERROR = "คำตอบจาก AI ไม่ตรงรูปแบบหรืออ้างข้อมูลที่ไม่ได้ระบุ กรุณาลองใหม่";
const REQUEST_ERROR = "เรียบเรียงสำนวนไม่สำเร็จ กรุณาตรวจการตั้งค่าบริการ AI และการเชื่อมต่อ แล้วลองใหม่";

function sourceFields(input) {
  return Object.fromEntries(
    FIELDS.map((field) => [field, typeof input?.[field] === "string" ? input[field].trim() : ""]),
  );
}

// Keep the exact submitted facts, without identity documents, evidence or coordinates.
// Compare this snapshot before displaying or printing a previously generated draft.
export function legalDraftSource(input) {
  return JSON.stringify(sourceFields(input));
}

function validatedInput(input) {
  const source = sourceFields(input);
  if (!source.details) throw new Error("กรุณาบอกเล่าเหตุการณ์ก่อนให้ AI เรียบเรียง");
  for (const field of FIELDS) {
    if (source[field].length > LIMITS[field])
      throw new Error("ข้อมูลเหตุการณ์ยาวเกินกำหนด กรุณาย่อรายละเอียดไม่เกิน 6,000 ตัวอักษร สถานที่ไม่เกิน 500 ตัวอักษร และวันเวลาไม่เกิน 80 ตัวอักษร");
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(source[field]))
      throw new Error("ข้อมูลเหตุการณ์มีอักขระที่ไม่รองรับ กรุณาตรวจข้อความอีกครั้ง");
  }
  return source;
}

function hasExactKeys(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key));
}

function boundedText(value, maximum, thai = false) {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= maximum &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value) &&
    (!thai || /[ก-๙]/u.test(value));
}

export function validateLegalDraft(data, input) {
  const invalid = () => { throw new Error(FORMAT_ERROR); };
  if (!hasExactKeys(data, ["formalNarrative", "knownFacts", "missingQuestions"]) ||
      !boundedText(data.formalNarrative, 6000, true) ||
      !data.formalNarrative.trim().startsWith("ผู้แจ้งให้ข้อมูลว่า") ||
      !Array.isArray(data.knownFacts) || data.knownFacts.length < 1 || data.knownFacts.length > 12 ||
      !Array.isArray(data.missingQuestions) || data.missingQuestions.length > 8)
    invalid();

  const source = input === undefined ? undefined : sourceFields(input);
  const seen = new Set();
  const knownFacts = data.knownFacts.map((fact) => {
    if (!hasExactKeys(fact, ["field", "quote"]) || !FIELDS.includes(fact.field) ||
        !boundedText(fact.quote, 1200) ||
        (source && !source[fact.field].includes(fact.quote)))
      invalid();
    const id = JSON.stringify([fact.field, fact.quote]);
    if (seen.has(id)) invalid();
    seen.add(id);
    return { field: fact.field, quote: fact.quote };
  });
  if (!knownFacts.some((fact) => fact.field === "details")) invalid();
  const missingQuestions = data.missingQuestions.map((question) => {
    if (!boundedText(question, 300, true)) invalid();
    return question.trim();
  });
  const draft = { formalNarrative: data.formalNarrative.trim(), knownFacts, missingQuestions };
  if (JSON.stringify(draft).length > 16000) invalid();
  return draft;
}

// Offline, deterministic demo; not a generative model and no external requests.
export async function generateLegalDraft(input) {
 const source=validatedInput(input);
 const knownFacts=FIELDS.filter(field=>source[field]).map(field=>({field,quote:source[field].slice(0,1200)}));
 const facts=formalizeIncident(source.details);
 const missingQuestions=[];
 if(!source.eventDate)missingQuestions.push('เหตุเกิดวันและเวลาใด');
 if(!source.eventPlace)missingQuestions.push('เหตุเกิดที่ใด');
 if(!facts.activity)missingQuestions.push('ขณะเกิดเหตุกำลังขับรถหรือจอดรถอยู่');
 missingQuestions.push('ยี่ห้อและทะเบียนรถของผู้แจ้ง รวมถึงรายละเอียดคู่กรณีที่ทราบคืออะไร');
 if(!facts.damages.length)missingQuestions.push('มีความเสียหายที่ส่วนใดของรถบ้าง');
 else if(!facts.damages.some(d=>/ด้านซ้าย|ด้านขวา/.test(d)))missingQuestions.push('ส่วนที่เสียหายอยู่ด้านใด');
 if(!facts.injury)missingQuestions.push('มีผู้ได้รับบาดเจ็บหรือไม่ และมีพยานหลักฐานใดบ้าง');
 const context=[source.eventDate ? `เมื่อ ${source.eventDate}` : '', source.eventPlace ? `ณ บริเวณ${source.eventPlace}` : ''].filter(Boolean).join(' ');
 const sentences=[
  `ผู้แจ้งให้ข้อมูลว่า ${context ? context+' ' : ''}${facts.activity ? facts.activity+' ' : ''}${facts.event}`,
  facts.damages.length ? `จากเหตุการณ์ดังกล่าว พบความเสียหาย ได้แก่ ${facts.damages.join(' และ ')}` : '',
  facts.injury,
  'ข้าพเจ้าจึงประสงค์แจ้งข้อเท็จจริงต่อพนักงานสอบสวนเพื่อบันทึกไว้เป็นหลักฐาน'
 ].filter(Boolean);
 return validateLegalDraft({formalNarrative:sentences.join('\n\n'),knownFacts,missingQuestions},source);
}
