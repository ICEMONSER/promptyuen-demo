import { D as React } from './shared-ui.js';
import { legalDraftSource, validateLegalDraft } from './reasoning.js?v=20261002-genai';
import {browserGenAI} from './browser-genai.js?v=auto-ai2';
const h = React.createElement;

export function LegalDraftPanel({ input, value, onChange, disabled = false, onBusyChange, autoGenerate = 0 }) {
  const [busy, setBusy] = React.useState(false);
  const service = React.useRef(null);
  const enabled = React.useRef(true);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const source = legalDraftSource(input);
  const latest = React.useRef(source);
  latest.current = source;
  const generation = React.useRef(0);
  React.useEffect(() => () => { generation.current++; }, []);
  React.useEffect(() => {
    if (value && value.source !== source) onChange(null);
    setError('');
  }, [source]);
  const current = value?.source === source ? value : null;
  async function generate() {
    if (busy) return;
    const id = ++generation.current;
    enabled.current=true;
    setBusy(true); onBusyChange?.(true); setError(''); setProgress('กำลังเปิด GenAI ในเครื่อง…');
    try {
      service.current ||= browserGenAI;
      const draft = await service.current.generate(input,message=>{if(id===generation.current)setProgress(message);});
      if (id === generation.current && latest.current === source) {
        onChange({ ...draft, source, mode: 'browser-genai', reviewed: false });
      }
    } catch (err) {
      if (id === generation.current && latest.current === source) setError(err.message);
    } finally {
      if (id === generation.current) { setBusy(false); onBusyChange?.(false); }
    }
  }
  React.useEffect(() => { if (autoGenerate) { if(enabled.current) generate(); else setError('คำถอดเสียงพร้อมแล้ว กดเปิด GenAI ฟรีด้านล่างเพื่อดาวน์โหลดโมเดลครั้งแรก หลังจากนั้นจะเรียบเรียงให้อัตโนมัติเมื่อหยุดพูด'); } }, [autoGenerate]);
  return h('section', { className: 'assistant-panel legal-draft', 'aria-label': 'เรียบเรียงสำนวนสำหรับพนักงานสอบสวน' },
    h('h3', null, 'เรียบเรียงสำนวนสำหรับพนักงานสอบสวน'),
    h('p', { className: 'small-note' }, 'GenAI จริง (Qwen2.5) ทำงานในเครื่อง ไม่ต้องมีบัญชีหรือ API key และไม่มีค่าบริการ AI เว็บเริ่มดาวน์โหลดโมเดลขนาดหลาย GB อัตโนมัติตั้งแต่เปิดหน้า ครั้งแรกยังต้องรอโหลดเสร็จ และใช้หน่วยความจำ GPU ประมาณ 2.5 GB ต้องใช้เบราว์เซอร์ที่รองรับ WebGPU คำบอกเล่าไม่ถูกส่งไปยังบริการ AI ภายนอก'),
    !disabled && h(React.Fragment, null,
      h('button', { type: 'button', disabled: busy || !input.details?.trim(), onClick: generate }, busy ? 'GenAI กำลังทำงาน…' : enabled.current ? 'เรียบเรียงใหม่ด้วย GenAI' : 'เปิด GenAI ฟรีและเรียบเรียง (ดาวน์โหลดโมเดล)')),
    busy && h('p', {role:'status'}, progress),
    busy && h('button', {type:'button',onClick:()=>service.current?.cancel()}, 'ยกเลิกการดาวน์โหลด / เรียบเรียง'),
    error && h('p', { role: 'alert', className: 'quick-error' }, error),
    current && h(React.Fragment, null,
      h('label', { className: 'assistant-field' }, 'ร่างสำนวนภาษาทางการ — ตรวจแก้ได้',
        h('textarea', { rows: 7, maxLength: 6000, value: current.formalNarrative, disabled: disabled || busy,
          onChange: e => onChange({ ...current, formalNarrative: e.target.value, reviewed: false, reviewedAt: null }) })),
      current.knownFacts.length > 0 && h('details', null, h('summary', null, 'ข้อความต้นทางที่ใช้อ้างอิง'),
        h('ul', null, ...current.knownFacts.map((fact, i) => h('li', { key: i }, fact.quote)))),
      current.missingQuestions.length > 0 && h('div', { className: 'location-note' },
        h('strong', null, 'ข้อมูลที่ควรสอบถามเพิ่มเติม'),
        h('ul', null, ...current.missingQuestions.map((question, i) => h('li', { key: i }, question))),
        h('small', null, 'ตรวจเติมข้อมูลที่ทราบในร่างด้านบนก่อนยืนยัน รายการที่ยังขาดจะปรากฏแยกในใบสรุป')),
      h('label', { className: 'map-consent' }, h('input', { type: 'checkbox', checked: !!current.reviewed, disabled: disabled || busy,
        onChange: e => { try { const { formalNarrative, knownFacts, missingQuestions } = current; if (e.target.checked) validateLegalDraft({ formalNarrative, knownFacts, missingQuestions }, input); setError(''); onChange({ ...current, reviewed: e.target.checked, reviewedAt: e.target.checked ? new Date().toISOString() : null }); } catch (err) { setError(err.message); } } }),
        'ตรวจแล้วว่าร่างตรงกับข้อเท็จจริงที่แจ้ง และยืนยันใช้ข้อความนี้ในใบสรุป'),
      !disabled && h('button', { type: 'button', disabled: busy, onClick: () => onChange(null) }, 'ยกเลิกร่าง และใช้คำบอกเล่าเดิม')),
    h('small', null, 'มีการตรวจร่างเทียบต้นฉบับด้วยโมเดลอีกครั้ง แต่ยังอาจผิดพลาดได้ ต้องตรวจข้อเท็จจริงก่อนยืนยัน'),
    h('small', null, 'เป็นร่างจากข้อมูลผู้แจ้งสำหรับให้พนักงานสอบสวนตรวจสอบ ไม่ใช่ข้อวินิจฉัยความผิดหรือสำนวนสอบสวนที่รับรองแล้ว'));
}
