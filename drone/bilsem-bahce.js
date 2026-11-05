// BİLSEM bahçesi ve Fen Lisesi avlusu (data/bal/bilsem.json → bahce, fenLisesi.avlu).
// Okulun koruma alanı (Google ağının atıldığı dikdörtgen) bahçenin tamamını kapsar: Google ağı okul binasını arazide
// kabarık bir tümsek olarak verir ve tümseğin eteği (kaymış çatı fotoğrafıyla) cephenin önünde havada asılı kalıyordu.
// Alanın içinde zemin bizim: arazi ağının üçgenlerine birebir oturan kaplama (surface), 4 cm yukarıda + polygonOffset.
// BİLSEM (Zafer Hoca'nın avlu fotoğrafları, 4 Kasım): yamaca oyulmuş düz beton avlu; güneyde boyası dökülen sarı, batıda
// gri beton istinat duvarı (üstlerinde demir parmaklık ve tel çit); duvar diplerinde bordür taşlı çim şeritler, çimde
// küçük köknarlar, genç ağaçlar, köşede büyük ağaç, sarmaşık; çim kenarında koyu banklar ve çöp kutuları; uzun aydınlatma
// direkleri; batıda kamelya (Meshy, yeri değişmez), beyaz konteyner, taş blok, duvar dibinde beyaz pano; meydanda rögar
// kapakları, merdivene giden hissedilebilir yüzey; doğuda turuncu dubalar. Atatürk köşesi merdivenin batı ucunda
// (Zafer Hoca'nın fotoğrafları): siyah, yukarı daralan kaide, önünde altın "NE MUTLU TÜRKÜM
// DİYENE", altın büst, girişe yakın yanında paslanmaz bayrak direği. Büst temsilidir (genel büst biçimi, portre değil).
// Fen Lisesi: binanın çevresi beton avlu.
// Yerel çerçeve okulunki: a bina ekseni (doğu), b ön (güney); nesneler bina merkezinde yaw ile dönen bir gruptadır.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createFlag} from './bilsem-bina.js';

/** Bölge dikdörtgeni (yerel): a ∈ [a0,a1], b ∈ [b0,b1]. z: {a0,a1,b0,b1} ya da binadan {side,back,front} metre. */
export function yardZone({hu,hv},z={}){
  if(Number.isFinite(z.a0))return {a0:z.a0,a1:z.a1,b0:z.b0,b1:z.b1};
  const side=z.side??8,back=z.back??8,front=z.front??8;
  return {a0:-hu-side,a1:hu+side,b0:-hv-back,b1:hv+front};
}

/** Yerel bölge → koruma alanı ({c,u,h}, keep-zone.js). */
export function zoneKeep(zone,world,u){
  const c=world((zone.a0+zone.a1)/2,(zone.b0+zone.b1)/2);
  return {c:[c.x,c.z],u,h:[(zone.a1-zone.a0)/2,(zone.b1-zone.b0)/2],hole:true};
}

/** Bahçe nesneleri (yerel) → çarpışma silindirleri (dünya). Model yüklemeden hesaplanır (test edilebilir). */
export function yardObstacles(spec,world){
  const out=[];
  for(const [a,b,h] of spec?.pines||[])out.push({...world(a,b),r:0.3*h,h,name:'çam fidanı'});
  for(const [a,b,h=2] of spec?.firs||[])out.push({...world(a,b),r:0.32*h,h,name:'köknar fidanı'});
  for(const [a,b,h=3.4] of spec?.saplings||[])out.push({...world(a,b),r:0.6,h,name:'ağaç'});
  for(const [a,b,h=6] of spec?.trees||[])out.push({...world(a,b),r:0.45*h,h,name:'ağaç'});
  for(const [a,b] of spec?.lamps||[])out.push({...world(a,b),r:0.2,h:LAMP_H+0.2,name:'aydınlatma direği'});
  if(spec?.container)out.push({...world(spec.container[0],spec.container[1]),r:1.5,h:2.6,name:'konteyner'});
  const at=spec?.ataturk?.at;
  if(at){out.push({...world(at[0],at[1]),r:0.55,h:2.1,name:'Atatürk büstü'});
    for(const [pa,pb] of ataturkPoles(spec.ataturk))out.push({...world(pa,pb),r:0.1,h:POLE_H+0.1,name:'bayrak direği'})}
  return out;
}
const POLE_H=6,LAMP_H=7.5;
/** Büstün yanındaki bayrak direkleri: poles = ["east"] (girişe yakın yan, BİLSEM), ["west","east"] ya da []. */
const ataturkPoles=({at,poles=['east']})=>poles.map(side=>[at[0]+(side==='west'?-1.05:1.05),at[1]-0.05]);

