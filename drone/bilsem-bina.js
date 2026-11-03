// Altıeylül BİLSEM binası: MEB tip projesi, yordamsal model (Meshy binasının yerine; kamelya Meshy'den kalır).
// Zafer Hoca: BİLSEM ile arkasındaki Altıeylül Fen Lisesi aynı tip projedir. Fen Lisesi'nin ön ve arka cephe
// fotoğraflarından: dört kat; katlarda çerçeveli pencere bantları; ortada saçaklı giriş, tabela ve bayrak direği; uçta
// öne ve arkaya taşan merdiven bloğu (yan yüzünde dikey cam şerit, arkasında küçük kare WC pencereleri); arkada camlı
// merdiven kulesi; geniş saçaklı kiremit kırma çatı. Renkler BİLSEM fotoğraflarından üretilen Meshy modelinden
// (2. ve 4. katta pembe bant, bordo çerçeve); data/bal/bilsem.json → style ile değişir. Ölçüler temsilidir; dış kutu
// Google uydu görüntüsünden ölçülen kutudur (bilsem.json → building).
// Yerel çerçeve: +X bina ekseni (doğu), +Z ön cephe (güney), y = 0 bina tabanı (bilsem.js yerleştirir).
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const STYLE_DEFAULTS={
  model:'tip-proje',endBlock:'west',floors:4,floorHeight:3.7,plinth:0.9,bandFloors:[1,3],
  wall:'#eeece6',trim:'#f7f6f2',plinthColor:'#9b978f',band:'#efc3b5',bandFrame:'#94353c',frame:'#3b3f45',
  glass:'#41596e',curtain:'#3a74a8',roof:'#b15a45',sign:'ALTIEYLÜL BİLİM VE SANAT MERKEZİ',flag:true,
};
const OVERHANG=1.0,END_WIDTH=8;

/** Plan: hacimler, çatılar, çarpışma yüksekliği (yerel metre). WebGL gerekmez; testler ve bilsem.js kullanır. */
export function binaPlan({hu,hv,height},style={}){
  const st={...STYLE_DEFAULTS,...style};
  const s=st.endBlock==='east'?-1:1;   // uç blok doğudaysa her şey x'te aynalanır
  const x0=-hu,x1=hu,xe=x0+END_WIDTH,zf=hv,zb=-hv,mf=hv-3.5,mb=-hv+3,c=(xe+x1)/2,o=OVERHANG;
  const wallTop=st.plinth+st.floors*st.floorHeight+0.2;
  const k=Math.min(0.4,Math.max(0.2,(height-0.3-wallTop)/((mf-mb)/2+o)));
  const vols=[
    {name:'uç blok',x0,x1:xe,z0:zb,z1:zf,top:wallTop},
    {name:'ana blok',x0:xe,x1,z0:mb,z1:mf,top:wallTop},
    {name:'giriş',x0:c-5,x1:c+5,z0:mf,z1:mf+0.9,top:wallTop},
    {name:'merdiven kulesi',x0:c+1,x1:c+5,z0:mb-1.4,z1:mb+1.2,top:wallTop+1.5},
  ];
  // ana çatı uç bloğun üstüne kadar uzar: iki kırma çatının birleşimi T biçimli çatı ve dereleri verir
  const roofs=[{name:'ana çatı',x0:x0-o,x1:x1+o,z0:mb-o,z1:mf+o,y:wallTop,k},
    {name:'uç blok çatısı',x0:x0-o,x1:xe+o,z0:zb-o,z1:zf+o,y:wallTop,k}];
  const roofY=(r,a,b)=>r.y+r.k*Math.min(a-r.x0,r.x1-a,b-r.z0,r.z1-b);
  const inRect=(r,a,b,m=0)=>a>=r.x0-m&&a<=r.x1+m&&b>=r.z0-m&&b<=r.z1+m;
  const pole={x:c+6.8,z:mf+5.6,height:11};
  return {st,s,vols,roofs,pole,roofY,inRect,
    dims:{x0,x1,xe,zf,zb,mf,mb,c,wallTop,o,k},
    top:Math.max(...roofs.map(r=>r.y+r.k*Math.min(r.x1-r.x0,r.z1-r.z0)/2),wallTop+1.8),
    /** (a,b): bina eksenindeki yerel konum (a doğu, b ön). Tabandan yükseklik; bina dışında -Infinity. */
    heightAt(a,b){
      a*=s;let h=-Infinity;
      for(const r of roofs)if(inRect(r,a,b))h=Math.max(h,roofY(r,a,b));
      for(const v of vols)if(inRect(v,a,b))h=Math.max(h,v.top+(v.name==='merdiven kulesi'?0.3:0));
      return h;
    },
  };
}

