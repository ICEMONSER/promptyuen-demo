import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestPoliceStation,DEMO_STATIONS} from '../assets/nearest-station.js';
test('free demo auto-selects nearest sample without network and labels it fictional',async()=>{const old=globalThis.fetch;globalThis.fetch=()=>{throw Error('network forbidden');};try{for(const item of DEMO_STATIONS){const station=await nearestPoliceStation({lat:item.lat,lon:item.lon});assert.equal(station.id,item.id);assert.equal(station.distance,0);assert.equal(station.demo,true);assert.equal(station.provider,'local-demo');assert.match(station.name,/สมมุติ/);}}finally{globalThis.fetch=old;}});
test('invalid or outside sample area cannot claim a real nearest station',async()=>{await assert.rejects(nearestPoliceStation(null));await assert.rejects(nearestPoliceStation({lat:0,lon:0}),/นอกพื้นที่สาธิต/);});
