import { extractFrames, isVideoFile, MAX_FRAMES } from './video-frames.js';
const $ = id => document.getElementById(id);
const money = amount => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount / 100);
const labels = {
  submitted: 'รับคำขอแล้ว', approved: 'อนุมัติสำหรับการจ่ายจำลอง', review_required: 'รอตรวจสอบเพิ่มเติม', settled: 'จ่ายสินไหมจำลองแล้ว',
  bumper: 'กันชน', door: 'ประตู', hood: 'ฝากระโปรง', fender: 'บังโคลน', headlamp: 'ไฟหน้า', windshield: 'กระจกหน้า',
  minor: 'เล็กน้อย', moderate: 'ปานกลาง', severe: 'รุนแรง',
  INSUFFICIENT_EVIDENCE: 'หลักฐานไม่เพียงพอ', LOW_CONFIDENCE: 'ผลประเมินมีความมั่นใจต่ำ',
  STRUCTURAL_DAMAGE: 'พบความเสียหายต่อโครงสร้าง', POSSIBLE_TOTAL_LOSS: 'อาจเสียหายสิ้นเชิง',
  COVERAGE_REVIEW: 'ต้องตรวจสอบความคุ้มครอง', ABOVE_AUTOMATION_LIMIT: 'เกินวงเงินอนุมัติอัตโนมัติ', POLICY_LIMIT_EXHAUSTED: 'วงเงินคุ้มครองคงเหลือไม่เพียงพอ',
};
const errors = {
  'API token required': 'กรุณาตรวจสอบรหัสเข้าถึงระบบ',
  'Unsupported coverage': 'กรุณาเลือกความคุ้มครองที่รองรับ',
  'Invalid sumInsured': 'กรุณาระบุทุนประกันให้ถูกต้องและไม่เกินมูลค่ารถ',
  'Invalid deductible': 'กรุณาระบุค่าเสียหายส่วนแรกให้ถูกต้อง',
  'Vehicle does not belong to customer': 'รถยนต์นี้ไม่ใช่รถของลูกค้าที่เลือก',
  'Quote expired': 'ใบเสนอราคาหมดอายุแล้ว กรุณาคำนวณเบี้ยใหม่',
  'Upload 1–6 photos': 'กรุณาแนบภาพ 1–6 ภาพ',
  'video-too-many': 'กรุณาเลือกวิดีโอเพียงไฟล์เดียว หรือเลือกเฉพาะภาพถ่าย',
  'Use JPEG, PNG or WebP': 'กรุณาใช้ไฟล์ภาพ JPEG, PNG หรือ WebP',
  'Invalid base64 photo': 'ข้อมูลภาพไม่ถูกต้อง กรุณาเลือกไฟล์ใหม่',
  'Photo must be at most 2 MiB': 'ภาพแต่ละไฟล์ต้องมีขนาดไม่เกิน 2 MiB',
  'Photo signature mismatch': 'ชนิดไฟล์ไม่ตรงกับข้อมูลภาพ กรุณาเลือกภาพใหม่',
  'Duplicate photo': 'มีภาพซ้ำในรายการ กรุณานำภาพซ้ำออก',
  'Photo already used on this policy': 'ภาพนี้เคยใช้ยื่นสินไหมในกรมธรรม์นี้แล้ว',
  'Incident already reported': 'มีคำขอสินไหมสำหรับเหตุการณ์นี้แล้ว',
  'Incident must be within policy coverage and not in the future': 'วันเวลาเกิดเหตุต้องอยู่ในระยะคุ้มครองและไม่เป็นเวลาในอนาคต',
  'Invalid policy or cause': 'กรุณาตรวจสอบกรมธรรม์และสาเหตุความเสียหาย',
  'Claim is not approved for automatic settlement': 'คำขอนี้ยังไม่ผ่านเกณฑ์การจ่ายสินไหมอัตโนมัติ',
  'Vision unavailable; retry assessment': 'ระบบวิเคราะห์ภาพไม่พร้อมใช้งาน กรุณาลองประเมินอีกครั้ง',
  'Local vision unavailable or invalid; retry assessment': 'โมเดลวิเคราะห์ภาพในเครื่องไม่พร้อมใช้งานหรือส่งผลไม่สมบูรณ์ กรุณาลองอีกครั้ง',
  'Invalid vision provenance': 'ข้อมูลแหล่งที่มาของผลวิเคราะห์ไม่ถูกต้อง กรุณาลองใหม่',
  'Invalid vision response': 'ผลวิเคราะห์ภาพไม่สมบูรณ์ กรุณาลองใหม่',
  'Unknown or duplicate damage part': 'ผลวิเคราะห์มีรายการความเสียหายที่ไม่รองรับหรือซ้ำกัน กรุณาลองใหม่',
  'Payment adapter returned invalid receipt': 'ยังยืนยันผลการจ่ายจำลองไม่ได้ กรุณาลองอีกครั้ง',
  'Idempotency key reused with different input': 'ข้อมูลคำขอเปลี่ยนไป กรุณาส่งคำขอใหม่',
  'Request too large': 'ข้อมูลที่ส่งมีขนาดใหญ่เกินไป กรุณาลดจำนวนหรือขนาดภาพ',
  'Quote not found': 'ไม่พบใบเสนอราคานี้ กรุณาสร้างใบเสนอราคาใหม่',
};
const localError = message => errors[message] || (message?.includes('record not found') ? 'ไม่พบข้อมูลที่ระบุ กรุณาตรวจสอบหมายเลขรายการ'
  : /[ก-๙]/.test(message || '') ? message : 'ดำเนินการไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่');
