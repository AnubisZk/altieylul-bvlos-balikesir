// Altıeylül BİLSEM ve Altıeylül Fen Lisesi binaları: MEB tip projesi, yordamsal model (kamelya Meshy'den kalır).
// Zafer Hoca'nın fotoğrafları (BİLSEM ön cephe ve avlu, 4 Kasım; Fen Lisesi ön, arka ve hava, 3 Kasım): dört kat ve
// yükseltilmiş zemin kat; batı ve doğu kanatları önde, ortadaki giriş bölümü 1.5 m geride; 2. ve 4. katta somon bant ve
// kiremit kırmızısı çerçeve; ortada cam saçaklı giriş, kapı üstünde logo şeridi, iki kat arasında okul tabelası; cephe
// boyunca teras, önünde geniş merdiven ve paslanmaz korkuluklar, doğu kanadı boyunca engelli rampası; doğu ucunda merdiven
// bloğu (ön yüzde tek çerçeveli pencereler, doğu yüzünde dikey cam şerit, arkada küçük kare WC pencereleri); arkada camlı
// merdiven kulesi; batı yüzü penceresiz; geniş saçaklı alçak kırma çatı. Ölçüler temsilidir; dış kutu Google uydu
// görüntüsünden ölçülen kutudur (bilsem.json → building). Renk ve yazılar data/bal/bilsem.json → style.
// Yerel çerçeve: +X bina ekseni (doğu), +Z ön cephe (güney), y = 0 bina tabanı (avlu düzeyi; bilsem.js yerleştirir).
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const STYLE_DEFAULTS={
  model:'tip-proje',endBlock:'east',floors:4,floorHeight:3.6,plinth:1.4,bandFloors:[1,3],
  wall:'#f1f0ec',trim:'#f7f6f3',plinthColor:'#d9cdb6',band:'#eab09c',bandFrame:'#c2614c',frame:'#4a525a',
  bandFrames:null,entranceFrame:null,endFrame:null,   // isteğe bağlı: katlara ({"1":"#..."}), giriş bölümüne, uç bloğa ayrı çerçeve rengi
  glass:'#3b4a57',curtain:'#5d8fb8',roof:'#c47a55',sign:'ALTIEYLÜL BİLİM VE SANAT MERKEZİ',signTop:'BALIKESİR - ALTIEYLÜL',flag:false,
  ramp:true,
};
const OVERHANG=1.0,END_WIDTH=8,WEST_WING=18.6,CENTER=11;

