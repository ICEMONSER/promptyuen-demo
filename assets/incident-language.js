// Conservative local fact parser. Unrecognised clauses must never silently disappear.
export function formalizeIncident(details) {
  let text = details.trim().replace(/[\s,，。.!]+/g, '');
  const facts = {event: '', activity: '', damages: [], injury: ''};
  const take = (pattern, apply) => { text = text.replace(pattern, (...args) => { apply(...args); return ''; }); };
  take(/^(?:ตอนนี้|เมื่อกี้|เมื่อสักครู่)/, () => {});
  take(/(?:ครับ|ค่ะ|คะ)$/g, () => {});
  take(/^(?:ผม|ฉัน|ดิฉัน)(?:กำลัง)?จอดรถอยู่/, () => { facts.activity = 'ขณะรถยนต์ของข้าพเจ้าจอดอยู่'; });
  take(/^(?:ผม|ฉัน|ดิฉัน)(?:กำลัง)?ขับรถอยู่/, () => { facts.activity = 'ขณะข้าพเจ้ากำลังขับขี่รถยนต์'; });
  take(/^(?:แล้ว|ก็)?(?:รถ(?:ยนต์)?(?:ของ)?(?:ผม|ฉัน|ดิฉัน)|รถ)(?:เพิ่ง|พึ่ง)?(?:โดน|ถูก)(?:รถ(?:คันอื่น|คู่กรณี))?(?:ขับมา)?(?:เฉี่ยวชน|ชน)(ท้าย|ด้านท้าย|ด้านหน้า)?/, (_, point) => {
    facts.event = 'รถยนต์ของข้าพเจ้าถูกชน' + (point ? 'บริเวณ' + (point === 'ท้าย' ? 'ด้านท้าย' : point) : '');
  });
  if (facts.activity) take(/^(?:แล้ว|ก็)?(?:โดน|ถูก)(?:รถ(?:คันอื่น|คู่กรณี))?(?:ขับมา)?ชน(ท้าย|ด้านท้าย|ด้านหน้า)?/, (_, point) => {
    facts.event = 'รถยนต์ของข้าพเจ้าถูกชน' + (point ? 'บริเวณ' + (point === 'ท้าย' ? 'ด้านท้าย' : point) : '');
  });
  if (text === 'โดนรถชน') { facts.event = 'ตนถูกรถชน'; text = ''; }
  // Only consume affirmative damage statements after an identified collision.
  if (facts.event) {
    take(/(?:ทำให้|เป็นเหตุให้|แล้ว|และ)?(ไฟท้าย|ไฟหน้า|กันชน|กระจก)(?:ด้าน)?(ซ้าย|ขวา)?(?:มัน)?(แตก|พัง|เสียหาย|บุบ|เป็นรอย)/g, (_, part, side, damage) => {
      facts.damages.push(`${part}${side ? 'ด้าน' + side : ''}${damage === 'พัง' || damage === 'เสียหาย' ? 'ได้รับความเสียหาย' : damage}`);
    });
    take(/(?:และ)?(?:ผม|ฉัน|ดิฉัน)?(?:ไม่ได้รับบาดเจ็บ|ไม่ได้บาดเจ็บ|ไม่บาดเจ็บ)/, () => { facts.injury = 'ข้าพเจ้าไม่ได้รับบาดเจ็บจากเหตุการณ์ดังกล่าว'; });
  }
  if (!facts.event || text) throw new Error('ยังเรียบเรียงคำบอกเล่านี้อย่างครบถ้วนไม่ได้ ข้อความต้นฉบับยังอยู่ กรุณาตรวจคำถอดเสียงและเล่าเป็นประโยคสั้น ๆ เช่น “ผมจอดรถอยู่แล้วโดนชนท้าย ไฟท้ายซ้ายแตก” ระบบสาธิตฟรีรองรับเฉพาะรูปประโยคอุบัติเหตุบางแบบ');
  return facts;
}
