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

import {setGeoRegion} from '../src/geo.js';
import {bilsemPlacement} from '../drone/bilsem.js';
import {keepZones} from '../drone/keep-zone.js';
test('BİLSEM binası: ölçülen konum ve ölçüde, kalkış pedi ön avluda, kamelya binanın önünde ve batısında',()=>{
  setGeoRegion(region,u);
  const data=JSON.parse(fs.readFileSync('data/bal/bilsem.json','utf8'));
  assert.ok(fs.existsSync(data.glb),'model dosyası yok: '+data.glb);
  const p=bilsemPlacement(data,()=>160),b=p.building,k=p.kamelya;
  assert.ok(Math.abs(b.hu*2-data.building.width)<0.01,'genişlik');assert.ok(b.top-b.bottom===data.building.height);
  assert.ok(Math.abs(Math.atan2(b.u[1],b.u[0]))<0.05,'bina doğu-batı ekseninde (±3°)');
  assert.ok(!b.inside(home.x,home.z,3)&&!k.inside(home.x,home.z,3),'ped bina/kamelya dışında, 3 m pay');
  const front=(home.z-b.z)*1;assert.ok(front>b.hv+8&&front<b.hv+30,`ped cepheden ${(front-b.hv).toFixed(1)} m önde`);
  assert.ok(k.z>b.z+b.hv+5&&k.x<b.x-b.hu/3,'kamelya binanın önünde ve batı tarafında');
  assert.ok(Math.hypot(k.x-home.x,k.z-home.z)>8,'kamelya pede çok yakın değil');
  // Google kalibrasyon noktası (ped +12 m doğu) bina ve kamelya dışında
  assert.ok(!p.boxes.some(x=>x.inside(home.x+12,home.z,1)));
  const zones=keepZones({home,extra:p.keepZones});assert.ok(zones.length<=4,'en fazla 4 koruma alanı (keep-zone.js MAX_KEEP)');
  // bahçe koruma alanı binayı, kamelyayı ve pedi içine alır (Google'ın bina tümseği cephe önünde kalmasın)
  const inZone=(zn,x,z,m=0)=>{const dx=x-zn.c[0],dz=z-zn.c[1];return Math.abs(dx*zn.u[0]+dz*zn.u[1])<=zn.h[0]-m&&Math.abs(-dx*zn.u[1]+dz*zn.u[0])<=zn.h[1]-m};
  for(const [x,z] of [[b.x-b.hu,b.z-b.hv],[b.x+b.hu,b.z+b.hv],[k.x,k.z],[home.x,home.z]])assert.ok(inZone(p.keepZones[0],x,z,5),'bahçe alanı');
  const inVol=(x,z,m)=>{const [la,lb]=b.local(x,z),xa=p.plan.s*la;return p.plan.vols.some(v=>xa>=v.x0-m&&xa<=v.x1+m&&lb>=v.z0-m&&lb<=v.z1+m)};
  for(const o of p.yardObstacles){assert.ok(Math.hypot(o.x-home.x,o.z-home.z)>o.r+4,o.name+' pede yakın');assert.ok(!inVol(o.x,o.z,o.r),o.name+' binanın içinde');assert.ok(!k.inside(o.x,o.z,0.5),o.name+' kamelyada')}
  const poles=p.yardObstacles.filter(o=>o.name==='bayrak direği'),bust=p.yardObstacles.find(o=>o.name==='Atatürk büstü');
  assert.equal(poles.length,1,'tek bayrak');assert.ok(b.local(poles[0].x,poles[0].z)[0]>b.local(bust.x,bust.z)[0],'bayrak büstün girişe yakın (doğu) yanında');
  assert.ok(p.yardObstacles.some(o=>o.name==='Atatürk büstü')&&p.yardObstacles.some(o=>o.name==='bayrak direği'));
});

test('BİLSEM tip proje binası: hacimler ölçülen kutuda, çatı ölçülen yükseklikte, ped/kamelya/bayrak direği bina dışında',()=>{
  setGeoRegion(region,u);
  const data=JSON.parse(fs.readFileSync('data/bal/bilsem.json','utf8'));
  const p=bilsemPlacement(data,()=>160),b=p.building,plan=p.plan;
  assert.equal(plan.st.model,'tip-proje');
  for(const v of plan.vols)assert.ok(v.x0>=-b.hu-1e-6&&v.x1<=b.hu+1e-6&&v.z0>=-b.hv-1e-6&&v.z1<=b.hv+1e-6,v.name+' kutu dışında');
  assert.ok(plan.top<=data.building.height+0.01,`çatı ${plan.top.toFixed(1)} m`);
  assert.ok(plan.heightAt(0,0)>plan.dims.wallTop,'ortada mahya');
  assert.ok(plan.vols[0].x1<0,'merdiven bloğu batı ucunda (Meshy)');
  for(const q of [home,p.kamelya]){const [a,c]=b.local(q.x,q.z);assert.equal(plan.heightAt(a,c),-Infinity)}
  assert.equal(p.pole,null,'BİLSEM bayrağı giriş önünde değil, Atatürk köşesinde');
  // çatı birleşimi: uç bloğun öne taşan kısmında uç blok çatısı, ana bloğun ortasında ana çatı
  assert.ok(plan.heightAt(plan.dims.x0+4,b.hv-0.5)>plan.dims.wallTop);
  assert.ok(Math.abs(plan.heightAt(20,0)-(plan.dims.wallTop+plan.dims.k*(b.hv-3+plan.dims.o-0.25)))<0.6);
});

test('Fen Lisesi: BİLSEM arkasında (kuzey), aynı tip proje aynalı, aralarında avlu, koruma alanı sınırı aşılmaz',()=>{
  setGeoRegion(region,u);
  const data=JSON.parse(fs.readFileSync('data/bal/bilsem.json','utf8'));
  const p=bilsemPlacement(data,()=>160),b=p.building,f=p.fen;
  assert.ok(f,'fenLisesi verisi');
  const [a,c]=b.local(f.building.x,f.building.z);
  assert.ok(c<-60&&c>-90&&Math.abs(a)<30,`Fen BİLSEM'in arkasında: ${a.toFixed(0)} m doğu, ${(-c).toFixed(0)} m kuzey`);
  assert.ok(-c-2*b.hv>35,'aradaki avlu en az 35 m');
  assert.equal(f.plan.s,-1,'Fen Lisesi aynalı: merdiven bloğu doğuda');assert.equal(p.plan.s,1,'BİLSEM: merdiven bloğu batıda');
  assert.ok(f.plan.top<=data.building.height+0.01);
  assert.ok(!f.building.inside(home.x,home.z,20),'ped Fen Lisesi\'nden uzak');
  assert.ok(keepZones({home,extra:p.keepZones}).length<=4,'ped + BİLSEM bahçesi + Fen avlusu ≤ 4 koruma alanı');
  assert.ok(HERITAGE.some(h=>h.id==='fen-lisesi'));
});
