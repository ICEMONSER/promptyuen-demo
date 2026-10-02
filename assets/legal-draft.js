import { D as React } from './shared-ui.js';
import { generateLegalDraft, legalDraftSource, validateLegalDraft } from './reasoning.js?v=20261002-voice3';
const h = React.createElement;

export function LegalDraftPanel({ input, value, onChange, disabled = false, onBusyChange, autoGenerate = 0 }) {
  const [busy, setBusy] = React.useState(false);
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
    setBusy(true); onBusyChange?.(true); setError('');
    try {
      const draft = await generateLegalDraft(input);
      if (id === generation.current && latest.current === source) {
        onChange({ ...draft, source, mode: 'local-demo', reviewed: false });
      }
    } catch (err) {
      if (id === generation.current && latest.current === source) setError(err.message);
    } finally {
      if (id === generation.current) { setBusy(false); onBusyChange?.(false); }
    }
  }
  React.useEffect(() => { if (autoGenerate) generate(); }, [autoGenerate]);
  return h('section', { className: 'assistant-panel legal-draft', 'aria-label': 'เรียบเรียงสำนวนสำหรับพนักงานสอบสวน' },
    h('h3', null, 'เรียบเรียงสำนวนสำหรับพนักงานสอบสวน'),
    h('p', { className: 'small-note' }, 'เรียบเรียงฟรีในเครื่อง รองรับคำบอกเล่าอุบัติเหตุบางรูปแบบ ไม่ใช่ GenAI หากแปลความไม่ครบจะแจ้งให้ตรวจคำถอดเสียง โดยไม่ตัดข้อเท็จจริงทิ้ง'),
    !disabled && h(React.Fragment, null,
      h('button', { type: 'button', disabled: busy || !input.details?.trim(), onClick: generate }, busy ? 'กำลังเรียบเรียงข้อเท็จจริง…' : current ? 'เรียบเรียงสำนวนใหม่' : 'สร้างร่างภาษาทางการ (สาธิตฟรี)')),
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
      !disabled && h('button', { type: 'button', disabled: busy, onClick: () => onChange(null) }, 'ยกเลิกร่างสาธิต และใช้คำบอกเล่าเดิม')),
    h('small', null, 'เป็นร่างจากข้อมูลผู้แจ้งสำหรับให้พนักงานสอบสวนตรวจสอบ ไม่ใช่ข้อวินิจฉัยความผิดหรือสำนวนสอบสวนที่รับรองแล้ว'));
}
