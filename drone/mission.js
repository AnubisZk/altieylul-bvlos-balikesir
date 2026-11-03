// Balıkesir · şehir merkezi gözlem turu. Offsets in metres from the Altıeylül BİLSEM launch pad (x = east, z = south).
// ANCHOR_FROM_HOME is the Saat Kulesi position seen from the pad (data/bal/region.json origin − home). The six points
// circle the centre at ~380 m; the first and last points are on the BİLSEM side, so the tour starts and ends heading
// north/south along the city. Recompute ANCHOR_FROM_HOME whenever origin or home in region.json changes
// (tests/balikesir.test.mjs fails when it is stale). Every point must stay inside the 2.5 km lesson radius (sim.js).
export const ANCHOR_FROM_HOME = [14,-2016];
const RING = [[0,380],[-360,180],[-360,-170],[0,-360],[360,-170],[360,180]];
export const OBSERVATION_POINTS = RING.map(([x,z])=>[ANCHOR_FROM_HOME[0]+x,ANCHOR_FROM_HOME[1]+z]);
export const createDefaultRoute = home => OBSERVATION_POINTS.map(([x,z])=>({x:home.x+x,z:home.z+z}));
// Heritage view targets (ids match data/bal/landmarks.json; distance = camera orbit radius in metres).
// Konumlar OSM verisinden (tools/balikesir/prepare-data.mjs) gelir; bulunamayan yapı listede görünür ama kamera
// açılırken atlanır.
export const HERITAGE = [
  {id:'saat-kulesi',name:'Saat Kulesi',distance:90},
  {id:'zaganos-pasa',name:'Zağanos Paşa Camii',distance:140},
  {id:'kuvayi-milliye',name:'Kuva-yi Milliye Müzesi',distance:110},
  {id:'ataturk-parki',name:'Atatürk Parkı',distance:300},
  {id:'bilsem',name:'Altıeylül BİLSEM',distance:120},
];
