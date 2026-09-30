# ⚓ Amiral Battı (Taktiksel Deniz Savaşı)

Modern web teknolojileriyle geliştirilmiş, stratejik **Mana Sistemi** ve **Özel Yetenekler** (Bomba, Radar, Nükleer) içeren interaktif Amiral Battı oyunu.

---

## 🌟 Öne Çıkan Özellikler

- **🎮 İki Farklı Oyun Modu**:
  - **🤖 Bota Karşı (Tek Oyunculu)**: Taktiksel yapay zekaya karşı tek başınıza mücadele edin.
  - **👥 Aynı Cihazda Sırayla (2 Oyuncu / Hotseat Pass & Play)**: Arkadaşınızla tek bir ekranda (bilgisayar veya tablet/telefon) yan yana sırayla oynayın.
  - **🔒 Akıllı Gizlilik Perdesi**: 2 oyunculu modda sıra veya hazırlık devirlerinde ekran otomatik olarak kararır, böylece rakibiniz gemi yerleşiminizi ve gizli taktiklerinizi göremez.

- **🗺️ Değiştirilebilir Harita Boyutu (Map Scaling)**:
  - **8×8 Hızlı**: Kompakt ve seri çatışmalar için hızlı harita boyutu.
  - **10×10 Standart**: Klasik amiral battı taktiksel oyun tahtası.
  - **12×12 Epik**: Geniş deniz sahası, derin strateji ve uzun soluklu mücadele.
  - Oyun mod modalından veya tersane panelindeki hap butonlardan tek tıkla dinamik değişim.
  - Koordinat harfleri/rakamları ve CSS ızgara sistemi seçilen boyuta anında uyum sağlar.

- **🏝️ Harita Temaları & Doğal Engeller (Kara, Buzul, Resifler)**:
  - **🌊 Açık Okyanus**: Engelsiz açık sular, saf klasik taktik savaşı.
  - **🧊 Kutup & Buzullar**: Geçit vermeyen yüzen buz kütleleri ve buz dağları.
  - **🏝️ Takımada**: Tropik kara parçaları, adacıklar ve korunaklı koylar.
  - **🪨 Fırtınalı Kayalıklar**: Sarp kayalıklar, sığ resifler ve dar boğazlar.
  - **🤖 Önemli Maçlarda Zorunlu Rastgelelik**: Bota karşı rekabetçi maçlarda tema zorunlu rastgele belirlenir; arkadaşlara karşı özel maçlarda tema dilediğiniz gibi seçilebilir.
  - **⚖️ Kusursuz Simetri & Şeffaflık**: Engeller her iki oyuncunun hem radar hem savunma ızgarasında her zaman görünür.
  - **🛡️ Haksız Ceza Yok**: Doğal engellere tıklamak atış sırasını veya manayı tüketmez; oyuncuyu uyarıp hakkını korur.
  - **⚓ Çözülebilirlik Garantisi**: Engel üretim algoritması tüm filonun sorunsuz yerleşebileceğini matematiksel olarak garanti eder.

- **🛠️ İnteraktif Donanma Konuşlandırma (Tersane)**:
  - Gemileri tek tek seçerek tahtaya yerleştirme veya konumlarını değiştirme.
  - Yatay ve dikey yerleştirme için tek tık ve klavye kısayolu (**`R`** tuşu).
  - Anlık yeşil/kırmızı gölge önizlemesi ile hatasız yerleşim.
  - Hızlı başlangıç için **`🎲 Rastgele`** ve **`🗑️ Temizle`** butonları.
  - Özel **L-Hücumbot** ve klasik gemi tasarımları.

- **💧 Mana Gücü & Taktiksel Yetenekler**:
  - **📡 Radar (2 Mana)**: 3×3 alandaki gemi parçalarını hasar vermeden tespit eder ve yeşil neon radar sinyaliyle işaretler.
  - **💣 Bomba (4 Mana)**: 3×3 alandaki tüm karelere yaylım ateşi açarak toplu hasar verir.
  - **☢️ Nükleer (6 Mana)**: Hedeflenen koordinatta gemi varsa, boyutu ne olursa olsun tüm gemiyi tek atışta anında batırır.
  - **⚡ +2 Mana Şarj Butonu**: Test ve taktiksel şarj için hızlı doldurma.

- **⌨️ Pratik Klavye Kısayolları**:
  - `1`: Bomba Seçimi
  - `2`: Radar Seçimi
  - `3`: Nükleer Seçimi
  - `Escape` veya `Sağ Tık`: Yetenek İptali
  - `R`: Gemi Döndürme (Hazırlık aşamasında)

- **🛡️ Oyun İçi Mod Koruması & Çıkış Sistemi**:
  - Devam eden bir savaş sırasında yanlışlıkla mod değiştirilmesini engelleyen akıllı onay penceresi (`⚠️ Savaş Devam Ediyor`).
  - İstendiğinde savaşı sıfırlayıp güvenle çıkmak için başlıktaki özel **`🏳️ Çıkış / Sıfırla`** butonu.

- **📱 Mobil ve Yerel Ağ (Wi-Fi) Uyumluluğu**:
  - Sunucu başlatıldığında bilgisayarın yerel ağ IP adresini otomatik algılar (Örn: `http://192.168.1.XX:3000`).
  - Aynı Wi-Fi'a bağlı telefon ve tabletlerden hiçbir ek ayar gerekmeden oyuna anında bağlanıp arkadaşlarla canlı oynanabilir.
  - Mobil cihazlarda dokunmatik dostu yerleşim, parmak erişimi için optimize edilmiş hızlı hazırlık çubuğu (`🔄 Döndür`, `🎲 Rastgele`, `⚔️ Savaş`) ve otomatik sekme geçişleri (`100dvh`).

- **🖥️ Responsive & Modern Arayüz**:
  - Kaydırma (scroll) gerektirmeyen, ekrana tam oturan viewport yerleşimi.
  - Web Audio API ile tamamen prosedürel ses efektleri (tıklama, top atışı, isabet, ıska, radar sinyali, nükleer patlama).
  - Masaüstü ve mobil ekranlara uyumlu sekme ve HUD sistemi.

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için:

```bash
# Bağımlılıkları yükleyin
npm install

# Yerel sunucuyu başlatın
npm start
```

Terminalde beliren bağlantıları kullanarak oyuna erişin:
- **💻 Bilgisayarda Oynamak İçin**: `http://localhost:3000`
- **📱 Telefondan / Arkadaşlarla Oynamak İçin**: `http://<LAN_IP>:3000` (Aynı Wi-Fi ağına bağlı olunmalıdır)

---

## 🧪 Testleri Çalıştırma

Tüm birim ve akış testlerini çalıştırmak için:

```bash
npm test
```

Test kapsamı:
- Donanma kuralları ve çakışma kontrolleri
- İsabet, ıska ve sıra takip kuralları
- Mana yenilenmesi ve yetenek tüketimleri
- Radar, Bomba ve Nükleer yeteneklerinin tüm senaryoları
- 2 Oyunculu (Hotseat / Local PvP) hazırlık, sıra devri ve zafer akışları

---