/** Plan: hacimler, çatılar, teras/merdiven/rampa, çarpışma yüksekliği (yerel metre). WebGL gerekmez; testler ve bilsem.js kullanır. */
export function binaPlan({hu,hv,height},style={}){
  const st={...STYLE_DEFAULTS,...style};
  const s=st.endBlock==='west'?-1:1;   // merdiven bloğu batıdaysa her şey x'te aynalanır
  const x0=-hu,x1=hu,xe=x1-END_WIDTH,ca0=x0+WEST_WING,ca1=ca0+CENTER,cd=(ca0+ca1)/2,o=OVERHANG;
  const fw=hv-1,fc=fw-1.5,fe=fw-0.8,bb=-hv+3.5,be=-hv;               // kanat önü, giriş önü, uç blok önü, gövde arkası, uç blok arkası
  const wallTop=st.plinth+st.floors*st.floorHeight+0.3;
  const k=Math.min(0.3,Math.max(0.18,(height-0.3-wallTop)/((fw-bb)/2+o)));
  const vols=[
    {name:'batı kanadı',x0,x1:ca0,z0:bb,z1:fw,top:wallTop},
    {name:'giriş bölümü',x0:ca0,x1:ca1,z0:bb,z1:fc,top:wallTop},
    {name:'doğu kanadı',x0:ca1,x1:xe,z0:bb,z1:fw,top:wallTop},
    {name:'uç blok',x0:xe,x1,z0:be,z1:fe,top:wallTop},
    {name:'merdiven kulesi',x0:cd-2,x1:cd+2,z0:bb-2.6,z1:bb,top:wallTop+1.5},
  ];
  // ana çatı bütün gövdeyi örter; uç blok çatısı arkaya taşan kısmını (iki kırma çatının birleşimi)
  const roofs=[{name:'ana çatı',x0:x0-o,x1:x1+o,z0:bb-o,z1:fw+o,y:wallTop,k},
    {name:'uç blok çatısı',x0:xe-o,x1:x1+o,z0:be-o,z1:fe+o,y:wallTop,k}];
  // teras (zemin kat düzeyi), önünde merdiven; rampa doğu kanadı boyunca doğuya iner
  const tY=st.plinth-0.05,tf=fw+2.2,steps=Math.max(3,Math.round(tY/0.175)),run=steps*0.32;
  const terrace={x0:x0+2.9,x1:ca1,z1:tf,top:tY},stair={x0:terrace.x0+0.2,x1:ca1-1.4,z0:tf,z1:tf+run,steps};
  const ramp=st.ramp?{x0:ca1,x1:ca1+19.5,z0:fw+0.15,z1:fw+2.15,top:tY}:null;
  const low=[{x0:terrace.x0,x1:terrace.x1,z0:fc,z1:tf,top:tY},{x0:stair.x0,x1:stair.x1,z0:tf,z1:tf+run,top:tY/2},
    ...(ramp?[{x0:ramp.x0,x1:ramp.x1,z0:ramp.z0,z1:ramp.z1,top:tY*0.55}]:[])];
  const roofY=(r,a,b)=>r.y+r.k*Math.min(a-r.x0,r.x1-a,b-r.z0,r.z1-b);
  const inRect=(r,a,b,m=0)=>a>=r.x0-m&&a<=r.x1+m&&b>=r.z0-m&&b<=r.z1+m;
  const pole={x:terrace.x0-0.8,z:tf+0.9,height:10};
  return {st,s,vols,roofs,terrace,stair,ramp,low,pole,roofY,inRect,
    dims:{x0,x1,xe,ca0,ca1,cd,fw,fc,fe,bb,be,wallTop,o,k},
    top:Math.max(...roofs.map(r=>r.y+r.k*Math.min(r.x1-r.x0,r.z1-r.z0)/2),wallTop+1.8),
    /** (a,b): bina eksenindeki yerel konum (a doğu, b ön). Tabandan yükseklik; bina dışında -Infinity. */
    heightAt(a,b){
      a*=s;let h=-Infinity;
      for(const r of roofs)if(inRect(r,a,b))h=Math.max(h,roofY(r,a,b));
      for(const v of vols)if(inRect(v,a,b))h=Math.max(h,v.top+(v.name==='merdiven kulesi'?0.3:0));
      for(const v of low)if(inRect(v,a,b))h=Math.max(h,v.top);
      return h;
    },
  };
}

