// Altıeylül BİLSEM binası ve kamelyası (data/bal/bilsem.json).
// Bina: MEB tip projesi, yordamsal model (bilsem-bina.js; Altıeylül Fen Lisesi ile aynı proje). Kamelya: Meshy modeli
// (models/bilsem-bina.glb → Kamelya düğümü, tools/balikesir/prepare-bilsem.mjs). style.model = "meshy" eski Meshy
// binasına döner. Bina kutusu Google uydu görüntüsünden ölçülen genişlikte, yönü ölçülen çatı ekseninden, tabanı DEM
// zeminine oturur. Kamelya kendi ölçülen yerine ayrıca konur. Çarpışma: bina planının duvar ve çatı yüksekliği,
// bayrak direği ve kamelya kutusu (normal bina gibi: çarpma = kaza).
import * as T from 'three';
import {lonLatToLocal} from '../src/geo.js';
import {binaPlan,createBinaObject} from './bilsem-bina.js';

/** Yönlü kutu: merkez (x,z), birim eksen u, yarı boyutlar (hu, hv), taban ve tavan. */
export function orientedBox({x,z,u,hu,hv,bottom,top,name}){
  const v=[-u[1],u[0]];
  const local=(px,pz)=>{const dx=px-x,dz=pz-z;return [dx*u[0]+dz*u[1],dx*v[0]+dz*v[1]]};
  return {x,z,u,hu,hv,bottom,top,name,local,
    inside(px,pz,r=0){const [a,b]=local(px,pz);return Math.abs(a)<=hu+r&&Math.abs(b)<=hv+r},
    keep(margin=0){return {c:[x,z],u,h:[hu+margin,hv+margin]}}};
}

/** bilsem.json → yerleşim (yerel metre). ground(x,z): DEM zemini. Model yüklemeden hesaplanır (test edilebilir). */
export function bilsemPlacement(data,ground){
  const m=data.model,b=data.building;
  const c=lonLatToLocal(...b.center),w=lonLatToLocal(...b.axisWest),e=lonLatToLocal(...b.axisEast);
  const len=Math.hypot(e.x-w.x,e.z-w.z),u=[(e.x-w.x)/len,(e.z-w.z)/len];
  const s=b.width/(m.bina.x1-m.bina.x0),sy=b.height/(m.bina.y1-m.bina.y0);
  const base=ground(c.x,c.z)-(b.sink||0);
  const building=orientedBox({x:c.x,z:c.z,u,hu:(m.bina.x1-m.bina.x0)*s/2,hv:(m.bina.z1-m.bina.z0)*s/2,bottom:base,top:base+b.height,name:data.name});
  const plan=binaPlan({hu:building.hu,hv:building.hv,height:b.height},data.style);
  let kamelya=null;
  if(data.kamelya&&m.kamelya){
    const k=lonLatToLocal(...data.kamelya.at),kb=ground(k.x,k.z)-0.1;
    kamelya=orientedBox({x:k.x,z:k.z,u,hu:(m.kamelya.x1-m.kamelya.x0)*s/2,hv:(m.kamelya.z1-m.kamelya.z0)*s/2,bottom:kb,top:kb+(m.kamelya.y1-m.kamelya.y0)*sy,name:'BİLSEM kamelyası'});
  }
  const v=[-u[1],u[0]],world=(a,bb)=>({x:c.x+a*u[0]+bb*v[0],z:c.z+a*u[1]+bb*v[1]});
  const pole=plan.st.flag?{...world(plan.s*plan.pole.x,plan.pole.z),height:plan.pole.height}:null;
  // three.js: modelin +X ekseni u yönüne (rotation.y = atan2(-uz, ux)); +Z (bina önü) güneye bakar
  return {s,sy,yaw:Math.atan2(-u[1],u[0]),building,kamelya,plan,pole,world,boxes:[building,kamelya].filter(Boolean)};
}

export async function createBilsemLayer({loader,data,ground,anisotropy=4}){
  const place=bilsemPlacement(data,ground),m=data.model,b=place.building,plan=place.plan;
  const meshy=plan.st.model==='meshy';
  const gltf=await loader.loadGLTF(data.glb);
  const object=new T.Group();object.name='bilsem';
  const holderAt=box=>{const h=new T.Group();h.position.set(box.x,box.bottom,box.z);h.rotation.y=place.yaw;object.add(h);return h};
  const put=(nodeName,box,mb)=>{
    const src=gltf.scene.getObjectByName(nodeName);if(!src||!box)return;
    src.position.set(-(mb.x0+mb.x1)/2*place.s,-mb.y0*place.sy,-(mb.z0+mb.z1)/2*place.s);src.rotation.set(0,0,0);
    src.scale.set(place.s,place.sy,place.s);
    src.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});
    holderAt(box).add(src);
  };
  let bina=null;
  if(meshy)put('Bina',b,m.bina);
  else{
    bina=createBinaObject(plan,{anisotropy,groundAt:(a,bb)=>{const p=place.world(a,bb);return ground(p.x,p.z)-b.bottom}});
    holderAt(b).add(bina.object);
  }
  put('Kamelya',place.kamelya,m.kamelya);
  // çarpışma yüksekliği: tip projede plan (duvar + kırma çatı), Meshy'de kutu
  const roofAt=(x,z,r=0)=>{
    if(meshy)return b.inside(x,z,r)?b.top:-Infinity;
    if(!b.inside(x,z,r+1.5))return -Infinity;
    const [a,bb]=b.local(x,z);let h=plan.heightAt(a,bb);
    if(r>0)for(const [da,db] of [[r,0],[-r,0],[0,r],[0,-r]])h=Math.max(h,plan.heightAt(a+da,bb+db));
    return h===-Infinity?h:b.bottom+h;
  };
  const kam=place.kamelya,pole=place.pole;
  return {
    object,boxes:place.boxes,stats:{model:meshy?data.glb:'tip proje + '+data.glb,source:meshy?'Meshy (temsili)':'tip proje (temsili)'},
    update(dt){bina?.update(dt)},
    heightAt(x,z){let h=roofAt(x,z);if(kam?.inside(x,z))h=Math.max(h,kam.top);return h},
    hitTest(x,y,z,r=0){
      const top=roofAt(x,z,r);if(y-r<=top&&y+r>=b.bottom-3)return {type:'building',id:'bilsem',name:b.name};
      if(kam&&y>=kam.bottom-r&&y<=kam.top+r&&kam.inside(x,z,r))return {type:'building',id:'bilsem',name:kam.name};
      if(pole&&Math.hypot(x-pole.x,z-pole.z)<=r+0.12){const g=ground(pole.x,pole.z);if(y>=g-r&&y<=g+pole.height+r)return {type:'building',id:'bilsem-bayrak',name:'BİLSEM bayrak direği'}}
      return null;
    },
  };
}