/** Plan → three.js nesnesi. groundAt(a,b): zemin yüksekliği (taban = 0'a göre), bayrak direği ve basamaklar için. */
export function createBinaObject(plan,{groundAt=()=>0,anisotropy=4}={}){
  const {st,dims:d}=plan,P={},ga=(x,z)=>groundAt(plan.s*x,z);   // plan x'i aynalı çerçeveye çevrilir
  const add=(key,g)=>(P[key]||(P[key]=[])).push(g);
  const box=(key,ax,bx,ay,by,az,bz)=>{if(bx-ax>1e-4&&by-ay>1e-4&&bz-az>1e-4)add(key,new T.BoxGeometry(bx-ax,by-ay,bz-az).translate((ax+bx)/2,(ay+by)/2,(az+bz)/2))};
  // cephe: n ekseni ('x'/'z'), at düzlemi, dir dış yön; öğe u aralığı, y aralığı, düzlemden dışa d0..d1
  const onFace=(key,f,u0,u1,y0,y1,d0,d1)=>{const a=f.at+f.dir*d0,b=f.at+f.dir*d1,lo=Math.min(a,b),hi=Math.max(a,b);
    if(f.n==='z')box(key,u0,u1,y0,y1,lo,hi);else box(key,lo,hi,y0,y1,u0,u1)};
  const floorY=i=>st.plinth+i*st.floorHeight;
  const banded=i=>st.bandFloors.includes(i);

  function windowAt(f,u,y,w,h,{mull=2,glass='glass'}={}){
    onFace('frame',f,u-w/2,u+w/2,y,y+h,-0.02,0.07);
    onFace(glass,f,u-w/2+0.07,u+w/2-0.07,y+0.07,y+h-0.07,0.07,0.085);
    for(let i=1;i<mull;i++){const x=u-w/2+w*i/mull;onFace('frame',f,x-0.035,x+0.035,y,y+h,0.07,0.1)}
    if(h>1.2)onFace('frame',f,u-w/2,u+w/2,y+h*0.74-0.035,y+h*0.74+0.035,0.07,0.1);   // vasistas kaydı
    onFace('sill',f,u-w/2-0.08,u+w/2+0.08,y-0.07,y,-0.02,0.16);
  }
  function band(f,u0,u1,y0,y1){const t=0.22,dd=0.12;
    onFace('bandFill',f,u0,u1,y0,y1,0,0.035);
    onFace('bandFrame',f,u0-t,u1+t,y1,y1+t,0,dd);onFace('bandFrame',f,u0-t,u1+t,y0-t,y0,0,dd);
    onFace('bandFrame',f,u0-t,u0,y0,y1,0,dd);onFace('bandFrame',f,u1,u1+t,y0,y1,0,dd);
  }
  /** Bölmede ortalanmış n pencere; bant katlarında çerçeveli şerit. */
  function bay(f,u0,u1,n,w,{floors=[0,1,2,3],bands=true,h=1.7,sill=0.9,gap=0.75,mull=2}={}){
    const gw=n*w+(n-1)*gap,g0=(u0+u1)/2-gw/2;
    for(const i of floors){if(i>=st.floors)continue;const y=floorY(i)+sill;
      if(bands&&banded(i))band(f,g0-0.45,g0+gw+0.45,y-0.42,y+h+0.42);
      for(let j=0;j<n;j++)windowAt(f,g0+w/2+j*(w+gap),y,w,h,{mull});
    }
  }
  const smallWindows=(f,us)=>{for(let i=0;i<st.floors;i++)for(const u of us)windowAt(f,u,floorY(i)+1.95,0.65,0.65,{mull:1})};
  const pilaster=(f,u,w=0.6)=>onFace('trim',f,u-w/2,u+w/2,st.plinth,d.wallTop-0.3,0,0.16);
  function curtain(f,u0,u1,y0,y1,dv,dh){
    onFace('curtain',f,u0,u1,y0,y1,0,0.05);
    onFace('frame',f,u0-0.08,u1+0.08,y0-0.08,y1+0.08,-0.02,0.04);
    for(let u=u0;u<=u1+1e-6;u+=(u1-u0)/Math.max(1,Math.round((u1-u0)/dv)))onFace('frame',f,u-0.04,u+0.04,y0,y1,0.05,0.1);
    for(let y=y0;y<=y1+1e-6;y+=(y1-y0)/Math.max(1,Math.round((y1-y0)/dh)))onFace('frame',f,u0,u1,y-0.04,y+0.04,0.05,0.1);
  }

  // gövde ve subasman (eğimli arazide alt kısım gömülür)
  for(const v of plan.vols){
    box('plinth',v.x0-0.06,v.x1+0.06,-3,st.plinth,v.z0-0.06,v.z1+0.06);
    box('wall',v.x0,v.x1,st.plinth,v.top,v.z0,v.z1);
  }
  const {x0,x1,xe,zf,zb,mf,mb,c}=d;

  // ön cephe: iki yanda ikişer bölme, ortada öne çıkan giriş
  const F={n:'z',at:mf,dir:1},lm=(xe+c-5)/2,rm=(c+5+x1)/2;
  for(const [u0,u1] of [[xe,lm],[lm,c-5],[c+5,rm],[rm,x1]])bay(F,u0+0.3,u1-0.3,3,2.1,{gap:0.6,h:1.8});
  for(const u of [lm,rm])pilaster(F,u);pilaster(F,x1-0.3);
  const G={n:'z',at:mf+0.9,dir:1};
  bay(G,c-5,c+5,4,1.15,{floors:[1,2,3],gap:1.0});
  windowAt(G,c,st.plinth+0.05,3.6,2.85,{mull:4});                       // giriş kapısı
  for(const u of [c-3.7,c+3.7])windowAt(G,u,floorY(0)+0.9,1.0,1.7,{mull:1});
  // giriş saçağı, tabela, sütunlar, sahanlık ve basamaklar
  const cz1=mf+3.85;
  box('canopy',c-3.7,c+3.7,4.3,4.62,mf+0.9,cz1);
  box('signBand',c-3.78,c+3.78,4.08,4.68,cz1-0.05,cz1+0.06);
  box('signBand',c-3.78,c-3.7,4.08,4.68,mf+0.9,cz1);box('signBand',c+3.7,c+3.78,4.08,4.68,mf+0.9,cz1);
  for(const u of [c-3.35,c+3.35])add('metal',new T.CylinderGeometry(0.11,0.11,4.3-st.plinth,12).translate(u,(4.3+st.plinth)/2,cz1-0.35));
  const groundFront=Math.min(0,ga(c,cz1+1.5));
  box('stone',c-4.2,c+4.2,groundFront-1.2,st.plinth,mf+0.9,cz1+0.1);
  const steps=Math.max(1,Math.round((st.plinth-groundFront)/0.18));
  for(let i=1;i<=steps;i++)box('stone',c-4.2,c+4.2,groundFront-1.2,st.plinth-(st.plinth-groundFront)*i/(steps+0.0001),cz1+0.1,cz1+0.1+0.32*i);

  // arka cephe: WC pencereleri, bölmeler, camlı merdiven kulesi
  const B={n:'z',at:mb,dir:-1},bw=xe+6.3,bm=(bw+c+1)/2,em=(c+5+x1)/2;
  smallWindows(B,[xe+1.8,xe+4.3]);
  for(const [u0,u1,n,w] of [[bw,bm,3,2.1],[bm,c+1,3,2.1],[c+5,em,4,1.65],[em,x1,4,1.65]])bay(B,u0+0.3,u1-0.3,n,w,{gap:0.6,h:1.8});
  for(const u of [bw,bm,em])pilaster(B,u);pilaster(B,x1-0.3);
  const tower=plan.vols[3];
  curtain({n:'z',at:tower.z0,dir:-1},c+1.3,c+4.7,st.plinth+0.25,tower.top-0.45,0.85,st.floorHeight/2);
  box('slab',c+0.65,c+5.35,tower.top,tower.top+0.32,tower.z0-0.35,tower.z1+0.2);
  box('edge',c+0.6,c+5.4,tower.top+0.32,tower.top+0.4,tower.z0-0.4,tower.z1+0.25);

  // uç blok: ön yüzde bantlı pencereler, dış yan yüzde dikey cam şerit, arkada WC pencereleri
  const EF={n:'z',at:zf,dir:1},EB={n:'z',at:zb,dir:-1},EW={n:'x',at:x0,dir:-1},EE={n:'x',at:xe,dir:1};
  bay(EF,x0+0.6,xe-0.6,2,1.7);pilaster(EF,x0+0.3);pilaster(EF,xe-0.3);
  smallWindows(EB,[x0+2.3,xe-2.3]);
  curtain(EW,0.4,2.4,st.plinth+0.3,d.wallTop-0.7,1.0,1.2);
  bay(EE,mf+0.2,zf-0.2,1,1.3,{bands:false});
  smallWindows(EE,[(zb+mb)/2]);
  // doğu (kısa) cephe
  const EX={n:'x',at:x1,dir:1};
  for(const u of [mb+(mf-mb)*0.3,mb+(mf-mb)*0.72])bay(EX,u-1,u+1,1,1.5,{bands:false});

  // çatı: saçak altı tablası (alnı beyaz), koyu kiremit kenarı, kırma çatı yüzleri, mahya
  plan.roofs.forEach((r,ri)=>{
    // ana çatının uç blok üstündeki kısmı uç blok çatısıyla örtüşür: saçak tablası ve kenar orada başlamaz
    const sx0=ri===0?xe:r.x0,e=0.07;
    box('slab',sx0,r.x1,r.y-0.32,r.y,r.z0,r.z1);
    box('edge',sx0,r.x1+e,r.y-0.02,r.y+0.08,r.z0-e,r.z0+0.1);box('edge',sx0,r.x1+e,r.y-0.02,r.y+0.08,r.z1-0.1,r.z1+e);
    if(ri!==0)box('edge',r.x0-e,r.x0+0.1,r.y-0.02,r.y+0.08,r.z0-e,r.z1+e);
    box('edge',r.x1-0.1,r.x1+e,r.y-0.02,r.y+0.08,r.z0-e,r.z1+e);
    add('roof',hipRoof(r,2.2));
  });
  roofCaps(plan,add);
  // bacalar (arka yamaçta)
  for(const u of [c-10,c+12]){const z=mb+3.2,y=plan.roofY(plan.roofs[0],u,z);
    box('trim',u-0.45,u+0.45,y-0.6,y+1.25,z-0.35,z+0.35);box('frame',u-0.55,u+0.55,y+1.25,y+1.37,z-0.45,z+0.45)}

  // yağmur inişleri (saçaktan zemine gri borular)
  const pipe=(x,z)=>add('pipe',new T.CylinderGeometry(0.065,0.065,d.wallTop-0.6,8).translate(x,(d.wallTop-0.6)/2+0.3,z));
  for(const x of [c-5.3,c+5.3,x1-0.8])pipe(x,mf+0.12);
  for(const x of [c+0.75,c+5.25,x1-0.8,xe+0.5])pipe(x,mb-0.12);
  pipe(x0+0.7,zf+0.12);pipe(xe-0.7,zf+0.12);pipe(x0+0.7,zb-0.12);pipe(xe-0.7,zb-0.12);

  // bayrak direği (giriş önü)
  const pole=plan.pole,pg=ga(pole.x,pole.z);
  add('metal',new T.CylinderGeometry(0.055,0.085,pole.height,10).translate(pole.x,pg+pole.height/2,pole.z));
  add('stone',new T.CylinderGeometry(0.55,0.65,0.35,16).translate(pole.x,pg+0.12,pole.z));
  add('metal',new T.SphereGeometry(0.12,12,8).translate(pole.x,pg+pole.height+0.08,pole.z));

  const tex=tileTexture(st.roof,anisotropy);
  const mat=(name,o)=>{const m=new T.MeshStandardMaterial(o);m.name='bilsem-'+name;return m};
  const mats={
    wall:mat('wall',{color:st.wall,roughness:0.93}),trim:mat('trim',{color:st.trim,roughness:0.88}),
    plinth:mat('plinth',{color:st.plinthColor,roughness:0.95}),stone:mat('stone',{color:'#cbc6bb',roughness:0.92}),
    bandFill:mat('band',{color:st.band,roughness:0.9}),bandFrame:mat('band-frame',{color:st.bandFrame,roughness:0.8}),
    frame:mat('frame',{color:st.frame,roughness:0.55,metalness:0.25}),sill:mat('sill',{color:'#dedad1',roughness:0.85}),
    glass:mat('glass',{color:st.glass,roughness:0.1,metalness:0.3}),curtain:mat('curtain',{color:st.curtain,roughness:0.08,metalness:0.35}),
    slab:mat('fascia',{color:'#f5f4f0',roughness:0.85}),edge:mat('roof-edge',{color:'#7b2f27',roughness:0.75}),
    roof:mat('roof',{map:tex,roughness:0.8}),cap:mat('ridge',{color:'#8c3b30',roughness:0.78}),
    canopy:mat('canopy',{color:'#f2f1ed',roughness:0.8}),signBand:mat('sign-band',{color:'#1e2b46',roughness:0.6}),
    metal:mat('metal',{color:'#a3a9ae',roughness:0.35,metalness:0.7}),pipe:mat('pipe',{color:'#bcbcb6',roughness:0.6,metalness:0.2}),
  };
  const object=new T.Group();object.name='bilsem-bina';
  for(const [key,list] of Object.entries(P)){
    const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());
    if(plan.s<0)mirrorX(g);
    const mesh=new T.Mesh(g,mats[key]);mesh.name='bilsem-'+key;mesh.castShadow=mesh.receiveShadow=true;object.add(mesh);
  }
  // tabela yazısı (aynalanmaz; konumu aynalanır)
  const sign=new T.Mesh(new T.PlaneGeometry(7.4,0.5),mat('sign',{map:signTexture(st.sign,anisotropy),roughness:0.6}));
  sign.position.set(plan.s*c,4.38,cz1+0.07);object.add(sign);
  let flag=null;
  if(st.flag){flag=createFlag(anisotropy);flag.mesh.position.set(plan.s*pole.x+0.08,pg+pole.height-0.95,pole.z);object.add(flag.mesh)}
  return {object,update(dt){flag?.update(dt)}};
}

