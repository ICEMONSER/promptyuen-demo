import {BANGKOK_STATIONS} from './bangkok-stations.js';
// Public station locations checked 2026-10-17; proximity is not jurisdiction.
export const RANGSIT_STATIONS = [
  {
    "id": "pathum-khlong-luang",
    "name": "สถานีตำรวจภูธรคลองหลวง",
    "lat": 14.06513,
    "lon": 100.6463,
    "address": "35 หมู่ 7 ตำบลคลองสอง อำเภอคลองหลวง จังหวัดปทุมธานี",
    "provider": "public-station-directory",
    "source": "https://mapcarta.com/W442793759"
  },
  {
    "id": "pathum-pratunam-chulalongkorn",
    "name": "สถานีตำรวจภูธรประตูน้ำจุฬาลงกรณ์",
    "lat": 13.9849012,
    "lon": 100.6125716,
    "address": "113 หมู่ 2 ตำบลประชาธิปัตย์ อำเภอธัญบุรี จังหวัดปทุมธานี",
    "provider": "public-station-directory",
    "source": "https://th.near-place.com/chulalongkorn-pratunam-metropolitan-police-station-113-thnn-soi-rangsit-pathum-thani-7-thanyaburi-district"
  }
];
export const POLICE_STATIONS = [...BANGKOK_STATIONS,...RANGSIT_STATIONS];
