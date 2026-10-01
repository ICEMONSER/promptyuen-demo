import {validPoint, incidentMapUrl} from './station-core.js';
const SETTINGS='promptyuen-google-maps-key';
export const getMapsKey=()=>sessionStorage.getItem(SETTINGS)||'';
export function saveMapsKey(key){
 const value=String(key||'').trim();
 if(value&&!/^[A-Za-z0-9_-]{20,200}$/.test(value))throw Error('กรุณาตรวจรหัสบริการ Google Maps');
 if(value)sessionStorage.setItem(SETTINGS,value);else sessionStorage.removeItem(SETTINGS);
}
let loading=null,loadedKey='';
async function loadPlaces(){
 const key=getMapsKey();
 if(!key)throw Error('กรุณาตั้งค่ารหัส Google Maps ที่เปิด Places API (New) ก่อนค้นหาสถานีอัตโนมัติ หรือระบุสถานีเอง');
 if(loadedKey&&loadedKey!==key)throw Error('เปลี่ยนรหัสบริการแล้ว กรุณาโหลดหน้าเว็บใหม่ก่อนค้นหา');
 if(!loading){
  loadedKey=key;
  loading=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   let settled=false;
   const finish=(error)=>{if(settled)return;settled=true;clearTimeout(timer);if(error){script.remove();reject(Error('เชื่อมต่อ Google Maps ไม่สำเร็จ กรุณาตรวจรหัส สิทธิ์เว็บไซต์ และการเปิดบริการ'));}else resolve();};
   const timer=setTimeout(()=>finish(true),20000);
   globalThis.promptyuenMapsReady=()=>finish(false);
   const url=new URL('https://maps.googleapis.com/maps/api/js');
   url.search=new URLSearchParams({key,v:'quarterly',loading:'async',language:'th',callback:'promptyuenMapsReady'}).toString();
   script.src=url.href;script.async=true;script.onerror=()=>finish(true);document.head.append(script);
  }).catch(error=>{loading=null;loadedKey='';throw error;});
 }
 await loading;
 return google.maps.importLibrary('places');
}
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
export async function nearestPoliceStation(point,library=loadPlaces){
 if(!validPoint(point))throw Error('กรุณาระบุละติจูดและลองจิจูดก่อนค้นหาสถานีอัตโนมัติ');
 const {Place,SearchNearbyRankPreference}=await library();
 let timer;
 try{
  const result=await Promise.race([
   Place.searchNearby({fields:['id','displayName','location','formattedAddress'],locationRestriction:{center:{lat:point.lat,lng:point.lon},radius:50000},includedTypes:['police'],rankPreference:SearchNearbyRankPreference.DISTANCE,maxResultCount:20}),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),20000);}),
  ]);
  const stations=stationResults(result.places,point);
  if(!stations.length)throw Error('empty');
  return stations[0];
 }catch(e){
  if(e.message==='empty')throw Error('ไม่พบสถานีตำรวจภายใน 50 กิโลเมตร กรุณาตรวจจุดเกิดเหตุหรือระบุสถานีเอง');
  throw Error('ค้นหาสถานีไม่สำเร็จ กรุณาตรวจการเปิด Places API (New) การเรียกเก็บเงิน และสิทธิ์เว็บไซต์ของรหัสบริการ');
 }finally{clearTimeout(timer);}
}
