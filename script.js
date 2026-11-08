(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const builder = $('#builder');
  const presentation = $('#presentation');
  const toast = $('#toast');
  const fields = {
    title: $('#title-input'), price: $('#price-input'), location: $('#location-input'),
    reference: $('#reference-input'), phone: $('#phone-input'), features: $('#features-input'),
    description: $('#description-input')
  };
  let photos = [];
  let activePhoto = 0;
  let toastTimer;

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function listingData() {
    return { title: fields.title.value.trim(), price: fields.price.value.trim(), location: fields.location.value.trim(), reference: fields.reference.value.trim(), phone: fields.phone.value.trim(), features: fields.features.value.split(/\n+/).map((x) => x.trim()).filter(Boolean), description: fields.description.value.trim(), photos };
  }
  function updatePreview() {
    const data = listingData();
    $('#preview-title').textContent = data.title || 'İlan başlığınız burada görünecek';
    $('#preview-price').textContent = data.price || 'Fiyat bilgisi';
    $('#preview-location').querySelector('span').textContent = data.location || 'Konum bilgisi';
    $('#preview-description').textContent = data.description || 'İlan açıklaması burada müşterinize sunulacak.';
    const featureContainer = $('#preview-features');
    featureContainer.replaceChildren();
    (data.features.length ? data.features.slice(0, 6) : ['Özellikleriniz burada']).forEach((feature) => {
      const chip = document.createElement('span'); chip.textContent = feature; featureContainer.append(chip);
    });
    const ref = $('#preview-reference');
    ref.hidden = !data.reference;
    ref.textContent = data.reference ? `İlan No: ${data.reference}` : '';
    const call = $('#preview-call');
    call.hidden = !data.phone;
    call.href = data.phone ? `tel:${data.phone.replace(/[^+\d]/g, '')}` : '#';
    const img = $('#preview-image');
    const placeholder = $('#image-placeholder');
    const count = $('#photo-count');
    const prev = $('#gallery-prev'), next = $('#gallery-next');
    if (photos.length) {
      img.src = photos[activePhoto]; img.style.display = 'block'; placeholder.hidden = true;
      count.hidden = false; count.textContent = `${activePhoto + 1} / ${photos.length}`;
      prev.hidden = photos.length < 2; next.hidden = photos.length < 2;
    } else {
      img.removeAttribute('src'); img.style.display = 'none'; placeholder.hidden = false;
      count.hidden = true; prev.hidden = true; next.hidden = true;
    }
  }
  function extractListing(rawText, html = '') {
    const text = rawText.replace(/\u00a0/g, ' ').split('\n').map((line) => line.trim()).filter(Boolean);
    const content = text.join('\n');
    const title = text.find((line) => line.length > 10 && line.length < 140 && !/(ilan no|\d{1,3}(\.\d{3})+\s*(tl|₺)|\d{4}\s*model)/i.test(line));
    if (title && !fields.title.value.trim()) fields.title.value = title;
    const price = content.match(/(?:₺\s*[\d.]+(?:,\d+)?|[\d.]+(?:,\d+)?\s*(?:TL|₺))/i);
    if (price && !fields.price.value.trim()) fields.price.value = price[0].replace(/\s+/g, ' ').trim();
    const ref = content.match(/(?:ilan\s*(?:no|numaras[ıi])|#)\s*[:.]?\s*(\d{5,})/i);
    if (ref && !fields.reference.value.trim()) fields.reference.value = ref[1];
    const locationLine = text.find((line) => /(?:\bMah\.|\bMahallesi|\bCad\.|\bSok\.|\bİlçe|\bİl\s*:|\b/iu.test(line) && /[A-Za-zÇĞİÖŞÜçğıöşü]+\s*\/\s*[A-Za-zÇĞİÖŞÜçğıöşü]+/.test(line));
    if (locationLine && !fields.location.value.trim()) fields.location.value = locationLine;
    const labels = /^(oda sayısı|brüt m²|net m²|bulunduğu kat|kat sayısı|ısıtma|banyo sayısı|balkon|eşya durumu|kullanım durumu|site içerisinde|aidat|krediye uygun|kimden|marka|seri|model|yıl|kilometre|yakıt|vites|kasa tipi|motor hacmi|çekiş|renk|plaka|durumu|konum|mahalle|ilçe|il)\s*[:：]?\s*(.+)$/i;
    const detected = [];
    const descriptionLines = [];
    text.forEach((line) => {
      const match = line.match(labels);
      if (match) detected.push(`${match[1].replace(/\b\w/g, (c) => c.toLocaleUpperCase('tr-TR'))}: ${match[2]}`);
      else if (line.length > 35 && line !== title && !/^(ilan no|favori|paylaş|tüm ilanlar)/i.test(line)) descriptionLines.push(line);
    });
    if (detected.length && !fields.features.value.trim()) fields.features.value = [...new Set(detected)].join('\n');
    if (descriptionLines.length && !fields.description.value.trim()) fields.description.value = descriptionLines.slice(-8).join('\n\n');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const imageUrls = [...doc.querySelectorAll('img')].map((image) => image.currentSrc || image.src || image.getAttribute('src')).filter((src) => src && /^https?:\/\//i.test(src));
    if (imageUrls.length) {
      const unique = [...new Set(imageUrls)].filter((url) => !/logo|avatar|icon|sprite/i.test(url));
      photos = [...new Set([...photos, ...unique])].slice(0, 12);
    }
    updatePreview();
    const status = $('#paste-status');
    status.textContent = `İçerik alındı${detected.length ? ` · ${detected.length} özellik bulundu` : ''}${photos.length ? ` · ${photos.length} fotoğraf` : ''}`;
    notify('İlan içeriği aktarıldı. Alanları kontrol edip düzenleyebilirsiniz.');
  }
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return reject(new Error('Bu dosya bir görsel değil.'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Görsel okunamadı.'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Görsel açılamadı.'));
        image.onload = () => {
          const scale = Math.min(1, 1500 / Math.max(image.naturalWidth, image.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
          canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  async function addImageFiles(files) {
    const available = Math.max(0, 12 - photos.length);
    if (!available) return notify('En fazla 12 fotoğraf ekleyebilirsiniz.');
    const selected = [...files].filter((file) => file.type.startsWith('image/')).slice(0, available);
    try {
      const images = await Promise.all(selected.map(compressImage));
      photos.push(...images); activePhoto = photos.length - 1; updatePreview();
      $('#paste-status').textContent = `${photos.length} fotoğraf sunuma eklendi`;
    } catch (error) { notify(error.message || 'Fotoğraf eklenemedi.'); }
  }
  function getSafeListing() {
    const data = listingData();
    if (!data.title) { fields.title.focus(); notify('Lütfen ilan başlığını girin.'); return null; }
    return data;
  }
  function encodeListing(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = ''; bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
  function decodeListing(encoded) {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  function publish() {
    const data = getSafeListing(); if (!data) return;
    const payload = encodeListing(data);
    const url = `${location.origin}${location.pathname}#sunum=${payload}`;
    if (url.length > 1800000) return notify('Fotoğraflar bağlantı sınırını aşıyor. Daha az veya daha küçük fotoğraf seçin.');
    history.replaceState(null, '', `#sunum=${payload}`);
    renderPresentation(data, true);
  }
  function renderPresentation(data, ownerView = false) {
    builder.hidden = true; presentation.hidden = false;
    const safePhotos = Array.isArray(data.photos) ? data.photos.filter((src) => typeof src === 'string' && /^(data:image\/(?:jpeg|png|webp);base64,|https?:\/\/)/i.test(src)).slice(0, 12) : [];
    const title = escapeHtml(data.title || 'İlan sunumu');
    const price = escapeHtml(data.price || 'Fiyat için iletişime geçin');
    const locationText = escapeHtml(data.location || 'Konum belirtilmemiş');
    const phone = String(data.phone || '').replace(/[^+\d]/g, '');
    const features = (Array.isArray(data.features) ? data.features : []).map((item) => String(item).slice(0, 160));
    const gallery = safePhotos.map((src, index) => `<button type="button" data-gallery-index="${index}" aria-label="Fotoğraf ${index + 1}"><img src="${src}" alt="İlan fotoğrafı ${index + 1}" loading="lazy"></button>`).join('');
    const featureHtml = features.map((item, index) => `<div class="presentation-feature"><small>ÖZELLİK ${String(index + 1).padStart(2, '0')}</small><strong>${escapeHtml(item)}</strong></div>`).join('');
    const description = escapeHtml(data.description || 'Bu ilan için ek açıklama girilmemiş.');
    const reference = data.reference ? `<div class="presentation-footer">İlan No: ${escapeHtml(data.reference)}</div>` : '';
    const ownerTools = ownerView ? `<div class="share-tools"><span>Sunum bağlantınız hazır. Bu bağlantıyı müşterinizle paylaşabilirsiniz.</span><button id="copy-link" type="button">Bağlantıyı kopyala</button></div><a class="back-link" id="edit-link" href="#">← Düzenlemeye dön</a>` : '';
    presentation.innerHTML = `${ownerTools}<nav class="presentation-nav"><a class="brand" href="./"><span class="brand-icon">İ</span><span>ilan<span class="brand-light">sunum</span></span></a><span class="presentation-tag">Size özel ilan sunumu</span></nav><div class="presentation-wrap"><section class="presentation-cover">${safePhotos.length ? `<img id="cover-image" src="${safePhotos[0]}" alt="${title}">` : '<div style="height:100%;display:grid;place-items:center;color:#9ba6b7;font-size:50px">⌂</div>'}<div class="cover-label"><small>${locationText}</small><h1>${title}</h1><div class="cover-price">${price}</div></div></section>${safePhotos.length > 1 ? `<div class="presentation-gallery">${gallery}</div>` : ''}<div class="presentation-layout"><section class="presentation-panel"><h2>İlan özellikleri</h2><div class="presentation-features">${featureHtml || '<p class="presentation-description">Bu ilan için henüz özellik eklenmemiş.</p>'}</div><h2 style="margin-top:24px">Açıklama</h2><div class="presentation-description">${description}</div></section><aside class="presentation-panel contact-panel"><h2>İlan hakkında</h2><div class="contact-price">${price}</div>${phone ? `<a href="tel:${escapeHtml(phone)}">☎ &nbsp; ${escapeHtml(data.phone)}</a><p>Detaylı bilgi almak için arayın.</p>` : '<p>İlan hakkında daha fazla bilgi için ilanı paylaşan kişiyle iletişime geçin.</p>'}</aside></div>${reference}<div class="presentation-footer">Bu sunum ilan bilgileri kullanılarak oluşturulmuştur.</div></div><div id="gallery-modal" class="gallery-modal" hidden><button type="button" aria-label="Kapat">×</button><img alt="Büyük ilan fotoğrafı"></div>`;
    const copyButton = $('#copy-link', presentation);
    if (copyButton) copyButton.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(location.href); copyButton.textContent = 'Kopyalandı ✓'; setTimeout(() => { if (copyButton.isConnected) copyButton.textContent = 'Bağlantıyı kopyala'; }, 2200); }
      catch { notify('Bağlantıyı adres çubuğundan kopyalayın.'); }
    });
    const edit = $('#edit-link', presentation);
    if (edit) edit.addEventListener('click', (event) => { event.preventDefault(); history.replaceState(null, '', location.pathname); presentation.hidden = true; builder.hidden = false; window.scrollTo(0, 0); });
    const modal = $('#gallery-modal', presentation);
    $$('.presentation-gallery button', presentation).forEach((button) => button.addEventListener('click', () => {
      const image = safePhotos[Number(button.dataset.galleryIndex)];
      $('img', modal).src = image; modal.hidden = false;
    }));
    $('button', modal).addEventListener('click', () => { modal.hidden = true; });
    modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; });
    document.title = `${data.title || 'İlan sunumu'} | İlanSunum`;
  }

  const pasteArea = $('#paste-area');
  pasteArea.addEventListener('paste', (event) => {
    const clipboard = event.clipboardData;
    if (!clipboard) return;
    const html = clipboard.getData('text/html');
    const text = clipboard.getData('text/plain');
    const pastedImages = [...clipboard.items].filter((item) => item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
    if (pastedImages.length) { event.preventDefault(); addImageFiles(pastedImages); }
    setTimeout(() => {
      const content = pasteArea.innerText || text;
      if (content.trim() || html) extractListing(content, html);
    }, 0);
  });
  pasteArea.addEventListener('input', () => {
    const text = pasteArea.innerText.trim();
    if (text) extractListing(text, pasteArea.innerHTML);
  });
  $('#clear-paste').addEventListener('click', () => { pasteArea.replaceChildren(); $('#paste-status').textContent = 'İlan içeriğini bekliyor'; });
  $('#photo-input').addEventListener('change', (event) => { addImageFiles(event.target.files); event.target.value = ''; });
  document.addEventListener('paste', (event) => {
    if (event.target === pasteArea || pasteArea.contains(event.target)) return;
    const images = [...(event.clipboardData?.items || [])].filter((item) => item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
    if (images.length) { event.preventDefault(); addImageFiles(images); }
  });
  Object.values(fields).forEach((field) => field.addEventListener('input', updatePreview));
  $('#gallery-prev').addEventListener('click', () => { activePhoto = (activePhoto - 1 + photos.length) % photos.length; updatePreview(); });
  $('#gallery-next').addEventListener('click', () => { activePhoto = (activePhoto + 1) % photos.length; updatePreview(); });
  $('#publish-button').addEventListener('click', publish);

  const shared = location.hash.match(/^#sunum=(.+)$/);
  if (shared) {
    try {
      const data = decodeListing(shared[1]);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid presentation');
      renderPresentation(data);
    } catch {
      history.replaceState(null, '', location.pathname);
      notify('Sunum bağlantısı okunamadı. Bağlantının tam olduğundan emin olun.');
    }
  } else updatePreview();
})();
