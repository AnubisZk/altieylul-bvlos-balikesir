# Balıkesir / Altıeylül BİLSEM — ilerleme ve devir notu

Çalışma başka bir hesapta veya oturumda sürdürülürken ilk okunacak not budur. Sonra `CLAUDE-BALIKESIR-DEVIR.md`
dosyasını okuyun (Ankara'dan gelen ilk devir notu; kurallar orada).

## 3 Kasım 2026 · `bal-0.1.0` iskelet

Kaynak: `AnubisZk/altieylul-bvlos-ankara` main, commit `60b9cea` (`ank-0.2.0` + gerçek şehir). Depo temiz geçmişle
başladı; Ankara deposuna ve İstanbul sitelerine yazılmadı.

### Alınan kararlar

- Merkez (yerel 0,0): **Balıkesir Saat Kulesi** 39.6456459 K, 27.8793218 D (Google Haritalar yer kaydı; OSM gelince
  doğrulanacak). Kalkış: **Altıeylül BİLSEM bahçesi** 39.627485 K, 27.878935 D (Zafer Hoca'nın işareti; bina önündeki
  çim alan, kamelya ve çam fidanlarının olduğu bahçe). BİLSEM Saat Kulesi'nin ~2,0 km güneyinde.
- UTM 35N (`EPSG:32635`). Yerel alan x −3000…3000, z −2000…4800 (kuzey −Z): BİLSEM çevresindeki eğitim çemberini
  ve merkezi kapsar.
- **Eğitim sınırı 2,5 km** (Ankara/İstanbul 2 km). Saat Kulesi 2 km'nin hemen dışında kaldığı için büyütüldü
  (`drone/sim.js LIMITS.radius`, harita çemberi, rapor ve kılavuz metinleri).
- Varsayılan rota: Saat Kulesi çevresinde ~370 m yarıçaplı altı nokta; ilk ve son nokta BİLSEM tarafında (güney).
  Toplam ~6 km, 80 m AGL'de yaklaşık 9–10 dakika.
- Anıtkabir, Aslanlı Yol, heykeller, İnönü Lahdi, Türk bayrağı, ilgili Blender/hazırlık betikleri ve Ankara müzikleri
  çıkarıldı. Koruma alanında yalnız kalkış pisti kaldı. Koruma kalkanı kodu (`main.js guardedTick`) ileride
  korunacak bir model (ör. Saat Kulesi) için duruyor.
- Müzik: Balıkesir parçası gelene kadar `seven-hills-at-dawn.mp3` (geçici). Konuma göre müzik bölgesi yok;
  `music-zone.js` bölge verilirse (`data/bal/music-zone.json`: `ring`, `inside`, `outside`) yine çalışır.
- Kılavuz: Ankara'ya özgü dört paragraf (0, 2, 3, 19) Balıkesir'e göre yeniden yazıldı. Bunların ses kaydı eski metni
  okuduğu için `drone/guide-audio.json` ile sessiz geçiliyor; yeni ses üretilince listeden çıkarılır.
- Google gerçek şehir: Ankara'daki gibi; dikey kalibrasyon noktası BİLSEM bahçesi (pedin 12 m doğusu), geoit tahmini
  37 m. Anahtar yalnız Vercel `GOOGLE_MAPS_TILES_KEY` (kaynakta yok).
- Dosya adları: `drone/ankara-world.js` → `drone/city-world.js` (`createCityWorld`, `CITY_DATA='data/bal/'`),
  `tools/ankara/` → `tools/balikesir/`, testler `tests/balikesir*.test.mjs`.

### Durum

- `npm test`: 83 geçti, 1 atlandı (gece arama testi `ground.json` bekliyor). `npm run build` temiz.
- Headless Chrome: sayfa açılıyor, `bvlosState.version = bal-0.1.0`, düz zemin (140 m), drone BİLSEM pedinden
  kalkıyor, sağ harita Saat Kulesi + BİLSEM + rotayı gösteriyor. Google katmanı container'da görünmez (ağ kapalı).

## Zafer Hoca'dan beklenen veriler

1. **GLO-30**: `Copernicus_DSM_COG_10_N39_00_E027_00_DEM.tif` (Ankara'daki gibi Copernicus tarayıcısından).
2. **OSM (Overpass Turbo, JSON çıktı)** — bu sorgu bölge dosyasıyla birebir uyumludur:

   ```
   [out:json][timeout:180];
   (
     way["building"](39.6015,27.8430,39.6645,27.9150);
     relation["building"](39.6015,27.8430,39.6645,27.9150);
     way["building:part"](39.6015,27.8430,39.6645,27.9150);
     way["highway"](39.6015,27.8430,39.6645,27.9150);
     way["leisure"](39.6015,27.8430,39.6645,27.9150);
     way["landuse"](39.6015,27.8430,39.6645,27.9150);
     way["natural"](39.6015,27.8430,39.6645,27.9150);
     way["amenity"](39.6015,27.8430,39.6645,27.9150);
     node["historic"](39.6015,27.8430,39.6645,27.9150);
     node["tourism"](39.6015,27.8430,39.6645,27.9150);
     node["amenity"](39.6015,27.8430,39.6645,27.9150);
     node["man_made"="tower"](39.6015,27.8430,39.6645,27.9150);
   );
   out body geom;
   ```

3. Google anahtarı: Google Cloud → `bvlos-ankara` projesi → Kimlik bilgileri → anahtarın web sitesi kısıtlamalarına
   `https://altieylul-bvlos-balikesir.vercel.app/*` ekle; yeni Vercel projesine `GOOGLE_MAPS_TILES_KEY` (Production).
   İsteğe bağlı `ARCGIS_API_KEY` için de aynı adres izni.
4. Balıkesir müziği ve (istenirse) yeni sesli kılavuz kayıtları.
5. Google Earth'te Balıkesir merkezine eğik bakış: gerçek 3B bina var mı? (Yoksa Karma görünüm zaten varsayılan.)

## Veri gelince

```sh
node tools/balikesir/prepare-data.mjs --dem raw/Copernicus_DSM_COG_10_N39_00_E027_00_DEM.tif --osm raw/balikesir-osm.json
node tools/balikesir/prepare-streets.mjs          # açılış haritası caddeleri (adlar --streets ile değiştirilebilir)
npm test && npm run build
```

`raw/` ve `*.tif` git dışıdır. `data/bal/report.txt` hangi yapıların bulunduğunu, BİLSEM ve Saat Kulesi yüksekliğini
ve kalkışa 250 m içindeki OSM adlarını yazar. OSM'deki Saat Kulesi konumu Google kaydından farklıysa
`region.json origin`, `originUTM`, `mission.js ANCHOR_FROM_HOME` birlikte güncellenir (test bayatlığı yakalar).

## Sıradaki adımlar

1. Arazi + OSM verisini işle; tarihi yapı menüsünün (Saat Kulesi, Zağanos Paşa Camii, Kuva-yi Milliye Müzesi,
   Atatürk Parkı, BİLSEM) OSM konumlarını doğrula; gece arama noktasının yeşil alana düştüğünü kontrol et.
2. Vercel projesi `altieylul-bvlos-balikesir` (GitHub `main` → otomatik üretim yayını, Node 22, build `npm run build`,
   çıktı `dist`). Önizleme yayınlarında kimlik koruması, üretim adresi herkese açık.
3. İsteğe bağlı: fotoğraftan temsili BİLSEM binası (beyaz cephe, kiremit renkli pencere bantları, kamelya) ve
   Saat Kulesi modeli; eklenirse `keep-zone.js` dikdörtgeni ve inceleme kamerası ayarı.
4. Kılavuz seslerinin (0, 2, 3, 19) yeniden üretimi; Balıkesir müziği.

## Çalıştırma

```sh
npm ci
npm test
npm run build
npm start   # http://127.0.0.1:5188/
```
