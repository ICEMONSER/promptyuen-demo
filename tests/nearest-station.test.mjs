import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nearestPoliceStation,stationResults} from '../assets/nearest-station.js';
const point={lat:13,lon:100};
const rows=[{id:'far',displayName:'ไกล',location:{lat:()=>13.1,lng:()=>100}},{id:'near',displayName:'ใกล้',location:{lat:()=>13.001,lng:()=>100}}];
test('retrieval sends coordinates and selects nearest usable police result',async()=>{
 let request;const station=await nearestPoliceStation(point,async()=>({Place:{searchNearby:async r=>{request=r;return{places:rows};}},SearchNearbyRankPreference:{DISTANCE:'DISTANCE'}}));
 assert.equal(station.id,'near');assert.deepEqual(station.incident,point);assert.equal(station.provider,'google');assert.equal(request.rankPreference,'DISTANCE');assert.deepEqual(request.includedTypes,['police']);assert.equal(request.locationRestriction.radius,50000);assert.deepEqual(request.locationRestriction.center,{lat:13,lng:100});assert.equal(new URL(station.mapUrl).searchParams.get('query_place_id'),'near');
});
test('bad coordinates never call provider; empty/error cannot become destination',async()=>{
 let called=false;await assert.rejects(nearestPoliceStation(null,async()=>{called=true;}));assert.equal(called,false);
 const lib=places=>async()=>({Place:{searchNearby:async()=>({places})},SearchNearbyRankPreference:{DISTANCE:'distance'}});
 await assert.rejects(nearestPoliceStation(point,lib([])),/ไม่พบสถานี/);
 await assert.rejects(nearestPoliceStation(point,lib([{id:'bad',displayName:'bad',location:null}])),/ไม่พบสถานี/);
 assert.equal(stationResults([...rows,{location:{lat:99,lng:100}}],point).length,2);
 await assert.rejects(nearestPoliceStation(point,async()=>({Place:{searchNearby:async()=>{throw Error('secret provider error');}},SearchNearbyRankPreference:{DISTANCE:'distance'}})),e=>!e.message.includes('secret'));
});