/** Plan → three.js nesnesi. groundAt(a,b): zemin yüksekliği (taban = 0'a göre), bayrak direği için. */
export function createBinaObject(plan,{groundAt=()=>0,anisotropy=4}={}){
  const {st,dims:d}=plan,P={},ga=(x,z)=>groundAt(plan.s*x,z);   // plan x'i aynalı çerçeveye çevrilir
  const add=(key,g)=>{if(g.index){const n=g.toNonIndexed();g.dispose();g=n}(P[key]||(P[key]=[])).push(g)};
  const box=(key,ax,bx,ay,by,az,bz)=>{if(bx-ax>1e-4&&by-ay>1e-4&&bz-az>1e-4)add(key,new T.BoxGeometry(bx-ax,by-ay,bz-az).translate((ax+bx)/2,(ay+by)/2,(az+bz)/2))};
  const tube=(key,p,q,r=0.025)=>{const v=new T.Vector3(q[0]-p[0],q[1]-p[1],q[2]-p[2]),len=v.length();if(len<0.02)return;
    const g=new T.CylinderGeometry(r,r,len,6,1);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));
    add(key,g.translate((p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2))};
  // cephe: n ekseni ('x'/'z'), at düzlemi, dir dış yön; öğe u aralığı, y aralığı, düzlemden dışa d0..d1
  const onFace=(key,f,u0,u1,y0,y1,d0,d1)=>{const a=f.at+f.dir*d0,b=f.at+f.dir*d1,lo=Math.min(a,b),hi=Math.max(a,b);
    if(f.n==='z')box(key,u0,u1,y0,y1,lo,hi);else box(key,lo,hi,y0,y1,u0,u1)};
  const floorY=i=>st.plinth+i*st.floorHeight;
  const banded=i=>st.bandFloors.includes(i);
  const {x0,x1,xe,ca0,ca1,cd,fw,fc,fe,bb,be,wallTop}=d;

  function windowAt(f,u,y,w,h,{mull=2,glass='glass',frame='frame'}={}){
    onFace(frame,f,u-w/2,u+w/2,y,y+h,-0.02,0.07);
    onFace(glass,f,u-w/2+0.07,u+w/2-0.07,y+0.07,y+h-0.07,0.05,0.06);
    for(let i=1;i<mull;i++){const x=u-w/2+w*i/mull;onFace(frame,f,x-0.035,x+0.035,y,y+h,0.05,0.09)}
    if(h>1.2)onFace(frame,f,u-w/2,u+w/2,y+h*0.76-0.035,y+h*0.76+0.035,0.05,0.09);   // vasistas kaydı
    onFace('sill',f,u-w/2-0.06,u+w/2+0.06,y-0.06,y,-0.02,0.12);
  }
  const frameKey=c=>c?'bf'+c:'bandFrame';
  function band(f,u0,u1,y0,y1,color){const t=0.2,dd=0.1,k=frameKey(color);
    onFace('bandFill',f,u0,u1,y0,y1,0,0.03);
    onFace(k,f,u0-t,u1+t,y1,y1+t,0,dd);onFace(k,f,u0-t,u1+t,y0-t,y0,0,dd);
    onFace(k,f,u0-t,u0,y0,y1,0,dd);onFace(k,f,u1,u1+t,y0,y1,0,dd);
  }
  /** Bölmede n pencere (gruplar: pair = ikişer); bant katlarında çerçeveli şerit. */
  function bay(f,u0,u1,n,w,{floors=[0,1,2,3],bands=true,h=1.65,sill=0.95,gap=0.7,pair=0,mull=2,frameColor=null,single=false}={}){
    const pos=[];
    if(pair){const g=n/2,gw=2*w+gap,step=(u1-u0)/g;for(let k=0;k<g;k++){const c=u0+step*(k+0.5);pos.push(c-gw/2+w/2,c+gw/2-w/2)}}
    else{const gw=n*w+(n-1)*gap,g0=(u0+u1)/2-gw/2;for(let j=0;j<n;j++)pos.push(g0+w/2+j*(w+gap))}
    for(const i of floors){if(i>=st.floors)continue;const y=floorY(i)+sill,color=frameColor||st.bandFrames?.[i]||null;
      if(bands&&banded(i)){if(single)for(const u of pos)band(f,u-w/2-0.35,u+w/2+0.35,y-0.4,y+h+0.4,color);
        else band(f,Math.min(...pos)-w/2-0.55,Math.max(...pos)+w/2+0.55,y-0.4,y+h+0.4,color)}
      for(const u of pos)windowAt(f,u,y,w,h,{mull})}
  }
  const smallWindows=(f,us)=>{for(let i=0;i<st.floors;i++)for(const u of us)windowAt(f,u,floorY(i)+2.0,0.62,0.62,{mull:1})};
  const pipe=(f,u)=>{onFace('pipe',f,u-0.06,u+0.06,0.2,wallTop-0.25,0.03,0.15)};
  function curtain(f,u0,u1,y0,y1,dv,dh,frame='frame'){
    onFace('curtain',f,u0,u1,y0,y1,0,0.04);
    onFace(frame,f,u0-0.2,u1+0.2,y0-0.2,y1+0.2,-0.02,0.03);
    for(let u=u0;u<=u1+1e-6;u+=(u1-u0)/Math.max(1,Math.round((u1-u0)/dv)))onFace('frame',f,u-0.035,u+0.035,y0,y1,0.04,0.09);
    for(let y=y0;y<=y1+1e-6;y+=(y1-y0)/Math.max(1,Math.round((y1-y0)/dh)))onFace('frame',f,u0,u1,y-0.035,y+0.035,0.04,0.09);
  }

  // gövde ve subasman (taş kaplama; eğimli zeminde alt kısım gömülür)
  for(const v of plan.vols){
    box('plinth',v.x0-0.05,v.x1+0.05,-3,st.plinth,v.z0-0.05,v.z1+0.05);
    box('wall',v.x0,v.x1,st.plinth,v.top,v.z0,v.z1);
  }
  // ön cephe
  const W={n:'z',at:fw,dir:1},C={n:'z',at:fc,dir:1},E={n:'z',at:fw,dir:1},EB={n:'z',at:fe,dir:1};
  bay(W,x0+0.6,ca0-0.6,6,1.35,{pair:1,gap:0.45});
  bay(C,ca0+0.5,ca1-0.5,4,1.3,{floors:[1,2,3],gap:1.0,frameColor:st.entranceFrame});
  bay(E,ca1+0.6,xe-0.6,4,2.6,{mull:3,gap:1.6});
  for(let i=0;i<st.floors;i++)if(!banded(i)&&i>0){}   // (doğu kanadı zemin katı aşağıda: geniş pencereler)
  bay(EB,xe+0.6,x1-0.6,1,1.6,{single:true,frameColor:st.endFrame});
  for(const [f,u] of [[W,x0+0.3],[W,ca0-0.25],[E,ca1+0.25],[E,xe-0.25],[EB,x1-0.3]])pipe(f,u);
  // giriş: üç çift cam kapı, üstünde logo şeridi; yanlarda dar pencere; cam saçak ve gergi çubukları
  const doorY=st.plinth;
  onFace('alu',C,cd-3.1,cd+3.1,doorY,doorY+3.35,-0.02,0.06);
  onFace('glassDoor',C,cd-3.0,cd+3.0,doorY,doorY+2.35,0.06,0.07);
  for(const u of [cd-3,cd-2,cd-1,cd,cd+1,cd+2,cd+3])onFace('alu',C,u-0.04,u+0.04,doorY,doorY+2.35,0.06,0.1);
  onFace('alu',C,cd-3.1,cd+3.1,doorY+2.33,doorY+2.43,0.06,0.1);
  for(const u of [ca0+1.6,ca1-1.6])windowAt(C,u,floorY(0)+0.95,1.1,1.65,{mull:1});
  const cy=doorY+3.45,cz=fc+1.9;
  box('alu',cd-3.7,cd+3.7,cy,cy+0.12,fc,fc+0.12);box('alu',cd-3.7,cd+3.7,cy,cy+0.1,cz-0.1,cz);
  for(const u of [cd-3.7,cd-1.2,cd+1.2,cd+3.7])box('alu',u-0.05,u+0.05,cy,cy+0.1,fc,cz);
  box('canopyGlass',cd-3.65,cd+3.65,cy+0.1,cy+0.13,fc+0.05,cz-0.05);
  for(let k=0;k<6;k++){const u=cd-3.3+k*1.32;tube('steel',[u,cy+0.12,cz-0.08],[u,cy+1.75,fc+0.02],0.018)}
  // ikinci katta klima dış ünitesi
  box('ac',cd-1.9,cd-1.1,floorY(1)+1.5,floorY(1)+2.05,fc,fc+0.3);
  // doğu kanadı zemin katı: geniş, jaluzili pencereler; doğu yüzünde dikey cam şerit ve sarı levha
  const Ex={n:'x',at:x1,dir:1};
  curtain(Ex,fe-4.6,fe-2.4,floorY(1)-0.3,wallTop-0.6,1.1,1.2,frameKey(st.endFrame));
  onFace('yellowSign',Ex,fe-1.6,fe-0.6,floorY(0)+0.9,floorY(0)+1.7,0,0.04);
  for(const u of [be+4,be+10])bay(Ex,u-0.8,u+0.8,1,1.2,{bands:false,floors:[0,1,2,3]});
  // uç bloğun arkaya taşan batı yüzü ve arka yüzü: küçük kare WC pencereleri
  smallWindows({n:'x',at:xe,dir:-1},[(be+bb)/2]);
  smallWindows({n:'z',at:be,dir:-1},[xe+2.2,x1-2.2]);
  // arka cephe: bölmeler, camlı merdiven kulesi
  const B={n:'z',at:bb,dir:-1};
  for(const [u0,u1,n,w] of [[x0,ca0,6,1.35],[ca0,cd-2,1,1.3],[cd+2,ca1,1,1.3],[ca1,xe,4,2.0]])bay(B,u0+0.6,u1-0.6,n,w,{pair:n===6?1:0,gap:0.6});
  for(const u of [x0+0.3,ca0,ca1,xe-0.3])pipe(B,u);
  const tower=plan.vols[4];
  curtain({n:'z',at:tower.z0,dir:-1},cd-1.7,cd+1.7,st.plinth+0.25,tower.top-0.45,0.85,st.floorHeight/2);
  box('slab',cd-2.35,cd+2.35,tower.top,tower.top+0.32,tower.z0-0.35,tower.z1+0.2);
  box('edge',cd-2.4,cd+2.4,tower.top+0.32,tower.top+0.4,tower.z0-0.4,tower.z1+0.25);
  // batı yüzü penceresiz (büyük duvar); yalnız yağmur inişi
  pipe({n:'x',at:x0,dir:-1},fw-0.4);pipe({n:'x',at:x0,dir:-1},bb+0.4);

  // teras, merdiven, korkuluklar, rampa
  const t=plan.terrace,sr=plan.stair;
  box('stone',t.x0,t.x1,-1.2,t.top,fc,t.z1);box('stone',t.x0,t.x1-CENTER+0.01,-1.2,t.top,fw-0.01,t.z1);
  box('stoneTop',t.x0,t.x1,t.top,t.top+0.05,fw,t.z1);box('stoneTop',ca0,ca1,t.top,t.top+0.05,fc,fw);
  box('stone',t.x0-0.25,t.x0+0.05,-1.2,t.top+0.5,fw,t.z1+0.05);                       // batı ucu alçak duvar
  for(let i=0;i<sr.steps;i++){const y=t.top*(1-(i+1)/sr.steps);box('stone',sr.x0,sr.x1,-1.2,y,sr.z0+i*0.32,sr.z0+(i+1)*0.32)}
  const railX=[];for(let k=0;k<=5;k++)railX.push(sr.x0+0.3+(sr.x1-sr.x0-0.6)*k/5);
  for(const x of railX){const pA=[x,t.top+0.9,sr.z0-0.4],pB=[x,0.9,sr.z1+0.2];tube('steel',pA,pB,0.025);tube('steel',[x,t.top+0.45,sr.z0-0.4],[x,0.45,sr.z1+0.2],0.015);
    for(let q=0;q<=3;q++){const f=q/3,p=[x,t.top*(1-f)+0.0,sr.z0-0.4+(sr.z1+0.6-sr.z0)*f];tube('steel',[p[0],p[1]-(q===3?0:0),p[2]],[p[0],p[1]+0.9,p[2]],0.022)}}
  if(plan.ramp){const r=plan.ramp,len=r.x1-r.x0,sl=Math.atan2(r.top,len);
    const slab=new T.BoxGeometry(Math.hypot(len,r.top),0.22,r.z1-r.z0).rotateZ(-sl).translate((r.x0+r.x1)/2,r.top/2-0.11,(r.z0+r.z1)/2);add('stoneTop',slab);
    const wall=new T.BoxGeometry(Math.hypot(len,r.top),r.top+1.2,0.18).rotateZ(-sl);add('stone',wall.translate((r.x0+r.x1)/2,r.top/2-0.6-0.1,r.z1+0.09));
    for(const z of [r.z0+0.06,r.z1-0.06,(r.z0+r.z1)/2]){tube('steel',[r.x0,r.top+0.9,z],[r.x1,0.9,z],0.025);tube('steel',[r.x0,r.top+0.7,z],[r.x1,0.7,z],0.018);
      for(let k=0;k<=13;k++){const x=r.x0+len*k/13,y=r.top*(1-k/13);tube('steel',[x,y,z],[x,y+0.9,z],0.022)}}
    box('stone',r.x1-0.1,r.x1+2.0,-0.3,0.06,r.z0,r.z1);}
  // tabela: ikinci kat bandının üstünde, giriş bölümünde
  const signY=floorY(2)-0.15;

  // çatı: saçak altı tablası (beyaz), koyu kenar, kırma çatı yüzleri, mahya
  plan.roofs.forEach((r,ri)=>{
    const e=0.07;
    box('slab',r.x0,r.x1,r.y-0.3,r.y,r.z0,r.z1);
    box('edge',r.x0-e,r.x1+e,r.y-0.03,r.y+0.09,r.z0-e,r.z0+0.1);box('edge',r.x0-e,r.x1+e,r.y-0.03,r.y+0.09,r.z1-0.1,r.z1+e);
    box('edge',r.x0-e,r.x0+0.1,r.y-0.03,r.y+0.09,r.z0-e,r.z1+e);box('edge',r.x1-0.1,r.x1+e,r.y-0.03,r.y+0.09,r.z0-e,r.z1+e);
    add('roof',hipRoof(r,2.2));
  });
  roofCaps(plan,add);
  for(const u of [cd-9,cd+14]){const z=bb+3.2,y=plan.roofY(plan.roofs[0],u,z);
    box('trim',u-0.45,u+0.45,y-0.6,y+1.25,z-0.35,z+0.35);box('frame',u-0.55,u+0.55,y+1.25,y+1.37,z-0.45,z+0.45)}

  // bayrak direği (isteğe bağlı; BİLSEM'de bayrak Atatürk köşesinde, bilsem-bahce.js)
  const pole=plan.pole,pg=ga(pole.x,pole.z);
  if(st.flag){
    add('steel',new T.CylinderGeometry(0.05,0.08,pole.height,10).translate(pole.x,pg+pole.height/2,pole.z));
    add('stone',new T.CylinderGeometry(0.5,0.6,0.3,16).translate(pole.x,pg+0.1,pole.z));
    add('steel',new T.SphereGeometry(0.1,12,8).translate(pole.x,pg+pole.height+0.07,pole.z));
  }

  const tex=tileTexture(st.roof,anisotropy);
  const mat=(name,o)=>{const m=new T.MeshStandardMaterial(o);m.name='bilsem-'+name;return m};
  const mats={
    wall:mat('wall',{color:st.wall,roughness:0.93}),trim:mat('trim',{color:st.trim,roughness:0.88}),
    plinth:mat('plinth',{color:st.plinthColor,roughness:0.85}),stone:mat('stone',{color:'#c9c1b2',roughness:0.92}),stoneTop:mat('stone-top',{color:'#b9ada0',roughness:0.9}),
    bandFill:mat('band',{color:st.band,roughness:0.9}),bandFrame:mat('band-frame',{color:st.bandFrame,roughness:0.8}),
    frame:mat('frame',{color:st.frame,roughness:0.55,metalness:0.25}),sill:mat('sill',{color:'#dedad1',roughness:0.85}),
    glass:mat('glass',{color:st.glass,roughness:0.08,metalness:0.45}),curtain:mat('curtain',{color:st.curtain,roughness:0.06,metalness:0.4}),
    glassDoor:mat('glass-door',{color:'#25313b',roughness:0.1,metalness:0.4}),alu:mat('alu',{color:'#55595c',roughness:0.45,metalness:0.6}),
    canopyGlass:mat('canopy-glass',{color:'#cfe3ea',roughness:0.05,metalness:0.2,transparent:true,opacity:0.45}),
    slab:mat('fascia',{color:'#f5f4f0',roughness:0.85}),edge:mat('roof-edge',{color:'#6b2a24',roughness:0.7}),
    roof:mat('roof',{map:tex,roughness:0.8}),cap:mat('ridge',{color:'#a54c30',roughness:0.78}),
    steel:mat('steel',{color:'#d3d7da',roughness:0.25,metalness:0.85}),pipe:mat('pipe',{color:'#f1f1ee',roughness:0.6,metalness:0.1}),
    ac:mat('ac',{color:'#e9e9e6',roughness:0.6}),yellowSign:mat('yellow-sign',{color:'#e3d34a',roughness:0.6}),
  };
  const object=new T.Group();object.name='bilsem-bina';
  for(const [key,list] of Object.entries(P)){
    const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());
    if(plan.s<0)mirrorX(g);
    const m=mats[key]||(key.startsWith('bf')?mat('band-frame',{color:key.slice(2),roughness:0.8}):mats.wall);
    const mesh=new T.Mesh(g,m);mesh.name='bilsem-'+key;mesh.castShadow=!m.transparent;mesh.receiveShadow=true;object.add(mesh);
  }
  // tabela ve kapı üstü logo şeridi (aynalanmaz; konumu aynalanır)
  const sign=new T.Mesh(new T.PlaneGeometry(6.6,1.0),mat('sign',{map:signTexture(st,anisotropy),roughness:0.5}));
  sign.position.set(plan.s*cd,signY,fc+0.09);object.add(sign);
  const logos=new T.Mesh(new T.PlaneGeometry(6.0,0.88),mat('logo-band',{map:logoBandTexture(anisotropy),roughness:0.5}));
  logos.position.set(plan.s*cd,doorY+2.88,fc+0.07);object.add(logos);
  let flag=null;
  if(st.flag){flag=createFlag(anisotropy);flag.mesh.position.set(plan.s*pole.x+0.07,pg+pole.height-0.85,pole.z);object.add(flag.mesh)}
  return {object,update(dt){flag?.update(dt)}};
}

