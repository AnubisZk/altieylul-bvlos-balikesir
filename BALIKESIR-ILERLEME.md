# Balıkesir / Altıeylül BİLSEM — ilerleme ve devir notu

Çalışma başka bir hesapta veya oturumda sürdürülürken ilk okunacak not budur. Sonra `CLAUDE-BALIKESIR-DEVIR.md`
dosyasını okuyun (Ankara'dan gelen ilk devir notu; kurallar orada). Yeni oturuma yapıştırılacak başlangıç mesajı:
`CLAUDE-BALIKESIR-BASLANGIC-MESAJI.txt`.

## Kısa durum (4 Kasım 2026, 21:30)

- Canlı: https://altieylul-bvlos-balikesir.vercel.app · depo `AnubisZk/altieylul-bvlos-balikesir` (main → Vercel otomatik).
- Var: GLO-30 arazi, 22 135 OSM kutu bina, Google gerçek şehir (Karma), ArcGIS hava görüntüsü, BİLSEM binası ve
  arkasındaki Altıeylül Fen Lisesi (MEB tip projesi, yordamsal, temsili) + BİLSEM kamelyası (Meshy), BİLSEM avlusu
  (düz beton meydan, istinat duvarları, fotoğraflara göre) ve Atatürk köşesi, Fen Lisesi beton avlusu, tarihi yapılar (Saat Kulesi, Kuva-yi Milliye Müzesi, Zağnos Paşa Camii,
  Balıkesir Garı; yordamsal, temsili), kalkış pedi BİLSEM ön bahçesinde, Saat Kulesi çevresinde 6 noktalı tur,
  Balıkesir müziği.
- Açık işler: aşağıda "Sıradaki adımlar".

## 4 Kasım 2026, 21:30 · BİLSEM avlusu ve cephesi fotoğraflara göre

- Zafer Hoca BİLSEM avlusunun ve ön cephesinin 11 fotoğrafını gönderdi ("okul bahçesi böyle").
- **Avlu** (`bilsem.json → bahce`, `drone/bilsem-bahce.js`): yamaca oyulmuş düz beton meydan. Güneyde boyası dökülen sarı
  istinat duvarı (5 m, üstünde demir parmaklık), batıda gri kalıp izli beton duvar (6 m, üstünde tel çit); duvar
  diplerinde bordür taşlı çim şeritler, köknar fidanları, genç ağaçlar (bazısı yapraksız, bazısı sarı), güneybatı
  köşesinde büyük ağaç ve sarmaşık; çim kenarında 13 koyu bank ve çöp kutuları; 7 aydınlatma direği; batıda kamelya
  (Meshy, yeri değişmedi), beyaz konteyner, bej taş blok, duvar dibinde beyaz pano; meydanda rögar kapakları, merdivene
  giden hissedilebilir yüzey, doğuda turuncu dubalar. Duvar yerleri fotoğraf ve uydu görüntüsünden **tahmini (±5 m)**:
  güney duvarı binanın ~35 m önünde ve binaya paralel (fotoğraflarda kaçış noktası bina ile aynı), batı duvarı batı
  ucunun ~7 m ötesinde. Zafer Hoca iki duvar köşesinin Google Haritalar noktasını verirse `bahce.walls`/`zone` düzeltilir.
- **Düz avlu**: DEM avlu boyunca batıdan doğuya ~6 m eğimliydi (bina batı ucunda ~3 m gömülüyordu). Artık avlu bina
  tabanı düzeyinde düz (`bilsemPlacement → yard.heightAt`); duvarlı kenarlarda (batı, güney) düz, açık kenarlarda
  (`open`: kuzey, doğu) son 6 m'de araziye bağlanır. Fizik zemini (`getGroundHeight`), kalkış pedi, rüzgâr çorabı, OSM
  kutularının tabanı ve Google dikey kalibrasyon noktası (`realCityAnchor`) bu düz zemini kullanır.
- **Koruma alanı "hole"**: `keep-zone.js` alanlarına `hole` bayrağı eklendi (vec3 `uKeepH`); bahçe/avlu alanlarında (BİLSEM,
  Fen, dört tarihi yapı) arazi ağı her iki görünümde de atılır, zemin kaplamadır (`clipToKeep(..., {holes:true})`).
- **Cephe** (`drone/bilsem-bina.js`, iki okul için aynı tip proje): batı ve doğu kanatları önde, ortadaki giriş bölümü
  1.5 m geride; dört kat, yükseltilmiş zemin kat (1.4 m, bej taş subasman); somon bant (#eab09c) ve kiremit kırmızısı
  çerçeve (#c2614c), antrasit doğramalar (fotoğraftan örneklenen renkler); cam saçak ve gergi çubukları, üç çift cam kapı,
  üstünde renkli kurum levhaları şeridi (temsili kutular, logo değil); ikinci kat bandının üstünde okul tabelası (beyaz,
  turkuaz çerçeve, temsili amblem, "BALIKESİR - ALTIEYLÜL / ALTIEYLÜL BİLİM VE SANAT MERKEZİ"); cephe boyunca teras ve
  önünde 8 basamaklı geniş merdiven, altı paslanmaz korkuluk; doğu kanadı boyunca engelli rampası; klima dış ünitesi.
- **Merdiven bloğu doğuda**: 4. fotoğrafta binanın doğu ucunun yan yüzünde dikey cam şerit (ve sarı levha) açıkça
  görünüyor; bu yüzden `style.endBlock: "east"` yapıldı (3 Kasım'daki "penceresiz duvar doğuda" cevabının tersi; batı
  yüzü artık penceresiz). Yanlışsa tek satır: `bilsem.json → style.endBlock: "west"`. Fen Lisesi de doğuda (hava
  fotoğrafı), iki okul artık aynalı değil.
- **Atatürk köşesi** merdivenin batı ucuna taşındı (fotoğraflarda büst ve bayrak binanın batı köşesinde, merdivenin
  yanında): `bahce.ataturk.at` = [-28.3, 14.6]; bayrak büstün girişe yakın (doğu) yanında.
- `npm test` 88/88 (yeni denetimler: giriş bölümü geride, merdiven bloğu doğuda, teras alçak, avlu düz ve kuzeyde araziye
  bağlanıyor, duvarlar pede uzak). Headless'ta avlu, cephe, giriş, Atatürk köşesi, doğu ucu ve kuşbakışı kontrol edildi;
  Karma görünümde Google zeminiyle birleşme (duvar üstleri, doğu/kuzey kenarı) canlıda bakılmalı.

## 4 Kasım 2026, 02:00 · Tarihi yapılar: Saat Kulesi, Kuva-yi Milliye Müzesi, Zağnos Paşa Camii, Balıkesir Garı

- Zafer Hoca fotoğrafları ve Google Haritalar noktalarını gönderdi. `drone/tarihi-yapilar.js` (yeni) yordamsal, temsili
  modeller kurar; veri `data/bal/tarihi-yapilar.json` (konum, yön, ölçü, kaynak notları). Her yapının çevresi koruma
  alanıdır (Google ağı atılır, zemin bizim: `createYard` kaplaması), ayak izine düşen OSM kutuları ayıklanır, çarpışma
  yerel kutu/silindir/kubbe parçalarıyla. Yapı inceleme menüsünde dördü de modelin ortasına bakar (`mission.js HERITAGE`
  lookHeight/elev; "Balıkesir Garı" eklendi).
- **Saat Kulesi**: Zafer Hoca'nın noktası 39.6456818, 27.8792595 (Google yer kaydının ~5 m batısı; `region.json origin`
  değişmedi, harita merkezi olarak kalır). Kare taş gövde, üç kat: kör kemer, tuğra ve kitabe; balkonlu kapı, yelpaze
  alınlık; dört yüzde saat (akrep/yelkovan tarayıcının saatini gösterir), modiyonlu saçak; sivri kemerli açık çan katı,
  kırma çatı, küçük kubbe ve paratoner. ~20 m (kaynak: 20 m, 1827). Moloz taş istinat duvarlı kaide ve demir parmaklık.
  Kaide köşesine düşen iki küçük OSM kutusu ayıklandı.
- **Kuva-yi Milliye Müzesi**: OSM ayak izi (kulenin ~34 m kuzeydoğusu, ~4 m aşağısı; Zafer Hoca'nın müze koordinatı
  kuleninkiyle aynı yapıştırılmıştı). Ön cephe Anafartalar Caddesi'ne (ÖGD 108°). Beyaz sıvalı zemin kat (demir
  parmaklıklı pencereler), koyu ahşap kaplamalı üst kat ve ortada çıkma, geniş saçaklı koyu kırma çatı; kemerli giriş
  saçağı, sütunlar, krem kapılar ve "MÜZE" tabelası, taş merdiven ve vazolar; bahçede düz yol, yeşil fenerler, fıstık
  çamı, antik taşlar; caddede taş kemerli kapı ("KUVA-YI MİLLİYE MÜZESİ", kafesli korkuluk, pirinç levha, dikey "MÜZE"),
  iki yanda moloz duvar üstünde yeşil parmaklık. Kapının kemerinin altından drone geçebilir. Zemin kat ön cepheye göre;
  arka yokuş yukarı (bina yamaca gömülür). Hacı Ali Camii (OSM kutusu) koruma alanı dışında bırakıldı.
- **Zağnos Paşa Camii**: OSM ayak izi (33 × 33.6 m) ve kubbe parçaları; Zafer Hoca'nın noktası (39.648934, 27.879955)
  kuzey cephenin önüne düşer. Kaynaklar (TDV İslâm Ansiklopedisi, Vikipedi): tuğla ve kesme taş, dişli taş plastırlar,
  üç sıra yuvarlak kemerli pencere (alt sıra yeşil demir parmaklıklı, üstler kafesli), cephelerin ortasında basık kemerli
  tonoz alınlıkları, dört köşe kubbesi ve dört köşe kulesi, sekizgen kasnak üstünde ana kubbe (Ø12.8 m) ve alem; kuzey,
  doğu ve batıda kurşun çatılı sundurmalar; güneyde hafif çıkıntılı mihrap; kuzeybatıda tek şerefeli yivli minare
  (~40 m); kuzey avluda on iki sütunlu şadırvan ve çınar; güneyde sekizgen kubbeli türbe (OSM'deki 537 m² türbe kutusu
  yerine) ve çimli hazire.
- **Balıkesir Garı**: OSM ayak izi (23.7 × 13.6 m) ve iki yanındaki tek katlı OSM yapıları (kanatlar). Ön cephe
  kuzeybatıda caddeye (326°), peron ve sundurma güneydoğuda raylara. Kesme taş, dişli köşe taşları; ortada alınlıklı
  çıkma blok ("TCDD", çift pencere, arka alınlıkta "BALIKESİR"), üç kemerli kapı ve "BALIKESİR GAR" yazısı; yanlarda
  kırma çatılı iki katlı bölümler ve bacalar; tek katlı kanatlar; sarı çizgili peron, beyaz çelik sundurma; bayrak.
  Arka alınlıktaki "1912" yazısı temsilidir (Osmanlıca kitabe yerine).
- Koruma alanı sınırı 4 → 8 (`keep-zone.js MAX_KEEP`; şimdi 7: ped, BİLSEM bahçesi, Fen avlusu, kule, müze, cami, gar).
- `npm test` 88/88 (yeni test: konumlar Zafer Hoca'nın noktaları ve OSM ile uyumlu, kule ~20 m, minare ~40 m, koruma
  alanları ayrık, Hacı Ali Camii korunur, OSM kutuları ayıklanır, kapıdan geçilir). Headless'ta dört yapı yakından ve
  sahnede kontrol edildi; Google katmanıyla uyum canlıda bakılmalı.
- Atatürk Parkı: Zafer Hoca'nın noktası (39.643690, 27.886327) parkın batı girişinde; inceleme kamerası OSM park
  alanının ortasına bakmaya devam ediyor. Park için model yapılmadı (ağaçlar, yollar, stadyum istenirse sonraki iş).

## 3 Kasım 2026, 23:55 · Bahçe, Atatürk köşesi, Google tümseği düzeltmesi

- Canlıda (Karma) BİLSEM cephesinin önünde havada asılı pembe bir yüzey görüldü (Zafer Hoca'nın ekran görüntüsü).
  Neden: Google ağı binayı arazide kabarık bir tümsek olarak verir ve üstüne kaymış çatı fotoğrafını giydirir;
  koruma alanı binanın yalnız 1,5 m dışına uzandığı için tümseğin eteği cephenin önünde kalıyordu.
  Düzeltme: koruma alanı artık okulun bahçesinin tamamı (`bilsem.json → bahce.zone`: yanlara 8, arkaya 8, öne 29 m;
  ped ve kamelya içinde) ve Fen Lisesi avlusu (`fenLisesi.avlu.zone`: her yöne 8 m). Koruma alanları: ped, BİLSEM
  bahçesi, Fen avlusu (3/4). Alanın içinde zemin bizim: `drone/bilsem-bahce.js` arazi ağının üçgenlerine birebir oturan
  kaplama (`city-world.js terrainSurface`), 4 cm yukarıda + polygonOffset; ped kaplamanın üstünde kalır.
  Canlıda kontrol: tümsek kalkmalı; bahçe kenarında Google zemini ile küçük bir basamak görünebilir.
- BİLSEM bahçesi Zafer Hoca'nın BİLSEM fotoğrafından: binanın önünde açık renk taş döşeme (kamelya döşemenin ön-batı
  köşesinde), önde ve batıda çim, çimde 10 çam fidanı ve 4 genç ağaç, 4 bank; arka ve doğu taş döşeme. Fen Lisesi:
  binanın çevresi beton avlu. Düzen `bilsem.json → bahce` (yerel metre, a doğu / b güney), elle değiştirilebilir.
- **Atatürk köşesi** (Zafer Hoca: "Atatürk büstü ve bayrak olacak"; 4 Kasım 00:15'te yeri ve görünüşü fotoğrafla
  düzeltildi): girişin solunda, cepheye dayalı (`bahce.ataturk.at` = [-3.4, 10.35]). Siyah, yukarı daralan kaide
  (1.3 m), ön yüzünde altın "NE MUTLU TÜRKÜM DİYENE", altın büst (temsili genel büst biçimi, portre değil). Tek bayrak
  (Zafer Hoca): büstün girişe yakın (doğu) yanında 6 m paslanmaz direk, bayrak batıya açılır (`poles: ["east"]`). BİLSEM'in
  giriş önündeki eski bayrak direği kaldırıldı (`style.flag: false`); Fen Lisesi'nin giriş bayrağı duruyor.
- Çarpışma: büst, bayrak direği, çam fidanları ve ağaçlar engel (pede en az 4 m + yarıçap; test denetler).
- `npm test` 87/87; headless'ta ped kamerası ve yapı inceleme görünümü kontrol edildi.

## 3 Kasım 2026, 23:30 · Altıeylül Fen Lisesi eklendi, yan cepheler, çatı rengi

- Zafer Hoca: BİLSEM'de penceresiz büyük yan duvar **doğu** ucunda, camlı merdiven bloğu batıda (model zaten öyle;
  doğu cephedeki uydurma pencereler kaldırıldı). Fen Lisesi bunun tersi: merdiven bloğu doğuda, penceresiz duvar batıda
  boş arsaya bakar (hava fotoğrafı). "Beri tarafta boş alan ve duvar var; Fen'de daha fazla, BİLSEM'de az" — arsa ve
  çevre duvarı modellenmedi (Karma görünümde Google zemini gösteriyor).
