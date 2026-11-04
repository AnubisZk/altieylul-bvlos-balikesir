// Altıeylül BİLSEM binası ve kamelyası, arkasındaki Altıeylül Fen Lisesi (data/bal/bilsem.json → fenLisesi).
// Binalar: MEB tip projesi, yordamsal model (bilsem-bina.js; iki okul aynı proje, Fen Lisesi aynalı). Kamelya: Meshy modeli
// (models/bilsem-bina.glb → Kamelya düğümü, tools/balikesir/prepare-bilsem.mjs). style.model = "meshy" eski Meshy
// binasına döner. Bina kutusu Google uydu görüntüsünden ölçülen genişlikte, yönü ölçülen çatı ekseninden, tabanı DEM
// zeminine oturur. Kamelya kendi ölçülen yerine ayrıca konur. Bahçe ve avlu: bilsem-bahce.js (koruma alanı okul
// bahçesinin tamamı). Çarpışma: bina planının duvar ve çatı yüksekliği, bayrak direkleri, büst, ağaçlar ve kamelya
// kutusu (normal bina gibi: çarpma = kaza).
import * as T from 'three';
import {lonLatToLocal} from '../src/geo.js';
import {binaPlan,createBinaObject} from './bilsem-bina.js';
import {yardZone,zoneKeep,yardObstacles,createYard} from './bilsem-bahce.js';

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
  // Fen Lisesi: aynı tip proje, aynı ölçü ve yön (uydu görüntüsünde iki çatı da aynı eksende)
  let fen=null;
  if(data.fenLisesi){
    const f=data.fenLisesi,fc=lonLatToLocal(...f.center),fb=ground(fc.x,fc.z)-(f.sink??b.sink??0);
    const box=orientedBox({x:fc.x,z:fc.z,u,hu:building.hu,hv:building.hv,bottom:fb,top:fb+b.height,name:f.name});
    const fplan=binaPlan({hu:building.hu,hv:building.hv,height:b.height},f.style);
    const fv=[-u[1],u[0]],fworld=(a,bb)=>({x:fc.x+a*u[0]+bb*fv[0],z:fc.z+a*u[1]+bb*fv[1]});
    fen={id:'fen-lisesi',building:box,plan:fplan,world:fworld,zone:yardZone(box,f.avlu?.zone),yard:f.avlu||{},
      pole:fplan.st.flag?{...fworld(fplan.s*fplan.pole.x,fplan.pole.z),height:fplan.pole.height}:null};
  }
  const v=[-u[1],u[0]],world=(a,bb)=>({x:c.x+a*u[0]+bb*v[0],z:c.z+a*u[1]+bb*v[1]});
  const local=building.local;
  // BİLSEM avlusu: yamaca oyulmuş düz beton meydan (bina tabanı düzeyinde). Duvarlı kenarlarda (batı, güney) düz kalır,
  // açık kenarlarda (open: kuzey, doğu) son 6 m'de araziye bağlanır. heightAt(x,z,base): avlu içinde yükseklik, dışında null.
  const zone=yardZone(building,data.bahce?.zone),open=data.bahce?.open||[],level=base,BLEND=6;
  const yard={zone,level,
    heightAt(x,z,baseFn=ground){const [a,bb]=local(x,z);if(a<zone.a0||a>zone.a1||bb<zone.b0||bb>zone.b1)return null;
      let t=1;if(open.includes('north'))t=Math.min(t,(bb-zone.b0)/BLEND);if(open.includes('east'))t=Math.min(t,(zone.a1-a)/BLEND);
      if(open.includes('south'))t=Math.min(t,(zone.b1-bb)/BLEND);if(open.includes('west'))t=Math.min(t,(a-zone.a0)/BLEND);
      t=Math.max(0,Math.min(1,t));return t>=1?level:level*t+baseFn(x,z)*(1-t)}};
  const yardGround=(x,z)=>yard.heightAt(x,z)??ground(x,z);
  let kamelya=null;
  if(data.kamelya&&m.kamelya){
    const k=lonLatToLocal(...data.kamelya.at),kb=yardGround(k.x,k.z)-0.1;
    kamelya=orientedBox({x:k.x,z:k.z,u,hu:(m.kamelya.x1-m.kamelya.x0)*s/2,hv:(m.kamelya.z1-m.kamelya.z0)*s/2,bottom:kb,top:kb+(m.kamelya.y1-m.kamelya.y0)*sy,name:'BİLSEM kamelyası'});
  }
  const pole=plan.st.flag?{...world(plan.s*plan.pole.x,plan.pole.z),height:plan.pole.height}:null;
  // three.js: modelin +X ekseni u yönüne (rotation.y = atan2(-uz, ux)); +Z (bina önü) güneye bakar
  const schools=[{id:'bilsem',building,plan,world,pole,zone,yard:data.bahce||{}},fen].filter(Boolean);
  // istinat duvarları (yerel kutular, çarpışma): iç yüz çizgisinden dışa kalınlık, avlu düzeyinden yükseklik + çit
  const walls=(data.bahce?.walls||[]).map(w=>{const [a0,b0]=w.p0,[a1,b1]=w.p1,[na,nb]=w.out,t=w.t??0.5,fh=w.fence==='tel'?1.9:1.5;
    return {a0:Math.min(a0,a1,a0+na*t,a1+na*t),a1:Math.max(a0,a1,a0+na*t,a1+na*t),b0:Math.min(b0,b1,b0+nb*t,b1+nb*t),b1:Math.max(b0,b1,b0+nb*t,b1+nb*t),top:level+w.h+0.14+fh,name:'istinat duvarı'}});
  return {s,sy,yaw:Math.atan2(-u[1],u[0]),building,kamelya,plan,pole,world,fen,schools,buildings:schools.map(x=>x.building),
    boxes:[building,kamelya,fen?.building].filter(Boolean),
    // koruma alanları: her okulun bahçesi/avlusu bütün (Google'ın bina tümseği ve kaymış çatı fotoğrafı içeride kalır)
    keepZones:schools.map(sc=>zoneKeep(sc.zone,sc.world,u)),
    yard,yardGround,walls,yardObstacles:yardObstacles(data.bahce,world)};
}

