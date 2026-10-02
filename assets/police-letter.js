// Citizen-authored letter layout, based on the supplied external-letter reference.
export function policeLetter({record,field,date,esc,legal,coordinates,signature,copies,thaiDate}) {
 const narrative=legal?.formalNarrative || record.fields.details?.value || '................................';
 const paragraphs=narrative.split(/\n\s*\n/).filter(Boolean).map(text=>`<p class="letter-body">${esc(text)}</p>`).join('');
 const attachments=[...copies.map(copy=>copy.name),...(record.evidence||[]).map((item,i)=>item.name||`หลักฐานประกอบเหตุการณ์ ${i+1}`)];
 return `<header class="letter-header"><h1>หนังสือแจ้งข้อเท็จจริง</h1><small>ฉบับร่างสำหรับผู้แจ้ง • ไม่ใช่เอกสารที่ออกหรือรับรองโดยหน่วยงานราชการ</small></header>
 <div class="letter-origin"><p>เขียนที่ ${field('address')}</p></div>
 <p class="letter-date">วันที่ ${esc(thaiDate(record.submittedAt || record.updatedAt || new Date()))}</p>
 <p><strong>เรื่อง</strong> ${record.service==='accident'?'แจ้งข้อเท็จจริงกรณีอุบัติเหตุรถยนต์':'ขอแจ้งข้อเท็จจริงเพื่อบันทึกไว้เป็นหลักฐาน'}</p>
 <p><strong>เรียน</strong> พนักงานสอบสวน ${esc(record.station?.name || '................................')}</p>
 ${attachments.length?`<div class="letter-attachments"><strong>สิ่งที่ส่งมาด้วย</strong><ol>${attachments.map(name=>`<li>${esc(name)}</li>`).join('')}</ol></div>`:''}
 <p class="letter-body">ข้าพเจ้า ${field('fullName')} อยู่บ้านเลขที่/ที่อยู่ ${field('address')} หมายเลขโทรศัพท์ ${field('phone')} ขอแจ้งข้อเท็จจริงเกี่ยวกับเหตุการณ์เมื่อ ${date('eventDate')} ณ ${field('eventPlace')} โดยมีรายละเอียดดังต่อไปนี้</p>
 ${paragraphs}
 <p class="letter-body">จึงเรียนมาเพื่อโปรดพิจารณาบันทึกข้อเท็จจริงไว้เป็นหลักฐาน และดำเนินการตามอำนาจหน้าที่ ข้าพเจ้ายินดีให้รายละเอียดและแสดงหลักฐานเพิ่มเติมต่อพนักงานสอบสวน</p>
 <section class="letter-sign"><p>ขอแสดงความนับถือ</p>
 ${signature?.startsWith('data:image/png;base64,')?`<img src="${esc(signature)}" alt="ลายมือชื่อผู้แจ้ง">`:'<div class="signature-space"></div>'}
 <p>ลงชื่อ ........................................</p><p>(${field('fullName')})</p><p>ผู้แจ้ง</p></section>
 <p class="letter-contact">ผู้ติดต่อ ${field('fullName')}<br>โทร. ${field('phone')}</p>
 <section class="letter-annex"><h2>ข้อมูลประกอบหนังสือแจ้งข้อเท็จจริง</h2>
 <p>เลขประจำตัวประชาชน ${field('nationalId')}</p><p>เกิดวันที่ ${date('birthDate')}</p>${coordinates}
 <h3>คำบอกเล่าต้นฉบับของผู้แจ้ง</h3><p>${field('details')}</p>
 ${legal?`<p><small>${legal.mode==='local-demo'?'ร่างสาธิตเรียบเรียงด้วยแม่แบบในเครื่อง ไม่ใช่ GenAI':'ร่างเรียบเรียงด้วย AI จากข้อมูลผู้แจ้ง'} ผู้แจ้งตรวจข้อความแล้ว พนักงานสอบสวนต้องตรวจสอบข้อเท็จจริงเพิ่มเติม</small></p>${legal.missingQuestions.length?`<h3>ประเด็นที่ยังต้องสอบถามเพิ่มเติม</h3><ol>${legal.missingQuestions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol>`:''}`:''}
 <p>เอกสารประกอบจำนวน ${copies.length} ฉบับ · หลักฐานเหตุการณ์ ${(record.evidence||[]).length} รายการ</p></section>`;
}
export const letterStyles=`
.police-letter{font-family:"TH Sarabun New","Sarabun",Tahoma,sans-serif;font-size:16pt;line-height:1.3;padding:25mm 20mm 20mm 30mm}
.police-letter .letter-header{border:0;padding:0;margin-bottom:5mm;text-align:center}
.police-letter h1{font-size:20pt;font-weight:700}.police-letter small{font-size:11pt}
.police-letter .letter-origin{margin-left:50%;overflow-wrap:anywhere}.police-letter .letter-date{text-align:center;margin:5mm 0}
.police-letter p{margin:3mm 0}.police-letter .letter-body{text-indent:25mm;text-align:justify;white-space:pre-wrap}
.letter-attachments{display:flex;gap:8mm;align-items:baseline}.letter-attachments strong{white-space:nowrap}.letter-attachments ol{margin:0;padding-left:6mm}
.police-letter .letter-sign{width:55%;margin:10mm 0 0 auto;text-align:center;break-inside:avoid}.letter-sign img{width:45mm;max-height:18mm;object-fit:contain}.signature-space{height:14mm}
.police-letter .letter-sign p{margin:1mm 0}.police-letter .letter-contact{margin-top:10mm;font-size:14pt}
.letter-annex{break-before:page;padding-top:8mm}.letter-annex h2{font-size:18pt}.letter-annex h3{font-size:16pt}
@media print{.police-letter{padding:0}.letter-annex{padding-top:0}@page{size:A4;margin:25mm 20mm 20mm 30mm}}
@media(max-width:600px){.police-letter{padding:20px;font-size:16px}.police-letter .letter-body{text-indent:24px}.letter-attachments{display:block}.police-letter .letter-sign{width:75%}}
`;
