// Printable preparation form, deliberately distinct from an issued police record.
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export function thaiDate(value = new Date()) {
  if (typeof value === "string") {
    const match =
      /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) ||
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (match) {
      const iso = match[1].length === 4;
      let year = Number(iso ? match[1] : match[3]);
      if (year > 2400) year -= 543;
      value = new Date(
        year,
        Number(match[2]) - 1,
        Number(iso ? match[3] : match[1]),
        12,
      );
    } else if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Bangkok",
      }).format(date);
}
export function renderReport(
  record,
  service,
  labels,
  copies = [],
  signature = "",
) {
  const esc = escapeHtml;
  const field = (key) =>
    esc(record.fields[key]?.value || "................................");
  const date = (key) =>
    esc(
      thaiDate(record.fields[key]?.value || "................................"),
    );
  const police = record.service === "police" || record.service === "accident";
  const sections = police
    ? `
    <section><h2>๑. ข้อมูลผู้แจ้ง</h2><p>ข้าพเจ้า ${field("fullName")} เลขประจำตัวประชาชน ${field("nationalId")}</p><p>เกิดวันที่ ${date("birthDate")} ที่อยู่ ${field("address")}</p><p>หมายเลขโทรศัพท์ ${field("phone")}</p></section>
    <section><h2>๒. วัน เวลา และสถานที่เกิดเหตุ</h2><p>วันที่ ${date("eventDate")}</p><p>สถานที่เกิดเหตุ ${field("eventPlace")}</p></section>
    <section><h2>๓. ข้อเท็จจริงที่ประสงค์แจ้ง</h2><p>${field("details")}</p></section>
    <section><h2>๔. ความประสงค์และเอกสารประกอบ</h2><p>ข้าพเจ้าขอแจ้งข้อเท็จจริงข้างต้นต่อพนักงานสอบสวน เพื่อโปรดพิจารณาดำเนินการตามอำนาจหน้าที่ และยินดีให้รายละเอียดเพิ่มเติมตามที่ได้รับการร้องขอ</p><p>เอกสารประกอบจำนวน ${copies.length} ฉบับ</p></section>`
    : [...service.required, ...service.optional]
        .map(
          (key, index) =>
            `<section><h2>${index + 1}. ${esc(labels[key])}</h2><p>${/Date$/.test(key) ? date(key) : field(key)}</p></section>`,
        )
        .join("");
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ร่าง${esc(service.short)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#eee;color:#111;font:16px/1.85 Tahoma,sans-serif}.toolbar{padding:12px;text-align:center}.paper{max-width:210mm;min-height:297mm;margin:16px auto;padding:20mm;background:white}header{text-align:center;border-bottom:2px solid #222;padding-bottom:12px}h1{font-size:23px;margin:0}h2{font-size:17px;margin:16px 0 6px}p{margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}.date,.sign{text-align:right}small{font-size:12px}.sign{margin-top:24px}.sign img{display:block;margin-left:auto;width:180px;max-height:80px;object-fit:contain}.copy{break-before:page;text-align:center}.copy img{max-width:100%;max-height:235mm;object-fit:contain}section{break-inside:auto}h2{break-after:avoid}img{break-inside:avoid}button{font:inherit;padding:8px 16px}@media(max-width:600px){.paper{padding:20px;min-height:0;margin:0;width:100%}h1{font-size:20px}}@page{size:A4;margin:20mm}@media print{body{background:white}.toolbar{display:none}.paper{padding:0;margin:0;max-width:none;min-height:0}.copy{min-height:0}.copy img{max-height:230mm}}
  </style></head><body><div class="toolbar"><button onclick="window.print()">พิมพ์ / บันทึกเป็นพีดีเอฟ</button></div><main class="paper"><header><strong>บันทึกเตรียมข้อมูลสำหรับยื่นต่อหน่วยงาน</strong><h1>${esc(service.label)}</h1><small>ฉบับร่างสำหรับผู้แจ้ง • ไม่ใช่เอกสารที่ออกหรือรับรองโดยหน่วยงานราชการ</small></header><p class="date">วันที่ ${esc(thaiDate())}</p><p>เรียน ${esc(record.station?.name || service.agency)}</p>${sections}<section class="sign">${signature.startsWith("data:image/png;base64,") ? `<img src="${esc(signature)}" alt="ลายมือชื่อผู้แจ้ง">` : ""}<p>ลงชื่อ ........................................ ผู้แจ้ง</p><p>(${field("fullName")})</p></section><p><small>${esc(service.note)}</small></p>${(record.evidence || []).map((item) => `<section><h2>ภาพประกอบเหตุการณ์</h2><p>${esc(item.label)}</p><p>${esc(item.analysis?.summary_th)}</p>${item.image?.startsWith("data:image/jpeg;base64,") ? `<img style="max-width:100%;max-height:100mm" src="${esc(item.image)}" alt="ภาพประกอบเหตุการณ์">` : ""}</section>`).join("")}${copies.map((copy) => `<section class="copy"><h2>${esc(copy.name)}</h2><img src="${esc(copy.image)}" alt="สำเนาเอกสารที่รับรองแล้ว"></section>`).join("")}</main></body></html>`;
}
