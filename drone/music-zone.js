import {pointInRing} from './area.js';
// Konuma göre parça: bölge (zone.ring) içinde zone.inside, dışında zone.outside. Balıkesir'de şimdilik tek parça
// vardır (zone yok → 'balikesir'); Zafer Hoca bölgeye özel müzik verirse data/bal/music-zone.json eklenir.
export function musicTrackAt(position,zone,current=null){
  const outside=zone?.outside||'balikesir';
  if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z)||!zone?.ring?.length)return current||outside;
  return pointInRing(position.x,position.z,zone.ring)?zone.inside:outside;
}