/** Kırma çatı: dikdörtgen + saçak, eğim k; her yüz ayrı köşeli, UV metre cinsinden (kiremit dokusu). */
function hipRoof(r,tile){
  const pos=[],uv=[],idx=[],W=r.x1-r.x0,D=r.z1-r.z0,h=Math.min(W,D)/2,yr=r.y+h*r.k,sl=Math.hypot(1,r.k);
  const A=[r.x0,r.y,r.z0],B=[r.x1,r.y,r.z0],C=[r.x1,r.y,r.z1],Dd=[r.x0,r.y,r.z1];
  const [R1,R2]=W>=D?[[r.x0+h,yr,(r.z0+r.z1)/2],[r.x1-h,yr,(r.z0+r.z1)/2]]:[[(r.x0+r.x1)/2,yr,r.z0+h],[(r.x0+r.x1)/2,yr,r.z1-h]];
  const face=(pts,ua,dist)=>{
    const base=pos.length/3;for(const p of pts){pos.push(...p);uv.push(ua(p)/tile,dist(p)*sl/tile)}
    for(let i=1;i<pts.length-1;i++){const a=pts[0],b=pts[i],q=pts[i+1],ny=(b[2]-a[2])*(q[0]-a[0])-(b[0]-a[0])*(q[2]-a[2]);
      if(ny>0)idx.push(base,base+i,base+i+1);else idx.push(base,base+i+1,base+i)}
  };
  const north=p=>p[2]-r.z0,south=p=>r.z1-p[2],west=p=>p[0]-r.x0,east=p=>r.x1-p[0],ux=p=>p[0],uz=p=>p[2];
  if(W>=D){face([A,B,R2,R1],ux,north);face([Dd,C,R2,R1],ux,south);face([A,Dd,R1],uz,west);face([B,C,R2],uz,east)}
  else{face([A,Dd,R2,R1],uz,west);face([B,C,R2,R1],uz,east);face([A,B,R1],ux,north);face([Dd,C,R2],ux,south)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();return g;
}

/** Mahya ve kırma başlıkları: yalnız çatı birleşiminin gerçekten görünen sırtlarında (öteki çatının altında kalanlar atlanır). */
function roofCaps(plan,add){
  const {roofs,roofY,inRect}=plan,r0=0.13;
  const cyl=(p,q)=>{const v=new T.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]),len=v.length();if(len<0.05)return;
    const g=new T.CylinderGeometry(r0,r0,len,8,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));
    add('cap',g.translate((p[0]+q[0])/2,(p[1]+q[1])/2+0.03,(p[2]+q[2])/2))};
  roofs.forEach((r,ri)=>{
    const W=r.x1-r.x0,D=r.z1-r.z0,h=Math.min(W,D)/2,yr=r.y+h*r.k;
    const [R1,R2]=W>=D?[[r.x0+h,yr,(r.z0+r.z1)/2],[r.x1-h,yr,(r.z0+r.z1)/2]]:[[(r.x0+r.x1)/2,yr,r.z0+h],[(r.x0+r.x1)/2,yr,r.z1-h]];
    const A=[r.x0,r.y,r.z0],B=[r.x1,r.y,r.z0],C=[r.x1,r.y,r.z1],Dd=[r.x0,r.y,r.z1];
    const lines=[[R1,R2],...(W>=D?[[A,R1],[Dd,R1],[B,R2],[C,R2]]:[[A,R1],[B,R1],[Dd,R2],[C,R2]])];
    for(const [p,q] of lines){
      const N=48;let start=null;
      const at=t=>p.map((v,i)=>v+(q[i]-v)*t);
      const visible=t=>{const [a,,b]=at(t),own=roofY(r,a,b);return roofs.every((o,oi)=>oi===ri||!inRect(o,a,b)||roofY(o,a,b)<own-0.04)};
      for(let i=0;i<=N;i++){const t=i/N,v=visible(t);
        if(v&&start===null)start=t;
        if((!v||i===N)&&start!==null){const end=v?t:(i-1)/N;if(end>start)cyl(at(start),at(end));start=null}}
    }
  });
}