/** Kırma çatı: dikdörtgen + saçak, eğim k; her yüz ayrı köşeli, UV metre cinsinden (kiremit dokusu). */
export function hipRoof(r,tile){
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
export function tileTexture(hex,anisotropy){
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

function signTexture(st,anisotropy){
  const cv=document.createElement('canvas');cv.width=1320;cv.height=200;const g=cv.getContext('2d');
  g.fillStyle='#ffffff';g.beginPath();g.roundRect(4,4,1312,192,28);g.fill();
  g.strokeStyle='#5fbcb0';g.lineWidth=12;g.beginPath();g.roundRect(8,8,1304,184,26);g.stroke();
  g.strokeStyle='#c9433b';g.lineWidth=7;g.beginPath();g.arc(100,100,60,0,Math.PI*2);g.stroke();   // temsili amblem
  g.fillStyle='#c9433b';g.beginPath();g.arc(100,100,22,0,Math.PI*2);g.fill();
  g.fillStyle='#2b3a55';g.textAlign='center';g.textBaseline='middle';
  g.font='600 30px "Segoe UI", Arial, sans-serif';g.fillText(st.signTop||'',700,52,900);
  g.font='bold 62px "Segoe UI", Arial, sans-serif';g.fillText(st.sign,720,122,1080);
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}
/** Kapı üstündeki proje/kurum levhaları: temsili renkli kutular (logo değil). */
function logoBandTexture(anisotropy){
  const cv=document.createElement('canvas');cv.width=1200;cv.height=176;const g=cv.getContext('2d');
  g.fillStyle='#3c4044';g.fillRect(0,0,1200,176);
  const C=['#2a5ba8','#d8402f','#1f8a5a','#e6a020','#6b4aa0','#1b9cc9','#c22f6b','#2d6e3e'];
  for(let i=0;i<8;i++){const x=8+i*148;g.fillStyle='#f4f4f2';g.fillRect(x,8,140,160);g.fillStyle=C[i];
    if(i%3===0){g.beginPath();g.arc(x+70,78,34,0,Math.PI*2);g.fill()}else if(i%3===1)g.fillRect(x+36,44,68,68);else{g.beginPath();g.moveTo(x+70,36);g.lineTo(x+110,112);g.lineTo(x+30,112);g.fill()}
    g.fillStyle='#55595c';g.fillRect(x+30,130,80,10)}
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}

/** Türk bayrağı (Türk Bayrağı Kanunu oranları), hafif dalgalanır. */
export function createFlag(anisotropy,{L=2.1,H=1.4}={}){
  const G=256,cv=document.createElement('canvas');cv.width=G*1.5;cv.height=G;const g=cv.getContext('2d');
  g.fillStyle='#e30a17';g.fillRect(0,0,cv.width,cv.height);
  const circ=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()};
  circ(0.5*G,0.5*G,0.25*G,'#ffffff');circ(0.5625*G,0.5*G,0.2*G,'#e30a17');
  const sx=(0.3625+1/3+0.125)*G,sy=0.5*G,R=0.125*G,ri=R*0.382;g.fillStyle='#ffffff';g.beginPath();
  for(let i=0;i<10;i++){const a=Math.PI+i*Math.PI/5,rr=i&1?ri:R;g.lineTo(sx+Math.cos(a)*rr,sy+Math.sin(a)*rr)}g.closePath();g.fill();
  const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=anisotropy;
  const geo=new T.PlaneGeometry(L,H,14,4).translate(L/2,0,0);
  const m=new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:0.85});m.name='bilsem-flag';
  const mesh=new T.Mesh(geo,m);mesh.name='bilsem-flag';mesh.castShadow=true;
  const p=geo.attributes.position,x0=Float32Array.from({length:p.count},(_,i)=>p.getX(i));let t=0;
  return {mesh,update(dt){t+=dt;for(let i=0;i<p.count;i++){const x=x0[i];p.setZ(i,Math.sin(x*2.6-t*5.5)*0.13*(x/L)+Math.sin(x*1.3-t*3.1)*0.05*(x/L))}
    p.needsUpdate=true;geo.computeVertexNormals()}};
}
