// Balıkesir tarihi yapıları (data/bal/tarihi-yapilar.json): Saat Kulesi, Kuva-yi Milliye Müzesi, Zağnos Paşa Camii,
// Balıkesir Garı. Yordamsal, temsili modeller: biçim Zafer Hoca'nın fotoğraflarından, konum onun Google Haritalar
// noktaları ve OSM ayak izlerinden, yükseklikler kaynaklardan ve fotoğraf oranlarından (yaklaşık).
// Her yapı kendi yerel çerçevesinde kurulur: a cephe boyunca, b öne (dışa), y yukarı; y = 0 yapı merkezindeki DEM zemini.
// Yapının çevresi koruma alanıdır: Google ağı orada atılır, zemin bizimdir (bilsem-bahce.js createYard kaplaması), ayak
// izine düşen OSM kutuları ayıklanır. Çarpışma: yerel kutu / silindir / kubbe parçaları (çarpma = kaza).
// Dokular tarayıcıda canvas ile üretilir (indirilecek dosya yok); her yapı malzeme başına tek birleşik geometridir.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {lonLatToLocal} from '../src/geo.js';
import {tileTexture,hipRoof,createFlag} from './bilsem-bina.js';
import {createYard,zoneKeep} from './bilsem-bahce.js';

/** center [lon,lat], front: ön cephenin baktığı yön (°). a ekseni = front − 90°, b ekseni = front. */
export function frameAt(center,front){
  const c=lonLatToLocal(...center),ub=(front-90)*Math.PI/180,u=[Math.sin(ub),-Math.cos(ub)],v=[-u[1],u[0]];
  return {c,u,v,yaw:Math.atan2(-u[1],u[0]),
    world:(a,b)=>({x:c.x+a*u[0]+b*v[0],z:c.z+a*u[1]+b*v[1]}),
    local:(x,z)=>{const dx=x-c.x,dz=z-c.z;return [dx*u[0]+dz*u[1],dx*v[0]+dz*v[1]]}};
}

// ---------------------------------------------------------------- yerleşim (WebGL gerekmez; testler kullanır)
const box=(a0,a1,b0,b1,y0,y1)=>({k:'box',a0,a1,b0,b1,y0,y1});
const cyl=(a,b,r,y0,y1)=>({k:'cyl',a,b,r,y0,y1});
const dome=(a,b,R,y0,ky=1)=>({k:'dome',a,b,R,y0,ky});

function towerLayout(def,ga){
  const W=def.base??5.4,h=(def.podium??8.4)/2;
  const g=[[-h,-h],[h,-h],[-h,h],[h,h],[0,h],[0,-h],[h,0],[-h,0],[0,0]].map(([a,b])=>ga(a,b));
  const P=Math.max(0.6,Math.max(...g)+0.45),low=Math.min(...g)-2.5;
  const Y={s1:P+0.45,c1:P+5.6,s2:P+6.0,c2:P+11.0,s3:P+11.35,c3:P+13.6,bel:P+14.1,belTop:P+16.6,roof:P+16.95,top:P+18.6,tip:P+19.9};
  return {W,h,P,low,Y,target:[0,0],
    colliders:[box(-h,h,-h,h,low,P),box(-W/2-0.4,W/2+0.4,-W/2-0.4,W/2+0.4,P,Y.roof+0.75),cyl(0,0,0.9,Y.roof,Y.tip)],
    zone:{a0:-h-0.5,a1:h+0.5,b0:-h-0.5,b1:h+0.5},remove:[[-h,h,-h,h]],solid:[[-h,h,-h,h]]};
}

function museumLayout(def,ga){
  const hw=def.width/2,hd=def.depth/2,gate=def.gate??36;
  const fr=[[-hw,hd],[hw,hd],[0,hd],[-hw,-hd],[hw,-hd]].map(([a,b])=>ga(a,b));
  // zemin kat ön cepheye göre (arka yokuş yukarı, Saat Kulesi tarafı: bina yamaca gömülür)
  const F0=Math.max(fr[0],fr[1],fr[2])+1.3,F1=F0+3.5,F2=F1+3.2,low=Math.min(...fr,ga(0,gate))-2.5;
  const pb=hd+1.8,gs=ga(0,pb+3),n=Math.max(3,Math.round((F0-gs)/0.17)),run=n*0.32;
  const pine=[-7.6,hd+4.2],lamps=[[-2.9,pb+run+1],[2.9,pb+run+1],[-2.4,gate-6],[2.4,gate-6]];
  return {hw,hd,gate,F0,F1,F2,low,pb,n,run,pine,lamps,target:[0,hd+4],
    colliders:[box(-hw,hw,-hd,hd,low,F2+0.5),box(-hw+1.6,hw-1.6,-hd+1.6,hd-1.6,F2,F2+2.6),box(-3.4,3.4,hd,hd+1.1,F1,F2+0.9),
      box(-2.7,2.7,hd,pb,low,F0+3.85),box(-3.7,3.7,pb,pb+run,low,F0+0.3),
      box(-3.2,-1.45,gate-0.6,gate+0.6,low,6.5),box(1.45,3.2,gate-0.6,gate+0.6,low,6.5),{...box(-3.2,3.2,gate-0.6,gate+0.6,4.35,6.5),bottom:4.35},
      cyl(pine[0],pine[1],0.45,low,13),{...cyl(pine[0],pine[1],4.6,11.5,15.6),bottom:11.5},...lamps.map(([a,b])=>cyl(a,b,0.15,low,ga(a,b)+4.3))],
    zone:{a0:-12.5,a1:12.5,b0:-hd-2.5,b1:gate+0.9},
    remove:[[-hw,hw,-hd,hd],[-3.5,3.5,hd,pb+run],[-3.3,3.3,gate-1,gate+1]],solid:[[-hw,hw,-hd,hd]]};
}

function mosqueLayout(def,ga){
  const H=def.half??16.5,g=[[-H,-H],[H,-H],[-H,H],[H,H]].map(([a,b])=>ga(a,b));
  const PL=Math.max(...g)+0.7,low=Math.min(...g)-2;
  const WT=PL+11.3,CB=WT+3.9,DT=CB+3.8,DR=6.4,MB=[H,H+3.6,H-3.6,H];   // minare tabanı a0,a1,b0,b1 (kuzeybatı: +a batı, +b kuzey)
  const mc=[(MB[0]+MB[1])/2,(MB[2]+MB[3])/2],Ym={base:PL+11.8,petek:PL+13.1,shaft:PL+15.9,serefe:PL+27.4,upper:PL+28.6,cap:PL+33.4,tip:PL+38.8,alem:PL+40.2};
  const sad=[6.5,H+11.5],tree=[-9.5,H+10.5],turbe=[-0.7,-H-11];
  return {H,PL,low,WT,CB,DT,DR,MB,mc,Ym,sad,tree,turbe,target:[0,0],
    colliders:[box(-H,H,-H,H,low,WT+0.6),
      ...[0,1,2,3].map(i=>{const r=rot(i,[-6.5,6.5],[H-2.5,H]);return box(r[0],r[1],r[2],r[3],WT,WT+4.6)}),
      box(-7,7,-7,7,WT,CB),cyl(0,0,7.1,CB,DT+0.35),dome(0,0,DR,DT+0.35),cyl(0,0,0.3,DT+DR,DT+DR+2),
      ...[[1,1],[1,-1],[-1,1],[-1,-1]].map(([sa,sb])=>dome(sa*11.4,sb*11.4,4.6,WT+0.5,0.55)),
      box(MB[0],MB[1],MB[2],MB[3],low,Ym.petek),cyl(mc[0],mc[1],1.6,Ym.petek,Ym.serefe),cyl(mc[0],mc[1],2.15,Ym.serefe-1.1,Ym.upper+0.95),
      cyl(mc[0],mc[1],1.3,Ym.upper,Ym.cap+0.4),cyl(mc[0],mc[1],0.9,Ym.cap,Ym.tip),cyl(mc[0],mc[1],0.25,Ym.tip,Ym.alem),
      ...[0,1,3].map(i=>{const r=rot(i,[-4,4],[H,H+4]);return box(r[0],r[1],r[2],r[3],low,PL+6.4)}),
      cyl(sad[0],sad[1],3.8,low,ga(...sad)+6.4),cyl(turbe[0],turbe[1],4.3,low,ga(...turbe)+10.6),
      cyl(tree[0],tree[1],0.7,low,ga(...tree)+8),{...cyl(tree[0],tree[1],5.8,ga(...tree)+5.5,ga(...tree)+13.5),bottom:ga(...tree)+5.5}],
    zone:{a0:-19.5,a1:23.5,b0:-39,b1:35},
    remove:[[-H-0.2,H+0.2,-H-0.2,H+0.2],[-15,13.5,-38.5,-H],[MB[0]-0.2,MB[1]+0.2,MB[2]-0.2,MB[3]+0.2]],
    solid:[[-H,H,-H,H],[MB[0],MB[1],MB[2],MB[3]]],
    yard:{plaza:[[-19.5,23.5,-H-0.5,35],[-19.5,-15,-39,-H],[13.5,23.5,-39,-H],[turbe[0]-1.2,turbe[0]+1.2,turbe[1],-H]]}};
}

