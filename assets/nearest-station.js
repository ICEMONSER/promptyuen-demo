import {validPoint, incidentMapUrl} from './station-core.js';
export function distanceKm(a,b){
 const rad=n=>n*Math.PI/180;
 const x=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,x))));
}
export function stationResults(places,point){
 if(!validPoint(point))throw Error('กรุณาระบุพิกัดจุดเกิดเหตุให้ถูกต้อง');
 return (Array.isArray(places)?places:[]).flatMap(place=>{
  const loc={lat:typeof place.location?.lat==='function'?place.location.lat():place.location?.lat,lon:typeof place.location?.lng==='function'?place.location.lng():place.location?.lng};
  if(!validPoint(loc)||!place.id||typeof place.displayName!=='string'||!place.displayName.trim())return [];
  const map=new URL(incidentMapUrl(loc));map.searchParams.set('query',place.displayName);map.searchParams.set('query_place_id',place.id);
  return [{id:place.id,name:place.displayName,address:place.formattedAddress||'',...loc,distance:distanceKm(point,loc),mapUrl:map.href,incident:{...point},provider:'google',manual:false}];
 }).sort((a,b)=>a.distance-b.distance);
}
// Fictional training destinations, bundled locally. Never claims live police data.
export const DEMO_STATIONS=[
 {id:'demo-a',name:'สถานีตำรวจสาธิต ก (ข้อมูลสมมุติ)',lat:13.7563,lon:100.5018},
 {id:'demo-b',name:'สถานีตำรวจสาธิต ข (ข้อมูลสมมุติ)',lat:13.7367,lon:100.5231},
 {id:'demo-c',name:'สถานีตำรวจสาธิต ค (ข้อมูลสมมุติ)',lat:13.765,lon:100.538},
];
export async function nearestPoliceStation(point){
 if(!validPoint(point))throw Error('กรุณาระบุละติจูดและลองจิจูดก่อนค้นหาสถานี');
 const stations=DEMO_STATIONS.map(station=>({...station,distance:distanceKm(point,station),incident:{...point},provider:'local-demo',demo:true,manual:false,mapUrl:incidentMapUrl(station)})).filter(station=>station.distance<=50).sort((a,b)=>a.distance-b.distance);
 if(!stations.length)throw Error('นอกพื้นที่สาธิต: ใช้พิกัดตัวอย่าง 13.7500, 100.5100 หรือระบุสถานีเองจากลิงก์แผนที่ฟรี');
 return stations[0];
}
