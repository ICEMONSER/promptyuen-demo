import {D as React} from './shared-ui.js';
import {BANGKOK_STATIONS} from './bangkok-stations.js';
import {validPoint,incidentMapUrl} from './station-core.js';
import {distanceKm} from './nearest-station.js?v=20261002-real-stations';
import {IncidentMap} from './incident-map.js?v=20261002-auto';
const h=React.createElement;
export function StationDestination({station,incident,onChange,disabled=false}){
 const [editing,setEditing]=React.useState(false);
 const markers=React.useMemo(()=>station&&validPoint(station)?[station]:[],[station]);
 function select(id){
  const found=BANGKOK_STATIONS.find(s=>s.id===id);if(!found)return;
  onChange({...found,manual:false,provider:'bma-open-data',incident:incident||null,mapUrl:incidentMapUrl(found),...(validPoint(incident)?{distance:distanceKm(incident,found)}:{})});setEditing(false);
 }
 return h('section',{className:'location-note','aria-label':'สถานีตำรวจที่เลือก'},
  h('strong',null,station?.name||'ยังไม่ได้เลือกสถานีตำรวจ'),
  h('small',null,'สถานีสำหรับนำเอกสารไปติดต่อ · ยังไม่ได้ส่งเรื่องถึงตำรวจ'),
  markers.length>0&&h(IncidentMap,{stationOnly:true,stations:markers,selected:station.id}),
  station?.mapUrl&&h('a',{href:station.mapUrl,target:'_blank',rel:'noopener noreferrer'},'ดูที่ตั้งสถานีในแผนที่ภายนอก'),
  onChange&&h('button',{type:'button',disabled,onClick:()=>setEditing(v=>!v)},editing?'ปิดตัวเลือกสถานี':'เปลี่ยนสถานีตำรวจ'),
  editing&&h('label',{className:'assistant-field'},'เลือกสถานีตำรวจอื่น',h('select',{value:station?.manual?'':station?.id||'',disabled,onChange:e=>select(e.target.value)},
   h('option',{value:''},'เลือกสถานี'),...BANGKOK_STATIONS.map(s=>h('option',{key:s.id,value:s.id},s.name)))),
  editing&&h('label',{className:'assistant-field'},'หรือระบุชื่อสถานีที่ไม่มีในรายการ',h('input',{value:station?.manual?station.name:'',maxLength:150,disabled,onChange:e=>onChange(e.target.value.trim()?{id:'manual',name:e.target.value,manual:true,incident:incident||null}:null)})),
  h('small',null,'ข้อมูลสถานีในรายการครอบคลุมกรุงเทพฯ ระยะใกล้ที่สุดไม่ยืนยันเขตรับผิดชอบ'));
}
