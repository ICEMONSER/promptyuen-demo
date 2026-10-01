import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { generateLegalDraft, legalDraftSource, validateLegalDraft } from "../assets/reasoning.js";

const input = { details: "โดนรถชน", eventDate: "", eventPlace: "" };
const draft = {
  formalNarrative: "ผู้แจ้งให้ข้อมูลว่า ตนถูกรถชน โดยยังไม่ได้ระบุวัน เวลา สถานที่ และรายละเอียดเพิ่มเติมเกี่ยวกับเหตุการณ์",
  knownFacts: [{ field: "details", quote: "โดนรถชน" }],
  missingQuestions: ["เหตุเกิดวันและเวลาใด", "เหตุเกิดที่ใด", "มีผู้บาดเจ็บหรือทรัพย์สินเสียหายหรือไม่"],
};
const settings = { endpoint: "https://existing.example/v1/chat/completions", key: "test-secret", model: "existing-model" };
const originalFetch = globalThis.fetch;
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");

function useSettings(value = settings) {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem(name) { assert.equal(name, "promptyuen-ai"); return JSON.stringify(value); } },
  });
}

function completion(value = draft, finishReason = "stop") {
  return new Response(JSON.stringify({ choices: [{ finish_reason: finishReason, message: { content: JSON.stringify(value) } }] }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalStorage) Object.defineProperty(globalThis, "sessionStorage", originalStorage);
  else delete globalThis.sessionStorage;
});

test("requires explicit consent before accessing settings or making requests", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("unexpected fetch"); };
  for (const consent of [undefined, false, "true", 1])
    await assert.rejects(generateLegalDraft(input, consent), /อนุญาตส่งคำบอกเล่า/);
  assert.equal(calls, 0);
});

test("reuses configured endpoint and sends only the three narrative fields", async () => {
  useSettings();
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, settings.endpoint);
    assert.equal(options.headers.Authorization, "Bearer test-secret");
    assert.equal(options.credentials, "omit");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.equal(body.model, "existing-model");
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(body.messages.length, 2);
    assert.deepEqual(JSON.parse(body.messages[1].content), input);
    assert.match(body.messages[0].content, /ห้ามแต่งข้อมูล/);
    assert.match(body.messages[0].content, /ห้ามแปลคำว่าโดนรถชนเป็นได้รับบาดเจ็บหรือรถเสียหาย/);
    assert.match(body.messages[0].content, /ห้ามเปิดเผยกระบวนการคิด/);
    assert.ok(!options.body.includes("private-document"));
    assert.ok(!options.body.includes("13.12345"));
    return completion();
  };
  assert.deepEqual(await generateLegalDraft({
    ...input, fullName: "private-document", id: "private-document", evidence: ["private-document"],
    latitude: 13.12345, longitude: 100.1, documents: ["private-document"],
  }, true), draft);
  assert.equal(calls, 1);
});

test("source snapshots ignore unrelated private data and detect changes to relevant facts", () => {
  assert.equal(legalDraftSource({ ...input, details: "  โดนรถชน  ", id: "private" }), legalDraftSource(input));
  assert.equal(legalDraftSource({}), '{"details":"","eventDate":"","eventPlace":""}');
  for (const field of ["details", "eventDate", "eventPlace"])
    assert.notEqual(legalDraftSource(input), legalDraftSource({ ...input, [field]: "เปลี่ยนแล้ว" }));
});

test("requires existing settings and prevents unsafe endpoints even if storage was altered", async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return completion(); };
  for (const value of [{}, null, { ...settings, key: " " }, { ...settings, model: {} }]) {
    useSettings(value);
    await assert.rejects(generateLegalDraft(input, true), /ตั้งค่า/);
  }
  for (const endpoint of ["http://example.com/v1", "https://u:p@example.com/v1", "https://example.com/v1?key=secret", "https://example.com/v1#secret", "invalid"]) {
    useSettings({ ...settings, endpoint });
    await assert.rejects(generateLegalDraft(input, true), /ที่อยู่บริการ/);
  }
  assert.equal(calls, 0);
});

