import {D as React} from './shared-ui.js';
import {nearestPoliceStation} from './nearest-station.js?v=20261002-real-stations';
import {STATION_SOURCE,BANGKOK_STATIONS} from './bangkok-stations.js';
import {validPoint} from './station-core.js';
const h=React.createElement;
export function NearestStationSearch({point,onSelect,disabled=false,enabled=true,onBusyChange,lookup=nearestPoliceStation}){
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
  version.current++;setError('');setBusy(false);callbacks.current.onBusyChange?.(false);if(!enabled)return;callbacks.current.onSelect(null);
  const timer=validPoint(point)?setTimeout(search,350):null;
  return()=>{clearTimeout(timer);version.current++;};
 },[source,enabled]);
 return h('div',null,
  busy&&h('p',{role:'status'},'กำลังเลือกสถานีตำรวจใกล้เคียง…'),
  error&&h('p',{role:'status'},error));
}
