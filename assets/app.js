import { LegalDraftPanel } from './legal-draft.js';
import { legalInputFromRecord, reviewedLegalDraft } from './legal-review.js';
import { legalDraftSource } from './reasoning.js';
import { EvidencePanel } from "./evidence.js";
import { AI_LABEL, validateAnalysis } from "./vision.js";
import { selectDocuments } from "./case-config.js";
import { DocumentChecklist } from "./document-checklist.js";
import { SignaturePad, LocalLogin, certifiedCopy } from "./signature.js";
import { StationPicker } from "./stations.js?v=20261002-auto";
import { AccidentFlow, CaseTracking } from "./accident.js?v=20261002-auto";
import { makeAccident, changeAccidentStation } from "./accident-core.js?v=20261002-auto";
import {
  readWorkspace,
  writeWorkspace,
  clearWorkspace,
  pendingDocs,
} from "./store.js";
import {
  readIdPhoto,
  readLicenseQR,
  validThaiId,
  normalizeDigits,
} from "./import-document.js";
import { renderReport } from "./report.js";
// Existing application extracted from the shipped bundle; shared UI is unchanged.
import {
  c,
  u,
  D,
  M,
  N,
  ee,
  P,
  I,
  re,
  ie,
  L,
  R,
  ae,
  z,
  oe,
  se,
  le,
  ue,
  de,
  fe,
  pe,
  ge,
  _e,
  ve,
  ye,
  be,
  xe,
  Se,
  we,
  Ee,
  B,
  Om,
  km,
  Mm,
  Nm,
  Pm,
  Fm,
  Im,
  Ym,
  Xm,
  Zm,
  Qm,
  $m,
  eh,
  th,
  nh,
  ih,
  ah,
  ch,
  lh,
  uh,
  dh,
  fh,
  hh,
  gh,
  _h,
  vh,
  yh,
  bh,
  xh,
  Sh,
  Ch,
  wh,
  Th,
  Eh,
  kh,
  Ah,
  Zh,
  pg,
} from "./shared-ui.js";
var mg = c({
    classify: () => bg,
    deriveFields: () => Sg,
    documentKinds: () => gg,
    fieldLabels: () => hg,
    fieldsFromOcr: () => xg,
    missingFields: () => yg,
    personalFields: () => vg,
    services: () => _g,
  }),
  hg = {
    fullName: `ชื่อ–นามสกุล`,
    licenseNumber: `เลขที่ใบอนุญาตขับรถ`,
    nationalId: `เลขประจำตัวประชาชน`,
    birthDate: `วันเดือนปีเกิด`,
    address: `ที่อยู่`,
    phone: `เบอร์โทรศัพท์`,
    plate: `ทะเบียนรถ`,
    contractNumber: `เลขที่สัญญา`,
    eventDate: `วันที่เกิดเหตุ`,
    eventPlace: `สถานที่เกิดเหตุ`,
    details: `รายละเอียดเรื่อง`,
    newName: `ชื่อใหม่ที่ต้องการ`,
    reason: `เหตุผล`,
    district: `เขต / อำเภอที่ติดต่อ`,
    provider: `บริษัท / คู่สัญญา`,
    expiryDate: `วันที่สัญญาสิ้นสุด`,
    recipient: `หน่วยงาน / ผู้รับเรื่อง`,
  },
  gg = {
    identity: `บัตรประชาชน`,
    license: `ใบอนุญาตขับขี่รถยนต์/รถจักรยานยนต์`,
    house: `ทะเบียนบ้าน`,
    vehicle: `สมุดคู่มือจดทะเบียนรถ`,
    insurance: `กรมธรรม์ประกันภัยรถยนต์`,
    name: `เอกสารเปลี่ยนชื่อ`,
    military: `เอกสารทหาร`,
    other: `เอกสารอื่น`,
  },
  _g = {
    police: {
      label: `เตรียมข้อมูลแจ้งความ / ลงบันทึกประจำวัน`,
      short: `แจ้งความ / ลงบันทึก`,
      agency: `สถานีตำรวจที่ผู้ใช้เลือก`,
      required: [`fullName`, `address`, `eventDate`, `eventPlace`, `details`],
      optional: [`phone`],
      intro: `ต้องการเตรียมข้อมูลแจ้งความเรื่องอะไรครับ? เล่าเหตุการณ์ วันที่ และสถานที่ได้เลย`,
      note: `เป็นบันทึกเตรียมข้อมูล ไม่ใช่ใบแจ้งความหรือหลักฐานการรับแจ้งจากตำรวจ กรณีฉุกเฉินโทร 191`,
    },
    vehicle_contract: {
      label: `ขอต่ออายุสัญญารถ`,
      short: `ต่ออายุสัญญารถ`,
      agency: `บริษัทหรือคู่สัญญาที่ผู้ใช้ระบุ`,
      required: [
        `fullName`,
        `provider`,
        `contractNumber`,
        `plate`,
        `expiryDate`,
        `details`,
      ],
      optional: [`address`, `phone`],
      intro: `เป็นสัญญาเช่า ลีสซิ่ง หรือสัญญาประเภทใด และต้องการต่อถึงเมื่อไรครับ?`,
      note: `เรื่องสัญญาต้องติดต่อคู่สัญญาโดยตรง ไม่ใช่การต่อภาษีรถ ข้อตกลงมีผลเมื่อคู่สัญญายอมรับ`,
    },
    vehicle_tax: {
      label: `เตรียมข้อมูลต่อภาษีรถ`,
      short: `ต่อภาษีรถ`,
      agency: `กรมการขนส่งทางบก`,
      required: [`fullName`, `plate`, `details`],
      optional: [`address`, `phone`],
      intro: `ต้องการต่อภาษีรถทะเบียนอะไร และเป็นรถประเภทใดครับ?`,
      note: `ต้นแบบช่วยจัดข้อมูลเท่านั้น ให้ตรวจเงื่อนไขและชำระเงินผ่านช่องทางทางการของกรมการขนส่งทางบก`,
    },
    name_change: {
      label: `เตรียมคำขอเปลี่ยนชื่อ`,
      short: `เปลี่ยนชื่อ`,
      agency: `สำนักทะเบียนเขต / อำเภอที่ผู้ใช้เลือก`,
      required: [`fullName`, `address`, `newName`, `reason`, `district`],
      optional: [`birthDate`, `phone`],
      intro: `ต้องการเปลี่ยนชื่อเป็นอะไร และเพราะเหตุใดครับ?`,
      note: `เป็นร่างเตรียมข้อมูล ไม่ใช่แบบ ช.1 ที่รับรองโดยหน่วยงาน ต้องตรวจเงื่อนไขและแบบที่สำนักทะเบียนกำหนด`,
    },
    military: {
      label: `เตรียมข้อมูลขึ้นทะเบียนทหารกองเกิน`,
      short: `ขึ้นทะเบียนทหาร`,
      agency: `หน่วยสัสดีเขต / อำเภอที่ผู้ใช้เลือก`,
      required: [`fullName`, `birthDate`, `address`, `district`],
      optional: [`phone`, `details`],
      intro: `ต้องการขึ้นทะเบียนในเขตหรืออำเภอใดครับ? ระบบจะช่วยรวบรวมข้อมูลที่คุณยืนยันแล้ว`,
      note: `ต้นแบบไม่วินิจฉัยหน้าที่ กำหนดเวลา หรือคุณสมบัติตามกฎหมาย โปรดตรวจสอบกับหน่วยสัสดีโดยตรง`,
    },
    general: {
      label: `เตรียมคำร้องทั่วไป`,
      short: `คำร้องทั่วไป`,
      agency: `หน่วยงานที่ผู้ใช้ระบุ`,
      required: [`fullName`, `recipient`, `details`],
      optional: [`address`, `phone`],
      intro: `ต้องการติดต่อหน่วยงานใด และขอให้ช่วยดำเนินการเรื่องอะไรครับ?`,
      note: `ร่างกลางสำหรับเตรียมข้อมูล ต้องปรับเข้ากับแบบฟอร์มและข้อกำหนดของผู้รับเรื่อง`,
    },
  },
  vg = [
    `licenseNumber`,
    `fullName`,
    `nationalId`,
    `birthDate`,
    `address`,
    `phone`,
    `plate`,
    `contractNumber`,
    `expiryDate`,
  ],
  yg = (e, t) =>
    _g[e].required.filter((e) => !t[e]?.value?.trim() || t[e]?.conflict);
