import {D as React} from './shared-ui.js';
import {nearestPoliceStation} from './nearest-station.js?v=20261002-real-stations';
import {STATION_SOURCE,BANGKOK_STATIONS} from './bangkok-stations.js';
import {validPoint} from './station-core.js';
const h=React.createElement;
export function NearestStationSearch({point,onSelect,disabled=false,onBusyChange,lookup=nearestPoliceStation}){
 const [busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 const source=JSON.stringify(point),version=React.useRef(0),callbacks=React.useRef({onSelect,onBusyChange});
 callbacks.current={onSelect,onBusyChange};
 async function search(){
  const id=++version.current;setBusy(true);callbacks.current.onBusyChange?.(true);setError('');callbacks.current.onSelect(null);
  try{const station=await lookup(point);if(id===version.current)callbacks.current.onSelect(station);}
  catch(e){if(id===version.current)setError(e.message);}
  finally{if(id===version.current){setBusy(false);callbacks.current.onBusyChange?.(false);}}
 }
 React.useEffect(()=>{
  version.current++;setError('');setBusy(false);callbacks.current.onBusyChange?.(false);callbacks.current.onSelect(null);
  const timer=validPoint(point)?setTimeout(search,350):null;
  return()=>{clearTimeout(timer);version.current++;};
 },[source]);
 return h('div',{className:'location-note'},
  h('strong',null,'เลือกชื่อสถานีตำรวจใกล้จุดเกิดเหตุอัตโนมัติ'),
  h('small',null,`คำนวณระยะจากพิกัดจุดเกิดเหตุไปยังสถานีจริง ${BANGKOK_STATIONS.length} แห่งในชุดข้อมูลกรุงเทพฯ แล้วเติมชื่อสถานีที่ใกล้ที่สุด ไม่ใช้พิกัดแทนชื่อสถานี`),
  h('button',{type:'button',disabled:busy||disabled,onClick:search},busy?'กำลังเลือกสถานี…':'คำนวณสถานีใกล้ที่สุดอีกครั้ง'),
  !validPoint(point)&&h('small',null,'เมื่อกรอกพิกัดครบ ระบบจะเติมชื่อสถานีให้อัตโนมัติ'),
  h('small',null,'ฟรี ไม่ใช้ API · ใกล้ที่สุดในชุดข้อมูลโดยระยะเส้นตรง ไม่ยืนยันเขตรับผิดชอบหรือข้อมูลล่าสุด'),
  error&&h('p',{role:'status'},error),h('a',{href:STATION_SOURCE,target:'_blank',rel:'noopener noreferrer'},'แหล่งข้อมูล: กรุงเทพมหานคร (ดาวน์โหลด 2 ต.ค. 2569)'));
}
