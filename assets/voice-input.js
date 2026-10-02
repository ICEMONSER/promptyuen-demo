import {D as React} from './shared-ui.js';
import {createThaiDictation} from './voice-core.js';
const h = React.createElement;
const errors = {
  'not-allowed': 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน กรุณาอนุญาตในเบราว์เซอร์ หรือพิมพ์ข้อความแทน',
  'audio-capture': 'ไม่พบไมโครโฟนที่ใช้งานได้ กรุณาพิมพ์ข้อความแทน',
  'network': 'การถอดเสียงเชื่อมต่อไม่สำเร็จ กรุณาลองใหม่หรือพิมพ์ข้อความแทน',
  'no-speech': 'ไม่ได้ยินเสียงพูด กรุณาลองใหม่หรือพิมพ์ข้อความแทน'
};
export function VoiceInput({value, disabled, onComplete, onBusyChange}) {
  const [listening, setListening] = React.useState(false);
  const [preview, setPreview] = React.useState('');
  const [error, setError] = React.useState('');
  const session = React.useRef(null);
  const Recognition = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  React.useEffect(() => () => session.current?.dispose(), []);
  function start() {
    if (session.current || disabled) return;
    setError(''); setPreview(''); setListening(true); onBusyChange(true);
    const finish = () => { session.current = null; setListening(false); onBusyChange(false); };
    session.current = createThaiDictation(Recognition, {
      base: value, onPreview: setPreview,
      onError: code => setError(errors[code] || 'ถอดเสียงไม่สำเร็จ กรุณาลองใหม่หรือพิมพ์ข้อความแทน'),
      onComplete: (text, changed) => {
        finish();
        if (text.length > 4000) {
          setError('ข้อความยาวเกิน 4,000 ตัวอักษร กรุณาคัดลอกข้อความที่ถอดเสียงด้านล่าง แล้วแบ่งกรอก ข้อความเดิมยังอยู่');
          return;
        }
        setPreview('');
        if (changed) onComplete(text);
      }
    });
    try { session.current.start(); } catch { session.current.dispose(); finish(); setError('เริ่มไมโครโฟนไม่ได้ กรุณาพิมพ์ข้อความแทน'); }
  }
  return h('section', {'aria-label': 'เล่าเหตุการณ์ด้วยเสียงภาษาไทย'},
    h('p', {className: 'small-note'}, 'พูดภาษาไทยได้ตามธรรมชาติ เมื่อหยุดพูด ระบบจะเติมข้อความและสร้างร่างภาษาทางการให้ตรวจแก้ การถอดเสียงอาจส่งเสียงไปยังผู้ให้บริการเบราว์เซอร์ เว็บนี้ไม่บันทึกไฟล์เสียง'),
    h('button', {type: 'button', className: 'voice-record-button', 'aria-pressed': listening, disabled: !Recognition || (!listening && disabled), onClick: () => listening ? session.current?.stop() : start()}, listening ? '■ หยุดและเรียบเรียง' : '🎙 กดพูดเล่าเหตุการณ์'),
<<<<<<< HEAD
    h('p', {className: 'small-note'}, 'เมื่อโมเดลที่เว็บโหลดอัตโนมัติพร้อม: พูด → แปลงเป็นข้อความ → เรียบเรียงร่างอัตโนมัติ ไม่ต้องกดสร้างร่างซ้ำ'),
=======
    h('p', {className: 'small-note'}, 'พูด → แปลงเป็นข้อความ → เรียบเรียงร่างภาษากฎหมายอัตโนมัติ ไม่ต้องกดสร้างร่างซ้ำ'),
>>>>>>> parent of 13af73c (Integrate real free on-device GenAI without user API keys)
    !Recognition && h('p', null, 'เบราว์เซอร์นี้ไม่รองรับการถอดเสียง ใช้ไมโครโฟนบนแป้นพิมพ์เพื่อกรอกข้อความ หรือพิมพ์แล้วกดสร้างร่างภาษาทางการ'),
    listening && h('p', {role: 'status'}, 'กำลังฟังภาษาไทย… กดหยุดเมื่อเล่าจบ'),
    preview && h('p', {'aria-live': 'polite', style: {whiteSpace: 'pre-wrap'}}, preview),
    error && h('p', {role: 'alert'}, error));
}