function mirrorX(g){
  g.scale(-1,1,1);const ix=g.index.array;
  for(let i=0;i<ix.length;i+=3){const t=ix[i+1];ix[i+1]=ix[i+2];ix[i+2]=t}
  g.index.needsUpdate=true;
}

/** Alaturka kiremit dokusu: sıra sıra yarım yuvarlak kiremit, sıra altında gölge, renk oynaması. 2.2 m'de bir tekrar. */
function tileTexture(hex,anisotropy){
  const S=512,cv=document.createElement('canvas');cv.width=cv.height=S;const g=cv.getContext('2d');
  const base=new T.Color(hex);let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const rgb=(c,f)=>`rgb(${Math.min(255,c.r*255*f)|0},${Math.min(255,c.g*255*f)|0},${Math.min(255,c.b*255*f)|0})`;
  g.fillStyle=rgb(base,0.66);g.fillRect(0,0,S,S);
  const rows=8,cols=11,rh=S/rows,cw=S/cols;   // çift sıra sayısı: dikişsiz tekrar
  for(let r=rows-1;r>=-1;r--){
    const y=r*rh,off=(r&1)*cw/2;
    for(let i=-1;i<=cols;i++){
      const x=i*cw+off,l=0.82+rnd()*0.3,col=base.clone().offsetHSL((rnd()-0.5)*0.025,(rnd()-0.5)*0.08,0);
      const gr=g.createLinearGradient(x,0,x+cw,0);
      gr.addColorStop(0,rgb(col,0.8*l));gr.addColorStop(0.35,rgb(col,1.1*l));gr.addColorStop(0.55,rgb(col,1.17*l));gr.addColorStop(1,rgb(col,0.76*l));
      g.fillStyle=gr;g.beginPath();g.roundRect(x+1.5,y-3,cw-3,rh+6,[2,2,cw*0.45,cw*0.45]);g.fill();
    }
    const sh=g.createLinearGradient(0,y+rh-2,0,y+rh+9);sh.addColorStop(0,'rgba(20,6,4,0.45)');sh.addColorStop(1,'rgba(20,6,4,0)');
    g.fillStyle=sh;g.fillRect(0,y+rh-2,S,11);
  }
  const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}

