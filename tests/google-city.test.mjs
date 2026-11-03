import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {WGS84_ELLIPSOID} from '3d-tiles-renderer';
import {createUtm} from '../src/maps/utm.js';
import {keepZones} from '../drone/keep-zone.js';

const region=JSON.parse(fs.readFileSync('data/bal/region.json','utf8'));
test('Google 3D Tiles çerçevesi: ECEF noktaları UTM 35N yerel koordinatına < 1 m oturur (alan köşeleri ~4.5 km)',async()=>{
  const {localFrame}=await import('../drone/google-city.js');
  const utm=createUtm(region.crs),M=localFrame(WGS84_ELLIPSOID,region,utm),[e0,n0]=utm.fwd(region.origin.lon,region.origin.lat);
  // Saat Kulesi, BİLSEM, alan köşeleri (güneybatı ~5.4 km, kuzeydoğu ~3.6 km)
  const [w,s,e,n]=region.bboxLonLat;
  for(const [lon,lat] of [[region.origin.lon,region.origin.lat],[region.home.lon,region.home.lat],[w,s],[e,n],[e,s]]){
    const p=new T.Vector3();WGS84_ELLIPSOID.getCartographicToPosition(lat*Math.PI/180,lon*Math.PI/180,140,p);p.applyMatrix4(M);
    const [e,n]=utm.fwd(lon,lat),x=e-e0,z=-(n-n0),d=Math.hypot(p.x-x,p.z-z);
    assert.ok(d<1.0,`${lon},${lat}: ${d.toFixed(2)} m`);
    const drop=(x*x+z*z)/(2*6371000);   // teğet düzlem: uzak noktalar dünya eğriliği kadar alçakta (5.4 km → 2.3 m)
    assert.ok(Math.abs(p.y-(140-drop))<0.3,`yükseklik ${p.y.toFixed(2)}, beklenen ${(140-drop).toFixed(2)}`);
  }
});
test('koruma alanı: Balıkesir’de yalnız kalkış pisti; ped içeride, Saat Kulesi dışarıda',()=>{
  const home={x:-13.5,z:2016},zones=keepZones({home});assert.equal(zones.length,1);
  const inK=(x,z)=>zones.some(r=>{const dx=x-r.c[0],dz=z-r.c[1];return Math.abs(dx*r.u[0]+dz*r.u[1])<=r.h[0]&&Math.abs(-dx*r.u[1]+dz*r.u[0])<=r.h[1]});
  assert.ok(inK(home.x,home.z));assert.ok(inK(home.x+12,home.z));assert.ok(!inK(0,0));assert.ok(!inK(home.x+40,home.z));
});
