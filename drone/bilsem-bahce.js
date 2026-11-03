// BİLSEM bahçesi ve Fen Lisesi avlusu (data/bal/bilsem.json → bahce, fenLisesi.avlu).
// Okulun koruma alanı (Google ağının atıldığı dikdörtgen) bahçenin tamamını kapsar: Google ağı okul binasını arazide
// kabarık bir tümsek olarak verir ve tümseğin eteği (kaymış çatı fotoğrafıyla) cephenin önünde havada asılı kalıyordu.
// Alanın içinde zemin bizim: arazi ağının üçgenlerine birebir oturan kaplama (surface), 4 cm yukarıda + polygonOffset.
// BİLSEM (Zafer Hoca'nın fotoğrafı): binanın önünde açık renk taş döşeme, önde ve batıda çim, çimde çam fidanları ve
// genç ağaçlar, döşemede banklar; kamelya döşemenin ön-batı köşesinde (Meshy, yeri değişmez). Atatürk köşesi girişin
// solunda, cepheye dayalı (Zafer Hoca'nın fotoğrafı): siyah, yukarı daralan kaide, önünde altın "NE MUTLU TÜRKÜM
// DİYENE", altın büst, girişe yakın yanında paslanmaz bayrak direği. Büst temsilidir (genel büst biçimi, portre değil).
// Fen Lisesi: binanın çevresi beton avlu.
// Yerel çerçeve okulunki: a bina ekseni (doğu), b ön (güney); nesneler bina merkezinde yaw ile dönen bir gruptadır.
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createFlag} from './bilsem-bina.js';

/** Bölge dikdörtgeni (yerel): a ∈ [a0,a1], b ∈ [b0,b1]. */
export function yardZone({hu,hv},z={}){
  const side=z.side??8,back=z.back??8,front=z.front??8;
  return {a0:-hu-side,a1:hu+side,b0:-hv-back,b1:hv+front};
}

/** Yerel bölge → koruma alanı ({c,u,h}, keep-zone.js). */
export function zoneKeep(zone,world,u){
  const c=world((zone.a0+zone.a1)/2,(zone.b0+zone.b1)/2);
  return {c:[c.x,c.z],u,h:[(zone.a1-zone.a0)/2,(zone.b1-zone.b0)/2]};
}

/** Bahçe nesneleri (yerel) → çarpışma silindirleri (dünya). Model yüklemeden hesaplanır (test edilebilir). */
export function yardObstacles(spec,world){
  const out=[];
  for(const [a,b,h] of spec?.pines||[])out.push({...world(a,b),r:0.3*h,h,name:'çam fidanı'});
  for(const [a,b] of spec?.saplings||[])out.push({...world(a,b),r:0.6,h:3.4,name:'ağaç'});
  const at=spec?.ataturk?.at;
  if(at){out.push({...world(at[0],at[1]),r:0.55,h:2.1,name:'Atatürk büstü'});
    for(const [pa,pb] of ataturkPoles(spec.ataturk))out.push({...world(pa,pb),r:0.1,h:POLE_H+0.1,name:'bayrak direği'})}
  return out;
}
const POLE_H=6;
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
    pave:groundMat('pave',paveTexture(kind==='avlu',anisotropy),kind==='avlu'?3.2:2.4),
    lawn:groundMat('lawn',lawnTexture(anisotropy),4),
  };
  // zemin kaplaması: 1 m hücreler, köşe yükseklikleri arazi üçgenlerinden
  const plaza=spec.plaza||[];
  const cls=(a,b)=>{if(inBuilding(a,b))return null;if(kind==='avlu')return 'pave';
    return plaza.some(([a0,a1,b0,b1])=>a>=a0&&a<=a1&&b>=b0&&b<=b1)?'pave':'lawn'};
  const na=Math.ceil(zone.a1-zone.a0),nb=Math.ceil(zone.b1-zone.b0),lift=0.04;
  const H=new Float32Array((na+1)*(nb+1));
  for(let j=0;j<=nb;j++)for(let i=0;i<=na;i++)H[j*(na+1)+i]=ground(zone.a0+i,zone.b0+j)+lift;
  const buf={pave:[],lawn:[]};
  for(let j=0;j<nb;j++)for(let i=0;i<na;i++){
    const a=zone.a0+i,b=zone.b0+j,k=cls(a+0.5,b+0.5);if(!k)continue;
    const v=(di,dj)=>[a+di,H[(j+dj)*(na+1)+i+di],b+dj];
    buf[k].push(...v(0,0),...v(0,1),...v(1,0),...v(0,1),...v(1,1),...v(1,0));
  }
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
  for(const [a,b] of spec.saplings||[]){const y=ground(a,b);
    add('bark',new T.CylinderGeometry(0.035,0.06,3.2,6),a,y+1.6,b);
    for(let i=0;i<4;i++){const g=new T.CylinderGeometry(0.015,0.025,1.1,5);g.rotateZ(0.6);g.translate(0.45,0,0);add('bark',g,a,y+1.9+i*0.35,b,i*1.7+a)}
    add('leaf',new T.IcosahedronGeometry(0.8,0).scale(1,1.25,1),a,y+3.1,b);
  }
  for(const [a,b,deg=0] of spec.benches||[]){const y=ground(a,b),r=-deg*Math.PI/180;
    const part=(key,w,h,d,x,yy,z)=>{const g=new T.BoxGeometry(w,h,d).translate(x,yy,z);add(key,g,a,y,b,r)};
    part('wood',1.8,0.07,0.45,0,0.45,0);part('wood',1.8,0.32,0.05,0,0.72,-0.2);
    for(const x of [-0.75,0.75]){part('iron',0.06,0.45,0.42,x,0.22,0);part('iron',0.06,0.4,0.05,x,0.65,-0.21)}
  }
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
    wood:M('bench-wood',{color:'#8a5a35',roughness:0.8}),iron:M('bench-iron',{color:'#2f3133',roughness:0.6,metalness:0.4}),
    black:M('pedestal',{color:'#141414',roughness:0.3,metalness:0.1}),gold:M('gold',{color:'#cfa63c',roughness:0.3,metalness:0.9}),
    steel:M('pole',{color:'#c4c9ce',roughness:0.18,metalness:0.9})};
  for(const [k,list] of Object.entries(P)){const g=mergeGeometries(list.map(x=>x.index?x.toNonIndexed():x),false);
    const mesh=new T.Mesh(g,look[k]);mesh.castShadow=k!=='leaf';mesh.receiveShadow=true;mesh.name='bilsem-bahce-'+k;group.add(mesh)}
  return {object:group,update(dt){for(const f of flags)f.update(dt)}};
}

function groundMat(name,map,tile){
  const m=new T.MeshStandardMaterial({map,roughness:name==='lawn'?0.97:0.88,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  m.name='bilsem-zemin-'+name;m.userData.tile=tile;return m;
}
function canvasTex(S,draw,anisotropy){
  const cv=document.createElement('canvas');cv.width=cv.height=S;draw(cv.getContext('2d'),S);
  const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;return t;
}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
/** Açık renk taş döşeme (2 × 2 taş / 2.4 m) ya da beton avlu (3.2 m'de bir derz). */
function paveTexture(concrete,anisotropy){
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
