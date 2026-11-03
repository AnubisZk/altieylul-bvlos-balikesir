// Altıeylül BİLSEM binası ve kamelyası (temsili Meshy modeli, data/bal/bilsem.json).
// Model tek GLB'de iki düğümdür (Bina, Kamelya; tools/balikesir/prepare-bilsem.mjs). Bina kutusu Google uydu
// görüntüsünden ölçülen genişliğe ölçeklenir, yönü ölçülen çatı ekseninden alınır, tabanı DEM zeminine oturur.
// Kamelya kendi ölçülen yerine ayrıca konur. Çarpışma yönlü kutularla yapılır (normal bina gibi: çarpma = kaza).
import * as T from 'three';
import {lonLatToLocal} from '../src/geo.js';

/** Yönlü kutu: merkez (x,z), birim eksen u, yarı boyutlar (hu, hv), taban ve tavan. */
export function orientedBox({x,z,u,hu,hv,bottom,top,name}){
  const v=[-u[1],u[0]];
  const local=(px,pz)=>{const dx=px-x,dz=pz-z;return [dx*u[0]+dz*u[1],dx*v[0]+dz*v[1]]};
  return {x,z,u,hu,hv,bottom,top,name,
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
  let kamelya=null;
  if(data.kamelya&&m.kamelya){
    const k=lonLatToLocal(...data.kamelya.at),kb=ground(k.x,k.z)-0.1;
    kamelya=orientedBox({x:k.x,z:k.z,u,hu:(m.kamelya.x1-m.kamelya.x0)*s/2,hv:(m.kamelya.z1-m.kamelya.z0)*s/2,bottom:kb,top:kb+(m.kamelya.y1-m.kamelya.y0)*sy,name:'BİLSEM kamelyası'});
  }
  // three.js: modelin +X ekseni u yönüne (rotation.y = atan2(-uz, ux)); +Z (bina önü) güneye bakar
  return {s,sy,yaw:Math.atan2(-u[1],u[0]),building,kamelya,boxes:[building,kamelya].filter(Boolean)};
}

export async function createBilsemLayer({loader,data,ground}){
  const place=bilsemPlacement(data,ground),m=data.model;
  const gltf=await loader.loadGLTF(data.glb);
  const object=new T.Group();object.name='bilsem';
  const put=(nodeName,box,mb)=>{
    const src=gltf.scene.getObjectByName(nodeName);if(!src||!box)return;
    const holder=new T.Group();holder.position.set(box.x,box.bottom,box.z);holder.rotation.y=place.yaw;
    src.position.set(-(mb.x0+mb.x1)/2*place.s,-mb.y0*place.sy,-(mb.z0+mb.z1)/2*place.s);src.rotation.set(0,0,0);
    src.scale.set(place.s,place.sy,place.s);
    src.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});
    holder.add(src);object.add(holder);
  };
  put('Bina',place.building,m.bina);put('Kamelya',place.kamelya,m.kamelya);
  return {
    object,boxes:place.boxes,stats:{model:data.glb},
    heightAt(x,z){let h=-Infinity;for(const b of place.boxes)if(b.inside(x,z)&&b.top>h)h=b.top;return h},
    hitTest(x,y,z,r=0){for(const b of place.boxes)if(y>=b.bottom-r&&y<=b.top+r&&b.inside(x,z,r))return {type:'building',id:'bilsem',name:b.name};return null},
  };
}