/**
 * Okul bahçesi/avlusu. surface(x,z): arazi ağının yüksekliği; world(a,b) → {x,z}; yaw/center: bina grubu;
 * inBuilding(a,b): bina hacmi içinde mi (kaplama orada atlanır). kind: 'bahce' (BİLSEM) | 'avlu' (beton).
 */
export function createYard({kind,zone,spec={},world,center,yaw,surface,inBuilding=()=>false,anisotropy=4}){
  const group=new T.Group();group.name=kind==='bahce'?'bilsem-bahce':'okul-avlu';
  group.position.set(center.x,0,center.z);group.rotation.y=yaw;
  const ground=(a,b)=>{const p=world(a,b);return surface(p.x,p.z)};
  const mats={
    pave:groundMat('pave',paveTexture(spec.paveTone||(kind==='avlu'?'beton':'tas'),anisotropy),spec.paveTile||(kind==='avlu'?3.2:2.4)),
    lawn:groundMat('lawn',lawnTexture(anisotropy),4),
  };
  // zemin kaplaması: 1 m hücreler, köşe yükseklikleri arazi üçgenlerinden
  const plaza=spec.plaza||[];
  const inR=(r,a,b)=>a>=r[0]&&a<=r[1]&&b>=r[2]&&b<=r[3];
  const cls=(a,b)=>{if(inBuilding(a,b))return null;if(kind==='avlu')return 'pave';
    if(spec.lawn)return spec.lawn.some(r=>inR(r,a,b))?'lawn':'pave';
    return plaza.some(r=>inR(r,a,b))?'pave':'lawn'};
  const cs=spec.cell||1,na=Math.ceil((zone.a1-zone.a0)/cs),nb=Math.ceil((zone.b1-zone.b0)/cs),lift=0.04;
  const A=i=>Math.min(zone.a0+i*cs,zone.a1),Bv=j=>Math.min(zone.b0+j*cs,zone.b1);
  const H=new Float32Array((na+1)*(nb+1));
  for(let j=0;j<=nb;j++)for(let i=0;i<=na;i++)H[j*(na+1)+i]=ground(A(i),Bv(j))+lift;
  const buf={pave:[],lawn:[],skirt:[]};
  for(let j=0;j<nb;j++)for(let i=0;i<na;i++){
    const k=cls((A(i)+A(i+1))/2,(Bv(j)+Bv(j+1))/2);if(!k)continue;
    const v=(di,dj)=>[A(i+di),H[(j+dj)*(na+1)+i+di],Bv(j+dj)];
    buf[k].push(...v(0,0),...v(0,1),...v(1,0),...v(0,1),...v(1,1),...v(1,0));
  }
  // etek: açık kenarlarda kaplamanın kenarından 4 m aşağı düşey şerit (Google zemini alçaksa kenar havada kalmasın)
  const skirt=(pts)=>{for(let n=0;n<pts.length-1;n++){const [a0,h0,b0]=pts[n],[a1,h1,b1]=pts[n+1];
    buf.skirt.push(a0,h0,b0,a1,h1,b1,a1,h1-4,b1,a0,h0,b0,a1,h1-4,b1,a0,h0-4,b0)}};
  const side=(name,list)=>{if((spec.skirt||[]).includes(name))skirt(list)};
  side('north',Array.from({length:na+1},(_,i)=>[A(na-i),H[na-i],Bv(0)]));
  side('south',Array.from({length:na+1},(_,i)=>[A(i),H[nb*(na+1)+i],Bv(nb)]));
  side('west',Array.from({length:nb+1},(_,j)=>[A(0),H[j*(na+1)],Bv(j)]));
  side('east',Array.from({length:nb+1},(_,j)=>[A(na),H[(nb-j)*(na+1)+na],Bv(nb-j)]));
  mats.skirt=new T.MeshStandardMaterial({color:kind==='avlu'?'#8f8a80':'#857c68',roughness:0.95,side:T.DoubleSide});mats.skirt.name='okul-zemin-etek';mats.skirt.userData.tile=4;
  for(const [k,arr] of Object.entries(buf)){
    if(!arr.length)continue;
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(arr,3));
    const uv=new Float32Array(arr.length/3*2),sc=mats[k].userData.tile;
    for(let n=0;n<arr.length/3;n++){uv[n*2]=arr[n*3]/sc;uv[n*2+1]=arr[n*3+2]/sc}
    g.setAttribute('uv',new T.BufferAttribute(uv,2));g.computeVertexNormals();
    const mesh=new T.Mesh(g,mats[k]);mesh.receiveShadow=true;mesh.name='okul-zemin-'+k;group.add(mesh);
  }
  if(kind!=='bahce')return {object:group,update(){}};

  // çam fidanları, genç ağaçlar, banklar, Atatürk köşesi (yerel çerçevede, birleştirilmiş geometri)
  const P={};const add=(key,g,a,y,b,rot=0)=>{if(rot)g.rotateY(rot);g.translate(a,y,b);(P[key]||(P[key]=[])).push(g)};
  for(const [a,b,h] of spec.pines||[]){const y=ground(a,b);
    add('bark',new T.CylinderGeometry(0.05*h/3,0.08*h/3,0.35*h,7),a,y+0.175*h,b);
    for(const [r,hh,y0] of [[0.34,0.5,0.22],[0.26,0.42,0.45],[0.16,0.34,0.66]])add('pine',new T.ConeGeometry(r*h,hh*h,9),a,y+(y0+hh/2)*h,b,(a*7+b)%3);
  }
  for(const [a,b,h=3.2,leaf='yesil'] of spec.saplings||[]){const y=ground(a,b),sd=Math.abs(Math.sin(a*12.9+b*7.1));
    add('bark',new T.CylinderGeometry(0.03,0.055,h,6),a,y+h/2,b);
    for(let i=0;i<5;i++){const g=new T.CylinderGeometry(0.01,0.02,0.9+0.3*((i+sd*5)%2),5);g.rotateZ(0.55+0.1*i);g.translate(0.38,0,0);add('bark',g,a,y+h*0.55+i*h*0.09,b,i*1.9+sd*3)}
    if(leaf)for(let i=0;i<3;i++)add(leaf==='sari'?'leafYellow':'leaf',new T.IcosahedronGeometry(0.42+0.12*i,0).scale(1,1.2,1),a+Math.cos(i*2.1+sd)*0.35,y+h*0.82+i*0.25,b+Math.sin(i*2.1+sd)*0.35);
  }
  for(const [a,b,h=2] of spec.firs||[]){const y=ground(a,b);
    add('bark',new T.CylinderGeometry(0.03,0.05,0.4,6),a,y+0.2,b);
    for(const [r,hh,y0] of [[0.38,0.45,0.12],[0.3,0.4,0.38],[0.2,0.34,0.62]])add('fir',new T.ConeGeometry(r*h,hh*h,8),a,y+(y0+hh/2)*h,b,(a*3+b)%2);
  }
  for(const [a,b,h=6] of spec.trees||[]){const y=ground(a,b);
    add('bark',new T.CylinderGeometry(0.12,0.2,h*0.6,8),a,y+h*0.3,b);
    for(const [da,db,dy,r,k] of [[0,0,0.72,0.34,'treeA'],[0.9,0.5,0.62,0.26,'treeB'],[-0.8,-0.4,0.66,0.27,'treeA'],[0.2,-0.9,0.82,0.22,'treeB']])
      add(k,new T.IcosahedronGeometry(r*h,1).scale(1,0.85,1),a+da*h*0.25,y+dy*h,b+db*h*0.25);
  }
  for(const [a,b,deg=0] of spec.benches||[]){const y=ground(a,b),r=-deg*Math.PI/180;
    const part=(key,w,h,d,x,yy,z,tilt=0)=>{const g=new T.BoxGeometry(w,h,d);if(tilt)g.rotateX(tilt);g.translate(x,yy,z);add(key,g,a,y,b,r)};
    for(const z of [-0.15,0,0.15])part('wood',1.75,0.04,0.11,0,0.44,z);
    for(const yy of [0.6,0.74,0.88])part('wood',1.75,0.11,0.035,0,yy,-0.23-(yy-0.6)*0.18,0.18);
    for(const x of [-0.78,0.78]){part('iron',0.06,0.42,0.06,x,0.21,0.17);part('iron',0.06,0.95,0.06,x,0.47,-0.22,0.18);part('iron',0.06,0.05,0.48,x,0.42,0);part('iron',0.06,0.04,0.36,x,0.64,-0.02)}
  }
  for(const [a,b] of spec.bins||[]){const y=ground(a,b);add('binBody',new T.CylinderGeometry(0.2,0.18,0.72,12),a,y+0.36,b);add('iron',new T.CylinderGeometry(0.22,0.22,0.05,12),a,y+0.74,b)}
  for(const [a,b,deg=0] of spec.lamps||[]){const y=ground(a,b),r=deg*Math.PI/180,dx=Math.sin(r),dz=Math.cos(r);
    add('lampPole',new T.BoxGeometry(0.3,0.5,0.3),a,y+0.25,b);add('lampPole',new T.CylinderGeometry(0.055,0.09,LAMP_H,8),a,y+LAMP_H/2,b);
    const arm=new T.CylinderGeometry(0.035,0.035,1.3,6);arm.rotateZ(Math.PI/2-0.2);arm.rotateY(-r+Math.PI/2);add('lampPole',arm,a+dx*0.6,y+LAMP_H+0.1,b+dz*0.6);
    const head=new T.BoxGeometry(0.22,0.08,0.55);head.rotateY(-r);add('lampHead',head,a+dx*1.25,y+LAMP_H+0.2,b+dz*1.25);
  }
  if(spec.container){const [a,b,deg=0]=spec.container,y=ground(a,b),r=-deg*Math.PI/180;
    const g=new T.BoxGeometry(2.45,2.55,2.1);g.translate(0,1.28,0);add('container',g,a,y,b,r);
    for(const x of [-1.2,1.2])for(const z of [-1.03,1.03]){const c=new T.BoxGeometry(0.1,2.58,0.1);c.translate(x,1.29,z);add('containerFrame',c,a,y,b,r)}}
  if(spec.stone){const [a,b]=spec.stone,y=ground(a,b);add('beige',new T.BoxGeometry(1.4,1.05,0.65),a,y+0.52,b);add('beigeDark',new T.BoxGeometry(1.5,0.1,0.75),a,y+0.05,b)}
  if(spec.panel){const [a,b,len=5]=spec.panel,y=ground(a,b);add('whitePanel',new T.BoxGeometry(0.16,1.3,len),a,y+0.65,b)}
  for(const [a,b] of spec.manholes||[]){const y=ground(a,b);add('manhole',new T.CylinderGeometry(0.36,0.36,0.03,18),a,y+0.055,b);add('stain',new T.CylinderGeometry(1.1,1.1,0.01,18).scale(1.3,1,0.8),a,y+0.045,b)}
  if(spec.tactile){const [a0,b0,a1,b1]=spec.tactile,len=Math.hypot(a1-a0,b1-b0),g=new T.BoxGeometry(0.6,0.025,len);g.rotateY(Math.atan2(a1-a0,b1-b0));
    add('tactile',g,(a0+a1)/2,ground((a0+a1)/2,(b0+b1)/2)+0.055,(b0+b1)/2)}
  for(const [a,b] of spec.bollards||[]){const y=ground(a,b);add('bollard',new T.CylinderGeometry(0.05,0.06,0.8,8),a,y+0.4,b);
    for(const yy of [0.55,0.68])add('bollardBand',new T.CylinderGeometry(0.056,0.056,0.05,8),a,y+yy,b)}
  // bordür taşları (beyaz / gri boyalı)
  for(const [a0,b0,a1,b1] of spec.curbs||[]){const len=Math.hypot(a1-a0,b1-b0),n=Math.max(1,Math.round(len/0.5)),ang=Math.atan2(a1-a0,b1-b0);
    for(let i=0;i<n;i++){const t=(i+0.5)/n,a=a0+(a1-a0)*t,b=b0+(b1-b0)*t,g=new T.BoxGeometry(0.16,0.16,len/n-0.01);g.rotateY(ang);add(i%2?'curbDark':'curbLight',g,a,ground(a,b)+0.06,b)}}
  // istinat duvarları: gövde, iç yüzde boyalı / beton doku, üstte harpuşta ve çit
  const wallFaces=[];
  for(const w of spec.walls||[]){const [a0,b0]=w.p0,[a1,b1]=w.p1,len=Math.hypot(a1-a0,b1-b0),ta=(a1-a0)/len,tb=(b1-b0)/len,[na,nb]=w.out,T0=w.t??0.5,h=w.h;
    const ang=Math.atan2(-tb,ta),ma=(a0+a1)/2+na*T0/2,mb=(b0+b1)/2+nb*T0/2,y=ground((a0+a1)/2-na*1,(b0+b1)/2-nb*1);
    const body=new T.BoxGeometry(len+(w.extend??0),h+1,T0);body.rotateY(ang);add('wallBody',body,ma,y+h/2-0.5,mb);
    const cap=new T.BoxGeometry(len+(w.extend??0)+0.1,0.14,T0+0.12);cap.rotateY(ang);add('wallCap',cap,ma,y+h+0.07,mb);
    wallFaces.push({w,len,ang,a:(a0+a1)/2-na*0.012,b:(b0+b1)/2-nb*0.012,y,h,na,nb});
    // çit: direkler + üst/alt lama, araları doku (demir parmaklık / tel çit)
    const fh=w.fence==='tel'?1.9:1.5,step=w.fence==='tel'?3:2.4,n=Math.max(1,Math.round(len/step));
    for(let i=0;i<=n;i++){const t=i/n,a=a0+(a1-a0)*t+na*0.15,b=b0+(b1-b0)*t+nb*0.15;add(w.fence==='tel'?'chainPost':'iron',new T.BoxGeometry(0.07,fh,0.07),a,y+h+0.14+fh/2,b)}
    for(const yy of w.fence==='tel'?[fh]:[0.12,fh-0.08]){const r=new T.BoxGeometry(len,0.05,0.05);r.rotateY(ang);add(w.fence==='tel'?'chainPost':'iron',r,(a0+a1)/2+na*0.15,y+h+0.14+yy,(b0+b1)/2+nb*0.15)}
    wallFaces.at(-1).fence={fh,a:(a0+a1)/2+na*0.15,b:(b0+b1)/2+nb*0.15};
  }
  for(const [a,b,len=3,deg=0] of spec.ivy||[]){const y=ground(a,b);void deg;wallFaces.push({ivy:true,a,b,y,len})}
  const flags=[];
  const at=spec.ataturk?.at;
  if(at){const [a,b]=at,y=ground(a,b);
    // kaide: siyah, yukarı daralan (alt 0.95 × 0.74, üst 0.75 × 0.585, 1.3 m), üstünde taşan siyah tabla
    const PH=1.3,frustum=new T.CylinderGeometry(0.75/Math.SQRT2,0.95/Math.SQRT2,PH,4,1).rotateY(Math.PI/4).scale(1,1,0.78).toNonIndexed();
    frustum.computeVertexNormals();add('black',frustum,a,y+PH/2,b);
    add('black',new T.BoxGeometry(0.86,0.06,0.68),a,y+PH+0.03,b);
    const top=y+PH+0.06;
    add('gold',new T.BoxGeometry(0.3,0.08,0.24),a,top+0.04,b);
    add('gold',new T.CylinderGeometry(0.2,0.22,0.1,20).scale(1,1,0.68),a,top+0.13,b);                          // göğüs altı
    add('gold',new T.SphereGeometry(1,22,12,0,Math.PI*2,0,Math.PI*0.5).scale(0.3,0.25,0.17),a,top+0.18,b);     // omuzlar ve göğüs
    add('gold',new T.CylinderGeometry(0.055,0.065,0.12,12),a,top+0.47,b);                                      // boyun
    add('gold',new T.SphereGeometry(0.115,18,14).scale(1,1.25,1.08),a,top+0.62,b);                              // baş
    // ön yüzdeki yazı: eğik yüze oturan düzlem
    const tilt=Math.atan((0.37-0.2925)/PH),ty=0.8,tz=0.37-(ty/PH)*(0.37-0.2925)+0.006;
    const text=new T.Mesh(new T.PlaneGeometry(0.68,0.78),new T.MeshStandardMaterial({map:mottoTexture(anisotropy),roughness:0.35,metalness:0.3}));
    text.material.name='bilsem-motto';text.material.roughness=0.3;text.material.metalness=0.1;text.rotation.x=-tilt;text.position.set(a,y+ty,b+tz);group.add(text);
    for(const [pa,pb] of ataturkPoles(spec.ataturk)){const py=ground(pa,pb);
      add('steel',new T.CylinderGeometry(0.045,0.055,POLE_H,12),pa,py+POLE_H/2,pb);add('steel',new T.BoxGeometry(0.36,0.06,0.36),pa,py+0.03,pb);
      add('steel',new T.ConeGeometry(0.05,0.16,10),pa,py+POLE_H+0.08,pb);
      // bayraklar girişten uzağa (batıya) açılır: sağdaki direğin bayrağı giriş cephesine girmesin
      const f=createFlag(anisotropy,{L:1.5,H:1.0});f.mesh.rotation.y=Math.PI;f.mesh.position.set(pa-0.05,py+POLE_H-0.62,pb);group.add(f.mesh);flags.push(f);
    }
  }
  const M=(name,o)=>{const m=new T.MeshStandardMaterial(o);m.name='bilsem-'+name;return m};
  const look={pine:M('pine',{color:'#2e5a33',roughness:0.95,flatShading:true}),bark:M('bark',{color:'#6b4c35',roughness:0.95}),
    leaf:M('leaf',{color:'#7c9c4a',roughness:0.95,flatShading:true,transparent:true,opacity:0.55}),
    leafYellow:M('leaf-yellow',{color:'#cdb23b',roughness:0.95,flatShading:true,transparent:true,opacity:0.6}),
    fir:M('fir',{color:'#33502f',roughness:0.95,flatShading:true}),treeA:M('tree-a',{color:'#9c9a3e',roughness:0.95,flatShading:true}),treeB:M('tree-b',{color:'#6f7c36',roughness:0.95,flatShading:true}),
    wood:M('bench-wood',{color:'#3d2d24',roughness:0.8}),iron:M('bench-iron',{color:'#1f2021',roughness:0.6,metalness:0.4}),
    binBody:M('bin',{color:'#4a3426',roughness:0.7}),lampPole:M('lamp-pole',{color:'#a3a8ab',roughness:0.45,metalness:0.6}),
    lampHead:M('lamp-head',{color:'#5d6266',roughness:0.4,metalness:0.5,emissive:'#202020'}),
    container:M('container',{color:'#f3f3f1',roughness:0.55,map:corrugationTexture(anisotropy)}),containerFrame:M('container-frame',{color:'#dcdcda',roughness:0.5}),
    beige:M('stone-block',{color:'#dccaa4',roughness:0.85}),beigeDark:M('stone-block-base',{color:'#b8a886',roughness:0.9}),whitePanel:M('white-panel',{color:'#f2f2f0',roughness:0.6}),
    manhole:M('manhole',{color:'#3e3631',roughness:0.6,metalness:0.4}),stain:M('stain',{color:'#6f685c',roughness:0.9,transparent:true,opacity:0.16,depthWrite:false}),
    tactile:M('tactile',{color:'#6b4a35',roughness:0.85}),bollard:M('bollard',{color:'#e8612a',roughness:0.55}),bollardBand:M('bollard-band',{color:'#f2f2f2',roughness:0.3}),
    curbLight:M('curb-light',{color:'#e6e5e1',roughness:0.85}),curbDark:M('curb-dark',{color:'#77736d',roughness:0.85}),
    wallBody:M('wall-body',{color:'#9e9888',roughness:0.95}),wallCap:M('wall-cap',{color:'#8f897c',roughness:0.95}),chainPost:M('chain-post',{color:'#9ea3a5',roughness:0.45,metalness:0.6}),
    black:M('pedestal',{color:'#141414',roughness:0.3,metalness:0.1}),gold:M('gold',{color:'#cfa63c',roughness:0.3,metalness:0.9}),
    steel:M('pole',{color:'#c4c9ce',roughness:0.18,metalness:0.9})};
  for(const [k,list] of Object.entries(P)){const g=mergeGeometries(list.map(x=>x.index?x.toNonIndexed():x),false);
    const mesh=new T.Mesh(g,look[k]);mesh.castShadow=k!=='leaf';mesh.receiveShadow=true;mesh.name='bilsem-bahce-'+k;group.add(mesh)}
  // duvar iç yüzleri (boya / beton dokusu), çit dokuları, sarmaşık
  const tex={sari:wallTexture('sari',anisotropy),gri:wallTexture('gri',anisotropy),demir:fenceTexture('demir',anisotropy),tel:fenceTexture('tel',anisotropy),ivy:ivyTexture(anisotropy)};
  const faceMat={sari:M('wall-yellow',{map:tex.sari,roughness:0.92}),gri:M('wall-gray',{map:tex.gri,roughness:0.95}),
    demir:M('fence-iron',{map:tex.demir,transparent:true,alphaTest:0.4,side:T.DoubleSide,roughness:0.6,metalness:0.4}),
    tel:M('fence-chain',{map:tex.tel,transparent:true,alphaTest:0.25,side:T.DoubleSide,roughness:0.5,metalness:0.5,depthWrite:false}),
    ivy:M('ivy',{map:tex.ivy,transparent:true,alphaTest:0.45,side:T.DoubleSide,roughness:0.9})};
  for(const f of wallFaces){
    if(f.ivy){const g=new T.PlaneGeometry(f.len,4.2);const m=new T.Mesh(g,faceMat.ivy);m.position.set(f.a,f.y+2.1,f.b);m.rotation.y=Math.PI/2;group.add(m);continue}
    const tile=f.w.kind==='gri'?7:6,g=new T.PlaneGeometry(f.len,f.h);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*f.len/tile);
    const m=new T.Mesh(g,faceMat[f.w.kind||'gri']);m.receiveShadow=true;m.position.set(f.a,f.y+f.h/2,f.b);m.rotation.y=Math.atan2(-f.na,-f.nb);group.add(m);
    const fh=f.fence.fh,fg=new T.PlaneGeometry(f.len,fh-0.1);const fu=fg.attributes.uv;for(let i=0;i<fu.count;i++)fu.setX(i,fu.getX(i)*f.len/(f.w.fence==='tel'?1.5:2.4));
    const fm=new T.Mesh(fg,faceMat[f.w.fence==='tel'?'tel':'demir']);fm.position.set(f.fence.a,f.y+f.h+0.14+fh/2,f.fence.b);fm.rotation.y=m.rotation.y;group.add(fm);
  }
  return {object:group,update(dt){for(const f of flags)f.update(dt)}};
}

