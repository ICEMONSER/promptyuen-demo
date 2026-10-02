import {D as React} from './shared-ui.js';
import {NearestStationSearch} from './nearest-station-ui.js?v=20261002-auto';
import {StationDestination} from './station-destination.js?v=20261002-auto';
const h=React.createElement;
export function StationPicker({initial,onSelect}) {
 const [point,setPoint]=React.useState(initial?.incident||null),[station,setStation]=React.useState(initial||null);
 const [override,setOverride]=React.useState(!!initial),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
 const callbacks=React.useRef({onSelect});callbacks.current={onSelect};
 React.useEffect(()=>{
  if(initial)return;
  let active=true;setBusy(true);
  if(!navigator.geolocation){setBusy(false);setError('ใช้ตำแหน่งอัตโนมัติไม่ได้ กรุณาเลือกสถานีเอง');return;}
  navigator.geolocation.getCurrentPosition(p=>{if(active){setPoint({lat:p.coords.latitude,lon:p.coords.longitude,source:'geolocation'});setBusy(false);}},
   ()=>{if(active){setBusy(false);setError('ไม่ได้รับตำแหน่ง กรุณาเลือกสถานีตำรวจที่ต้องการติดต่อเอง');}},
   {enableHighAccuracy:true,timeout:12000,maximumAge:0});
  return()=>{active=false;};
 },[]);
 function select(next){setStation(next);callbacks.current.onSelect(next);}
 return h('div',null,
  busy&&h('p',{role:'status'},'กำลังเลือกสถานีตำรวจใกล้เคียง…'),
  error&&h('p',{role:'status'},error),
  h(NearestStationSearch,{point,enabled:!override,onSelect:select}),
  h(StationDestination,{station,incident:point,onChange:next=>{setOverride(true);select(next);}}));
}
