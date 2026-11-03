import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {heightSampler,createObstacleIndex} from '../drone/city-world.js';
import {createDefaultRoute,ANCHOR_FROM_HOME,HERITAGE} from '../drone/mission.js';
import {validRoute,LIMITS} from '../drone/sim.js';
import {createUtm} from '../src/maps/utm.js';

const region=JSON.parse(fs.readFileSync('data/bal/region.json','utf8'));
const u=createUtm(region.crs),[e0,n0]=u.fwd(region.origin.lon,region.origin.lat);
const local=(lon,lat)=>{const [e,n]=u.fwd(lon,lat);return {x:e-e0,z:n0-n}};
const home=local(region.home.lon,region.home.lat);

test('Balıkesir bölge çerçevesi: UTM 35N, başlangıç Saat Kulesi, kalkış BİLSEM ve görev çapası güncel',()=>{
  assert.equal(region.crs,'EPSG:32635');
  assert.ok(Math.abs(e0-region.originUTM[0])<.01&&Math.abs(n0-region.originUTM[1])<.01,'originUTM bayat');
  assert.ok(Math.abs(-home.x-ANCHOR_FROM_HOME[0])<2&&Math.abs(-home.z-ANCHOR_FROM_HOME[1])<2,'ANCHOR_FROM_HOME bayat');
  const d=Math.hypot(home.x,home.z);assert.ok(d>1800&&d<2300,`BİLSEM Saat Kulesi'nden ${d.toFixed(0)} m`);
});

test('yerel alan ve bbox: eğitim çemberi ve Saat Kulesi alanın içinde; bbox yerel alanı kapsar',()=>{
  const L=region.local,r=LIMITS.radius;
  assert.ok(home.x-r>=L.minX&&home.x+r<=L.maxX&&home.z-r>=L.minZ&&home.z+r<=L.maxZ,'2,5 km eğitim çemberi arazi dışına taşıyor');
  assert.ok(0>=L.minX+500&&0<=L.maxX-500&&0>=L.minZ+500&&0<=L.maxZ-500,'Saat Kulesi kenara çok yakın');
  const [w,s,e,n]=region.bboxLonLat;
  for(const [x,z] of [[L.minX,L.minZ],[L.minX,L.maxZ],[L.maxX,L.minZ],[L.maxX,L.maxZ]]){
    const g=u.inv(x+e0,n0-z);assert.ok(g.lon>=w-1e-3&&g.lon<=e+1e-3&&g.lat>=s-1e-3&&g.lat<=n+1e-3,`köşe ${x},${z} bbox dışında`);
  }
});

test('varsayılan rota: Saat Kulesi çevresinde ~370 m halka, hepsi 2,5 km sınırı içinde',()=>{
  const route=createDefaultRoute(home);
  assert.equal(route.length,6);assert.equal(validRoute(route,home),true);
  for(const p of route){const d=Math.hypot(p.x,p.z);assert.ok(d>300&&d<450,`halka noktası Saat Kulesi'ne ${d.toFixed(0)} m`)}
  // ilk nokta BİLSEM tarafında (güney), en kuzey nokta merkezin kuzeyinde
  assert.ok(route[0].z>0&&Math.min(...route.map(p=>p.z))<-300);
  assert.ok(new Set(HERITAGE.map(h=>h.id)).size===HERITAGE.length);
  assert.ok(HERITAGE.some(h=>h.id==='saat-kulesi')&&HERITAGE.some(h=>h.id==='bilsem'));
});

test('height grid is sampled bilinearly and held at the edges; no grid = fallback',()=>{
  const g=heightSampler({x0:0,z0:0,step:10,cols:2,rows:2,heights:[0,10,20,30]},5);
  assert.equal(g(5,5),15);assert.equal(g(-50,-50),0);assert.equal(g(99,99),30);
  assert.equal(heightSampler(null,140)(1,2),140);
});

test('building index: top height inside the footprint, hit test with radius',()=>{
  const idx=createObstacleIndex([{id:'b',height:12,ring:[[0,0],[10,0],[10,10],[0,10]]}],()=>140);
  assert.equal(idx.heightAt(5,5),152);assert.equal(idx.heightAt(15,5),-Infinity);
  assert.ok(idx.hitTest(5,145,5,.2));assert.equal(idx.hitTest(5,153,5,.2),null);
  assert.ok(idx.hitTest(10.25,145,5,.3));assert.equal(idx.hitTest(11,145,5,.3),null);
});

test('Ankara’ya özgü dosyalar pakette yok, açılış haritası Saat Kulesi ve BİLSEM’i gösterir',()=>{
  for(const f of ['drone/anitkabir.js','drone/aslanli-yol.js','data/ank','models/anitkabir.glb','models/aslanli-yol'])assert.equal(fs.existsSync(f),false,f);
  const open=JSON.parse(fs.readFileSync('data/bal/opening-streets.json','utf8'));
  assert.equal(open.monument.name,'Saat Kulesi');assert.equal(open.home.name,'Altıeylül BİLSEM');
  assert.ok(open.streets.length<=5,'street-map.js en fazla beş cadde etiketler');
});
