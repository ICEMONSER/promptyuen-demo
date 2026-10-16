import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestPoliceStation,distanceKm} from '../assets/nearest-station.js';
import {BANGKOK_STATIONS} from '../assets/bangkok-stations.js';
test('real station directory selects station name, never incident coordinates, without network',async()=>{const old=globalThis.fetch;globalThis.fetch=()=>{throw Error('network forbidden');};try{const point={lat:13.698928,lon:100.537145};const expected=[...BANGKOK_STATIONS].sort((a,b)=>distanceKm(point,a)-distanceKm(point,b))[0];const station=await nearestPoliceStation(point);assert.equal(station.id,expected.id);assert.match(station.name,/สถานีตำรวจ/);assert.doesNotMatch(station.name,/สาธิต|สมมุติ/);assert.deepEqual(station.incident,point);assert.ok(station.distance>0);assert.notEqual(station.lat,point.lat);}finally{globalThis.fetch=old;}});
test('changing location recalculates nearest and invalid/outside points fail',async()=>{for(const item of BANGKOK_STATIONS){const station=await nearestPoliceStation({lat:item.lat,lon:item.lon});assert.equal(station.distance,0);}await assert.rejects(nearestPoliceStation(null));await assert.rejects(nearestPoliceStation({lat:0,lon:0}),/นอกพื้นที่/);});

test('Thammasat Rangsit automatically selects Khlong Luang without network',async()=>{
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('network forbidden')};
 try{for(const point of [{lat:14.073,lon:100.601},{lat:14.068,lon:100.612},{lat:14.080,lon:100.615}]){
 const station=await nearestPoliceStation(point);
 assert.equal(station.id,'pathum-khlong-luang');assert.ok(station.distance<6);assert.equal(station.manual,false);
 assert.match(station.mapUrl,/14.06513/);
 }}finally{globalThis.fetch=original;}
});
test('central Rangsit selects Pratunam station and rejects outside coverage',async()=>{
 assert.equal((await nearestPoliceStation({lat:13.99,lon:100.615})).id,'pathum-pratunam-chulalongkorn');
 await assert.rejects(nearestPoliceStation({lat:14.5,lon:100.6}),/นอกพื้นที่/);
});
