# ⚓ Amiral Battı (Taktiksel Deniz Savaşı)

Modern web teknolojileriyle geliştirilmiş, stratejik **Mana Sistemi** ve **Özel Yetenekler** (Bomba, Radar, Nükleer) içeren interaktif Amiral Battı oyunu.

---

## 🌟 Öne Çıkan Özellikler

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

Tarayıcınızda açın:
```
http://localhost:3000
```

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

---

## 📜 Lisans

MIT License © 2026 Sabahattin