- **Fen Lisesi** (`bilsem.json → fenLisesi`): aynı tip proje, aynı ölçü ve yön, `style.endBlock: "east"` (aynalı).
  Konum Zafer Hoca'nın Google Haritalar uydu ekran görüntüsünden: Fen ve BİLSEM çatıları ile "Altıeylül Fen Lisesi
  Müdürlüğü" iğnesi (39.628403, 27.879561 — iğne binanın kuzeydoğusunda, çatı değil) karşılaştırıldı, BİLSEM'deki
  eğiklik düzeltmesi aynen uygulandı → merkez 39.628317, 27.878992 (BİLSEM'in ~74 m kuzeyi, ~14 m doğusu; ±5 m).
  Aynı görüntüde kamelya modeldeki yerine 3–4 m içinde oturuyor (ölçek ve hizalama doğrulaması).
  Renkler ön cephe fotoğrafından: 4. kat kırmızı, 2. kat mavi, giriş yeşil, uç blok turuncu çerçeve; tabela
  "ALTIEYLÜL FEN LİSESİ", girişin solunda bayrak direği. Yapı inceleme listesinde "Altıeylül Fen Lisesi" var.
- (23:55'te değişti: koruma alanları okul bahçeleri oldu, 3/4.) Fen ayak izine düşen OSM kutusu yok.
- Çatı rengi fotoğraflardaki turuncu kiremide yaklaştırıldı (`style.roof`, varsayılan `#c47a55`).
- `npm test` 87/87.

## 3 Kasım 2026, 23:00 · BİLSEM binası tip projeye göre yeniden kuruldu

- Zafer Hoca: BİLSEM ile arkasındaki **Altıeylül Fen Lisesi aynı tip proje**; Fen Lisesi'nin ön (iki) ve arka cephe
  fotoğraflarını gönderdi. Kamelyaya dokunulmadı (BİLSEM kamelyası Fen Lisesi'ninkinden farklı yerde; Meshy modeli ve
  `bilsem.json → kamelya.at` aynen duruyor).
- `drone/bilsem-bina.js` (yeni): yordamsal bina. Dört kat + subasman; katlarda çerçeveli pencere bantları (2. ve 4. kat
  pembe zemin + bordo çerçeve, renkler BİLSEM fotoğraflarından üretilen Meshy modelinden); ortada öne çıkan giriş,
  saçak ve "ALTIEYLÜL BİLİM VE SANAT MERKEZİ" tabelası, basamaklar, bayrak direği (Türk bayrağı, hafif dalgalanır);
  batı ucunda öne ve arkaya taşan merdiven bloğu (batı yüzünde dikey cam şerit, arkada küçük kare WC pencereleri);
  arkada camlı merdiven kulesi; geniş saçaklı kiremit kırma çatı (ana çatı + uç blok çatısı birleşimi, mahyalar yalnız
  görünen sırtlarda), bacalar, yağmur inişleri. Doku yalnız çatıda (tuvalde üretilen alaturka kiremit); dosya
  indirmesi yok. Dış kutu yine ölçülen kutu (59.2 × 26 m, 21 m; mahya ≈ 20.2 m).
- Meshy'deki gibi merdiven bloğu batıda kabul edildi (Fen Lisesi'nde doğuda; aynalı olabilir). Yanlışsa
  `bilsem.json → style.endBlock: "east"`. Bant renkleri ve katları `style.band`, `bandFrame`, `bandFloors`.
  `style.model: "meshy"` eski Meshy binasına döner (GLB'deki `Bina` düğümü duruyor; kamelya için GLB zaten yükleniyor).
- Çarpışma: bina kutusu yerine plan yüksekliği (duvar + kırma çatı + kule); bayrak direği ayrı engel. Koruma alanları
  (Google ağı kırpma) değişmedi: ped, bina kutusu, kamelya.
- `npm test` 86/86 (yeni test: hacimler ölçülen kutuda, çatı ≤ 21 m, ped/kamelya bina dışında, direk pede > 15 m).
  Headless'ta gündüz ve akşam görünümü, yapı inceleme ve ped kamerası kontrol edildi; Google katmanı burada görünmez,
  Karma görünümde zeminle uyum canlıda bakılmalı.
- Bahçe yapılmadı: BİLSEM bahçesinin gerçek düzeni (çim mi, Fen Lisesi'ndeki gibi beton avlu mu, çam fidanları nerede)
  belli değil; Karma görünümde zemin zaten Google görüntüsü. Zafer Hoca'dan bilgi/fotoğraf bekleniyor.

## 3 Kasım 2026, 18:00 · BİLSEM binası, kalkış pedi, müzik

- Zafer Hoca Meshy modeli gönderdi (`Meshy_AI_School_Building_in_Gr_1103144257_texture.glb`, 88 MB, 1.06 M üçgen,
  8K doku; repoda yok, `raw/bilsem-meshy.glb`). `tools/balikesir/prepare-bilsem.mjs` → `models/bilsem-bina.glb`
  (4.3 MB; düğümler `Bina` ~47.5 bin, `Kamelya` ~6 bin üçgen; Meshy'nin iki çamı atıldı) ve
  `data/bal/bilsem.json → model` kutuları.
- Konum/ölçü: Google 2D uydu karosu (Map Tiles API, aynı anahtar) Leaflet'te koordinatlı açılıp ölçüldü. Çatı
  59.2 m (D-B) × ~27 m; görüntü kuzeyden eğik (kuzey cephe görünüyor) olduğu için çatı ~9 m kuzeye kaydırılarak taban
  bulundu. Eksen ~1.4° (doğu ucu kuzeyde). Yükseklik 21 m kabul edildi (Meshy oranı 24 m veriyordu; dikeyde ölçekli).
  Zafer Hoca'nın ilk işareti (39.627485, 27.878935) ön cephe girişine düşüyordu.
- Kamelya ("oturma yeri") Meshy'de binaya yapışıktı; Zafer Hoca "daha beride" dedi. Görüntüde cephenin ~15 m önünde,
  batı ucunda: ayrı düğüm olarak oraya kondu (`bilsem.json → kamelya.at`).
- Kalkış pedi (`region.json home`) ön avluya taşındı: 39.6273509, 27.878743 (cepheden ~19 m, kamelyanın ~15 m
  doğusu). `ANCHOR_FROM_HOME` = [30, −2031].
- `drone/bilsem.js`: yönlü kutu çarpışma (bina ve kamelya; çarpma = kaza), Google ağı bina/kamelya kutusunda atılır
  (`keep-zone.js extra`), ped koruma alanı 8 m'ye indi. Tarihi yapı menüsündeki "Altıeylül BİLSEM" binaya bakar.
- Müzik: `music/over-the-aegean-horizon.mp3` (Zafer Hoca'nın kaydı); geçici `seven-hills-at-dawn.mp3` kaldırıldı.
- `npm test` 85/85. Headless'ta bina, kamelya ve ped görüldü.

## 3 Kasım 2026, 17:35 · Google ve ArcGIS anahtarları

- Vercel Production: `GOOGLE_MAPS_TILES_KEY` ve `ARCGIS_API_KEY` tanımlı (değerler kaynakta yok). Yeniden yayından sonra
  canlı sitede: "Şehir: Karma" düğmesi görünüyor, Google katmanı yüklenip BİLSEM bahçesinde kalibre oldu (geoit
  41.1 m), ArcGIS hava görüntüsü hazır (64 karo, zoom 17). Zafer Hoca'nın tarayıcısında doğrulandı.
- Google anahtarının izinli adresleri: Ankara ve Balıkesir vercel.app adresleri (geniş `*.vercel.app` kalıbı yok).
- ArcGIS kuruluşunun yenileme tarihi 2 Aralık 2026; anahtarın son kullanma tarihi takip edilmeli.

## 3 Kasım 2026, 17:10 · Gerçek arazi ve OSM verisi

- Zafer Hoca GLO-30 paftasını (`Copernicus_DSM_COG_10_N39_00_E027_00_DEM.tif`, 45 MB) ve overpass-turbo
  **GeoJSON** dışa aktarımını (`export.geojson`, 22 MB, OSM 2026-11-03T14:02Z) gönderdi. Ham dosyalar repoda yok
  (`raw/` git dışı). `prepare-data.mjs` artık GeoJSON'u da okur (çokgenlerin dış halkası; ham JSON da çalışır).
- `terrain.json`: 301 × 341 nokta, 20 m, 103.5–359.8 m. Saat Kulesi ≈ 159.9 m, BİLSEM kalkışı ≈ 163.9 m.
  `fallbackElevation` 160 yapıldı.
- `buildings.json`: 22 135 bina (21 933'ünün yüksekliği tahmini; çoğu `building=yes` → 10 m). `ground.json`: 7031 öğe.
- Tarihi yapılar (OSM): Zağnos Paşa Camii (way 211424804; Balıkesir'deki doğru yazım "Zağnos"), Kuva-yi Milliye
  Müzesi (way 232389727, Saat Kulesi noktasına 34 m), Atatürk Parkı (way 232036050). **Saat Kulesi** OSM çıktısında
  adıyla yok → Google kaydındaki başlangıç noktası kullanılıyor. **BİLSEM** binası OSM'de adsız; kalkışa en yakın
  bina 76 m (aynı boyda beş bina dizisi, ~267 m²). Fotoğraftaki BİLSEM binasının OSM'de olup olmadığı doğrulanmalı.
- Açılış haritası caddeleri: Anafartalar, Kızılay, Atalar, Milli Kuvvetler, Zağnos Paşa Caddesi.
- `npm test`: 84/84 (gece arama testi artık gerçek yeşil alanla çalışıyor). Headless Chrome (yazılım GPU): 22 135 bina,
  sayfa ~22 sn'de hazır (Ankara 8313 binada ~7 sn). Gerçek GPU'lu okul bilgisayarında ölçülmeli; yavaşsa küçük
  binalar veya eğitim çemberi dışı binalar elenir.

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
- Müzik: (18:00'de Over the Aegean Horizon geldi.) Konuma göre müzik bölgesi yok;
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

### Yayın (3 Kasım, 17:00)

- Vercel projesi `altieylul-bvlos-balikesir` (prj_MCDlAn2HZIDP1pA2OiUuMs48r9IK, takım team_cQj2sAnuqQqKoymTzVlCgwG8),
  Node 22.x, build `npm run build`, çıktı `dist`. Kimlik koruması yalnız önizlemelerde; üretim adresi herkese açık.
- Canlı adres: https://altieylul-bvlos-balikesir.vercel.app (ilk yayın `dcaab88`, düz zemin, `bal-0.1.0`).
- `GOOGLE_MAPS_TILES_KEY` henüz girilmedi (gerçek şehir düğmesi görünmez).

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

## Veri yenilenirse

```sh
node tools/balikesir/prepare-data.mjs --dem raw/Copernicus_DSM_COG_10_N39_00_E027_00_DEM.tif --osm raw/balikesir-osm.json
node tools/balikesir/prepare-streets.mjs          # açılış haritası caddeleri (adlar --streets ile değiştirilebilir)
npm test && npm run build
```

`raw/` ve `*.tif` git dışıdır. `data/bal/report.txt` hangi yapıların bulunduğunu, BİLSEM ve Saat Kulesi yüksekliğini
ve kalkışa 250 m içindeki OSM adlarını yazar. OSM'deki Saat Kulesi konumu Google kaydından farklıysa
`region.json origin`, `originUTM`, `mission.js ANCHOR_FROM_HOME` birlikte güncellenir (test bayatlığı yakalar).

## Sıradaki adımlar

0. Zafer Hoca canlıda BİLSEM avlusuna baksın: duvarların yeri (iki duvar köşesinin Google Haritalar noktası gelirse
   düzeltilir), Karma görünümde duvar üstlerinin Google zeminiyle birleşmesi, merdiven bloğunun doğuda olduğu.
0. Zafer Hoca canlıda tarihi yapılara baksın: yerleri (kaydırma `tarihi-yapilar.json → center`, yön `front`), Google
   zemini ile birleşme, kule ve minare boyu. Atatürk Parkı için ne istendiği (ağaçlar, yollar, stadyum?).
0. Zafer Hoca canlıda iki okula baksın: cephe önündeki Google tümseği kalktı mı, bahçe kenarında Google zemini ile
   basamak var mı, Fen Lisesi'nin yeri (±5 m; kaydırma yalnız `bilsem.json → fenLisesi.center`), Atatürk köşesinin ve
   bahçe düzeninin yeri (`bilsem.json → bahce`). Batıdaki boş alan ve duvar henüz yok (ölçü bekleniyor).
1. Zafer Hoca canlı sitede BİLSEM'i kontrol etsin: binanın yeri/yönü, kamelya ve ped konumu, Karma görünümde Google
   zemini ile uyum. Kaydırma gerekirse yalnız `data/bal/bilsem.json` (building.center, kamelya.at) ve
   `region.json home` değişir; testler (`tests/balikesir.test.mjs`) tutarlılığı denetler.
2. Okul bilgisayarında açılış süresi ve FPS (22 135 bina). Yavaşsa küçük binalar / eğitim çemberi dışı binalar elenir
   (`prepare-data.mjs` veya `city-world.js` içinde süzgeç).
3. (4 Kasım'da yapıldı: Saat Kulesi Zafer Hoca'nın noktasında modellendi, koruma alanı eklendi.)
4. Kılavuz seslerinin (paragraf 0, 2, 3, 19) Balıkesir metniyle yeniden üretimi (`drone/guide-audio.json` listesi).
5. Bina yükseklikleri çoğunlukla tahmini (10 m); istenirse mahalleye göre kat sayısı varsayımı.

## Ham dosyalar (repoda yok, Zafer Hoca'da)

- `Copernicus_DSM_COG_10_N39_00_E027_00_DEM.tif` → `raw/`, `export.geojson` (overpass-turbo) → `raw/balikesir-osm.geojson`
- `Meshy_AI_School_Building_in_Gr_1103144257_texture.glb` → `raw/bilsem-meshy.glb`
- Yeniden üretim: `node tools/balikesir/prepare-data.mjs --dem raw/<tif> --osm raw/balikesir-osm.geojson`,
  `node tools/balikesir/prepare-streets.mjs`, `node tools/balikesir/prepare-bilsem.mjs --in raw/bilsem-meshy.glb`.
  İşlenmiş çıktılar (`data/bal/*.json`, `models/bilsem-bina.glb`) repoda olduğundan ham dosya yalnız yeniden üretim için
  gerekir.

## Çalıştırma

```sh
npm ci
npm test
npm run build
npm start   # http://127.0.0.1:5188/
```