function stationLayout(def,ga){
  const hw=def.width/2,hd=def.depth/2,g=[[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd]].map(([a,b])=>ga(a,b));
  const PL=Math.max(...g)+0.55,low=Math.min(...g,ga(0,-12),ga(-20,0),ga(20,0))-2,E=PL+8.8,W=[12,20.6,-4.3,4.5];
  return {hw,hd,PL,low,E,W,target:[0,0],pole:[-14.5,8.6],
    colliders:[box(-hw,hw,-hd,hd,low,E+0.5),box(-5.6,5.6,-hd-0.7,hd+0.7,low,E+4.3),box(-hw,hw,-hd+1,hd-1,E,E+2.3),
      box(W[0],W[1],W[2],W[3],low,PL+5.6),box(-W[1],-W[0],W[2],W[3],low,PL+5.6),{...box(-24.3,24.3,-11.7,-hd,PL+3.65,PL+4.6),bottom:PL+3.65},
      ...[-21,-15,-9,-3,3,9,15,21].map(a=>cyl(a,-10.8,0.15,low,PL+4)),cyl(-14.5,8.6,0.12,low,ga(-14.5,8.6)+10.2)],
    zone:{a0:-24.5,a1:24.5,b0:-12.5,b1:10.5},remove:[[-hw-0.2,hw+0.2,-hd-0.2,hd+0.2],[W[0]-0.3,W[1]+0.5,W[2]-0.5,W[3]+0.5],[-W[1]-0.5,-W[0]+0.3,W[2]-0.5,W[3]+0.5]],
    solid:[[-hw,hw,-hd,hd],[-5.2,5.2,-hd-0.6,hd+0.6],W,[-W[1],-W[0],W[2],W[3]]]};
}
const LAYOUT={'saat-kulesi':towerLayout,muze:museumLayout,cami:mosqueLayout,gar:stationLayout};

/** Cephe döndürmesi: i = 0 ön (+b), 1 (+a), 2 arka (−b), 3 (−a). s/d aralığı → (a,b) dikdörtgeni [a0,a1,b0,b1]. */
function rot(i,[s0,s1],[d0,d1]){
  if(i===0)return [s0,s1,d0,d1];if(i===2)return [-s1,-s0,-d1,-d0];
  if(i===1)return [d0,d1,-s1,-s0];return [-d1,-d0,s0,s1];
}
const toAB=(i,s,dd)=>i===0?[s,dd]:i===1?[dd,-s]:i===2?[-s,-dd]:[-dd,s];

function colTop(c,a,b,r){
  if(c.k==='box')return a>=c.a0-r&&a<=c.a1+r&&b>=c.b0-r&&b<=c.b1+r?c.y1:-Infinity;
  const d=Math.hypot(a-c.a,b-c.b);
  if(c.k==='cyl')return d<=c.r+r?c.y1:-Infinity;
  return d<=c.R+r?c.y0+Math.sqrt(Math.max(0,c.R*c.R-Math.min(d,c.R)**2))*c.ky:-Infinity;
}

/** tarihi-yapilar.json → yapılar (yerel çerçeve, yerleşim, çarpışma, koruma alanı). ground(x,z): DEM zemini. */
export function heritagePlacement(data,ground){
  const structures=[];
  for(const [id,def] of Object.entries(data?.yapilar||{})){
    const L=LAYOUT[def.tip];if(!L)continue;
    const f=frameAt(def.center,def.front),y0=ground(f.c.x,f.c.z);
    const ga=(a,b)=>{const p=f.world(a,b);return ground(p.x,p.z)-y0};
    const lay=L(def,ga),t=f.world(...lay.target);
    structures.push({id,def,name:def.name,...f,y0,ga,lay,keep:zoneKeep(lay.zone,f.world,f.u),target:{x:t.x,z:t.z}});
  }
  const inR=(r,a,b)=>a>=r[0]&&a<=r[1]&&b>=r[2]&&b<=r[3];
  return {structures,keepZones:structures.map(s=>s.keep),
    /** OSM kutusu bir yapının yerine mi düşüyor (merkezi ya da bir köşesi ayıklama dikdörtgeninde) */
    removes(ring){
      const n=ring.length,cx=ring.reduce((s,p)=>s+p[0],0)/n,cz=ring.reduce((s,p)=>s+p[1],0)/n;
      return structures.some(s=>s.lay.remove.some(r=>inR(r,...s.local(cx,cz))||ring.some(([x,z])=>inR(r,...s.local(x,z)))));
    },
    heightAt(x,z){let h=-Infinity;for(const s of structures){const [a,b]=s.local(x,z);if(Math.abs(a)>60||Math.abs(b)>60)continue;
      for(const c of s.lay.colliders)h=Math.max(h,s.y0+colTop(c,a,b,0))}return h},
    hitTest(x,y,z,r=0){for(const s of structures){const [a,b]=s.local(x,z);if(Math.abs(a)>60||Math.abs(b)>60)continue;
      for(const c of s.lay.colliders){const top=colTop(c,a,b,r);if(top===-Infinity)continue;const bot=s.y0+(c.bottom??c.y0??-5);
        if(y-r<=s.y0+top&&y+r>=bot)return {type:'building',id:s.id,name:s.name}}}return null},
  };
}

// ---------------------------------------------------------------- geometri araçları
function kit(){
  const P={};
  const put=(k,g)=>{if(g.index){const n=g.toNonIndexed();g.dispose();g=n}(P[k]||(P[k]=[])).push(g);return g};
  const bx=(k,a0,a1,y0,y1,b0,b1)=>{if(a1-a0>1e-4&&y1-y0>1e-4&&b1-b0>1e-4)put(k,new T.BoxGeometry(a1-a0,y1-y0,b1-b0).translate((a0+a1)/2,(y0+y1)/2,(b0+b1)/2))};
  const cy=(k,a,b,y0,y1,r0,r1=r0,seg=16,open=false)=>put(k,new T.CylinderGeometry(r1,r0,y1-y0,seg,1,open).translate(a,(y0+y1)/2,b));
  const sp=(k,a,y,b,r,sy=1,seg=12,phi=Math.PI/2)=>put(k,new T.SphereGeometry(r,seg*2,seg,0,Math.PI*2,0,phi).scale(1,sy,1).translate(a,y,b));
  /** Cephe: düzlem D, i yönünde. s cephe boyunca (dışarıdan bakana sağa), d dışa. */
  const face=(i,D)=>{const m=new T.Matrix4().makeRotationY(i*Math.PI/2),q=(k,g)=>put(k,g.applyMatrix4(m));
    return {i,D,
      bx:(k,s0,s1,y0,y1,d0,d1)=>{if(s1-s0>1e-4&&y1-y0>1e-4&&d1-d0>1e-4)q(k,new T.BoxGeometry(s1-s0,y1-y0,d1-d0).translate((s0+s1)/2,(y0+y1)/2,D+(d0+d1)/2))},
      geo:(k,g,s,y,d=0)=>q(k,g.translate(s,y,D+d)),
      ab:(s,d=0)=>toAB(i,s,D+d)}};
  return {P,put,bx,cy,sp,face};
}
/** Pencere / kapı dış hatları (XY düzleminde, taban y = 0, ortada x = 0). */
function outline(w,h,arch='round'){
  const r=w/2,s=new T.Shape();s.moveTo(-r,0);s.lineTo(r,0);
  if(arch==='round'){const hs=Math.max(0.01,h-r);s.lineTo(r,hs);s.absarc(0,hs,r,0,Math.PI,false)}
  else if(arch==='segment'){const rise=Math.min(w*0.16,h*0.3),R=(r*r+rise*rise)/(2*rise),cy=h-R,t0=Math.atan2(h-rise-cy,r);s.lineTo(r,h-rise);s.absarc(0,cy,R,t0,Math.PI-t0,false)}
  else if(arch==='pointed'){const hs=Math.max(0.01,h-r*1.25);s.lineTo(r,hs);s.quadraticCurveTo(r,hs+r*0.95,0,hs+r*1.25);s.quadraticCurveTo(-r,hs+r*0.95,-r,hs)}
  else s.lineTo(r,h),s.lineTo(-r,h);
  s.lineTo(-r,0);return s;
}
function ring(w,h,t,arch,depth){
  const o=outline(w+2*t,h+t,arch);o.holes.push(new T.Path(outline(w,h,arch).getPoints(10)));
  return new T.ExtrudeGeometry(o,{depth,bevelEnabled:false,curveSegments:10});
}
/** Cephede pencere: çerçeve, cam (ya da kafes), kayıt, denizlik; grille: önünde demir parmaklık. */
function windowOn(F,{s,y,w,h,arch='round',glass='glass',frame='frame',ft=0.12,fd=0.14,mull=0,transom=false,grille=null,sill=null,gd=0.02}){
  F.geo(frame,ring(w,h,ft,arch,fd),s,y,-0.02);
  F.geo(glass,new T.ShapeGeometry(outline(w,h,arch),8),s,y,gd);
  const straight=arch==='round'?h-w/2:arch==='pointed'?h-w*0.62:arch==='segment'?h-Math.min(w*0.16,h*0.3):h;
  for(let k=1;k<=mull;k++){const x=s-w/2+w*k/(mull+1);F.bx(frame,x-0.035,x+0.035,y,y+straight,gd,gd+0.06)}
  if(transom)F.bx(frame,s-w/2,s+w/2,y+straight*0.72-0.035,y+straight*0.72+0.035,gd,gd+0.06);
  if(grille){for(let x=s-w/2+0.1;x<s+w/2-0.05;x+=0.13)F.bx(grille,x-0.015,x+0.015,y+0.05,y+straight,fd,fd+0.03);
    for(const yy of [y+0.3,y+straight*0.55,y+straight-0.05])F.bx(grille,s-w/2,s+w/2,yy-0.02,yy+0.02,fd,fd+0.035)}
  if(sill)F.bx(sill,s-w/2-ft-0.08,s+w/2+ft+0.08,y-0.12,y,-0.02,fd+0.12);
}
/** Dişli köşe taşı (cephede düşey şerit): her iki sırada bir taşan blok. */
function quoins(F,k,s,y0,y1,w=0.9,wide=1.3,dd=0.08,step=0.5){
  for(let y=y0,i=0;y<y1-0.01;y+=step,i++){const ww=i%2?wide:w;F.bx(k,s-ww/2,s+ww/2,y+0.02,Math.min(y1,y+step-0.02),0,dd)}
}
/** Kırma çatıdan farklı: üçgen alınlıklı beşik çatı (sırt b boyunca). */
function gableRoof(x0,x1,z0,z1,y,k,tile){
  const xm=(x0+x1)/2,ry=y+(x1-x0)/2*k,sl=Math.hypot(1,k),pos=[],uv=[];
  const quad=(p)=>{for(const q of [p[0],p[1],p[2],p[0],p[2],p[3]]){pos.push(...q);uv.push(q[2]/tile,Math.abs(q[0]-(q[0]<xm?x0:x1))*sl/tile)}};
  quad([[x0,y,z0],[x0,y,z1],[xm,ry,z1],[xm,ry,z0]]);quad([[x1,y,z1],[x1,y,z0],[xm,ry,z0],[xm,ry,z1]]);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.computeVertexNormals();return g;
}
function metricUV(g,s){
  const p=g.attributes.position,n=g.attributes.normal,uv=new Float32Array(p.count*2);
  for(let i=0;i<p.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i)),x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    let u,v;if(ny>=nx&&ny>=nz){u=x;v=z}else if(nx>=nz){u=z;v=y}else{u=x;v=y}uv[i*2]=u/s;uv[i*2+1]=v/s}
  g.setAttribute('uv',new T.BufferAttribute(uv,2));return g;
}
function bake(P,M,name){
  const g=new T.Group();g.name=name;
  for(const [k,list] of Object.entries(P)){
    const m=M[k];if(!m){console.warn('[tarihi] malzeme yok',k);continue}
    for(const x of list){if(!x.attributes.uv)x.setAttribute('uv',new T.BufferAttribute(new Float32Array(x.attributes.position.count*2),2));if(!x.attributes.normal)x.computeVertexNormals()}
    const geo=mergeGeometries(list,false);list.forEach(x=>x.dispose());if(m.userData.uv)metricUV(geo,m.userData.uv);
    const mesh=new T.Mesh(geo,m);mesh.name=name+'-'+k;mesh.castShadow=!m.transparent;mesh.receiveShadow=true;g.add(mesh);
  }
  return g;
}