_g.police.optional = ["nationalId", "birthDate", "phone"];
_g.accident = {
  ..._g.police,
  label: "เตรียมข้อมูลแจ้งความอุบัติเหตุทางรถ",
  short: "อุบัติเหตุทางรถ",
  optional: [..._g.police.optional, "plate"],
  intro: "กรุณาระบุข้อมูลที่ยังขาดเพื่อเตรียมรายงานอุบัติเหตุ",
};
function bg(e) {
  if (/อุบัติเหตุ|รถชน|เฉี่ยวชน/.test(e)) return "accident";
  return /ภาษีรถ|ต่อภาษี|ต่อทะเบียนรถ/.test(e)
    ? `vehicle_tax`
    : /สัญญา|ลีสซิ่ง|เช่ารถ/.test(e)
      ? `vehicle_contract`
      : /เปลี่ยนชื่อ|เปลี่ยนนามสกุล/.test(e)
        ? `name_change`
        : /ทหาร|สัสดี|สด\.9/.test(e)
          ? `military`
          : /แจ้งความ|หาย|ขโมย|ตำรวจ|ลงบันทึก/.test(e)
            ? `police`
            : `general`;
}
function xg(e) {
  let t = {},
    n = (e) => e.replace(/^[\s=|_:：–—-]+/u, ``).trim(),
    r = e
      .normalize(`NFC`)
      .replace(/[๐-๙]/g, (e) => String(e.charCodeAt(0) - 3664))
      .split(/\r?\n/)
      .map(n)
      .filter(Boolean),
    i = {
      fullName: [
        `ชื่อ-นามสกุล`,
        `ชื่อ–นามสกุล`,
        `ชื่อและนามสกุล`,
        `ชื่อตัวและชื่อสกุล`,
        `ชื่อตัวและชื่อสกุล`,
        `ชื่อ`,
      ],
      nationalId: [
        `เลขประจำตัวประชาชน`,
        `เลขบัตรประชาชน`,
        `Identification Number`,
        `ID Number`,
      ],
      address: [`ที่อยู่`, `Address`],
      birthDate: [
        `วันเดือนปีเกิด`,
        `เกิดวันที่`,
        `วันเกิด`,
        `Date of Birth`,
        `DOB`,
      ],
      phone: [`เบอร์โทรศัพท์`, `โทรศัพท์`, `โทร`, `Phone`],
      plate: [`ทะเบียนรถ`, `เลขทะเบียน`],
      contractNumber: [`เลขที่สัญญา`],
      expiryDate: [`วันที่สัญญาสิ้นสุด`, `วันสิ้นสุด`],
    },
    a = (e) =>
      RegExp(
        `^` +
          [...e]
            .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`))
            .join(`\\s*`) +
          `[\\s:：]*`,
        `iu`,
      ),
    o = (e) =>
      Object.values(i)
        .flat()
        .some((t) => a(t).test(e)) ||
      /^(?:Last\s*name|Surname|Name|วันออกบัตร|วันหมดอายุ|Date of (?:Issue|Expiry)|ศาสนา)/i.test(
        e,
      );
  for (let [e, s] of Object.entries(i))
    for (let i = 0; i < r.length; i++) {
      let c = r[i],
        l = s.map((e) => a(e).exec(c)).find(Boolean);
      if (!l) continue;
      let u = n(c.slice(l[0].length));
      if ((!u && r[i + 1] && !o(r[i + 1]) && (u = r[i + 1]), e === `address`))
        for (
          let e = i + 1;
          e <= i + 3 &&
          e < r.length &&
          !(
            o(r[e]) ||
            !/^(?:แขวง|เขต|ตำบล|อำเภอ|จังหวัด|ถนน|ซอย|หมู่|ต\.|อ\.|จ\.|กรุงเทพ)/.test(
              r[e],
            )
          );
          e++
        )
          u += ` ` + r[e];
      u && !t[e] && (t[e] = u.slice(0, 500));
    }
  if (!t.fullName) {
    let e = r.find((e) =>
      /(?:นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*[ก-๙]+\s+[ก-๙]+/.test(e),
    );
    e &&
      (t.fullName = e.match(
        /(?:นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.)\s*[ก-๙]+(?:\s+[ก-๙]+)+/,
      )[0]);
  }
  if (!t.fullName) {
    let e = r
        .map((e) =>
          /^(?:Name|First\s*name|Given\s*name)\s*[:：]?\s+(.+)/i.exec(e),
        )
        .find(Boolean)?.[1],
      n = r
        .map((e) => /^(?:Last\s*name|Surname)\s*[:：]?\s+(.+)/i.exec(e))
        .find(Boolean)?.[1];
    e && (t.fullName = [e, n].filter(Boolean).join(` `));
  }
  let s = [
    ...new Set(
      r.flatMap((e) =>
        Array.from(e.matchAll(/\d(?:[ -]*\d)*/g), (e) =>
          e[0].replace(/[ -]/g, ``),
        ).filter((e) => e.length === 13),
      ),
    ),
  ];
  if (t.nationalId) {
    let e = t.nationalId.replace(/[\s-]/g, ``);
    /^\d{13}$/.test(e) ? (t.nationalId = e) : delete t.nationalId;
  }
  !t.nationalId && s.length === 1 && (t.nationalId = s[0]);
  let c =
    /\b\d{1,2}\s*(?:ม\.?\s*ค\.?|ก\.?\s*พ\.?|มี\.?\s*ค\.?|เม\.?\s*ย\.?|พ\.?\s*ค\.?|มิ\.?\s*ย\.?|ก\.?\s*ค\.?|ส\.?\s*ค\.?|ก\.?\s*ย\.?|ต\.?\s*ค\.?|พ\.?\s*ย\.?|ธ\.?\s*ค\.?|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|Jan\w*\.?|Feb\w*\.?|Mar\w*\.?|Apr\w*\.?|May|Jun\w*\.?|Jul\w*\.?|Aug\w*\.?|Sep\w*\.?|Oct\w*\.?|Nov\w*\.?|Dec\w*\.?)\s*(?:พ\.ศ\.\s*)?\d{4}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/i;
  if (t.birthDate) {
    let e = t.birthDate.match(c);
    e ? (t.birthDate = e[0]) : delete t.birthDate;
  }
  return t;
}
function Sg(e, t) {
  let n = [..._g[t].required, ..._g[t].optional],
    r = {};
  for (let t of e)
    if (t.verified)
      for (let [e, i] of Object.entries(t.fields))
        !n.includes(e) ||
          !i.trim() ||
          (r[e] && r[e].value !== i
            ? (r[e] = {
                value: ``,
                source: `ข้อมูลต่างกันระหว่างเอกสาร กรุณาเลือกค่าที่ถูกต้อง`,
                conflict: !0,
              })
            : r[e] || (r[e] = { value: i, source: t.name, documentId: t.id }));
  return r;
}
const wg = readWorkspace;
const Tg = writeWorkspace;
function Eg(e, t, n) {
  (e.events.unshift({
    action: t,
    target: n,
    created_at: new Date().toISOString(),
  }),
    (e.events = e.events.slice(0, 80)));
}
var Dg = Promise.resolve();
async function Og(e, t, n = `POST`) {
  let r = Dg.then(() =>
    navigator.locks
      ? navigator.locks.request("promptyuen-write", () => kg(e, t, n))
      : kg(e, t, n),
  );
  return ((Dg = r.catch(() => {})), r);
}
async function kg(e, t, n) {
  let r = new URL(e, `https://demo.invalid`),
    i = await wg(),
    a = r.searchParams.get(`id`) || t?.id;
  if (r.pathname === '/api/accident' && n === 'POST') {
    const record = makeAccident(t, i.documents);
    i.cases.unshift(record);
    await Tg(i);
    return {case:record};
  }
  if (r.pathname === `/api/workspace`) {
    if (n === `GET`)
      return {
        user: { name: `พื้นที่ในเบราว์เซอร์นี้` },
        documents: i.documents.map(({ blob: e, ...t }) => t),
        cases: i.cases,
        events: i.events,
        aiEnabled: !1,
        signature: i.signature,
      };
    if (t?.action === `clear`) {
      await clearWorkspace();
      return { ok: true };
    }
    if (t?.action === `signature`) {
      if (
        t.signature !== null &&
        (typeof t.signature !== "string" ||
          !t.signature.startsWith("data:image/png;base64,") ||
          t.signature.length > 2000000)
      )
        throw Error("ลายมือชื่อไม่ถูกต้อง");
      i.signature = t.signature;
      await Tg(i);
      return { ok: true };
    }
    if (t?.action !== `demo`) throw Error(`รายการไม่ถูกต้อง`);
    let e = `identity`;
    return (
      i.documents.some((t) => t.id === e) ||
        (i.documents.unshift({
          id: e,
          name: `ข้อมูลตัวอย่าง · ไม่ใช่บุคคลจริง`,
          kind: `identity`,
          mime: `text/plain`,
          size: 0,
          fields: {
            fullName: `นาย พร้อมยื่น ทดลอง`,
            nationalId: `DEMO-0001`,
            birthDate: `1 มกราคม 2549`,
            address: `99 ถนนตัวอย่าง กรุงเทพมหานคร`,
            phone: `000-000-0000`,
          },
          rawText: `ข้อมูลสมมติ ไม่ใช่เอกสารราชการ`,
          verified: !0,
          demo: !0,
          createdAt: new Date().toISOString(),
          method: `sample`,
        }),
        Eg(i, `เพิ่มข้อมูลจำลอง`, e),
        await Tg(i)),
      { id: e }
    );
  }
  if (r.pathname === `/api/documents`) {
    if (n === `POST`) {
      let e = t?.get(`file`),
        n = t?.get(`kind`);
      if (t?.get(`consent`) !== `true`) throw Error(`กรุณาอนุญาตเก็บข้อมูล`);
      if (
        !(e instanceof File) ||
        !e.size ||
        e.size > 8 * 1024 * 1024 ||
        ![`image/jpeg`, `image/png`, `application/pdf`].includes(e.type) ||
        !gg[n]
      )
        throw Error(`ใช้ไฟล์เจเพ็ก พีเอ็นจี หรือพีดีเอฟ ไม่เกิน 8 เมกะไบต์`);
      let r = new Uint8Array(await e.slice(0, 5).arrayBuffer());
      if (
        !(e.type === `application/pdf`
          ? new TextDecoder().decode(r) === `%PDF-`
          : e.type === `image/png`
            ? r[0] === 137 && r[1] === 80 && r[2] === 78 && r[3] === 71
            : r[0] === 255 && r[1] === 216 && r[2] === 255)
      )
        throw Error(`ประเภทไฟล์ไม่ตรงกับเนื้อหา`);
      if (i.documents.length >= 30) throw Error(`ทดลองได้สูงสุด 30 เอกสาร`);
      let a = {
        id: "pending:" + n,
        name: e.name,
        kind: n,
        mime: e.type,
        size: e.size,
        blob: e,
        fields: {},
        rawText: ``,
        verified: !1,
        demo: !1,
        createdAt: new Date().toISOString(),
        method: `manual`,
      };
      pendingDocs.set(a.id, a);
      let { blob: o, ...s } = a;
      return { document: s };
    }
    let e = pendingDocs.get(a) || i.documents.find((e) => e.id === a);
    if (!e) throw Error(`ไม่พบเอกสาร`);
    if (n === `GET`) {
      if (!e.blob) throw Error(`ตัวอย่างไม่มีไฟล์ต้นฉบับ`);
      return new Response(e.blob, { headers: { "Content-Type": e.mime } });
    }
    if (n === `DELETE`)
      return (
        (i.documents = i.documents.filter((e) => e.id !== a)),
        Eg(i, `ลบเอกสารในเบราว์เซอร์`, a),
        await Tg(i),
        { ok: !0 }
      );
    if (t.action === `verify`) {
      let n = Object.fromEntries(
        Object.entries(t.fields || {}).filter(
          ([e, t]) => vg.includes(e) && typeof t == `string`,
        ),
      );
      if (!Object.values(n).some((e) => e.trim()))
        throw Error(`กรอกข้อมูลอย่างน้อยหนึ่งช่อง`);
      if (n.nationalId)
        n.nationalId = normalizeDigits(n.nationalId).replace(/[\s-]/g, "");
      if ((e.kind === "identity" && !e.demo) || n.nationalId) {
        if (!validThaiId(n.nationalId))
          throw Error(
            "เลขประจำตัวประชาชนต้องมี 13 หลักและผ่านการตรวจเลขตรวจสอบ กรุณาแก้ไข",
          );
      }
      if (
        e.kind === "identity" &&
        !e.demo &&
        ["fullName", "address", "birthDate"].some((key) => !n[key]?.trim())
      )
        throw Error("กรุณาตรวจชื่อ ที่อยู่ และวันเกิดให้ครบ");
      const existing = i.documents.find((doc) => doc.kind === e.kind);
      if (a.startsWith("pending:") && existing && !t.replaceConfirmed)
        throw Error("แทนที่ข้อมูลเดิม? กรุณายืนยันก่อนบันทึก");
      e = {
        ...e,
        id: e.kind,
        fields: n,
        verified: true,
        updated: new Date().toISOString(),
      };
      i.documents = [e, ...i.documents.filter((doc) => doc.kind !== e.kind)];
    } else if (t.action === "qr") {
      e.rawText = t.rawText.slice(0, 50000);
      e.fields = t.fields;
      e.verified = false;
      e.method = "browser-qr";
    } else if (t.action === `ocr`) {
      if (!t.rawText?.trim()) throw Error(`อ่านไม่พบข้อความ กรุณากรอกเอง`);
      ((e.rawText = t.rawText.slice(0, 5e4)),
        (e.fields = xg(e.rawText)),
        (e.verified = !1),
        (e.method = `browser-ocr`));
    } else throw Error(`รุ่นฟรีไม่ได้เรียก AI API`);
    (Eg(i, e.verified ? `ตรวจและยืนยันข้อมูล` : `อ่านภาพด้วย OCR ในเครื่อง`, a),
      t.action === "verify" ? await Tg(i) : undefined);
    if (t.action === "verify") pendingDocs.delete(a);
    else pendingDocs.set(a, e);
    let { blob: r, ...o } = e;
    return { document: o };
  }
  if (r.pathname === `/api/cases`) {
    if (n === `POST`) {
      if (!t.consent || !_g[t.service])
        throw Error(`กรุณาเลือกเรื่องและอนุญาตใช้ข้อมูล`);
      let e = (t.documentIds || []).map((e) =>
        i.documents.find((t) => t.id === e),
      );
      if (e.some((e) => !e?.verified)) throw Error(`ตรวจเอกสารก่อนใช้`);
      let n = t.service,
        r = Sg(e, n),
        a = [];
      (t.text &&
        ((r.details = { value: t.text, source: `คุณระบุ` }),
        a.push({ role: `user`, text: t.text })),
        a.push({
          role: `assistant`,
          text: yg(n, r)[0]
            ? `กรุณาระบุ: ${hg[yg(n, r)[0]]}`
            : `ข้อมูลครบแล้ว เปิดตรวจร่างได้เลยครับ`,
          mode: `guided`,
        }));
      let o = new Date().toISOString(),
        s = {
          id: crypto.randomUUID(),
          service: n,
          status: `draft`,
          fields: r,
          messages: a,
          documentIds: e.map((e) => e.id),
          createdAt: o,
          updatedAt: o,
          reference: null,
          revision: 0,
        };
      return (
        i.cases.unshift(s),
        Eg(i, `สร้างร่างจากข้อมูลที่เลือก`, s.id),
        await Tg(i),
        { case: s }
      );
    }
    let e = i.cases.find((e) => e.id === a);
    if (!e) throw Error(`ไม่พบคำขอ`);
    if (n === `DELETE`)
      return (
        (i.cases = i.cases.filter((e) => e.id !== a)),
        Eg(i, `ลบคำขอและสำเนาข้อมูล`, a),
        await Tg(i),
        { ok: !0 }
      );
    if (n==='PATCH' && t.action==='station' && e.quickAccident) {
      Object.assign(e,changeAccidentStation(e,t.station,t.revision));
      await Tg(i);return {case:e};
    }
    if (e.status !== `draft`) throw Error(`คำขอนี้ส่งแบบจำลองแล้ว`);
    if (e.revision !== t.revision) throw Error(`กรุณาโหลดใหม่ มีการแก้ไขคำขอ`);
    let r = _g[e.service];
    const oldLegalSource = legalDraftSource(legalInputFromRecord(e));
    if (t.action === "edit" && Array.isArray(t.documentIds)) {
      const documents = t.documentIds.map((id) =>
        i.documents.find((doc) => doc.id === id),
      );
      if (documents.some((doc) => !doc?.verified))
        throw Error("กรุณาตรวจเอกสารก่อนใช้");
      const oldIds = e.documentIds || [];
      const next = Sg(documents, e.service);
      for (const [key, field] of Object.entries(e.fields)) {
        if (field.documentId && !t.documentIds.includes(field.documentId)) {
          delete e.fields[key];
          if (t.fields) delete t.fields[key];
        }
      }
      for (const [key, field] of Object.entries(next)) {
        if (!e.fields[key]?.value || !oldIds.includes(field.documentId)) {
          e.fields[key] = field;
          if (t.fields) delete t.fields[key];
        }
      }
      e.documentIds = t.documentIds;
    }
    if (t.action === "edit" && Object.hasOwn(t, "station")) e.station = t.station || null;
    if (t.action === `edit`)
      for (let [n, i] of Object.entries(t.fields || {}))
        [...r.required, ...r.optional].includes(n) &&
          typeof i == `string` &&
          (e.fields[n]?.value !== i || e.fields[n]?.conflict) &&
          (e.fields[n] = { value: i, source: `คุณตรวจแก้` });
    else if (t.action === "evidence") {
      if (e.service !== "accident" || (e.evidence || []).length >= 5)
        throw Error("แนบภาพอุบัติเหตุได้ไม่เกิน 5 ภาพ");
      if (
        !t.evidence?.image?.startsWith("data:image/jpeg;base64,") ||
        t.evidence.image.length > 2000000
      )
        throw Error("ภาพหลักฐานไม่ถูกต้อง");
      e.evidence = [
        ...(e.evidence || []),
        {
          ...t.evidence,
          analysis: t.evidence.analysis ? validateAnalysis(t.evidence.analysis) : null,
          label: t.evidence.analysis ? AI_LABEL : "หลักฐานที่ผู้แจ้งแนบ · ยังไม่ได้วิเคราะห์",
        },
      ];
    } else if (t.action === "removeEvidence") {
      e.evidence = (e.evidence || []).filter(
        (item) => item.id !== t.evidenceId,
      );
    } else if (t.action === `chat`) {
      if (!t.text?.trim()) throw Error(`กรอกข้อความก่อน`);
      const structured = { service: e.service, fields: e.fields };
      const i = yg(structured.service, structured.fields)[0];
      i
        ? (e.fields[i] = { value: t.text, source: `คุณระบุ` })
        : (e.fields.details = {
            value: [e.fields.details?.value, t.text].filter(Boolean).join(`
`),
            source: `คุณระบุ`,
          });
      let a = yg(e.service, e.fields)[0];
      e.messages.push(
        { role: `user`, text: t.text },
        {
          role: `assistant`,
          text: a
            ? `กรุณาระบุ: ${hg[a]}`
            : `ข้อมูลตามรายการต้นแบบครบแล้ว เปิดตรวจร่างและยืนยันได้เลยครับ`,
          mode: `guided`,
        },
      );
    } else if (t.action === `submit`) {
      if (["police", "accident"].includes(e.service) && !e.station?.name)
        throw Error("กรุณาเลือกสถานีตำรวจ");
      if (!t.confirmed || yg(e.service, e.fields).length)
        throw Error(`ข้อมูลยังไม่ครบหรือยังไม่ยืนยัน`);
      ((e.status = `simulated`),
        (e.reference =
          `DEMO-` + crypto.randomUUID().slice(0, 8).toUpperCase()));
    } else throw Error(`รายการไม่ถูกต้อง`);
    if (t.action === 'edit' && Object.hasOwn(t, 'legalDraft')) {
      const draft = reviewedLegalDraft(t.legalDraft, legalInputFromRecord(e));
      if (t.legalDraft && !draft) throw Error('กรุณาตรวจยืนยันสำนวนให้ตรงกับข้อมูลล่าสุดก่อนบันทึก');
      e.legalDraft = draft;
    } else if (oldLegalSource !== legalDraftSource(legalInputFromRecord(e))) {
      e.legalDraft = null;
    }
    return (
      e.revision++,
      (e.updatedAt = new Date().toISOString()),
      Eg(
        i,
        t.action === `submit`
          ? `ส่งแบบจำลองในเบราว์เซอร์เท่านั้น`
          : `แก้ไขข้อมูลคำขอ`,
        a,
      ),
      await Tg(i),
      { case: e }
    );
  }
  throw Error(`ไม่รองรับรายการนี้`);
}
var Ag = (e) =>
  String(e ?? ``).replace(
    /[&<>"']/g,
    (e) =>
      ({ "&": `&amp;`, "<": `&lt;`, ">": `&gt;`, '"': `&quot;`, "'": `&#39;` })[
        e
      ],
  );
async function jg(e) {
  let t = e.startsWith(`/print/`),
    n = t ? window.open(``, `_blank`) : null,
    r = await wg(),
    i,
    a = `document`;
  if (e.startsWith(`/api/documents`)) {
    let t = new URL(e, `https://demo.invalid`).searchParams.get(`id`),
      n = pendingDocs.get(t) || r.documents.find((e) => e.id === t);
    if (!n?.blob) throw Error(`ไม่มีไฟล์ต้นฉบับ`);
    ((i = n.blob), (a = n.name));
  } else {
    let o = t
        ? e.split(`/`).pop()
        : new URL(e, `https://demo.invalid`).searchParams.get(`id`),
      s = r.cases.find((e) => e.id === o);
    if (!s) throw Error(`ไม่พบคำขอ`);
    if (
      ((a = `promptyuen-` + s.id.slice(0, 8) + `.json`),
      (i = new Blob(
        [
          JSON.stringify(
            {
              schemaVersion: `2.0`,
              governmentSubmitted: !1,
              service: _g[s.service].label,
              fields: s.fields,
              reference: s.reference,
              station: s.station || null,
              documentTypes: s.documentIds || [],
              evidence: s.evidence || [],
            },
            null,
            2,
          ),
        ],
        { type: `application/json` },
      )),
      t)
    ) {
      if (!n) throw Error(`กรุณาอนุญาตหน้าต่างพิมพ์`);
      const copies = (
        await Promise.all(
          (s.documentIds || [])
            .map((id) => r.documents.find((doc) => doc.id === id))
            .filter(Boolean)
            .map((doc) => certifiedCopy(doc, r.signature)),
        )
      ).filter(Boolean);
      n.document.write(renderReport(s, _g[s.service], hg, copies, r.signature));
      n.document.close();
      return;
    }
  }
  let o = URL.createObjectURL(i),
    s = document.createElement(`a`);
  ((s.href = o),
    (s.download = a),
    s.click(),
    setTimeout(() => URL.revokeObjectURL(o), 6e4));
}
var Mg = `modulepreload`,
  Ng = function (e, t) {
    return new URL(e, t).href;
  },
  Pg = {},
  Fg = function (e, t, n) {
    let r = Promise.resolve();
    if (t && t.length > 0) {
      let e = document.getElementsByTagName(`link`),
        i = document.querySelector(`meta[property=csp-nonce]`),
        a = i?.nonce || i?.getAttribute(`nonce`);
      function o(e) {
        return Promise.all(
          e.map((e) =>
            Promise.resolve(e).then(
              (e) => ({ status: `fulfilled`, value: e }),
              (e) => ({ status: `rejected`, reason: e }),
            ),
          ),
        );
      }
      r = o(
        t.map((t) => {
          if (((t = Ng(t, n)), t in Pg)) return;
          Pg[t] = !0;
          let r = t.endsWith(`.css`),
            i = r ? `[rel="stylesheet"]` : ``;
          if (n)
            for (let n = e.length - 1; n >= 0; n--) {
              let i = e[n];
              if (i.href === t && (!r || i.rel === `stylesheet`)) return;
            }
          else if (document.querySelector(`link[href="${t}"]${i}`)) return;
          let o = document.createElement(`link`);
          if (
            ((o.rel = r ? `stylesheet` : Mg),
            r || (o.as = `script`),
            (o.crossOrigin = ``),
            (o.href = t),
            a && o.setAttribute(`nonce`, a),
            document.head.appendChild(o),
            r)
          )
            return new Promise((e, n) => {
              (o.addEventListener(`load`, e),
                o.addEventListener(`error`, () =>
                  n(Error(`Unable to preload CSS for ${t}`)),
                ));
            });
        }),
      );
    }
    function i(e) {
      let t = new Event(`vite:preloadError`, { cancelable: !0 });
      if (((t.payload = e), window.dispatchEvent(t), !t.defaultPrevented))
        throw e;
    }
    return r.then((t) => {
      for (let e of t || []) e.status === `rejected` && i(e.reason);
      return e().catch(i);
    });
  },
  Ig = [
    { id: `chat`, icon: pe, label: `ผู้ช่วยพร้อมยื่น` },
    { id: `cases`, icon: re, label: `คำขอของฉัน` },
    { id: `documents`, icon: se, label: `คลังเอกสาร` },
  ],
  Lg = [
    { id: `accident`, icon: N, label: `อุบัติเหตุทางรถ` },
    { id: `police`, icon: oe, label: `แจ้งความ / ลงบันทึก` },
    { id: `vehicle_contract`, icon: N, label: `เรื่องรถและสัญญา` },
    { id: `name_change`, icon: z, label: `เปลี่ยนชื่อ` },
    { id: `military`, icon: le, label: `ขึ้นทะเบียนทหาร` },
  ],
  Rg = (e) =>
    new Date(e).toLocaleString(`th-TH`, {
      dateStyle: `medium`,
      timeStyle: `short`,
      timeZone: `Asia/Bangkok`,
    });
async function zg(e, t, n = `POST`) {
  return Og(e, t, n);
}
var Bg = (e, t, n, r) =>
  (0, B.jsxs)(`label`, {
    className: `check-label`,
    htmlFor: r,
    children: [
      (0, B.jsx)(kh, {
        id: r,
        checked: e,
        onCheckedChange: (e) => t(e === !0),
      }),
      (0, B.jsx)(`span`, { children: n }),
    ],
  });
function Vg() {
  const [quickAccident, setQuickAccident] = D.useState(false);
  const [tracking, setTracking] = D.useState(null);
  const [caseDocumentIds, setCaseDocumentIds] = D.useState([]);
  const [entered, setEntered] = D.useState(false);
  const [stationChoice, setStationChoice] = D.useState(null);
  const [stationRequest, setStationRequest] = D.useState(0);
  const [legalChoice, setLegalChoice] = D.useState(null);
  const [legalBusy, setLegalBusy] = D.useState(false);
  let [e, t] = (0, D.useState)(`chat`),
    [n, r] = (0, D.useState)(null),
    [i, a] = (0, D.useState)(``),
    [o, s] = (0, D.useState)(!1),
    [c, l] = (0, D.useState)(``),
    [d, f] = (0, D.useState)(``),
    [p, m] = (0, D.useState)(null),
    [h, g] = (0, D.useState)([]),
    [_, v] = (0, D.useState)(!1),
    [y, b] = (0, D.useState)(!1),
    [x, S] = (0, D.useState)(null),
    [C, w] = (0, D.useState)(`identity`),
    [T, E] = (0, D.useState)(!1),
    [O, k] = (0, D.useState)(null),
    [A, j] = (0, D.useState)({}),
    [N, F] = (0, D.useState)(!1),
    [te, ne] = (0, D.useState)(0),
    [oe, ce] = (0, D.useState)(!1),
    [le, pe] = (0, D.useState)(null),
    [me, he] = (0, D.useState)(``),
    [Ce, Te] = (0, D.useState)(!1),
    [Ee, De] = (0, D.useState)(!1),
    [Oe, ke] = (0, D.useState)({}),
    [Ae, je] = (0, D.useState)(!1),
    [Me, Ne] = (0, D.useState)(null),
    Pe = (0, D.useRef)(null);
  async function Fe() {
    try {
      let e = await zg(`/api/workspace`, void 0, `GET`);
      return (
        r(e),
        m((current) =>
          current
            ? e.cases.find((item) => item.id === current.id) || null
            : null,
        ),
        s(!1),
        a(``),
        e
      );
    } catch (e) {
      return (a(e.message), s(e.status === 401), null);
    }
  }
  ((0, D.useEffect)(() => {
    Fe();
  }, []),
    (0, D.useEffect)(() => {
      let e = (e) => {
        let t = e.target?.closest?.(`a`)?.getAttribute(`href`) || ``;
        [`/api/documents`, `/api/export`, `/print/`].some((e) =>
          t.startsWith(e),
        ) && (e.preventDefault(), jg(t).catch((e) => Zh.error(e.message)));
      };
      return (
        document.addEventListener(`click`, e),
        () => document.removeEventListener(`click`, e)
      );
    }, []),
    (0, D.useEffect)(() => {
      p && Pe.current?.scrollIntoView({ behavior: `smooth`, block: `nearest` });
    }, [p?.messages.length]));
  async function Ie(e, t) {
    if (!c) {
      l(e);
      try {
        await t();
      } catch (e) {
        Zh.error(e.message || `ทำรายการไม่สำเร็จ`);
      } finally {
        l(``);
      }
    }
  }
  function Le(e) {
    k(e);
    let t = { ...e.fields };
    if (!e.verified && e.rawText)
      for (let [n, r] of Object.entries(xg(e.rawText)))
        t[n]?.trim() || (t[n] = r);
    (j(t), F(!1), ce(!1));
  }
  function Re() {
    if (!O) return;
    let e = xg(O.rawText),
      t = Object.fromEntries(Object.entries(e).filter(([e]) => !A[e]?.trim()));
    (j((e) => ({ ...e, ...t })),
      F(!1),
      Zh.info(
        Object.keys(t).length
          ? `เติมให้ ${Object.keys(t).length} ช่องแล้ว กรุณาตรวจเทียบต้นฉบับ`
          : Object.keys(e).length
            ? `ช่องที่อ่านได้มีข้อมูลแล้ว ระบบไม่เขียนทับข้อมูลที่คุณแก้`
            : `ยังแยกข้อมูลไม่ได้ เก็บไฟล์ไว้ก่อนได้ หรือกรอกเฉพาะข้อมูลที่จะใช้`,
      ));
  }
  function ze(e) {
    if(e.status==='simulated'){setTracking(e);return;}
    setCaseDocumentIds(e.documentIds || []);
    setStationChoice(e.station || null);
    setLegalChoice(e.legalDraft || null);
    setStationRequest(0);
    (m(e),
      ke(
        Object.fromEntries(
          Object.entries(e.fields).map(([e, t]) => [e, t.value]),
        ),
      ),
      je(!1),
      De(!0));
  }
  function Be(e, t = ``) {
    if(e==='accident'){setQuickAccident(true);return;}
    g(selectDocuments(e, n?.documents || []));
    setStationChoice(null);
    setLegalChoice(null);
    setStationRequest(0);
    (pe(e), he(t), Te(!1));
  }
  async function Ve() {
    await Ie(`demo`, async () => {
      let e = await zg(`/api/workspace`, { action: `demo` });
      (await Fe(),
        g([e.id]),
        Zh.success(
          `เพิ่มข้อมูลสมมติแล้ว เลือกเรื่องที่ต้องการเพื่อทดลองได้เลย`,
        ));
    });
  }
  async function He() {
    if(le==='accident'){pe(null);setQuickAccident(true);return;}
    !le ||
      !Ce ||
      (await Ie(`start`, async () => {
        (m(
          (
            await zg(`/api/cases`, {
              service: le,
              text: me || void 0,
              documentIds: h,
              consent: !0,
            })
          ).case,
        ),
          pe(null),
          f(``),
          t(`chat`),
          await Fe());
      }));
  }
  async function Ue(e) {
    if ((e?.preventDefault(), !(!d.trim() || c))) {
      if (!p) {
        let { classify: e } = await Fg(
          async () => {
            let { classify: e } = await Promise.resolve().then(() => mg);
            return { classify: e };
          },
          void 0,
          import.meta.url,
        );
        Be(e(d), d);
        return;
      }
      await Ie(`chat`, async () => {
        (m(
          (
            await zg(
              `/api/cases`,
              {
                id: p.id,
                revision: p.revision,
                action: `chat`,
                caseData: { service: p.service, fields: p.fields },
                text: d,
                aiConsent: _,
              },
              `PATCH`,
            )
          ).case,
        ),
          f(``),
          await Fe());
      });
    }
  }
  async function We() {
    !x ||
      !T ||
      (await Ie(`upload`, async () => {
        let e = new FormData();
        (e.set(`file`, x), e.set(`kind`, C), e.set(`consent`, `true`));
        let t = await zg(`/api/documents`, e);
        (b(!1),
          S(null),
          E(!1),
          Le(t.document),
          await Fe(),
          Zh.success(`กรุณาอ่านภาพหรือตรวจกรอกข้อมูลก่อนบันทึก`));
      }));
  }
  async function Ge() {
    O &&
      (await Ie(`ocr`, async () => {
        ne(0);
        let e = await Og(
          `/api/documents?id=` + encodeURIComponent(O.id),
          void 0,
          `GET`,
        );
        if (!e.ok) throw Error(`โหลดไฟล์ไม่สำเร็จ`);
        const blob = await e.blob();
        const result =
          O.kind === "license"
            ? await readLicenseQR(blob, xg)
            : { rawText: await readIdPhoto(blob, ne, text => {const fields=xg(text);return Object.keys(fields).length*10+(validThaiId(fields.nationalId||'')?30:0);}) };
        Le(
          (
            await zg(
              "/api/documents",
              {
                id: O.id,
                action: O.kind === "license" ? "qr" : "ocr",
                ...result,
              },
              "PATCH",
            )
          ).document,
        );
        Zh.success(result.warning || "อ่านภาพแล้ว กรุณาตรวจทุกช่องก่อนบันทึก");
      }));
  }
  async function Ke() {
    O &&
      (await Ie(`vision`, async () => {
        (Le(
          (
            await zg(
              `/api/documents`,
              { id: O.id, action: `ai`, aiConsent: oe },
              `PATCH`,
            )
          ).document,
        ),
          await Fe());
      }));
  }
  async function qe() {
    !O ||
      !N ||
      (await Ie(`verify`, async () => {
        const replaceConfirmed =
          !O.id.startsWith("pending:") ||
          !n.documents.some((doc) => doc.kind === O.kind) ||
          window.confirm("แทนที่ข้อมูลเดิม?");
        if (!replaceConfirmed) return;
        let e = await zg(
          `/api/documents`,
          { id: O.id, action: `verify`, fields: A, replaceConfirmed },
          `PATCH`,
        );
        (await Fe(),
          k(null),
          g((t) => (t.includes(e.document.id) ? t : [...t, e.document.id])),
          Zh.success(`ยืนยันข้อมูลแล้ว พร้อมนำไปใช้ซ้ำ`));
      }));
  }
  async function Je() {
    if (legalBusy) return;
    p &&
      (await Ie(`draft`, async () => {
        (m(
          (
            await zg(
              `/api/cases`,
              {
                id: p.id,
                revision: p.revision,
                action: `edit`,
                fields: Oe,
                station: stationChoice,
                legalDraft: legalChoice,
                documentIds: caseDocumentIds,
              },
              `PATCH`,
            )
          ).case,
        ),
          je(!1),
          await Fe(),
          Zh.success(`บันทึกร่างแล้ว`));
      }));
  }
  async function Ye() {
    if (legalBusy) return;
    if (p && ["police", "accident"].includes(p.service) && !stationChoice) {
      setStationRequest((value) => value + 1);
      Zh.info("กรุณาตรวจจุดเกิดเหตุและเลือกสถานี แล้วกดยืนยันอีกครั้ง");
      return;
    }
    !p ||
      !Ae ||
      (await Ie(`submit`, async () => {
        let e = await zg(
          `/api/cases`,
          {
            id: p.id,
            revision: p.revision,
            action: `edit`,
            fields: Oe,
            station: stationChoice,
            legalDraft: legalChoice,
            documentIds: caseDocumentIds,
          },
          `PATCH`,
        );
        (m(e.case),
          m(
            (
              await zg(
                `/api/cases`,
                {
                  id: p.id,
                  revision: e.case.revision,
                  action: `submit`,
                  confirmed: !0,
                },
                `PATCH`,
              )
            ).case,
          ),
          De(!1),
          t(`cases`),
          await Fe(),
          Zh.success(`บันทึกเข้าระบบจำลองแล้ว ไม่มีการส่งให้ภาครัฐ`));
      }));
  }
  async function Xe() {
    if (!Me) return;
    let e = Me;
    await Ie(`delete`, async () => {
      (await zg(
        `/api/` + e.type + `?id=` + encodeURIComponent(e.id),
        void 0,
        `DELETE`,
      ),
        e.type === `documents`
          ? (g((t) => t.filter((t) => t !== e.id)), O?.id === e.id && k(null))
          : p?.id === e.id && m(null),
        await Fe(),
        Ne(null),
        Zh.success(`ลบข้อมูลแล้ว`));
    });
  }
  (0, D.useEffect)(() => {
    let e = document.modelContext;
    if (!e?.registerTool) return;
    let t = new AbortController(),
      n = (n) =>
        Promise.resolve(e.registerTool(n, { signal: t.signal })).catch(
          () => {},
        );
    return (
      n({
        name: `list_document_workspace`,
        title: `ดูสถานะพื้นที่เอกสาร`,
        description: `Return counts and AI availability. No document content or personal data.`,
        inputSchema: {
          type: `object`,
          properties: {},
          additionalProperties: !1,
        },
        annotations: { readOnlyHint: !0, untrustedContentHint: !1 },
        execute: async () => {
          let e = await zg(`/api/workspace`, void 0, `GET`);
          return (
            r(e),
            {
              documents: e.documents.length,
              verified: e.documents.filter((e) => e.verified).length,
              requests: e.cases.length,
              aiEnabled: e.aiEnabled,
            }
          );
        },
      }),
      n({
        name: `start_request_review`,
        title: `เปิดขั้นตอนเตรียมคำขอ`,
        description: `Open the service selection and consent dialog only. Does not create or submit a request.`,
        inputSchema: {
          type: `object`,
          properties: { service: { type: `string`, enum: Object.keys(_g) } },
          required: [`service`],
          additionalProperties: !1,
        },
        annotations: { readOnlyHint: !1, untrustedContentHint: !1 },
        execute: (e) => {
          if (
            !e ||
            !Object.hasOwn(_g, e.service) ||
            Object.keys(e).some((e) => e !== `service`)
          )
            throw Error(`Invalid service`);
          return (
            pe(e.service),
            Te(!1),
            he(``),
            { stage: `awaiting_user_consent`, service: e.service }
          );
        },
      }),
      () => t.abort()
    );
  }, []);
  let Ze = n?.documents || [],
    Qe = Ze.filter((e) => e.verified),
    $e = p ? _g[p.service] : null,
    et = p ? yg(p.service, p.fields) : [],
    tt = p
      ? Math.round(
          (($e.required.length - et.length) / $e.required.length) * 100,
        )
      : 0,
    nt = !!c,
    V = Ig.find((t) => t.id === e).label;
  if (!entered && n)
    return D.createElement(LocalLogin, {
      signature: n.signature,
      onSave: async (signature) => {
        await zg("/api/workspace", { action: "signature", signature });
        await Fe();
      },
      onEnter: () => setEntered(true),
      onClear: async () => { if(window.confirm("ล้างเอกสาร ลายมือชื่อ และคำขอทั้งหมดบนเครื่องนี้? กู้คืนไม่ได้")) { await zg("/api/workspace", {action:"clear"}); await Fe(); } },
    });
  return (0, B.jsxs)(Ym, {
    children: [
      tracking && D.createElement(CaseTracking,{record:tracking,onStationChange:tracking.quickAccident?async(station)=>{const result=await zg('/api/cases',{id:tracking.id,revision:tracking.revision,action:'station',station},'PATCH');setTracking(result.case);await Fe();}:undefined,onClose:()=>setTracking(null),onPrint:()=>jg('/print/'+tracking.id).catch(e=>Zh.error(e.message))}),
      (0, B.jsx)(pg, { richColors: !0, position: `top-center` }),
      (0, B.jsxs)(Xm, {
        className: `app-sidebar`,
        children: [
          (0, B.jsx)(Qm, {
            children: (0, B.jsxs)(`button`, {
              className: `brand`,
              onClick: () => t(`chat`),
              "aria-label": `กลับผู้ช่วยพร้อมยื่น`,
              children: [
                (0, B.jsx)(`span`, {
                  className: `brand-icon`,
                  children: (0, B.jsx)(z, {}),
              ... (74 KB left)
