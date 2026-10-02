import { D as React } from './shared-ui.js';
import { legalDraftSource, validateLegalDraft } from './reasoning.js?v=20261002-auto-voice';
import {createBrowserGenAI} from './browser-genai.js?v=20261002-auto-voice';
const h = React.createElement;

export function LegalDraftPanel({ input, value, onChange, disabled = false, onBusyChange, autoGenerate = 0 }) {
  const [busy, setBusy] = React.useState(false);
  const service = React.useRef(null);
  const [error, setError] = React.useState('');
  const source = legalDraftSource(input);
  const latest = React.useRef(source);
  latest.current = source;
  const generation = React.useRef(0);
  React.useEffect(() => () => { generation.current++; service.current?.cancel(); }, []);
  React.useEffect(() => {
    if (value && value.source !== source) onChange(null);
    setError('');
  }, [source]);
  const current = value?.source === source ? value : null;
  async function generate() {
    if (busy) return;
    const id = ++generation.current;
    setBusy(true); onBusyChange?.(true); setError('');
    try {
      service.current ||= createBrowserGenAI();
      const draft = await service.current.generate(input);
      if (id === generation.current && latest.current === source) {
        onChange({ ...draft, source, mode: 'browser-genai', reviewed: false });
      }
    } catch (err) {
      if (id === generation.current && latest.current === source) setError(err.message);
    } finally {
      if (id === generation.current) { setBusy(false); onBusyChange?.(false); }
    }
  }
  React.useEffect(() => { if (autoGenerate) generate(); }, [autoGenerate]);
  return h('section', { className: 'assistant-panel legal-draft', 'aria-label': 'ข้อความสำหรับใบสรุป' },
    h('h3', null, 'ข้อความสำหรับใบสรุป'),
    h('p', { className: 'small-note' }, 'เมื่อพูดจบ ระบบจะเรียบเรียงและใส่ข้อความในใบสรุปให้โดยอัตโนมัติ ตรวจความถูกต้องก่อนยืนยันเอกสาร'),
    busy && h('p', {role:'status'}, 'กำลังเตรียมข้อความสำหรับเอกสาร… ครั้งแรกอาจใช้เวลาหลายนาที คุณไม่ต้องดาวน์โหลดหรือตั้งค่าเอง'),
    busy && h('button', {type:'button',onClick:()=>service.current?.cancel()}, 'ยกเลิก'),
    !disabled && !busy && (error || !autoGenerate) && h('button', {type:'button',disabled:!input.details?.trim(),onClick:generate}, error ? 'ลองเรียบเรียงอีกครั้ง' : 'เตรียมข้อความสำหรับเอกสาร'),
    error && h('p', { role: 'alert', className: 'quick-error' }, error),
    current && h(React.Fragment, null,
      h('label', { className: 'assistant-field' }, 'ข้อความที่จะใช้ในเอกสาร — ตรวจแก้ได้',
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
    h('small', null, 'เป็นร่างจากข้อมูลผู้แจ้งสำหรับให้พนักงานสอบสวนตรวจสอบ ไม่ใช่ข้อวินิจฉัยความผิดหรือสำนวนสอบสวนที่รับรองแล้ว'));
}