// ---------------------------------------------------------------- dokular ve malzemeler
let seed=3;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function canvasTex(S,draw,anisotropy,{w=S,h=S,repeat=true}={}){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);
  const t=new T.CanvasTexture(cv);if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}
const shade=v=>`rgb(${v|0},${v|0},${v|0})`;
function drawAshlar(g,S){   // 1.8 m'de 6 sıra kesme taş
  g.fillStyle=shade(200);g.fillRect(0,0,S,S);const rows=6,rh=S/rows;
  for(let r=0;r<rows;r++){let x=-(r%2)*S/6;while(x<S){const w=S*(0.2+rnd()*0.22),v=205+rnd()*38;g.fillStyle=shade(v);g.fillRect(x+1.5,r*rh+1.5,w-3,rh-3);
    for(let i=0;i<14;i++){g.fillStyle=`rgba(0,0,0,${0.03+rnd()*0.05})`;g.fillRect(x+rnd()*w,r*rh+rnd()*rh,2+rnd()*5,1+rnd()*3)}x+=w}}
}
function drawRubble(g,S){   // 2 m'de moloz taş duvar
  g.fillStyle=shade(120);g.fillRect(0,0,S,S);
  for(let i=0;i<70;i++){const x=rnd()*S,y=rnd()*S,r=10+rnd()*20,v=150+rnd()*70;g.fillStyle=`rgb(${v|0},${(v-8)|0},${(v-18)|0})`;g.beginPath();
    for(let k=0;k<7;k++){const a=k/7*Math.PI*2,rr=r*(0.7+rnd()*0.45);g.lineTo(x+Math.cos(a)*rr*1.3,y+Math.sin(a)*rr*0.8)}g.closePath();g.fill()}
}
function drawBrick(g,S){    // 1.2 m'de 16 sıra sarımsı tuğla
  g.fillStyle='#d9cfbd';g.fillRect(0,0,S,S);const rows=16,rh=S/rows,bw=S/4.8;
  for(let r=0;r<rows;r++)for(let x=-(r%2)*bw/2;x<S;x+=bw){const v=rnd();g.fillStyle=`rgb(${(184+v*30)|0},${(156+v*26)|0},${(112+v*22)|0})`;g.fillRect(x+1,r*rh+1,bw-2,rh-2)}
}
function drawTimber(g,S){   // 2 m'de 11 yatay tahta
  const rows=11,rh=S/rows;
  for(let r=0;r<rows;r++){const v=rnd()*14;g.fillStyle=`rgb(${(92+v)|0},${(62+v)|0},${(44+v*0.6)|0})`;g.fillRect(0,r*rh,S,rh);
    for(let i=0;i<5;i++){g.fillStyle='rgba(30,18,10,0.18)';g.fillRect(0,r*rh+rnd()*rh,S,1)}g.fillStyle='rgba(20,12,6,0.65)';g.fillRect(0,r*rh+rh-3,S,3)}
}
function drawLattice(g,S){  // 1 m'de pencere kafesi (şebeke): koyu cam üstünde beyaz baklava
  g.fillStyle='#22313c';g.fillRect(0,0,S,S);g.strokeStyle='#f1ede4';g.lineWidth=S/36;const n=5,c=S/n;
  for(let i=-n;i<=2*n;i++){g.beginPath();g.moveTo(i*c,0);g.lineTo(i*c+S,S);g.stroke();g.beginPath();g.moveTo(i*c,S);g.lineTo(i*c+S,0);g.stroke()}
  g.fillStyle='#f1ede4';for(let y=0;y<n;y++)for(let x=0;x<n;x++){g.beginPath();g.arc((x+0.5)*c,(y+0.5)*c,c*0.09,0,Math.PI*2);g.fill()}
}
function clockTexture(anisotropy){
  return canvasTex(256,(g,S)=>{const c=S/2;g.fillStyle='#f6f4ee';g.fillRect(0,0,S,S);g.strokeStyle='#151515';g.lineWidth=14;g.beginPath();g.arc(c,c,c-9,0,Math.PI*2);g.stroke();
    g.fillStyle='#151515';g.font='bold 30px Georgia, serif';g.textAlign='center';g.textBaseline='middle';
    const N=['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
    N.forEach((t,i)=>{const a=i/12*Math.PI*2;g.save();g.translate(c+Math.sin(a)*(c-40),c-Math.cos(a)*(c-40));g.rotate(a);g.fillText(t,0,0,46);g.restore()});
    for(let i=0;i<60;i++){const a=i/60*Math.PI*2;g.fillRect(c+Math.sin(a)*(c-20)-1.5,c-Math.cos(a)*(c-20)-1.5,3,3)}
  },anisotropy,{repeat:false});
}
function textTexture(text,{w=1024,h=128,bg=null,fg='#ffffff',font='bold 80px "Segoe UI", Arial, sans-serif',vertical=false,anisotropy=4}){
  return canvasTex(w,(g,W,H)=>{if(bg){g.fillStyle=bg;g.fillRect(0,0,W,H)}else g.clearRect(0,0,W,H);g.fillStyle=fg;g.font=font;g.textAlign='center';g.textBaseline='middle';
    if(vertical){const L=[...text];L.forEach((ch,i)=>g.fillText(ch,W/2,H*(i+0.5)/L.length))}else g.fillText(text,W/2,H/2+4,W-40)},anisotropy,{w,h,repeat:false});
}
function materials(anisotropy){
  const A=canvasTex(256,drawAshlar,anisotropy),R=canvasTex(256,drawRubble,anisotropy),B=canvasTex(256,drawBrick,anisotropy),
    W=canvasTex(256,drawTimber,anisotropy),L=canvasTex(256,drawLattice,anisotropy);
  const M=(name,o,uv=0)=>{const m=new T.MeshStandardMaterial(o);m.name='tarihi-'+name;if(uv)m.userData.uv=uv;return m};
  return {
    towerStone:M('kule-tasi',{map:A,color:'#f3e3c6',roughness:0.9},1.8),whiteStone:M('beyaz-tas',{map:A,color:'#f4efe6',roughness:0.85},1.8),
    gateStone:M('kapi-tasi',{map:A,color:'#dcc2b0',roughness:0.88},1.8),stationStone:M('gar-tasi',{map:A,color:'#d3c4ab',roughness:0.92},1.6),
    stationLight:M('gar-kose',{map:A,color:'#e7dccb',roughness:0.88},1.6),rubble:M('moloz',{map:R,color:'#d2cbc0',roughness:0.95},2),
    brick:M('tugla',{map:B,color:'#ffffff',roughness:0.9},1.2),timber:M('ahsap-kaplama',{map:W,color:'#ffffff',roughness:0.85},2),
    lattice:M('kafes',{map:L,roughness:0.6}),plaster:M('siva',{color:'#f3f0ea',roughness:0.92}),
    lead:M('kursun',{color:'#a5abb0',roughness:0.42,metalness:0.6}),leadDark:M('kursun-koyu',{color:'#6d757b',roughness:0.5,metalness:0.5}),
    glass:M('cam',{color:'#2a3743',roughness:0.12,metalness:0.4}),glassLight:M('cam-acik',{color:'#9fb2bc',roughness:0.08,metalness:0.5}),
    frame:M('dograma',{color:'#f2efe6',roughness:0.7}),frameDark:M('dograma-koyu',{color:'#3c2d22',roughness:0.7}),
    iron:M('demir',{color:'#2b2e2f',roughness:0.55,metalness:0.5}),greenIron:M('yesil-demir',{color:'#2c5747',roughness:0.5,metalness:0.4}),
    marble:M('mermer',{color:'#eeebe4',roughness:0.45}),gold:M('altin',{color:'#cfa63c',roughness:0.3,metalness:0.9}),goldPlate:M('pirinc-levha',{color:'#d6b24c',roughness:0.35,metalness:0.45}),
    woodDoor:M('kapi',{color:'#6a4a30',roughness:0.7}),cream:M('krem-kapi',{color:'#eee4cc',roughness:0.7}),eave:M('sacak',{color:'#3d2b20',roughness:0.8}),
    dark:M('karanlik',{color:'#141618',roughness:0.95}),plaque:M('kitabe',{color:'#24504f',roughness:0.5,metalness:0.2}),
    tileRed:M('kiremit',{map:tileTexture('#b9603f',anisotropy),roughness:0.8}),tileDark:M('kiremit-koyu',{map:tileTexture('#5b4537',anisotropy),roughness:0.85}),
    roofFlat:M('duz-cati',{color:'#8e8c86',roughness:0.9}),steel:M('celik',{color:'#e9ebec',roughness:0.4,metalness:0.4}),
    canopy:M('sundurma',{color:'#d9dcdc',roughness:0.6,metalness:0.2}),concrete:M('beton',{color:'#b9b7b0',roughness:0.95}),
    yellow:M('hissedilir',{color:'#e3b321',roughness:0.7}),bark:M('kabuk',{color:'#5e4632',roughness:0.95}),
    pine:M('fistik-cami',{color:'#2f5530',roughness:0.95,flatShading:true}),plane:M('cinar',{color:'#5b7f3a',roughness:0.95,flatShading:true}),
    lampGlass:M('fener',{color:'#f6f2df',roughness:0.3,emissive:'#3a3524'}),
  };
}
const textMat=(tex,name,o={})=>{const m=new T.MeshStandardMaterial({map:tex,roughness:0.5,transparent:!!o.transparent,alphaTest:o.transparent?0.4:0,...o.extra});m.name='tarihi-'+name;return m};

// ---------------------------------------------------------------- Saat Kulesi
function buildTower(L,ctx){
  const K=kit(),{W,h,P,low,Y}=L,M=ctx.M,group=new T.Group();
  // kaide: moloz taş istinat duvarı, taş harpuşta, üstü taş döşeme, demir parmaklık
  K.bx('rubble',-h,h,low,P-0.25,-h,h);K.bx('whiteStone',-h-0.08,h+0.08,P-0.25,P,-h-0.08,h+0.08);
  const fence=(s0,s1,i)=>{const F=K.face(i,h-0.18);
    for(let s=s0;s<=s1+1e-6;s+=0.15)F.bx('iron',s-0.014,s+0.014,P,P+1.35,-0.014,0.014);
    for(const y of [P+0.12,P+1.2])F.bx('iron',s0,s1,y-0.02,y+0.02,-0.025,0.025);
    for(let s=s0;s<=s1+1e-6;s+=(s1-s0)/3){F.bx('iron',s-0.05,s+0.05,P,P+1.55,-0.05,0.05);F.geo('iron',new T.SphereGeometry(0.07,8,6),s,P+1.6)}};
  for(let i=0;i<4;i++)fence(-h+0.18,h-0.18,i);
  // gövde
  const sq=(k,w,y0,y1)=>K.bx(k,-w/2,w/2,y0,y1,-w/2,w/2);
  sq('whiteStone',W+0.4,P,Y.s1);sq('towerStone',W,Y.s1,Y.c1);sq('whiteStone',W+0.5,Y.c1,Y.c1+0.25);sq('whiteStone',W+0.25,Y.c1+0.25,Y.s2);
  sq('towerStone',W-0.3,Y.s2,Y.c2);sq('whiteStone',W+0.15,Y.c2,Y.c2+0.25);sq('whiteStone',W-0.1,Y.c2+0.25,Y.s3);
  sq('towerStone',W-0.4,Y.s3,Y.c3);sq('whiteStone',W,Y.c3,Y.c3+0.25);sq('whiteStone',W+0.5,Y.c3+0.25,Y.bel);
  const clocks=[];
  for(let i=0;i<4;i++){
    // 1. kat: kör kemer, kitabe ve tuğra (ön yüz), mazgal pencere
    let F=K.face(i,W/2);F.geo('whiteStone',ring(3.0,3.9,0.14,'round',0.06),0,Y.s1+0.4);
    if(i===0){F.bx('plaque',-0.45,0.45,P+2.3,P+3.5,0,0.05);F.bx('gold',-0.5,0.5,P+2.25,P+2.31,0,0.06);F.bx('gold',-0.5,0.5,P+3.49,P+3.55,0,0.06);
      F.bx('marble',-0.55,0.55,P+1.45,P+2.05,0,0.04)}
    else windowOn(F,{s:0,y:P+2.6,w:0.3,h:0.95,glass:'dark',frame:'whiteStone',ft:0.08,fd:0.05});
    // 2. kat: balkonlu kapı, saçaklı alınlık ve yelpaze kabartma, mazgal
    F=K.face(i,(W-0.3)/2);const yb=Y.s2+0.62;
    windowOn(F,{s:0,y:yb+0.12,w:0.82,h:2.0,glass:'dark',frame:'whiteStone',ft:0.12,fd:0.08});
    F.bx('whiteStone',-0.7,0.7,yb+2.14,yb+2.28,0,0.26);
    F.geo('whiteStone',new T.CircleGeometry(0.52,16,0,Math.PI),0,yb+2.28,0.02);
    for(let k=1;k<6;k++){const a=k/6*Math.PI,g=new T.BoxGeometry(0.035,0.48,0.03).translate(0,0.24,0);g.rotateZ(Math.PI/2-a);F.geo('towerStone',g,0,yb+2.28,0.045)}
    F.bx('whiteStone',-0.78,0.78,yb-0.12,yb,0,0.72);for(const s of [-0.5,0.5])F.bx('whiteStone',s-0.1,s+0.1,yb-0.55,yb-0.12,0,0.55);
    for(const s of [-0.76,0.76])for(let d=0.06;d<0.7;d+=0.12)F.bx('iron',s-0.012,s+0.012,yb,yb+0.9,d-0.012,d+0.012);
    for(let s=-0.72;s<=0.72;s+=0.12)F.bx('iron',s-0.012,s+0.012,yb,yb+0.9,0.66,0.69);
    F.bx('iron',-0.78,0.78,yb+0.88,yb+0.93,0.64,0.71);
    windowOn(F,{s:0,y:Y.c2-1.1,w:0.28,h:0.8,glass:'dark',frame:'whiteStone',ft:0.07,fd:0.05});
    // 3. kat: saat kadranı (kabartma çerçeve) ve akrep / yelkovan; ana saçak altında modiyonlar
    F=K.face(i,(W-0.4)/2);const yc=(Y.s3+Y.c3)/2-0.05;
    F.geo('whiteStone',new T.CircleGeometry(1.0,24).scale(1,1.12,1),0,yc,0.01);F.geo('dark',new T.CylinderGeometry(0.82,0.82,0.08,32).rotateX(Math.PI/2),0,yc,0.06);
    const holder=new T.Group(),m=new T.Matrix4().makeRotationY(i*Math.PI/2);holder.applyMatrix4(m);group.add(holder);
    const faceM=new T.Mesh(new T.CircleGeometry(0.74,32),ctx.clockMat);faceM.position.set(0,yc,(W-0.4)/2+0.105);holder.add(faceM);
    const hand=(len,wid)=>{const g=new T.BoxGeometry(wid,len,0.02).translate(0,len/2-0.08,0),mm=new T.Mesh(g,M.dark);mm.position.set(0,yc,(W-0.4)/2+0.12);holder.add(mm);return mm};
    clocks.push({hour:hand(0.44,0.06),minute:hand(0.64,0.04)});
    for(let s=-(W-0.4)/2+0.25;s<(W-0.4)/2-0.1;s+=0.46)F.bx('whiteStone',s-0.08,s+0.08,Y.c3-0.24,Y.c3,0,0.32);
  }
  // çan katı: köşe ayakları, her yüzde üç sivri kemerli açıklık, iç karanlık, alçak parmaklık
  const bw=4.3,bh=Y.belTop-Y.bel;sq('dark',3.3,Y.bel,Y.belTop);
  for(let i=0;i<4;i++){const F=K.face(i,bw/2);
    const panel=new T.Shape();panel.moveTo(-bw/2,0);panel.lineTo(bw/2,0);panel.lineTo(bw/2,bh);panel.lineTo(-bw/2,bh);panel.lineTo(-bw/2,0);
    for(const s of [-1.1,0,1.1])panel.holes.push(new T.Path(outline(0.88,bh-0.45,'pointed').getPoints(10).map(p=>new T.Vector2(p.x+s,p.y))));
    F.geo('towerStone',new T.ExtrudeGeometry(panel,{depth:0.3,bevelEnabled:false,curveSegments:8}),0,Y.bel,-0.3);
    for(const s of [-1.1,0,1.1]){F.geo('whiteStone',ring(0.88,bh-0.45,0.07,'pointed',0.05),s,Y.bel);for(let x=s-0.38;x<=s+0.38;x+=0.13)F.bx('iron',x-0.012,x+0.012,Y.bel,Y.bel+0.8,-0.15,-0.12)}
    F.bx('iron',-bw/2+0.4,bw/2-0.4,Y.bel+0.78,Y.bel+0.83,-0.16,-0.11);
  }
  sq('whiteStone',bw+0.35,Y.belTop,Y.belTop+0.2);sq('eave',5.7,Y.belTop+0.2,Y.roof);
  K.put('tileDark',hipRoof({x0:-2.85,x1:2.85,z0:-2.85,z1:2.85,y:Y.roof,k:0.27},2.2));
  K.cy('towerStone',0,0,Y.roof+0.6,Y.roof+0.95,0.9,0.85,16);K.sp('towerStone',0,Y.roof+0.95,0,0.85,0.85);
  K.cy('iron',0,0,Y.top-0.1,Y.tip,0.03,0.02,6);K.sp('gold',0,Y.tip-0.25,0,0.08,1,8,Math.PI);
  group.add(bake(K.P,M,'saat-kulesi'));
  let acc=1;
  return {object:group,update(dt){acc+=dt;if(acc<1)return;acc=0;const d=new Date(),mi=d.getMinutes()+d.getSeconds()/60,hr=(d.getHours()%12)+mi/60;
    for(const c of clocks){c.hour.rotation.z=-hr/12*Math.PI*2;c.minute.rotation.z=-mi/60*Math.PI*2}}};
}

// ---------------------------------------------------------------- Kuva-yi Milliye Müzesi
function pineTree(K,a,b,y,height=13){
  K.cy('bark',a,b,y-0.5,y+height,0.42,0.26,9);
  for(const [da,db,dy,r,sy] of [[0,0,1.5,4.4,0.42],[1.6,0.8,1.0,3.0,0.45],[-1.5,-0.9,0.9,3.2,0.45],[0.4,-1.6,2.0,2.6,0.5]])
    K.put('pine',new T.IcosahedronGeometry(r,1).scale(1,sy,1).translate(a+da,y+height+dy,b+db));
}
function lampPost(K,a,b,y){
  K.cy('greenIron',a,b,y,y+0.5,0.14,0.11,10);K.cy('greenIron',a,b,y+0.5,y+3.6,0.07,0.06,8);
  K.cy('lampGlass',a,b,y+3.6,y+4.05,0.16,0.2,10);K.cy('greenIron',a,b,y+4.05,y+4.35,0.5,0.06,12);K.sp('greenIron',a,y+4.32,b,0.08);
}
function buildMuseum(L,ctx){
  const K=kit(),M=ctx.M,{hw,hd,gate,F0,F1,F2,low,pb,n,run}=L,group=new T.Group();
  K.bx('rubble',-hw-0.15,hw+0.15,low,F0,-hd-0.15,hd+0.15);K.bx('whiteStone',-hw-0.2,hw+0.2,F0-0.15,F0+0.05,-hd-0.2,hd+0.2);
  K.bx('plaster',-hw,hw,F0,F1,-hd,hd);K.bx('frame',-hw-0.06,hw+0.06,F1-0.12,F1+0.08,-hd-0.06,hd+0.06);K.bx('timber',-hw,hw,F1,F2,-hd,hd);
  // üst kat ortada çıkma (cumba), alt kemerli giriş saçağı
  K.bx('timber',-3.3,3.3,F1-0.1,F2,hd,hd+1.0);K.bx('eave',-3.4,3.4,F1-0.22,F1-0.1,hd,hd+1.1);
  for(const a of [-3.0,-1,1,3.0])K.bx('eave',a-0.08,a+0.08,F1-0.6,F1-0.22,hd,hd+0.9);
  K.bx('eave',-hw-1.1,hw+1.1,F2,F2+0.16,-hd-1.1,hd+1.1);K.bx('eave',-4.4,4.4,F2,F2+0.16,hd,hd+2.1);
  K.put('tileDark',hipRoof({x0:-hw-1.1,x1:hw+1.1,z0:-hd-1.1,z1:hd+1.1,y:F2+0.16,k:0.4},2.2));
  K.put('tileDark',hipRoof({x0:-4.4,x1:4.4,z0:hd-3.4,z1:hd+2.1,y:F2+0.16,k:0.4},2.2));
  // pencereler
  const upper=(F,list,w,hh,yy)=>{for(const s of list)windowOn(F,{s,y:yy,w,h:hh,arch:'flat',glass:'glassLight',frame:'frame',ft:0.1,fd:0.12,mull:1,transom:true})};
  const lower=(F,list)=>{for(const s of list)windowOn(F,{s,y:F0+0.95,w:1.1,h:1.65,arch:'flat',glass:'glass',frame:'frame',ft:0.1,fd:0.1,grille:'iron',sill:'whiteStone'})};
  const Fr=K.face(0,hd),Fc=K.face(0,hd+1.0);
  upper(Fr,[-7.4,-5.0,5.0,7.4],1.0,1.75,F1+0.85);upper(Fc,[-1.65,0,1.65],1.15,2.05,F1+0.65);lower(Fr,[-7.4,-4.7,4.7,7.4]);
  const Bk=K.face(2,hd);upper(Bk,[-7,-3.5,0,3.5,7],1.0,1.75,F1+0.85);lower(Bk,[-6.5,-2.2,2.2,6.5]);
  for(const i of [1,3]){const S=K.face(i,hw);upper(S,[-3.6,0,3.6],1.0,1.75,F1+0.85);lower(S,[-3.6,3.6])}
  // giriş: krem kapılar ve üst ışıklık, MÜZE tabelası, kemerli saçak, sütunlar, merdiven ve yanak duvarları, vazolar
  Fr.bx('cream',-1.6,1.6,F0,F0+2.75,0,0.06);Fr.bx('dark',-0.5,0.5,F0,F0+2.55,0.06,0.07);
  for(const s of [-1.05,1.05]){Fr.bx('frame',s-0.42,s+0.42,F0+0.25,F0+1.15,0.06,0.09);Fr.bx('frame',s-0.42,s+0.42,F0+1.35,F0+2.45,0.06,0.09)}
  for(let k=0;k<4;k++){const s=-1.5+k*1.0;windowOn(Fr,{s,y:F0+2.85,w:0.8,h:0.42,arch:'flat',glass:'glassLight',frame:'frame',ft:0.06,fd:0.06,mull:2})}
  Fr.geo('dark',new T.PlaneGeometry(0.95,0.3),0,F0+3.5,0.07);
  const sign=new T.Mesh(new T.PlaneGeometry(0.85,0.24),textMat(textTexture('MÜZE',{w:256,h:72,fg:'#d9b55a',font:'bold 54px Georgia, serif',anisotropy:ctx.anisotropy}),'muze-yazi',{transparent:true}));
  sign.position.set(0,F0+3.5,hd+0.08);group.add(sign);
  const rise=0.55,R=(2.6*2.6+rise*rise)/(2*rise),spring=F0+2.95;
  const arch=new T.Shape();arch.moveTo(-2.6,spring);arch.lineTo(-2.6,F0+3.9);arch.lineTo(2.6,F0+3.9);arch.lineTo(2.6,spring);
  arch.absarc(0,spring+rise-R,R,Math.atan2(R-rise,2.6),Math.PI-Math.atan2(R-rise,2.6),false);
  K.put('plaster',new T.ExtrudeGeometry(arch,{depth:0.3,bevelEnabled:false,curveSegments:16}).translate(0,0,pb-0.3));
  K.bx('frame',-2.75,2.75,F0+3.9,F0+4.05,hd,pb+0.1);K.bx('plaster',-2.6,2.6,F0+3.55,F0+3.9,hd,pb);
  for(const s of [-2.35,2.35]){K.cy('frame',s,pb-0.2,F0,F0+3.6,0.14,0.12,12);K.bx('frame',s-0.2,s+0.2,F0+3.5,F0+3.62,pb-0.4,pb);K.bx('frame',s-0.18,s+0.18,F0,F0+3.6,hd,hd+0.12)}
  K.bx('whiteStone',-2.7,2.7,F0-0.25,F0,hd,pb);
  const g0=L.n,rise1=(F0-ctx.ga(0,pb+run))/g0;
  for(let k=0;k<g0;k++)K.bx('stone',-3.2,3.2,low,F0-(k+1)*rise1,pb+k*0.32,pb+(k+1)*0.32);
  for(const s of [-1,1]){K.bx('stone',s*3.2-(s>0?0:0.45),s*3.2+(s>0?0.45:0),low,F0+0.35,hd,pb+0.9);
    K.bx('stone',s*3.2-(s>0?0:0.45),s*3.2+(s>0?0.45:0),low,ctx.ga(s*3.4,pb+run)+0.75,pb+0.9,pb+run+0.1);
    const ua=s*3.42,ub=pb+run-0.15,uy=ctx.ga(ua,ub)+0.75;K.cy('marble',ua,ub,uy,uy+0.12,0.22,0.2,12);K.cy('marble',ua,ub,uy+0.12,uy+0.55,0.16,0.28,12)}
  // bahçe: lambalar, fıstık çamı, antik taşlar
  for(const [a,b] of L.lamps)lampPost(K,a,b,ctx.ga(a,b));
  pineTree(K,L.pine[0],L.pine[1],ctx.ga(...L.pine));
  for(const [a,b,w,d,r] of [[-6.2,hd+1.6,1.6,0.45,0.2],[-8.4,hd+1.8,1.4,0.5,-0.3],[7.6,hd+1.5,1.2,0.5,0.1]]){const g=new T.BoxGeometry(w,1.0,d);g.rotateY(r);g.rotateX(-0.25);K.put('marble',g.translate(a,ctx.ga(a,b)+0.45,b))}
  // kapı: taş kemer, yazı kuşağı, kafesli korkuluk; iki yanda moloz duvar üstünde yeşil parmaklık
  const gw=3.2,gy=ctx.ga(0,gate),G=new T.Shape();G.moveTo(-gw,0);G.lineTo(gw,0);G.lineTo(gw,4.7);G.lineTo(-gw,4.7);G.lineTo(-gw,0);
  G.holes.push(new T.Path(outline(3.0,4.3,'round').getPoints(16)));
  K.put('gateStone',new T.ExtrudeGeometry(G,{depth:1.1,bevelEnabled:false,curveSegments:16}).translate(0,gy,gate-0.55));
  K.bx('gateStone',-gw,gw,low,gy,gate-0.55,gate+0.55);
  for(const s of [-1,1]){K.bx('gateStone',s*2.35-0.85,s*2.35+0.85,gy+4.0,gy+4.2,gate-0.62,gate+0.62);K.bx('gateStone',s*2.35-0.9,s*2.35+0.9,gy,gy+0.45,gate-0.62,gate+0.62)}
  K.bx('gateStone',-gw-0.1,gw+0.1,gy+4.7,gy+5.3,gate-0.6,gate+0.6);K.bx('gateStone',-gw-0.25,gw+0.25,gy+5.3,gy+5.5,gate-0.7,gate+0.7);
  K.bx('gateStone',-gw-0.05,gw+0.05,gy+6.25,gy+6.45,gate-0.65,gate+0.65);for(const s of [-gw+0.15,-1.05,1.05,gw-0.15])K.bx('gateStone',s-0.15,s+0.15,gy+5.5,gy+6.25,gate-0.45,gate+0.45);
  const lat=new T.Mesh(new T.PlaneGeometry(2*gw-0.3,0.75),ctx.latticeGate);lat.position.set(0,gy+5.87,gate);group.add(lat);
  const frieze=textMat(textTexture('KUVA-YI MİLLİYE MÜZESİ',{w:1024,h:96,fg:'#8d7766',font:'bold 70px Georgia, serif',anisotropy:ctx.anisotropy}),'kapi-yazi',{transparent:true});
  for(const d of [1,-1]){const t=new T.Mesh(new T.PlaneGeometry(6.0,0.5),frieze);t.position.set(0,gy+5.0,gate+d*0.61);if(d<0)t.rotation.y=Math.PI;group.add(t)}
  K.bx('goldPlate',-2.75,-2.05,gy+2.0,gy+2.85,gate+0.55,gate+0.58);
  const muze=new T.Mesh(new T.PlaneGeometry(0.28,1.15),textMat(textTexture('MÜZE',{w:64,h:256,fg:'#c9a44a',font:'bold 52px Georgia, serif',vertical:true,anisotropy:ctx.anisotropy}),'muze-dikey',{transparent:true}));
  muze.position.set(-1.75,gy+1.85,gate+0.56);group.add(muze);
  for(const [s0,s1] of [[-12.4,-gw],[gw,12.4]]){
    for(let a=s0;a<s1;a+=0.5){const y=ctx.ga(a+0.25,gate);K.bx('rubble',a,a+0.5,low,y+0.7,gate-0.25,gate+0.25)}
    for(let a=s0+0.08;a<s1;a+=0.14){const y=ctx.ga(a,gate)+0.7;K.bx('greenIron',a-0.015,a+0.015,y,y+1.45,gate-0.015,gate+0.015)}
    for(let a=s0;a<s1;a+=2){const y=ctx.ga(a,gate)+0.7;K.bx('greenIron',a,Math.min(s1,a+2),y+0.12,y+0.16,gate-0.025,gate+0.025);K.bx('greenIron',a,Math.min(s1,a+2),y+1.3,y+1.34,gate-0.025,gate+0.025);
      K.bx('greenIron',a-0.05,a+0.05,y,y+1.6,gate-0.05,gate+0.05)}
  }
  group.add(bake(K.P,M,'kuvayi-milliye'));
  return {object:group};
}

// ---------------------------------------------------------------- Zağnos Paşa Camii
function buildMosque(L,ctx){
  const K=kit(),M=ctx.M,{H,PL,low,WT,CB,DT,DR,MB,mc,Ym}=L,group=new T.Group();
  K.bx('whiteStone',-H-0.15,H+0.15,low,PL,-H-0.15,H+0.15);K.bx('brick',-H,H,PL,WT,-H,H);
  for(let i=0;i<4;i++){
    const F=K.face(i,H),mihrab=i===2,porch=i!==2;
    for(const s of [-H+0.6,H-0.6])quoins(F,'whiteStone',s,PL,WT,1.2,1.55,0.12,0.55);
    for(const s of [-6.5,6.5])quoins(F,'whiteStone',s,PL,WT,0.9,1.25,0.1,0.55);
    F.bx('whiteStone',-H-0.05,H+0.05,PL+4.6,PL+4.9,0,0.14);F.bx('whiteStone',-H-0.1,H+0.1,WT,WT+0.25,0,0.32);F.bx('whiteStone',-H-0.15,H+0.15,WT+0.25,WT+0.45,0,0.48);
    const hide=s=>i===1&&s<-12;   // batı cephesinin kuzey ucu minare tabanının arkasında
    for(const s of [-13.3,-9.4,9.4,13.3])if(!hide(s))windowOn(F,{s,y:PL+0.95,w:1.4,h:2.7,glass:'glass',frame:'whiteStone',ft:0.18,fd:0.14,grille:'greenIron',sill:'whiteStone'});
    for(const s of [-13.3,-9.4,0,9.4,13.3])if(!hide(s)&&!(mihrab&&s===0))windowOn(F,{s,y:PL+5.6,w:1.3,h:3.0,glass:'lattice',frame:'whiteStone',ft:0.18,fd:0.14,sill:'whiteStone'});
    // ortada beşik tonozun ucu: basık kemerli alınlık, üç kafesli pencere; arkasında kurşun tonoz
    const rise=4.0,Rg=(6.5*6.5+rise*rise)/(2*rise),gy=WT+0.45,cyc=gy+rise-Rg,t0=Math.atan2(gy-cyc,6.5);
    const gab=new T.Shape();gab.moveTo(-6.5,gy);gab.lineTo(6.5,gy);gab.absarc(0,cyc,Rg,t0,Math.PI-t0,false);gab.lineTo(-6.5,gy);
    F.geo('brick',new T.ExtrudeGeometry(gab,{depth:0.6,bevelEnabled:false,curveSegments:20}),0,0,-0.6);
    const cop=new T.Shape();cop.absarc(0,cyc,Rg+0.3,t0,Math.PI-t0,false);cop.absarc(0,cyc,Rg,Math.PI-t0,t0,true);
    F.geo('whiteStone',new T.ExtrudeGeometry(cop,{depth:0.85,bevelEnabled:false,curveSegments:20}),0,0,-0.7);
    for(const [s,y,hh] of [[-2.7,gy+0.45,2.0],[0,gy+0.75,2.3],[2.7,gy+0.45,2.0]])windowOn(F,{s,y,w:1.0,h:hh,glass:'lattice',frame:'whiteStone',ft:0.15,fd:0.12});
    const a0=Math.PI-Math.asin(6.5/Rg),vault=new T.CylinderGeometry(Rg+0.05,Rg+0.05,H-6.5+0.6,24,1,true,a0,2*Math.asin(6.5/Rg));
    vault.rotateX(Math.PI/2).translate(0,cyc,(H+6.5)/2-0.6-H);F.geo('lead',vault,0,0,0);
    if(porch){
      // basık kemerli sundurma: iki kare mermer sütun, kurşun kaplı eğik çatı, ahşap kapı, basamaklar
      F.bx('whiteStone',-4,4,PL-0.12,PL,0,3.9);F.bx('marble',-3.3,-2.85,PL,PL+4.4,3.2,3.65);F.bx('marble',2.85,3.3,PL,PL+4.4,3.2,3.65);
      for(const s of [-3.075,3.075])F.bx('marble',s-0.32,s+0.32,PL+4.4,PL+4.6,3.1,3.75);
      F.bx('whiteStone',-3.95,3.95,PL+4.6,PL+5.25,3.05,3.8);for(const s of [-3.95,3.7])F.bx('whiteStone',s,s+0.25,PL+4.6,PL+5.25,0,3.8);
      const roof=new T.BoxGeometry(8.6,0.15,Math.hypot(4.3,1.1)).rotateX(Math.atan2(1.1,4.3));F.geo('lead',roof,0,PL+5.9,2.1);
      F.bx('woodDoor',-1.15,1.15,PL,PL+3.3,0.02,0.1);F.bx('frameDark',-0.03,0.03,PL,PL+3.3,0.1,0.13);
      F.geo('whiteStone',ring(2.3,3.6,0.22,'segment',0.16),0,PL,-0.02);windowOn(F,{s:0,y:PL+3.45,w:2.0,h:0.6,arch:'flat',glass:'lattice',frame:'whiteStone',ft:0.08,fd:0.1});
      for(let k=0;k<3;k++){const [a,b]=F.ab(0,4.2+k*0.35),gy2=ctx.ga(a,b);F.bx('whiteStone',-3.6,3.6,low,PL-(k+1)*(PL-gy2)/3.2,3.9+k*0.35,4.25+k*0.35)}
    }else{
      F.bx('brick',-3,3,PL,PL+9.2,0,1.25);quoins(F,'whiteStone',-2.75,PL,PL+9.2,0.5,0.75,1.3,0.55);quoins(F,'whiteStone',2.75,PL,PL+9.2,0.5,0.75,1.3,0.55);
      F.bx('whiteStone',-3.2,3.2,PL+9.2,PL+9.5,0,1.45);F.geo('lead',new T.BoxGeometry(6.2,0.15,1.7).rotateX(0.35),0,PL+9.75,0.75);
      windowOn(K.face(2,H+1.25),{s:0,y:PL+5.6,w:1.2,h:2.6,glass:'lattice',frame:'whiteStone',ft:0.15,fd:0.12});
    }
  }
  // çatı: kurşun düz örtü, dört köşe kubbesi, ortada kare kaide, dört köşe kulesi, sekizgen kasnak, ana kubbe, alem
  K.bx('lead',-H+0.1,H-0.1,WT+0.35,WT+0.5,-H+0.1,H-0.1);
  for(const [sa,sb] of [[1,1],[1,-1],[-1,1],[-1,-1]]){K.bx('lead',sa*11.4-4.3,sa*11.4+4.3,WT+0.45,WT+0.75,sb*11.4-4.3,sb*11.4+4.3);K.sp('lead',sa*11.4,WT+0.7,sb*11.4,4.5,0.55,14)}
  K.bx('brick',-7,7,WT+0.45,CB,-7,7);K.bx('whiteStone',-7.15,7.15,CB-0.3,CB,-7.15,7.15);
  for(const [sa,sb] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const a=sa*9.2,b=sb*9.4;K.cy('whiteStone',a,b,WT+0.45,WT+3.4,1.9,1.9,8);K.cy('whiteStone',a,b,WT+3.4,WT+3.65,2.05,2.05,8);
    K.sp('lead',a,WT+3.65,b,1.75,0.8,10);K.cy('gold',a,b,WT+5.0,WT+5.7,0.04,0.03,6);K.sp('gold',a,WT+5.75,b,0.09,1,6,Math.PI)}
  K.cy('leadDark',0,0,CB,DT,7.0,7.0,8);K.cy('whiteStone',0,0,DT,DT+0.35,7.3,7.3,8);
  for(let k=0;k<8;k++){const th=Math.PI/8+k*Math.PI/4,ap=7.0*Math.cos(Math.PI/8),m=new T.Matrix4().makeRotationY(th);
    const fr=ring(1.3,2.4,0.14,'round',0.12).translate(0,CB+0.6,ap-0.02).applyMatrix4(m),gl=new T.ShapeGeometry(outline(1.3,2.4,'round'),8).translate(0,CB+0.6,ap+0.01).applyMatrix4(m);
    K.put('whiteStone',fr);K.put('lattice',gl)}
  K.sp('lead',0,DT+0.3,0,DR,1,20);
  K.cy('gold',0,0,DT+0.3+DR-0.1,DT+0.3+DR+1.6,0.06,0.04,8);for(const [y,r] of [[0.45,0.22],[0.95,0.16]])K.sp('gold',0,DT+0.3+DR+y,0,r,1,8,Math.PI);
  K.put('gold',new T.TorusGeometry(0.28,0.05,6,16,Math.PI*1.4).rotateZ(Math.PI*0.8).translate(0,DT+0.3+DR+1.5,0));
  // minare (kuzeybatı): kare kaide, pabuç, sekizgen petek, yivli gövde, tek şerefe, külah, alem
  const [ma,mb]=mc;K.bx('whiteStone',MB[0],MB[1],low,Ym.base,MB[2],MB[3]);K.bx('whiteStone',MB[0]-0.12,MB[1]+0.12,PL+4.6,PL+4.9,MB[2]-0.12,MB[3]+0.12);
  K.bx('whiteStone',MB[0]-0.15,MB[1]+0.15,Ym.base-0.3,Ym.base,MB[2]-0.15,MB[3]+0.15);
  K.cy('whiteStone',ma,mb,Ym.base,Ym.petek,2.15,1.55,8);K.cy('whiteStone',ma,mb,Ym.petek,Ym.shaft,1.55,1.55,8);K.cy('whiteStone',ma,mb,Ym.shaft-0.2,Ym.shaft,1.65,1.65,16);
  const flute=(r0,r1,y0,y1)=>{const g=new T.CylinderGeometry(r1,r0,y1-y0,32,1);const p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),k=Math.round(Math.atan2(x,z)/(Math.PI*2/32));if(k%2===0){p.setX(i,x*0.955);p.setZ(i,z*0.955)}}
    g.computeVertexNormals();K.put('whiteStone',g.translate(ma,(y0+y1)/2,mb))};
  flute(1.3,1.22,Ym.shaft,Ym.serefe-1.0);
  for(const [y0,y1,r] of [[-1.0,-0.7,1.35],[-0.7,-0.4,1.55],[-0.4,-0.15,1.8],[-0.15,0,2.05]])K.cy('whiteStone',ma,mb,Ym.serefe+y0,Ym.serefe+y1,r,r,24);
  K.cy('whiteStone',ma,mb,Ym.serefe,Ym.serefe+0.9,2.02,2.02,24,true);K.cy('whiteStone',ma,mb,Ym.serefe+0.9,Ym.serefe+1.0,2.1,2.1,24);
  flute(1.1,1.05,Ym.serefe,Ym.cap-0.3);K.cy('whiteStone',ma,mb,Ym.cap-0.3,Ym.cap,1.3,1.3,24);
  K.cy('lead',ma,mb,Ym.cap,Ym.tip,1.25,0.02,24);K.cy('gold',ma,mb,Ym.tip-0.2,Ym.alem,0.05,0.03,8);
  for(const [y,r] of [[0.35,0.18],[0.75,0.13]])K.sp('gold',ma,Ym.tip+y,mb,r,1,8,Math.PI);
  K.put('gold',new T.TorusGeometry(0.22,0.04,6,14,Math.PI*1.4).rotateZ(Math.PI*0.8).translate(ma,Ym.alem-0.1,mb));
  // şadırvan: on iki köşeli mermer hazne, on iki sütun, kurşun kubbe
  const [sa0,sb0]=L.sad,sy=ctx.ga(sa0,sb0);
  K.cy('marble',sa0,sb0,sy-0.5,sy+0.15,3.9,3.9,12);K.cy('marble',sa0,sb0,sy+0.15,sy+1.05,1.9,1.9,12);
  for(let k=0;k<12;k++){const t=k/12*Math.PI*2;K.cy('marble',sa0+Math.sin(t)*3.15,sb0+Math.cos(t)*3.15,sy+0.15,sy+3.4,0.16,0.16,10)}
  K.cy('whiteStone',sa0,sb0,sy+3.4,sy+3.7,3.7,3.6,12);K.sp('lead',sa0,sy+3.65,sb0,3.45,0.55,14);K.cy('gold',sa0,sb0,sy+5.4,sy+6.3,0.04,0.03,6);
  // türbe (güney): sekizgen, kubbeli
  const [ta,tb]=L.turbe,ty=ctx.ga(ta,tb);
  K.cy('whiteStone',ta,tb,ty-1,ty+0.6,4.3,4.3,8);K.cy('towerStone',ta,tb,ty+0.6,ty+6.2,4.0,4.0,8);K.cy('whiteStone',ta,tb,ty+6.2,ty+6.55,4.25,4.25,8);
  K.cy('lead',ta,tb,ty+6.55,ty+7.1,3.7,3.7,16);K.sp('lead',ta,ty+7.1,tb,3.7,0.85,14);K.cy('gold',ta,tb,ty+10.1,ty+10.9,0.04,0.03,6);
  for(let k=0;k<8;k++){const th=Math.PI/8+k*Math.PI/4,ap=4.0*Math.cos(Math.PI/8),m=new T.Matrix4().makeRotationY(th),door=k===0;   // kapı kuzeyde, camiye bakar
    const w=door?1.2:0.95,hh=door?2.6:1.8,y=door?ty+0.6:ty+2.0;
    K.put('whiteStone',ring(w,hh,0.13,'round',0.1).translate(0,y,ap-0.02).applyMatrix4(m));K.put(door?'woodDoor':'lattice',new T.ShapeGeometry(outline(w,hh,'round'),8).translate(0,y,ap+0.01).applyMatrix4(m))}
  // avlu çınarı
  const [pa,pbb]=L.tree,py=ctx.ga(pa,pbb);K.cy('bark',pa,pbb,py-0.5,py+7,0.75,0.5,10);
  for(const [da,db,dy,r] of [[0,0,9.5,5.2],[2.6,1.4,8.2,3.8],[-2.8,-1,8.6,3.9],[0.6,-2.8,10.8,3.4],[-1,2.6,11,3.2]])K.put('plane',new T.IcosahedronGeometry(r,1).scale(1,0.78,1).translate(pa+da,py+dy,pbb+db));
  group.add(bake(K.P,M,'zaganos-pasa'));
  return {object:group};
}