function groundMat(name,map,tile){
  const m=new T.MeshStandardMaterial({map,roughness:name==='lawn'?0.97:0.88,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  m.name='bilsem-zemin-'+name;m.userData.tile=tile;return m;
}
function canvasTex(S,draw,anisotropy,{w=S,h=S,repeat=true}={}){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);
  const t=new T.CanvasTexture(cv);if(repeat)t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
/** Açık renk taş döşeme (2 × 2 taş / 2.4 m), gri beton avlu (3.2 m'de bir derz) ya da bej beton meydan (BİLSEM, 5 m derz, lekeler). */
function paveTexture(tone,anisotropy){
  if(tone==='meydan')return canvasTex(512,(g,S)=>{
    g.fillStyle='#cdc2ac';g.fillRect(0,0,S,S);
    for(let i=0;i<46;i++){const x=rnd()*S,y=rnd()*S,r=20+rnd()*90,v=rnd()<0.5?'rgba(150,138,118,0.10)':'rgba(236,230,214,0.12)';const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,v);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,2*r,2*r)}
    for(let i=0;i<5000;i++){const v=170+rnd()*60;g.fillStyle=`rgba(${v|0},${(v-6)|0},${(v-18)|0},0.16)`;g.fillRect(rnd()*S,rnd()*S,1+rnd()*3,1+rnd()*3)}
    g.fillStyle='rgba(95,88,76,0.55)';g.fillRect(0,0,S,2);g.fillRect(0,0,2,S);
  },anisotropy);
  const concrete=tone==='beton';
  return canvasTex(256,(g,S)=>{
    g.fillStyle=concrete?'#c4c3be':'#dcd8cf';g.fillRect(0,0,S,S);
    for(let i=0;i<900;i++){const v=concrete?150+rnd()*70:185+rnd()*55;g.fillStyle=`rgba(${v|0},${v|0},${(v-6)|0},0.18)`;g.fillRect(rnd()*S,rnd()*S,2+rnd()*6,2+rnd()*6)}
    const n=concrete?1:2,c=S/n;
    if(!concrete)for(let y=0;y<n;y++)for(let x=0;x<n;x++){const v=(rnd()-0.5)*7;g.fillStyle=`rgba(${v>0?255:0},${v>0?255:0},${v>0?255:0},${Math.abs(v)/100})`;g.fillRect(x*c,y*c,c,c)}
    g.fillStyle=concrete?'rgba(70,70,68,0.45)':'rgba(130,124,114,0.42)';
    for(let k=0;k<n;k++){g.fillRect(k*c,0,concrete?3:2,S);g.fillRect(0,k*c,S,concrete?3:2)}
  },anisotropy);
}
function lawnTexture(anisotropy){
  return canvasTex(256,(g,S)=>{
    g.fillStyle='#5d8c38';g.fillRect(0,0,S,S);
    for(let i=0;i<2600;i++){const l=rnd(),r=60+l*55,gg=110+l*60,b=30+l*30;g.fillStyle=`rgba(${r|0},${gg|0},${b|0},0.35)`;
      const x=rnd()*S,y=rnd()*S,s=1+rnd()*(i<120?22:4);g.fillRect(x,y,s,s)}
  },anisotropy);
}
function mottoTexture(anisotropy){
  const cv=document.createElement('canvas');cv.width=272;cv.height=312;const g=cv.getContext('2d');
  g.fillStyle='#141414';g.fillRect(0,0,cv.width,cv.height);
  g.fillStyle='#e0bb4e';g.font='bold 54px "Segoe UI", Arial, sans-serif';g.textBaseline='middle';
  ['NE','MUTLU','TÜRKÜM','DİYENE'].forEach((w,i)=>g.fillText(w,22,46+i*66,232));
  const t=new T.CanvasTexture(cv);t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}