function signTexture(text,anisotropy){
  const cv=document.createElement('canvas');cv.width=2048;cv.height=140;const g=cv.getContext('2d');
  g.fillStyle='#1e2b46';g.fillRect(0,0,cv.width,cv.height);
  g.fillStyle='#ffffff';g.font='bold 92px "Segoe UI", Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.fillText(text,cv.width/2,cv.height/2+4,cv.width-80);
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}

/** Türk bayrağı (Türk Bayrağı Kanunu oranları), hafif dalgalanır. */
function createFlag(anisotropy){
  const G=256,cv=document.createElement('canvas');cv.width=G*1.5;cv.height=G;const g=cv.getContext('2d');
  g.fillStyle='#e30a17';g.fillRect(0,0,cv.width,cv.height);
  const circ=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()};
  circ(0.5*G,0.5*G,0.25*G,'#ffffff');circ(0.5625*G,0.5*G,0.2*G,'#e30a17');
  const sx=(0.3625+1/3+0.125)*G,sy=0.5*G,R=0.125*G,ri=R*0.382;g.fillStyle='#ffffff';g.beginPath();
  for(let i=0;i<10;i++){const a=Math.PI+i*Math.PI/5,rr=i&1?ri:R;g.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr)}g.closePath();g.fill();
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=anisotropy;
  const L=2.1,H=1.4,geo=new T.PlaneGeometry(L,H,14,4).translate(L/2,0,0);
  const m=new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:0.85});m.name='bilsem-flag';
  const mesh=new T.Mesh(geo,m);mesh.name='bilsem-flag';mesh.castShadow=true;
  const p=geo.attributes.position,x0=Float32Array.from({length:p.count},(_,i)=>p.getX(i));let t=0;
  return {mesh,update(dt){t+=dt;for(let i=0;i<p.count;i++){const x=x0[i];p.setZ(i,Math.sin(x*2.6-t*5.5)*0.13*(x/L)+Math.sin(x*1.3-t*3.1)*0.05*(x/L))}
    p.needsUpdate=true;geo.computeVertexNormals()}};
}