let catalog, quote, claim, previewUrls = [], resolvedPhotos = [], extracting = false;
// Keep the same key across retries of an identical operation; never persist credentials/photos.
const pending = new Map();
async function api(path, body) {
  const payload = body ? JSON.stringify(body) : undefined;
  const digest = payload ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))),
    byte => byte.toString(16).padStart(2, '0')).join('') : '';
  const operation = `${path}:${digest}`;
  if (body && !pending.has(operation)) pending.set(operation, crypto.randomUUID());
  const response = await fetch(`/api/${path}`, { method: body ? 'POST' : 'GET',
    headers: { ...(body ? { 'Content-Type': 'application/json', 'Idempotency-Key': pending.get(operation) } : {}),
      ...($('token').value ? { Authorization: `Bearer ${$('token').value}` } : {}) },
    ...(body ? { body: payload } : {}) });
  let result;
  try { result = await response.json(); } catch { throw new Error('ยังเชื่อมต่อระบบประกันไม่ได้ กรุณาเปิดหน้านี้ผ่านเซิร์ฟเวอร์ประกันที่พอร์ต 4188'); }
  if (!response.ok) throw new Error(localError(result.error));
  return result;
}
async function perform(button, action) {
  button.disabled = true; $('message').textContent = '';
  try { await action(); } catch (error) { $('message').textContent = localError(error.message); }
  finally { button.disabled = false; }
}
function options(select, records, label) {
  select.replaceChildren(...records.map(record => new Option(label(record), record.id)));
}
function vehicles() {
  options($('vehicle'), catalog.vehicles.filter(v => v.customerId === $('customer').value), v => `${v.make} ${v.model} · ${v.registration}`);
}
async function connect() {
  catalog = await api('company');
  $('company-name').textContent = catalog.company.name === 'Insurance Company' ? 'บริษัทประกันภัย' : catalog.company.name;
  $('vision-mode').textContent = catalog.visionMode === 'simulated' ? 'ผลประเมินจำลอง' : catalog.visionMode === 'ollama' ? 'วิเคราะห์ภาพในเครื่อง' : 'ระบบวิเคราะห์ภาพที่เชื่อมต่อ';
  $('connection-status').textContent = catalog.visionMode === 'simulated'
    ? 'เชื่อมต่อแล้ว · โหมดจำลองยังไม่ได้วิเคราะห์เนื้อหาในภาพ' : catalog.visionMode === 'ollama'
      ? 'เชื่อมต่อแล้ว · ภาพจะถูกวิเคราะห์ด้วยโมเดล Ollama ในเครื่อง' : 'เชื่อมต่อแล้ว · ภาพจะถูกส่งไปยังระบบวิเคราะห์ที่ผู้ดูแลตั้งค่าไว้';
  options($('customer'), catalog.customers, c => c.name === 'Demo Customer' ? 'ลูกค้าตัวอย่าง' : c.name); vehicles();
}
$('connect').onclick = () => perform($('connect'), connect);
$('customer').onchange = vehicles;
$('quote-form').onsubmit = event => {
  event.preventDefault();
  perform(event.submitter, async () => {
    quote = await api('quotes', { customerId: $('customer').value, vehicleId: $('vehicle').value,
      coverage: $('coverage').value, sumInsured: Math.round(Number($('sum-insured').value) * 100),
      deductible: Math.round(Number($('deductible').value) * 100) });
    const result = $('quote-result'); result.replaceChildren();
    const total = document.createElement('strong'); total.textContent = `${money(quote.premium.total)} / ปี`;
    const detail = document.createElement('p'); detail.textContent = `เบี้ยสุทธิ ${money(quote.premium.net)} + ภาษีจำลอง ${money(quote.premium.tax)} ใบเสนอราคามีอายุ 24 ชั่วโมง`;
    result.append(total, detail); $('issue').disabled = false;
  });
};
$('issue').onclick = () => perform($('issue'), async () => {
  const policy = await api(`quotes/${quote.id}/issue`, {});
  $('policy-id').value = policy.id; $('policy-result').textContent = `กรมธรรม์จำลองที่มีผลคุ้มครอง: ${policy.id}`;
  const local = new Date(Date.now() - new Date().getTimezoneOffset() * 60000 + 1000);
  $('occurred-at').value = local.toISOString().slice(0, 19);
});
function renderPreviews() {
  previewUrls.forEach(URL.revokeObjectURL); previewUrls = [];
  $('previews').replaceChildren();
  for (const file of resolvedPhotos) {
    const img = document.createElement('img'); img.alt = 'ภาพที่ใช้ประเมินความเสียหาย';
    img.src = URL.createObjectURL(file); previewUrls.push(img.src); $('previews').append(img);
  }
}
$('photos').onchange = async () => {
  const files = [...$('photos').files];
  $('video-progress').textContent = ''; $('message').textContent = '';
  if (files.length > 1 && files.some(isVideoFile)) {
    $('message').textContent = localError('video-too-many'); $('photos').value = '';
    resolvedPhotos = []; renderPreviews(); return;
  }
  if (files.length === 1 && isVideoFile(files[0])) {
    extracting = true; resolvedPhotos = []; renderPreviews();
    try {
      resolvedPhotos = await extractFrames(files[0], { onProgress: (done, total) =>
        { $('video-progress').textContent = `กำลังแยกภาพจากวิดีโอ… (${done}/${total})`; } });
      $('video-progress').textContent = `แยกภาพจากวิดีโอรอบคันได้ ${resolvedPhotos.length} ภาพ`;
    } catch (error) {
      $('message').textContent = localError(error.message); $('photos').value = ''; resolvedPhotos = [];
    } finally { extracting = false; renderPreviews(); }
    return;
  }
  resolvedPhotos = files.slice(0, MAX_FRAMES); renderPreviews();
};
const encode = file => new Promise((resolve, reject) => {
  const reader = new FileReader(); reader.onerror = () => reject(new Error('อ่านภาพไม่ได้ กรุณาเลือกไฟล์ใหม่'));
  reader.onload = () => resolve({ mimeType: file.type, data: reader.result.split(',')[1] }); reader.readAsDataURL(file);
});
function renderClaim() {
  const result = $('claim-result'); result.replaceChildren();
  const status = document.createElement('span'); status.className = 'tag'; status.textContent = labels[claim.status] || 'กำลังตรวจสอบสถานะ'; result.append(status);
  if (claim.assessment) {
    const a = claim.assessment, total = document.createElement('strong'), details = document.createElement('p');
    total.textContent = ` ค่าสินไหมประมาณการ ${money(a.payout)}`;
    details.textContent = `ค่าซ่อม ${money(a.repair.total)} · ค่าเสียหายส่วนแรก ${money(a.deductible)} · ความมั่นใจ ${Math.round(a.vision.confidence * 100)}% ${a.vision.simulated ? 'เป็นผลจำลองที่กำหนดไว้ ไม่ได้ประเมินจากเนื้อหาในภาพ' : `โมเดล: ${a.vision.model}`} ${a.reasons.map(reason => labels[reason] || 'ต้องตรวจสอบเพิ่มเติม').join(' · ')}`;
    result.append(total, details);
    for (const item of a.repair.items) {
      const row = document.createElement('p'); row.textContent = `${labels[item.part] || 'ชิ้นส่วนอื่น'} · ความเสียหาย${labels[item.severity] || 'รอตรวจสอบ'} · ${money(item.total)}`; result.append(row);
    }
  }
  if (claim.payment) { const receipt = document.createElement('p'); receipt.textContent = `จ่ายสินไหมจำลองเรียบร้อย · ${claim.payment.id}`; result.append(receipt); }
  $('settle').disabled = claim.status !== 'approved'; $('retry-assess').disabled = !!claim.assessment;
}
async function assess() { claim = await api(`claims/${claim.id}/assess`, {}); renderClaim(); }
$('claim-form').onsubmit = event => {
  event.preventDefault();
  perform(event.submitter, async () => {
    if (extracting) throw new Error('กำลังแยกภาพจากวิดีโอ กรุณารอสักครู่แล้วลองใหม่');
    if (!resolvedPhotos.length || resolvedPhotos.length > MAX_FRAMES || resolvedPhotos.some(f => f.size > 2 * 1024 * 1024))
      throw new Error('กรุณาเลือกภาพ 1–6 ภาพ หรือวิดีโอรอบคัน 1 ไฟล์ ขนาดภาพละไม่เกิน 2 MiB');
    $('settle').disabled = true; $('retry-assess').disabled = true;
    claim = await api('claims', { policyId: $('policy-id').value, cause: $('cause').value,
      occurredAt: new Date($('occurred-at').value).toISOString(), photos: await Promise.all(resolvedPhotos.map(encode)) });
    renderClaim(); await assess();
  });
};
$('retry-assess').onclick = () => perform($('retry-assess'), assess).then(renderClaim);
$('settle').onclick = () => perform($('settle'), async () => { claim = await api(`claims/${claim.id}/settle`, {}); renderClaim(); }).then(renderClaim);
connect().catch(error => { $('connection-status').textContent = localError(error.message); });
