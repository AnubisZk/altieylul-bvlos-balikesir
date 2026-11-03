// Altıeylül BİLSEM binası: Meshy GLB → oyun modeli.
//   node tools/balikesir/prepare-bilsem.mjs --in raw/bilsem-meshy.glb [--out models/bilsem-bina.glb] [--tris 60000]
// 1) sadeleştirme + WebP doku (prepare-model.mjs ile aynı ayarlar),
// 2) Meshy'nin binanın önüne koyduğu kamelya ayrı düğüme (Kamelya) alınır; gerçek yeri bina önünde ~15 m ileride
//    olduğu için oyunda data/bal/bilsem.json → kamelya konumuna ayrıca yerleştirilir. Meshy'nin iki çam fidanı atılır,
// 3) model kutuları (bina, kamelya; Meshy biriminde) data/bal/bilsem.json → model alanına yazılır.
// Kutular Meshy çıktısına göre ayarlıdır (+Z bina önü). Yeni bir Meshy modeli gelirse --kamelya ve --trees kutuları
// (x0,z0,x1,z1) yeniden ölçülmeli: betik bulduğu üçgen sayılarını yazar.
import fs from 'node:fs';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {weld,simplify,textureCompress,dedup,prune} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';

const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>(v.startsWith('--')&&a.push([v.slice(2),all[i+1]]),a),[]));
if(!args.in)throw Error('--in <meshy.glb> gerekli');
const OUT=args.out||'models/bilsem-bina.glb',target=+(args.tris||60000);
const box=s=>s.split(',').map(Number);
const KAMELYA=box(args.kamelya||'-0.72,0.05,-0.33,0.26');
const KAMELYA_TOP=+(args.kamelyaTop||0);   // kamelya çatısı bu yükseklikten alçak; üstündeki üçgenler binanın saçağıdır
const TREES=[box('-0.76,0.28,-0.62,0.42'),box('-0.46,0.64,-0.32,0.78')];
const inBox=(x,z,[x0,z0,x1,z1])=>x>=x0&&x<=x1&&z>=z0&&z<=z1;

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const doc=await io.read(args.in);
await MeshoptSimplifier.ready;
let before=0;for(const m of doc.getRoot().listMeshes())for(const p of m.listPrimitives())before+=(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3;
await doc.transform(dedup(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:Math.min(1,target/before),error:0.001}),prune(),
  textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],quality:84}));
for(const m of doc.getRoot().listMaterials()){m.setMetallicFactor(0);m.setRoughnessFactor(1)}

const root=doc.getRoot(),scene=root.listScenes()[0],buf=root.listBuffers()[0];
const mesh=root.listMeshes()[0],prim=mesh.listPrimitives()[0];
const pos=prim.getAttribute('POSITION'),idx=prim.getIndices().getArray(),v=[0,0,0];
const parts={Bina:[],Kamelya:[]};let dropped=0;
const ext={Bina:[1e9,1e9,1e9,-1e9,-1e9,-1e9],Kamelya:[1e9,1e9,1e9,-1e9,-1e9,-1e9]};
for(let t=0;t<idx.length/3;t++){
  let cx=0,cy=0,cz=0;for(let k=0;k<3;k++){pos.getElement(idx[t*3+k],v);cx+=v[0]/3;cy+=v[1]/3;cz+=v[2]/3}
  if(TREES.some(b=>inBox(cx,cz,b))){dropped++;continue}
  const part=inBox(cx,cz,KAMELYA)&&cy<KAMELYA_TOP?'Kamelya':'Bina';parts[part].push(idx[t*3],idx[t*3+1],idx[t*3+2]);
  for(let k=0;k<3;k++){pos.getElement(idx[t*3+k],v);const e=ext[part];for(let a=0;a<3;a++){e[a]=Math.min(e[a],v[a]);e[a+3]=Math.max(e[a+3],v[a])}}
}
// eski düğümleri kaldır, iki düğüm kur (aynı köşe ve malzeme; yalnız indeksler ayrı)
for(const n of scene.listChildren())scene.removeChild(n);
for(const [name,list] of Object.entries(parts)){
  const p=doc.createPrimitive().setMaterial(prim.getMaterial()).setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(list)).setBuffer(buf));
  for(const s of prim.listSemantics())p.setAttribute(s,prim.getAttribute(s));
  scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(p)));
}
mesh.dispose();await doc.transform(prune());
await io.write(OUT,doc);
const r=a=>a.map(n=>+n.toFixed(4));
console.log(`${OUT}: ${Math.round(before)} → Bina ${parts.Bina.length/3}, Kamelya ${parts.Kamelya.length/3} üçgen (atılan çam: ${dropped})`);

// Bina kutusu: zemine yakın taban ve ön basamaklar hariç, gövde (y > taban + 0.05) üzerinden
let body=[1e9,1e9,-1e9,-1e9];for(let i=0;i<parts.Bina.length;i++){pos.getElement(parts.Bina[i],v);if(v[1]>ext.Bina[1]+0.15){body[0]=Math.min(body[0],v[0]);body[1]=Math.min(body[1],v[2]);body[2]=Math.max(body[2],v[0]);body[3]=Math.max(body[3],v[2])}}
const model={source:'Meshy AI (Zafer Hoca), sadeleştirilmiş',bina:{x0:r(body)[0],z0:r(body)[1],x1:r(body)[2],z1:r(body)[3],y0:+ext.Bina[1].toFixed(4),y1:+ext.Bina[4].toFixed(4)},
  kamelya:{x0:+ext.Kamelya[0].toFixed(4),z0:+ext.Kamelya[2].toFixed(4),x1:+ext.Kamelya[3].toFixed(4),z1:+ext.Kamelya[5].toFixed(4),y0:+ext.Kamelya[1].toFixed(4),y1:+ext.Kamelya[4].toFixed(4)}};
console.log(JSON.stringify(model));
const file='data/bal/bilsem.json';
if(fs.existsSync(file)){const d=JSON.parse(fs.readFileSync(file,'utf8'));d.model=model;fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');console.log(file,'→ model güncellendi')}
