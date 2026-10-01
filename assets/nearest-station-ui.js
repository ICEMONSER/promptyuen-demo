import {D as React} from './shared-ui.js';
import {getMapsKey,saveMapsKey,nearestPoliceStation} from './nearest-station.js';
import {validPoint} from './station-core.js';
const h=React.createElement;
export function NearestStationSearch({point,onSelect,disabled=false,onBusyChange,lookup=nearestPoliceStation}){
 const [key,setKey]=React.useState(getMapsKey),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
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
  h('strong',null,'เลือกสถานีใกล้ที่สุดเป็นจุดยื่นเอกสาร'),
  h('small',null,'ค้นหาสถานีตำรวจในรัศมี 50 กม. จากพิกัดจุดเกิดเหตุ แล้วเลือกผลที่ใกล้ที่สุดโดยระยะเส้นตรงอัตโนมัติ ไม่ยืนยันเขตรับผิดชอบ'),
  h('details',null,h('summary',null,'ตั้งค่าการค้นหา Google Maps'),
   h('label',{className:'assistant-field'},'รหัส Google Maps สำหรับเว็บไซต์',h('input',{type:'password',value:key,autoComplete:'off',disabled:busy||disabled,onChange:e=>setKey(e.target.value)})),
   h('small',null,'ใช้รหัสที่เปิด Maps JavaScript API และ Places API (New) จำกัดเว็บไซต์เป็น icemonser.github.io เก็บในเซสชันนี้เท่านั้น'),
   h('button',{type:'button',disabled:busy||disabled,onClick:()=>{try{saveMapsKey(key);setError('บันทึกการตั้งค่าแล้ว');}catch(e){setError(e.message);}}},'บันทึกรหัสบริการ')),
  h('button',{type:'button',disabled:busy||disabled,onClick:search},busy?'กำลังค้นหาสถานี…':'ค้นหาและเลือกสถานีใกล้ที่สุด'),
  !validPoint(point)&&h('small',null,'ใส่ละติจูดและลองจิจูดเพื่อค้นหาอัตโนมัติ'),
  h('small',null,'เมื่อกดค้นหา จะส่งเฉพาะพิกัดให้ Google ไม่ส่งคำบอกเล่าหรือเอกสาร'),
  error&&h('p',{role:'status'},error),h('small',null,'Google Maps'));
}