// ---------------------------------------------------------------- Balıkesir Garı
function buildStation(L,ctx){
  const K=kit(),M=ctx.M,{hw,hd,PL,low,E,W}=L,group=new T.Group();
  K.bx('stationStone',-hw-0.1,hw+0.1,low,PL,-hd-0.1,hd+0.1);K.bx('stationStone',-hw,hw,PL,E,-hd,hd);K.bx('stationStone',-5.2,5.2,low,E,-hd-0.6,hd+0.6);
  const bands=(F,s0,s1)=>{F.bx('stationLight',s0-0.05,s1+0.05,PL+4.6,PL+4.85,0,0.12);F.bx('stationLight',s0-0.1,s1+0.1,E,E+0.25,0,0.3);F.bx('stationLight',s0-0.15,s1+0.15,E+0.25,E+0.42,0,0.45)};
  for(const i of [0,2]){
    const F=K.face(i,hd),C=K.face(i,hd+0.6);bands(F,-hw,-5.2);bands(F,5.2,hw);
    C.bx('stationLight',-5.25,5.25,PL+4.6,PL+4.85,0,0.12);C.bx('stationLight',-5.3,5.3,E,E+0.3,0,0.3);
    for(const s of [-hw+0.45,hw-0.45])quoins(F,'stationLight',s,PL,E,0.9,1.3,0.07,0.38);for(const s of [-4.85,4.85])quoins(C,'stationLight',s,PL,E,0.7,1.05,0.07,0.38);
    // orta blok: üç kemerli kapı (ön) ya da kapı ve pencereler (peron), yazı, üst kat pencereleri, alınlık
    for(const s of [-2.55,0,2.55]){windowOn(C,{s,y:PL,w:1.55,h:3.3,glass:'glass',frame:'stationLight',ft:0.3,fd:0.16,mull:1,transom:true});C.bx('stationLight',s-0.22,s+0.22,PL+3.3,PL+3.75,0,0.2)}
    for(const s of [-2.55,0,2.55])windowOn(C,{s,y:PL+5.6,w:1.15,h:2.0,arch:'segment',glass:'glass',frame:'stationLight',ft:0.22,fd:0.14,mull:1,transom:true,sill:'stationLight'});
    for(const s of [-10.1,-7.4,7.4,10.1]){windowOn(F,{s,y:PL+1.2,w:1.25,h:2.4,arch:'segment',glass:'glass',frame:'stationLight',ft:0.24,fd:0.14,mull:1,transom:true,sill:'stationLight'});
      windowOn(F,{s,y:PL+5.6,w:1.15,h:2.0,arch:'segment',glass:'glass',frame:'stationLight',ft:0.22,fd:0.14,mull:1,transom:true,sill:'stationLight'})}
    const ped=new T.Shape();ped.moveTo(-5.4,0);ped.lineTo(5.4,0);ped.lineTo(0,3.8);ped.lineTo(-5.4,0);
    C.geo('stationStone',new T.ExtrudeGeometry(ped,{depth:0.5,bevelEnabled:false}),0,E+0.3,-0.5);
    for(const sg of [-1,1]){const len=Math.hypot(5.6,3.92),g=new T.BoxGeometry(len,0.22,0.75).rotateZ(-sg*Math.atan2(3.92,5.6));C.geo('stationLight',g,sg*2.8,E+0.3+1.96+0.08,-0.15);
      for(let t=0.08;t<0.95;t+=0.07){const s=sg*5.4*(1-t),y=E+0.3+3.8*t-0.18;C.bx('stationLight',s-0.1,s+0.1,y-0.12,y,0,0.1)}}
    for(const s of [-0.5,0.5])windowOn(C,{s,y:E+1.45,w:0.5,h:1.0,glass:'glass',frame:'stationLight',ft:0.1,fd:0.08});
    const txt=new T.Mesh(new T.PlaneGeometry(i===0?5.6:4.0,i===0?0.62:0.5),i===0?ctx.garText:ctx.balText);const [ta,tb]=C.ab(0,0.13);txt.position.set(ta,PL+4.05,tb);txt.rotation.y=i*Math.PI/2;group.add(txt);
    const tc=new T.Mesh(new T.PlaneGeometry(1.7,0.52),i===0?ctx.tcddText:ctx.ottoText);const [ca,cb]=C.ab(0,0.02);tc.position.set(ca,E+0.85,cb);tc.rotation.y=i*Math.PI/2;group.add(tc);
    if(i===0){C.geo('frame',new T.CircleGeometry(0.34,20),0,E+3.0,0.02);C.geo('plaque',new T.CircleGeometry(0.26,20),0,E+3.0,0.03)}
  }
  for(const i of [1,3]){const F=K.face(i,hw);bands(F,-hd,hd);for(const s of [-3.2,3.2]){windowOn(F,{s,y:PL+1.2,w:1.25,h:2.4,arch:'segment',glass:'glass',frame:'stationLight',ft:0.24,fd:0.14,mull:1,transom:true});
    windowOn(F,{s,y:PL+5.6,w:1.15,h:2.0,arch:'segment',glass:'glass',frame:'stationLight',ft:0.22,fd:0.14,mull:1,transom:true})}}
  // çatılar: ortada alınlıklı beşik, yanlarda kırma; bacalar
  K.put('tileRed',gableRoof(-5.75,5.75,-hd-0.95,hd+0.95,E+0.3,3.8/5.4,2.2));
  for(const sg of [-1,1]){const x0=sg>0?5.0:-hw-0.5,x1=sg>0?hw+0.5:-5.0;K.put('tileRed',hipRoof({x0,x1,z0:-hd-0.5,z1:hd+0.5,y:E+0.42,k:0.55},2.2));
    for(const b of [-3.4,3.4]){const a=sg*8.5;K.bx('stationLight',a-0.3,a+0.3,E+1.2,E+3.6,b-0.3,b+0.3);K.bx('stationStone',a-0.38,a+0.38,E+3.6,E+3.8,b-0.38,b+0.38)}}
  // tek katlı kanatlar
  for(const sg of [-1,1]){const a0=sg>0?W[0]:-W[1],a1=sg>0?W[1]:-W[0];
    K.bx('stationStone',a0,a1,low,PL+4.6,W[2],W[3]);K.bx('stationLight',a0-0.2,a1+0.2,PL+4.6,PL+4.9,W[2]-0.2,W[3]+0.2);
    for(const [x0,x1,z0,z1] of [[a0,a1,W[2],W[2]+0.3],[a0,a1,W[3]-0.3,W[3]],[a0,a0+0.3,W[2],W[3]],[a1-0.3,a1,W[2],W[3]]]){K.bx('stationStone',x0,x1,PL+4.9,PL+5.5,z0,z1);K.bx('stationLight',x0-0.05,x1+0.05,PL+5.5,PL+5.6,z0-0.05,z1+0.05)}
    K.bx('roofFlat',a0+0.3,a1-0.3,PL+4.9,PL+5.0,W[2]+0.3,W[3]-0.3);
    for(const [i,D] of [[0,W[3]],[2,-W[2]]]){const F=K.face(i,D);for(const s of [(a0+a1)/2-2.1,(a0+a1)/2+2.1]){const ss=i===0?s:-s;windowOn(F,{s:ss,y:PL+0.9,w:1.3,h:2.5,arch:'segment',glass:'glass',frame:'stationLight',ft:0.22,fd:0.12,mull:1,transom:true})}}
    const F=K.face(sg>0?1:3,W[1]);windowOn(F,{s:sg>0?-(W[2]+W[3])/2:(W[2]+W[3])/2,y:PL+0.9,w:1.3,h:2.5,arch:'segment',glass:'glass',frame:'stationLight',ft:0.22,fd:0.12,mull:1,transom:true});
  }
  // peron ve sundurma (raylar tarafı, −b)
  K.bx('concrete',-24.5,24.5,low,PL-0.05,-12.4,-hd);K.bx('yellow',-24.5,24.5,PL-0.05,PL-0.03,-11.95,-11.65);
  const roofLen=Math.hypot(4.9,0.5),tilt=Math.atan2(0.5,4.9);
  K.put('canopy',new T.BoxGeometry(48.8,0.1,roofLen).rotateX(-tilt).translate(0,PL+4.2,-hd-2.45));K.bx('steel',-24.4,24.4,PL+3.7,PL+3.98,-11.75,-11.65);
  for(const a of [-21,-15,-9,-3,3,9,15,21]){K.cy('steel',a,-10.8,PL-0.05,PL+3.7,0.12,0.11,10);
    for(const [b1,y1] of [[-8.6,PL+4.3],[-11.6,PL+3.95]]){const len=Math.hypot(b1+10.8,y1-PL-3.0),g=new T.BoxGeometry(0.08,0.12,len).rotateX(Math.atan2(-(y1-PL-3.0),b1+10.8));K.put('steel',g.translate(a,(PL+3.0+y1)/2,(b1-10.8)/2))}}
  // bayrak direği
  const [fa,fb]=L.pole,fy=ctx.ga(fa,fb);K.cy('steel',fa,fb,fy,fy+10,0.08,0.05,10);K.cy('stationLight',fa,fb,fy-0.2,fy+0.3,0.45,0.5,12);K.sp('steel',fa,fy+10.05,fb,0.1);
  const flag=createFlag(ctx.anisotropy,{L:1.8,H:1.2});flag.mesh.position.set(fa+0.06,fy+9.3,fb);group.add(flag.mesh);
  group.add(bake(K.P,M,'gar'));
  return {object:group,update(dt){flag.update(dt)}};
}
const BUILD={'saat-kulesi':buildTower,muze:buildMuseum,cami:buildMosque,gar:buildStation};

