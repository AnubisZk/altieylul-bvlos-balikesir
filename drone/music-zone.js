import {pointInRing} from './area.js';
// Konuma göre parça: bölge içinde zone.inside, dışında zone.outside (yoksa 'balikesir'). Bölge ya yerel çokgen
// (zone.ring) ya da çember: zone.circle = {x, z, radius, hysteresis} (yerel metre; music.js enlem/boylamdan çevirir).
// Çemberde çıkış payı vardır: içerideyken ancak radius + hysteresis dışına çıkınca parça değişir (kenarda gidip gelmez).
// Balıkesir: data/bal/music-zone.json (işaretlenen noktada "Balıkesir Bengisi").
export function musicTrackAt(position,zone,current=null){
  const outside=zone?.outside||'balikesir';
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return current||outside;
  if(zone?.circle&&Number.isFinite(zone.circle.x)){const c=zone.circle,d=Math.hypot(position.x-c.x,position.z-c.z);
    return d<=c.radius+(current===zone.inside?(c.hysteresis||0):0)?zone.inside:outside}
  if(!zone?.ring?.length)return current||outside;
  return pointInRing(position.x,position.z,zone.ring)?zone.inside:outside;
}
