import {D as React} from './shared-ui.js';
import {loadScript} from './import-document.js';
import {validPoint} from './station-core.js';
const h = React.createElement;
let cssReady;
function loadMap() {
  if (!cssReady) cssReady = new Promise((resolve,reject) => {
    const link=document.createElement('link');
    link.rel='stylesheet';link.href='https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css';
    const fail=()=>{clearTimeout(timer);link.remove();cssReady=null;reject(Error('โหลดรูปแบบแผนที่ไม่สำเร็จ กรุณาลองใหม่'));};
    const timer=setTimeout(fail,15000);
    link.onload=()=>{clearTimeout(timer);resolve();};link.onerror=fail;
    document.head.append(link);
  });
  return Promise.all([cssReady,loadScript('https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js','L')]).then(([,L])=>L);
}
export function IncidentMap({point,stations=[],selected,onPoint,onSelect,stationOnly=false}) {
  const host=React.useRef(null),map=React.useRef(null),layer=React.useRef(null),callbacks=React.useRef({onPoint,onSelect});
  callbacks.current={onPoint,onSelect};
  const [ready,setReady]=React.useState(false),[error,setError]=React.useState(''),[attempt,setAttempt]=React.useState(0);
  React.useEffect(()=>{
    let cancelled=false,observer;
    setError('');setReady(false);
    loadMap().then(L=>{
      if(cancelled)return;
      const view=L.map(host.current,{attributionControl:true,scrollWheelZoom:false});map.current=view;
      view.getContainer().querySelector('.leaflet-control-zoom-in').title='ขยายแผนที่';view.getContainer().querySelector('.leaflet-control-zoom-in').setAttribute('aria-label','ขยายแผนที่');
      view.getContainer().querySelector('.leaflet-control-zoom-out').title='ย่อแผนที่';view.getContainer().querySelector('.leaflet-control-zoom-out').setAttribute('aria-label','ย่อแผนที่');
      view.attributionControl.setPrefix(false);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">ผู้ร่วมสร้างโอเพนสตรีตแมป</a>'}).on('tileerror',()=>{if(!cancelled)setError('ภาพแผนที่บางส่วนโหลดไม่ได้ ลองใหม่หรือเปิดแผนที่ภายนอก');}).addTo(view);
      layer.current=L.layerGroup().addTo(view);
      const center=validPoint(point)?point:stations.find(validPoint);
      view.setView(center?[center.lat,center.lon]:[13.3,101],center?14:6);
      view.on('click',e=>callbacks.current.onPoint?.({lat:e.latlng.lat,lon:e.latlng.lng,source:'map'}));
      observer=new ResizeObserver(()=>view.invalidateSize());observer.observe(host.current);
      setReady(true);
    }).catch(e=>{if(!cancelled)setError(e.message);});
    return()=>{cancelled=true;observer?.disconnect();map.current?.remove();map.current=null;layer.current=null;};
  },[attempt]);
  React.useEffect(()=>{
    if(!ready||!map.current)return;
    const L=window.L,points=[];layer.current.clearLayers();
    if(validPoint(point)){
      points.push([point.lat,point.lon]);
      const label=document.createElement('span');label.textContent='จุดเกิดเหตุที่เลือก';
      L.circleMarker(points[0],{radius:10,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1}).bindTooltip(label,{permanent:true,direction:'top'}).addTo(layer.current);
      if(point.accuracy)L.circle(points[0],{radius:point.accuracy,color:'#2563eb',weight:1,fillOpacity:.08}).addTo(layer.current);
    }
    for(const [i,station] of stations.entries()){
      if(!validPoint(station))continue;
      const pos=[station.lat,station.lon];points.push(pos);
      const label=document.createElement('span');label.textContent=`${i+1}. ${station.name}`;
      L.circleMarker(pos,{radius:selected===station.id?11:8,color:'#fff',weight:2,fillColor:selected===station.id?'#c2410c':'#64748b',fillOpacity:1,bubblingMouseEvents:false}).bindTooltip(label).on('click',()=>callbacks.current.onSelect?.(station)).addTo(layer.current);
    }
    if(points.length>1)map.current.fitBounds(points,{padding:[32,45],maxZoom:15});
    else if(points.length)map.current.setView(points[0],14);
  },[ready,point?.lat,point?.lon,point?.accuracy,stations,selected]);
  return h('div',{className:'incident-map-wrap'},
    h('p',{className:'small-note'},stationOnly?'ที่ตั้งสถานีตำรวจที่เลือก':validPoint(point)?'หมุดสีน้ำเงินคือจุดเกิดเหตุ · สีส้มคือสถานีที่เลือก':'แผนที่ประเทศไทย · ยังไม่ได้ระบุจุดเกิดเหตุ'),
    h('div',{ref:host,className:'incident-map',role:'region','aria-label':stationOnly?'แผนที่สถานีตำรวจที่เลือก':'แผนที่จุดเกิดเหตุและสถานีตำรวจ',style:{height:300,width:'100%',isolation:'isolate'}}),
    !ready&&!error&&h('p',{role:'status'},'กำลังโหลดแผนที่…'),
    error&&h('p',{role:'status'},error,h('button',{type:'button',onClick:()=>setAttempt(n=>n+1)},'ลองโหลดแผนที่ใหม่')),
    onPoint&&h('button',{type:'button',disabled:!ready,onClick:()=>{const p=map.current.getCenter();onPoint({lat:p.lat,lon:p.lng,source:'map'});}},'ใช้จุดกึ่งกลางแผนที่เป็นจุดเกิดเหตุ'),
    onPoint&&h('small',null,'แตะตำแหน่งบนแผนที่ หรือใช้ปุ่มลูกศรเลื่อนแล้วเลือกจุดกึ่งกลาง'),
  );
}
