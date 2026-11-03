import fs from 'node:fs';

// Açılış haritası (sağ üst): Saat Kulesi, BİLSEM ve birkaç ana cadde. Paketteki data/bal/ground.json ve
// landmarks.json'dan üretilir (önce prepare-data.mjs çalıştırılmalı).
//   node tools/balikesir/prepare-streets.mjs [--streets "Cadde 1,Cadde 2,…"]
// Aynı adlı birden çok OSM yolu birleştirilir; yalnız Saat Kulesi'ne 1,5 km içindekiler alınır. Bulunamayan cadde
// raporlanır ve atlanır.
const arg=process.argv.indexOf('--streets');
const NAMES=arg>0?process.argv[arg+1].split(',').map(s=>s.trim()).filter(Boolean)
  :['Milli Kuvvetler Caddesi','Anafartalar Caddesi','Gazi Bulvarı','Vasıf Çınar Caddesi','Kızılay Caddesi'];
const data=JSON.parse(fs.readFileSync('data/bal/ground.json','utf8'));
const landmarks=JSON.parse(fs.readFileSync('data/bal/landmarks.json','utf8')).landmarks;
const region=JSON.parse(fs.readFileSync('data/bal/region.json','utf8'));
const tower=landmarks.find(l=>l.id==='saat-kulesi')||{lon:region.origin.lon,lat:region.origin.lat,osm:null};
const bilsem=landmarks.find(l=>l.id==='bilsem');
const near=([lon,lat])=>Math.hypot((lon-tower.lon)*85730,(lat-tower.lat)*111030)<1500;
const streets=[];
for(const name of NAMES){
  const ways=data.features.filter(f=>f.tags.highway&&f.tags.name===name&&f.coordinates.some(near));
  if(!ways.length){console.warn('Bulunamadı:',name);continue}
  streets.push({name,ways:ways.map(w=>({osm:w.id,sourceName:w.tags.name,coordinates:w.coordinates}))});
}
if(streets.length>5)streets.length=5;   // etiket yerleşimi (street-map.js offsets) en fazla beş caddeye göre ayarlı
fs.writeFileSync('data/bal/opening-streets.json',JSON.stringify({
  source:data.source,license:data.license,sourceUrl:data.sourceUrl,timestamp:data.timestamp,
  monument:{name:'Saat Kulesi',coordinates:[tower.lon,tower.lat],osm:tower.osm},
  home:{name:'Altıeylül BİLSEM',coordinates:[region.home.lon,region.home.lat],osm:bilsem?.osm||null},streets
})+'\n');
console.log('Açılış haritası:',streets.map(s=>s.name).join(', ')||'cadde yok');