/** İstinat duvarı iç yüzü. sari: boyası dökülen sarı beton (6 m × duvar yüksekliği), gri: kalıp izli çıplak beton (7 m). */
function wallTexture(kind,anisotropy){
  return canvasTex(512,(g,W,H)=>{
    if(kind==='sari'){
      g.fillStyle='#cbbd70';g.fillRect(0,0,W,H);
      for(let x=0;x<W;x+=10+rnd()*8){g.fillStyle=`rgba(90,80,40,${0.04+rnd()*0.05})`;g.fillRect(x,0,1.5,H)}       // kalıp tahtası izleri
      for(let i=0;i<90;i++){const x=rnd()*W,y=H*(0.15+rnd()*0.8),w=8+rnd()*60,h=6+rnd()*40;g.fillStyle=`rgba(${120+rnd()*30|0},${118+rnd()*25|0},${104+rnd()*20|0},${0.55+rnd()*0.4})`;
        g.beginPath();g.ellipse(x,y,w/2,h/2,rnd()*0.6,0,Math.PI*2);g.fill()}                                           // dökülen boya, çıplak beton
      const dirt=g.createLinearGradient(0,H*0.62,0,H);dirt.addColorStop(0,'rgba(70,64,40,0)');dirt.addColorStop(1,'rgba(70,64,40,0.75)');g.fillStyle=dirt;g.fillRect(0,0,W,H);
    }else{
      g.fillStyle='#b9b09e';g.fillRect(0,0,W,H);
      for(let y=0;y<H;y+=H/4){g.fillStyle='rgba(80,74,64,0.35)';g.fillRect(0,y,W,2)}
      for(let x=0;x<W;x+=W/3){g.fillStyle='rgba(80,74,64,0.3)';g.fillRect(x,0,2,H)}
      for(let y=H/8;y<H;y+=H/4)for(let x=W/12;x<W;x+=W/6){g.fillStyle='rgba(60,56,50,0.55)';g.beginPath();g.arc(x,y,2.5,0,Math.PI*2);g.fill()}   // kalıp bağlantı delikleri
      for(let i=0;i<1800;i++){const v=150+rnd()*60;g.fillStyle=`rgba(${v|0},${(v-4)|0},${(v-14)|0},0.18)`;g.fillRect(rnd()*W,rnd()*H,2,2)}
    }
    for(let i=0;i<70;i++){const x=rnd()*W,y=rnd()*H*0.4,len=H*(0.2+rnd()*0.6);const gr=g.createLinearGradient(0,y,0,y+len);
      gr.addColorStop(0,'rgba(55,55,40,0.0)');gr.addColorStop(0.2,`rgba(55,55,40,${0.15+rnd()*0.25})`);gr.addColorStop(1,'rgba(55,55,40,0)');g.fillStyle=gr;g.fillRect(x,y,2+rnd()*6,len)}  // akıntı izleri
  },anisotropy,{w:512,h:kind==='sari'?420:440});
}
/** Çit dokusu (saydam): demir parmaklık (2.4 m'de 18 çubuk) ya da tel örgü (1.5 m). */
function fenceTexture(kind,anisotropy){
  return canvasTex(256,(g,W,H)=>{g.clearRect(0,0,W,H);
    if(kind==='demir'){g.fillStyle='#1d1f20';for(let i=0;i<18;i++)g.fillRect(i*W/18+3,0,4,H)}
    else{g.strokeStyle='rgba(150,155,158,0.95)';g.lineWidth=2;const c=16;for(let i=-H/c;i<W/c+H/c;i++){g.beginPath();g.moveTo(i*c,0);g.lineTo(i*c+H,H);g.stroke();g.beginPath();g.moveTo(i*c,H);g.lineTo(i*c+H,0);g.stroke()}}
  },anisotropy,{w:256,h:128});
}
function ivyTexture(anisotropy){
  return canvasTex(256,(g,W,H)=>{g.clearRect(0,0,W,H);
    for(let i=0;i<900;i++){const x=W*(0.2+0.6*rnd())+(rnd()-0.5)*W*0.4*(1-0),y=rnd()*H,yy=y/H,spread=0.15+0.35*yy;const xx=W/2+(rnd()-0.5)*W*spread*2;
      const v=rnd();g.fillStyle=`rgb(${40+v*30|0},${70+v*45|0},${30+v*20|0})`;g.beginPath();g.ellipse(xx,y,3+rnd()*4,2+rnd()*3,rnd()*3,0,Math.PI*2);g.fill();void x}
  },anisotropy,{w:256,h:256,repeat:false});
}
function corrugationTexture(anisotropy){
  return canvasTex(128,(g,W,H)=>{g.fillStyle='#f4f4f2';g.fillRect(0,0,W,H);for(let x=0;x<W;x+=8){g.fillStyle='rgba(120,120,118,0.25)';g.fillRect(x,0,2,H)}},anisotropy,{w:128,h:64});
}
