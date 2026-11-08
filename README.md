# EmlakSunum

Emlak daire ilanlarını müşteriye özel, paylaşılabilir bir sunuma dönüştürmek için hazırlanan statik web uygulaması.

## Özellikler

- Sahiplenmiş ilan verilerini kopyalayıp yapıştırma alanına aktarabilirsiniz.
- Fiyat, konum, oda sayısı, metrekare, kat ve ilan numarası için özel alanlar vardır.
- Fotoğraflar dosyadan seçilebilir ya da panodan yapılabilir.
- Sunum önizlemesi canlı güncellenir.
- “Sunumu oluştur” düğmesi ile müşteriye gönderilebilecek tek bir bağlantı üretir.

## Çalıştırma

```bash
python -m http.server 8000
```

Sonrasında tarayıcıda şu adresi açın:

```text
http://localhost:8000
```

GitHub Pages için `Settings > Pages > Deploy from a branch > main > /root` seçerek yayınlayabilirsiniz.

## Kullanım

1. Emlak ilanı sayfasını ziyaret edip bilgileri kopyalayın.
2. Yapıştırma alanına yapıştırın.
3. Fotoğrafları ekleyin.
4. Alanları kontrol edip düzenleyin.
5. “Sunumu oluştur” butonunu kullanarak bağlantıyı kopyalayın.

## Not

Bu sürüm statik ve sunucusuzdur; ilan bilgileri URL içinde paylaşılacak şekilde kodlanır. Gerçek bir veritabanı veya kullanıcı hesabı sistemi içermez.