export async function createBilsemLayer({loader,data,ground,surface=ground,anisotropy=4,place=bilsemPlacement(data,ground)}){
  const m=data.model;
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
  // okullar: tip proje (yordamsal); BİLSEM için style.model = "meshy" eski Meshy binası
  const schools=place.schools.map(sc=>{
    const b=sc.building,meshy=sc.id==='bilsem'&&sc.plan.st.model==='meshy';
    let bina=null;
    if(meshy)put('Bina',b,m.bina);
    else{bina=createBinaObject(sc.plan,{anisotropy,groundAt:(a,bb)=>{const p=sc.world(a,bb);return ground(p.x,p.z)-b.bottom}});bina.object.name='okul-'+sc.id;holderAt(b).add(bina.object)}
    // çarpışma yüksekliği: tip projede plan (duvar + kırma çatı), Meshy'de kutu
    const roofAt=(x,z,r=0)=>{
      if(meshy)return b.inside(x,z,r)?b.top:-Infinity;
      if(!b.inside(x,z,r+1.5))return -Infinity;
      const [a,bb]=b.local(x,z);let h=sc.plan.heightAt(a,bb);
      if(r>0)for(const [da,db] of [[r,0],[-r,0],[0,r],[0,-r]])h=Math.max(h,sc.plan.heightAt(a+da,bb+db));
      return h===-Infinity?h:b.bottom+h;
    };
    return {...sc,bina,meshy,roofAt};
  });
  put('Kamelya',place.kamelya,m.kamelya);
  // bahçe ve avlu: koruma alanının tamamı bizim zemin (arazi ağı üçgenlerine oturur)
  const yards=schools.map(sc=>{
    const vols=sc.plan.vols,s=sc.plan.s;
    const y=createYard({kind:sc.id==='bilsem'?'bahce':'avlu',zone:sc.zone,spec:sc.yard,world:sc.world,center:sc.building,yaw:place.yaw,surface,anisotropy,
      inBuilding:(a,bb)=>{const x=s*a;return vols.some(v=>x>=v.x0+0.2&&x<=v.x1-0.2&&bb>=v.z0+0.2&&bb<=v.z1-0.2)}});
    object.add(y.object);return y;
  });
  const obstacles=place.yardObstacles.map(o=>({...o,g:ground(o.x,o.z)}));
  const kam=place.kamelya,tip=schools.some(x=>!x.meshy);
  return {
    object,boxes:place.boxes,stats:{model:data.glb,source:tip?'tip proje (temsili)':'Meshy (temsili)',okullar:schools.map(x=>x.building.name)},
    update(dt){for(const sc of schools)sc.bina?.update(dt);for(const y of yards)y.update(dt)},
    heightAt(x,z){let h=-Infinity;for(const sc of schools)h=Math.max(h,sc.roofAt(x,z));if(kam?.inside(x,z))h=Math.max(h,kam.top);
      const [a,bb]=place.building.local(x,z);for(const w of place.walls)if(a>=w.a0&&a<=w.a1&&bb>=w.b0&&bb<=w.b1)h=Math.max(h,w.top);return h},
    hitTest(x,y,z,r=0){
      for(const sc of schools){
        const b=sc.building,top=sc.roofAt(x,z,r);if(y-r<=top&&y+r>=b.bottom-3)return {type:'building',id:sc.id,name:b.name};
        const pole=sc.pole;
        if(pole&&Math.hypot(x-pole.x,z-pole.z)<=r+0.12){const g=ground(pole.x,pole.z);if(y>=g-r&&y<=g+pole.height+r)return {type:'building',id:sc.id+'-bayrak',name:b.name+' bayrak direği'}}
      }
      if(kam&&y>=kam.bottom-r&&y<=kam.top+r&&kam.inside(x,z,r))return {type:'building',id:'bilsem',name:kam.name};
      for(const o of obstacles)if(Math.hypot(x-o.x,z-o.z)<=o.r+r&&y>=o.g-r&&y<=o.g+o.h+r)return {type:'building',id:'bilsem-bahce',name:o.name};
      if(place.walls.length){const [a,bb]=place.building.local(x,z);
        for(const w of place.walls)if(a>=w.a0-r&&a<=w.a1+r&&bb>=w.b0-r&&bb<=w.b1+r&&y-r<=w.top&&y+r>=place.yard.level-1)return {type:'building',id:'bilsem-duvar',name:w.name}}
      return null;
    },
  };
}
