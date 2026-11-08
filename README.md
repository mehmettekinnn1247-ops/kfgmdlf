# İlanSunum

İlan metnini yapıştırıp düzenleyerek müşterilerle paylaşılabilir bir ilan sunumu bağlantısı oluşturmak için hazırlanan web tabanlı demo.

## Özellikler

- Kopyalanan ilan metninden başlık, fiyat ve bazı özellikleri otomatik ayıklamaya çalışır.
- Fotoğraflar dosya olarak seçilebilir veya panodan yapıştırılabilir; görseller tarayıcıda küçültülür.
- Sunum önizlemesi, başlık, fiyat, konum, açıklama, özellikler ve iletişim bilgileri düzenlenebilir.
- Oluşturulan paylaşım bağlantısı, ilan verilerini URL içinde taşır; sunumu açmak için bir hesap gerekmez.
- Mobil uyumlu tasarım ve sunum fotoğraf galerisi.

## Çalıştırma

Statik dosyaları bir web sunucusunda yayınlayın. Yerelde hızlıca denemek için:

```bash
python -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. GitHub Pages ile yayınlamak için depoda **Settings → Pages → Deploy from a branch → main → /(root)** seçin.

## Kullanım

1. İlan sayfasından kopyaladığınız içeriği yapıştırma alanına yapıştırın. Tarayıcı panoya ilan fotoğraflarını koyduysa, görsel adresleri de alınabilir; aksi halde fotoğrafları ayrıca seçin veya panodan yapıştırın.
2. Otomatik doldurulan alanları ve fotoğrafları kontrol edip düzenleyin.
3. **Sunumu oluştur** düğmesine basıp bağlantıyı kopyalayın.

## Önemli sınırlar

Bu sürüm tamamen statik ve sunucusuz bir başlangıç sürümüdür. Sunum bilgileri bağlantının içine kodlanır; gerçek bir veritabanına kaydedilmez. Fotoğraflar da bağlantıya gömüldüğünden çok büyük bağlantılar oluşabilir; görseller tarayıcıda sıkıştırılır ve bağlantı için boyut sınırı uygulanır. Kalıcı kayıt, özel alan adı, yönetim paneli, parola/erişim kontrolü, bağlantı silme ve büyük fotoğraflar için depolama gerekiyorsa bir backend ve nesne depolama servisi eklenmelidir.

Otomatik ilan okuma, ilan sayfasının panoya kopyaladığı içeriğe bağlıdır. Bazı siteler kopyalanan içerikte görsel veya ilan özelliklerini vermeyebilir; bu durumda alanları elle düzenleyip fotoğrafları ayrıca yükleyebilirsiniz. Bu araç ilan sayfalarını arka planda taramaz ve oturum açma bilgisi istemez. İlan içeriğini ve görselleri paylaşmaya yetkili olduğunuzdan emin olun.
