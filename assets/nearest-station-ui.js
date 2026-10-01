import {D as React} from './shared-ui.js';
import {nearestPoliceStation} from './nearest-station.js';
import {validPoint} from './station-core.js';
const h=React.createElement;
export function NearestStationSearch({point,onSelect,disabled=false,onBusyChange,lookup=nearestPoliceStation}){
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 const source=JSON.stringify(point),current=React.useRef(source),version=React.useRef(0);
 current.current=source;
 React.useEffect(()=>{setError('');},[source]);
 React.useEffect(()=>()=>{version.current++;},[]);
 async function search(){
  if(busy)return;
  const id=++version.current;setBusy(true);onBusyChange?.(true);setError('');onSelect(null);
  try{const station=await lookup(point);if(id===version.current&&current.current===source)onSelect(station);}
  catch(e){if(id===version.current&&current.current===source)setError(e.message);}
  finally{if(id===version.current){setBusy(false);onBusyChange?.(false);}}
 }
 return h('div',{className:'location-note'},
  h('strong',null,'เลือกจุดยื่นเอกสารสาธิต (ไม่มีค่าใช้จ่าย)'),
  h('small',null,'สาธิตฟรีด้วยสถานีสมมุติ 3 แห่งในกรุงเทพฯ เลือกแห่งที่ใกล้พิกัดที่สุดในชุดตัวอย่าง ไม่ใช่สถานีจริงหรือผลค้นหาออนไลน์'),
  h('button',{type:'button',disabled:busy||disabled,onClick:search},busy?'กำลังค้นหาสถานี…':'ค้นหาและเลือกสถานีใกล้ที่สุด'),
  !validPoint(point)&&h('small',null,'ใส่ละติจูดและลองจิจูดเพื่อค้นหาอัตโนมัติ'),
  h('small',null,'คำนวณในเครื่อง ไม่ใช้ API · พิกัดทดลอง 13.7500, 100.5100'),
  error&&h('p',{role:'status'},error),h('small',null,'ข้อมูลสมมุติสำหรับสาธิตเท่านั้น'));
}
