import {validPoint, incidentMapUrl} from './station-core.js';
import {BANGKOK_STATIONS} from './bangkok-stations.js';
export function distanceKm(a,b){
 const rad=n=>n*Math.PI/180;
 const x=Math.sin(rad(b.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,x))));
}
// Nearest listed station by straight-line distance, not a jurisdiction lookup.
export async function nearestPoliceStation(point){
 if(!validPoint(point))throw Error('กรุณาระบุละติจูดและลองจิจูดก่อนค้นหาสถานี');
 if(point.lat<13.45||point.lat>14.05||point.lon<100.25||point.lon>100.95)throw Error('พิกัดอยู่นอกพื้นที่ข้อมูลกรุงเทพฯ กรุณาค้นหาสถานีจากลิงก์แผนที่และระบุเอง');
 const stations=BANGKOK_STATIONS.map(station=>({...station,distance:distanceKm(point,station),incident:{...point},provider:'bma-open-data',manual:false,mapUrl:incidentMapUrl(station)})).filter(station=>station.distance<=50).sort((a,b)=>a.distance-b.distance);
 if(!stations.length)throw Error('ไม่พบสถานีในชุดข้อมูลใกล้พิกัดนี้ กรุณาระบุสถานีเอง');
 return stations[0];
}
