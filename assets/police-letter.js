import {emblem} from './letter-emblem.js';
// Citizen-authored letter layout, based on the supplied external-letter reference.
export function policeLetter({record,field,date,esc,legal,coordinates,signature,copies,thaiDate,locationText}) {
 const slot=(key,label)=>record.fields[key]?.value?esc(record.fields[key].value):`<span class="letter-slot" contenteditable="true" aria-label="${label}">[${label}]</span>`;
 const thaiDigits=value=>String(value).replace(/[0-9]/g,n=>'๐๑๒๓๔๕๖๗๘๙'[n]);
 const narrative=legal?.formalNarrative || record.fields.details?.value || '................................';
 const paragraphs=narrative.split(/\n\s*\n/).filter(Boolean).map(text=>`<p class="letter-body">${locationText(text)}</p>`).join('');
 return `<header class="letter-header"><img class="letter-emblem" src="${emblem}" alt="ตราครุฑตามแบบฟอร์ม"><div class="letter-reference"><span>ที่ ${record.reference?esc(record.reference):slot('letterNumber','ระบุเลขที่หนังสือ')}</span></div></header>
 <p class="letter-date">${esc(thaiDigits(thaiDate(record.submittedAt || record.updatedAt || new Date())))}</p>
 <p><strong>เรื่อง</strong> ${record.service==='accident'?'แจ้งความกรณีอุบัติเหตุรถยนต์':'แจ้งข้อเท็จจริงเพื่อบันทึกไว้เป็นหลักฐาน'}</p>
 <p><strong>เรียน</strong> ${record.station?.name?`พนักงานสอบสวน ${esc(record.station.name)}`:slot('recipient','ระบุผู้รับ')}</p>
 <p class="letter-body letter-opening">ด้วย ${slot('fullName','ระบุชื่อผู้แจ้งความ')} ขอแจ้งข้อเท็จจริงเกี่ยวกับเหตุการณ์เมื่อ ${date('eventDate')} ณ ${locationText(record.fields.eventPlace?.value || '................................')} โดยมีรายละเอียดดังนี้</p>
 ${paragraphs}
 <p class="letter-body">ในการนี้ ${record.fields.organization?.value?esc(record.fields.organization.value):'ข้าพเจ้า'} ใคร่ขอแจ้งความกรณีเหตุการณ์ดังกล่าว เพื่อให้ ${esc(record.station?.name || 'พนักงานสอบสวน')} ได้โปรดตรวจสอบข้อเท็จจริงและดำเนินการตามอำนาจหน้าที่ต่อไป</p>
 <p class="letter-body">จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไปด้วย</p>
 <section class="letter-sign"><p>ขอแสดงความนับถือ</p>
 ${signature?.startsWith('data:image/png;base64,')?`<img src="${esc(signature)}" alt="ลายมือชื่อผู้แจ้ง">`:'<div class="signature-space"></div>'}
 <p>(${slot('fullName','ระบุชื่อ')})</p></section>
 <div class="letter-contact"><p>โทร. ${slot('phone','ระบุหมายเลขโทรศัพท์')}</p><p>ไปรษณีย์อิเล็กทรอนิกส์ ${slot('email','ระบุอีเมล')}</p></div>
 <p class="draft-note">ฉบับร่างสำหรับผู้แจ้ง • ไม่ใช่เอกสารที่ออกหรือรับรองโดยหน่วยงานราชการ</p>
 <section class="letter-annex"><h2>ข้อมูลประกอบหนังสือแจ้งข้อเท็จจริง</h2>
 <p>เลขประจำตัวประชาชน ${field('nationalId')}</p><p>เกิดวันที่ ${date('birthDate')}</p>${coordinates}
 ${legal?`<p><small>${legal.mode==='local-demo'?'ร่างสาธิตเรียบเรียงด้วยแม่แบบในเครื่อง ไม่ใช่ GenAI':'ร่างเรียบเรียงด้วย AI จากข้อมูลผู้แจ้ง'} ผู้แจ้งตรวจข้อความแล้ว พนักงานสอบสวนต้องตรวจสอบข้อเท็จจริงเพิ่มเติม</small></p>${legal.missingQuestions.length?`<h3>ประเด็นที่ยังต้องสอบถามเพิ่มเติม</h3><ol>${legal.missingQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol>`:''}`:''}
 <p>เอกสารประกอบจำนวน ${copies.length} ฉบับ · หลักฐานเหตุการณ์ ${(record.evidence||[]).length} รายการ</p></section>`;
}
export const letterStyles=`
.police-letter{font-family:"TH Sarabun New","Sarabun",Tahoma,sans-serif;font-size:16pt;line-height:1.3;padding:25mm 20mm 20mm 30mm}
.police-letter .letter-header{border:0;padding:0;margin-bottom:4mm;text-align:center;position:relative;height:34mm}.letter-emblem{width:30mm;height:30mm;object-fit:contain}.letter-reference{position:absolute;top:20mm;left:0;right:0;display:flex;justify-content:space-between;gap:32mm;text-align:left}.letter-reference>span{max-width:38%;overflow-wrap:anywhere}
.police-letter h1{font-size:20pt;font-weight:700}.police-letter small{font-size:11pt}
.police-letter .letter-origin{margin-left:50%;overflow-wrap:anywhere}.police-letter .letter-date{text-align:center;margin:4mm 0 8mm}
.police-letter p{margin:3mm 0}.police-letter .letter-body{text-indent:25mm;text-align:justify;white-space:pre-wrap}
.letter-attachments{display:flex;gap:8mm;align-items:baseline}.letter-attachments strong{white-space:nowrap}.letter-attachments ol{margin:0;padding-left:6mm}
.police-letter .letter-sign{width:55%;margin:6mm 0 0 auto;text-align:center;break-inside:avoid}.letter-sign img{width:45mm;max-height:18mm;object-fit:contain}.signature-space{height:14mm}
.police-letter .letter-sign p{margin:1mm 0}.police-letter .letter-contact{margin-top:8mm;margin-left:25mm;font-size:16pt}
.letter-slot{color:#96501d;background:#fffbea;border:1px dashed #d8a43c;border-radius:5px;padding:1px 5px}.letter-opening{margin-top:8mm!important}.draft-note{font-size:10pt;color:#666}.letter-annex{break-before:page;padding-top:8mm}.letter-annex h2{font-size:18pt}.letter-annex h3{font-size:16pt}
@media print{.letter-slot{color:#111;background:none;border:0;padding:0}.police-letter{padding:0}.letter-annex{padding-top:0}@page{size:A4;margin:25mm 20mm 20mm 30mm}}
@media(max-width:600px){.police-letter{padding:20px;font-size:16px}.police-letter .letter-body{text-indent:24px}.letter-attachments{display:block}.police-letter .letter-sign{width:75%}}
`;