test("rejects missing or oversized facts before sending a request", async () => {
  useSettings();
  let calls = 0;
  globalThis.fetch = async () => { calls++; return completion(); };
  for (const value of [{}, { ...input, details: " " }, { ...input, details: "ก".repeat(6001) }, { ...input, eventPlace: "ก".repeat(501) }, { ...input, eventDate: "1".repeat(81) }, { ...input, details: "โดน\u0000รถชน" }])
    await assert.rejects(generateLegalDraft(value, true));
  assert.equal(calls, 0);
});

test("validates source excerpts against the precise field and refuses invented or duplicate quotes", () => {
  assert.deepEqual(validateLegalDraft(draft, input), draft);
  for (const knownFacts of [
    [{ field: "details", quote: "รถเสียหาย" }],
    [{ field: "eventPlace", quote: "โดนรถชน" }],
    [{ field: "details", quote: " โดนรถชน " }],
    [{ field: "latitude", quote: "13.1" }],
    [draft.knownFacts[0], draft.knownFacts[0]],
    [],
  ]) assert.throws(() => validateLegalDraft({ ...draft, knownFacts }, input), /อ้างข้อมูลที่ไม่ได้ระบุ/);
  const completeInput = { ...input, eventDate: "2026-10-02T10:00", eventPlace: "หน้าร้าน ก" };
  assert.equal(validateLegalDraft({ ...draft, knownFacts: [
    ...draft.knownFacts, { field: "eventDate", quote: completeInput.eventDate }, { field: "eventPlace", quote: "หน้าร้าน ก" },
  ] }, completeInput).knownFacts.length, 3);
});

test("bounded schema rejects raw reasoning, missing attribution, wrong types and oversized output", () => {
  const bad = [
    { ...draft, reasoning: "private reasoning" },
    { ...draft, formalNarrative: "รถยนต์ขับโดยประมาทชนผู้แจ้ง" },
    { ...draft, formalNarrative: "ผู้แจ้งให้ข้อมูลว่า" + "ก".repeat(6000) },
    { ...draft, knownFacts: [{ ...draft.knownFacts[0], reasoning: "private" }] },
    { ...draft, knownFacts: "โดนรถชน" },
    { ...draft, missingQuestions: "เกิดเมื่อใด" },
    { ...draft, missingQuestions: ["a".repeat(301)] },
    { ...draft, missingQuestions: Array(9).fill("เกิดเมื่อใด") },
  ];
  for (const value of bad) assert.throws(() => validateLegalDraft(value, input), /คำตอบจาก AI/);
});

test("malformed JSON, direct JSON, incomplete completions, and ungrounded answers never produce a fallback draft", async () => {
  useSettings();
  const responses = [
    new Response("not-json secret-test"),
    new Response(JSON.stringify(draft)),
    new Response(JSON.stringify({ choices: [{ message: { content: "```json\n{}\n```" } }] })),
    completion(draft, "length"),
    completion({ ...draft, knownFacts: [{ field: "details", quote: "ขาหัก" }] }),
  ];
  for (const response of responses) {
    globalThis.fetch = async () => response;
    await assert.rejects(generateLegalDraft(input, true), (error) => {
      assert.ok(!error.message.includes("secret-test"));
      assert.match(error.message, /ไม่สำเร็จ|คำตอบจาก AI/);
      return true;
    });
  }
});

test("provider errors do not leak keys, endpoint, payload, or raw response", async () => {
  useSettings();
  const secret = "test-secret https://existing.example/v1/chat/completions private-response";
  for (const fail of [
    async () => { throw new Error(secret); },
    async () => new Response(secret, { status: 401 }),
    async () => { throw new DOMException(secret, "TimeoutError"); },
  ]) {
    globalThis.fetch = fail;
    await assert.rejects(generateLegalDraft(input, true), (error) => {
      assert.match(error.message, /เรียบเรียงสำนวนไม่สำเร็จ/);
      assert.ok(!error.message.includes("test-secret"));
      assert.ok(!error.message.includes("existing.example"));
      assert.ok(!error.message.includes("private-response"));
      return true;
    });
  }
});

test("limits response bytes with and without Content-Length", async () => {
  useSettings();
  for (const response of [
    new Response("{}", { headers: { "Content-Length": "64001" } }),
    new Response("ก".repeat(22000)),
  ]) {
    globalThis.fetch = async () => response;
    await assert.rejects(generateLegalDraft(input, true), /คำตอบจาก AI/);
  }
});