/** Katman: yapılar, koruma alanı zemin kaplamaları, çarpışma. surface(x,z): arazi ağının yüksekliği. */
export function createHeritageLayer({data,ground,surface=ground,anisotropy=4,place=heritagePlacement(data,ground)}){
  const M=materials(anisotropy);M.stone=M.marble;
  const latticeTex=canvasTex(256,(g,W,H)=>{g.clearRect(0,0,W,H);g.strokeStyle='#e0cbbb';g.lineWidth=9;
    for(let x=0;x<4;x++){g.beginPath();g.arc((x+0.5)*W/4,H/2,H/2-8,0,Math.PI*2);g.stroke()}g.fillStyle='#e0cbbb';g.fillRect(0,0,W,6);g.fillRect(0,H-6,W,6)},anisotropy,{w:256,h:64,repeat:true});
  latticeTex.repeat.set(1.6,1);
  const ctx={M,anisotropy,clockMat:new T.MeshStandardMaterial({map:clockTexture(anisotropy),roughness:0.5}),
    latticeGate:Object.assign(new T.MeshStandardMaterial({map:latticeTex,transparent:true,alphaTest:0.4,side:T.DoubleSide,roughness:0.85}),{name:'tarihi-kapi-kafes'}),
    garText:textMat(textTexture('BALIKESİR GAR',{w:1024,h:112,fg:'#ffffff',font:'bold 96px "Segoe UI", Arial, sans-serif',anisotropy}),'gar-yazi',{transparent:true,extra:{emissive:'#555555'}}),
    balText:textMat(textTexture('BALIKESİR',{w:1024,h:120,bg:'#cdbfa8',fg:'#6b5a46',font:'bold 84px Georgia, serif',anisotropy}),'gar-balikesir'),
    tcddText:textMat(textTexture('TCDD',{w:512,h:150,fg:'#ffffff',font:'bold 132px "Segoe UI", Arial, sans-serif',anisotropy}),'gar-tcdd',{transparent:true,extra:{emissive:'#444444'}}),
    ottoText:textMat(textTexture('1912',{w:512,h:150,bg:'#cdbfa8',fg:'#6b5a46',font:'bold 100px Georgia, serif',anisotropy}),'gar-kitabe')};
  ctx.clockMat.name='tarihi-saat-kadrani';
  const object=new T.Group();object.name='tarihi-yapilar';const parts=[];
  for(const s of place.structures){
    const b=BUILD[s.def.tip];if(!b)continue;
    const built=b(s.lay,{...ctx,ga:s.ga});
    const holder=new T.Group();holder.name='tarihi-'+s.id;holder.position.set(s.c.x,s.y0,s.c.z);holder.rotation.y=s.yaw;holder.add(built.object);object.add(holder);
    const solid=s.lay.solid||[];
    const yard=createYard({kind:s.def.tip==='gar'?'avlu':'bahce',zone:s.lay.zone,spec:s.lay.yard||(s.def.tip==='muze'?{plaza:[[-s.lay.hw-1.2,s.lay.hw+1.2,-s.lay.hd-1.2,s.lay.hd+1.2],[-3.8,3.8,s.lay.hd,s.lay.pb+s.lay.run+0.6],[-1.6,1.6,s.lay.hd,s.lay.gate+0.9]]}:{plaza:[[-99,99,-99,99]]}),
      world:s.world,center:s.c,yaw:s.yaw,surface,anisotropy,inBuilding:(a,bb)=>solid.some(r=>a>=r[0]+0.2&&a<=r[1]-0.2&&bb>=r[2]+0.2&&bb<=r[3]-0.2)});
    object.add(yard.object);parts.push(built,yard);
  }
  return {object,place,stats:{yapilar:place.structures.map(s=>s.name)},
    update(dt){for(const p of parts)p.update?.(dt)},
    heightAt:(x,z)=>place.heightAt(x,z),hitTest:(x,y,z,r)=>place.hitTest(x,y,z,r)};
}
