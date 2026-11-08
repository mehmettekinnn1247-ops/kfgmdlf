(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const builder = $('#builder');
  const presentation = $('#presentation');
  const toast = $('#toast');

  const fields = {
    title: $('#title-input'),
    price: $('#price-input'),
    location: $('#location-input'),
    rooms: $('#rooms-input'),
    sqm: $('#sqm-input'),
    floor: $('#floor-input'),
    age: $('#age-input'),
    reference: $('#reference-input'),
    phone: $('#phone-input'),
    features: $('#features-input'),
    description: $('#description-input')
  };

  let photos = [];
  let activePhoto = 0;
  let toastTimer = null;

  function notify(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function listingData() {
    return {
      title: fields.title.value.trim(),
      price: fields.price.value.trim(),
      location: fields.location.value.trim(),
      rooms: fields.rooms.value.trim(),
      sqm: fields.sqm.value.trim(),
      floor: fields.floor.value.trim(),
      age: fields.age.value.trim(),
      reference: fields.reference.value.trim(),
      phone: fields.phone.value.trim(),
      features: fields.features.value.split(/\n+/).map((line) => line.trim()).filter(Boolean),
      description: fields.description.value.trim(),
      photos
    };
  }

  function updatePreview() {
    const data = listingData();

    $('#preview-title').textContent = data.title || 'Daire başlığı burada görünecek';
    $('#preview-price').textContent = data.price || 'Fiyat bilgisi';
    $('#preview-location span').textContent = data.location || 'Konum bilgisi';
    $('#preview-description').textContent = data.description || 'Daire açıklaması burada müşterinize sunulacak.';
    $('#preview-rooms').textContent = data.rooms || '3+1';
    $('#preview-sqm').textContent = data.sqm || '145 m²';
    $('#preview-floor').textContent = data.floor || '10. kat';
    $('#preview-age').textContent = data.age || '-';
    $('#preview-reference').textContent = data.reference || '-';

    const featureContainer = $('#preview-features');
    featureContainer.replaceChildren();
    const chips = data.features.length ? data.features.slice(0, 6) : ['Asansör', 'Krediye uygun', 'Balkon'];
    chips.forEach((feature) => {
      const chip = document.createElement('span');
      chip.textContent = feature;
      featureContainer.appendChild(chip);
    });

    const callLink = $('#preview-call');
    callLink.hidden = !data.phone;
    if (data.phone) {
      callLink.href = `tel:${data.phone.replace(/[^+\d]/g, '')}`;
    }

    const image = $('#preview-image');
    const placeholder = $('#image-placeholder');
    const count = $('#photo-count');
    const prev = $('#gallery-prev');
    const next = $('#gallery-next');

    if (photos.length) {
      image.src = photos[activePhoto];
      image.style.display = 'block';
      placeholder.hidden = true;
      count.hidden = false;
      count.textContent = `${activePhoto + 1} / ${photos.length}`;
      prev.hidden = photos.length < 2;
      next.hidden = photos.length < 2;
    } else {
      image.removeAttribute('src');
      image.style.display = 'none';
      placeholder.hidden = false;
      count.hidden = true;
      prev.hidden = true;
      next.hidden = true;
    }
  }

  function extractListing(rawText, html = '') {
    const lines = rawText.replace(/\u00a0/g, ' ').split(/\n|\r/).map((line) => line.trim()).filter(Boolean);
    const content = lines.join('\n');

    if (!fields.title.value.trim()) {
      const titleCandidate = lines.find((line) => line.length > 12 && line.length < 140 && !/^(ilan no|fiyat|metrekare|oda|bina)|\d{3,}/i.test(line));
      if (titleCandidate) fields.title.value = titleCandidate;
    }

    if (!fields.price.value.trim()) {
      const priceMatch = content.match(/(?:₺\s*[\d.]+(?:,\d+)?|[\d.]+(?:,\d+)?\s*(?:TL|₺))/i);
      if (priceMatch) fields.price.value = priceMatch[0].replace(/\s+/g, ' ').trim();
    }

    if (!fields.location.value.trim()) {
      const cityMatch = lines.find((line) => /(kadıköy|bakırköy|fatih|beşiktaş|ümraniye|bahçelievler|pendik|kartal|üsküdar|sarıyer|atasehir|maltepe|başakşehir|istanbul|ankara|izmir|eskişehir|izmir)/i.test(line));
      if (cityMatch) fields.location.value = cityMatch;
    }

    if (!fields.rooms.value.trim()) {
      const roomMatch = content.match(/\b(\d\+\d|\d\+\d\+\d|studio|1\+0|2\+1|3\+1|4\+1|5\+1|6\+1)\b/i);
      if (roomMatch) fields.rooms.value = roomMatch[0].trim();
    }

    if (!fields.sqm.value.trim()) {
      const sqmMatch = content.match(/(\d{2,4})\s*(?:m²|m2|metrekare|m2\s*net|m2\s*brut)/i);
      if (sqmMatch) fields.sqm.value = `${sqmMatch[1]} m²`;
    }

    if (!fields.floor.value.trim()) {
      const floorMatch = content.match(/(\d+\.?\d*\s*(?:kat|k\.|kati)|giriş|bahçe katı|zemin|5\. kat|10\. kat|2\. kat)/i);
      if (floorMatch) fields.floor.value = floorMatch[0].trim();
    }

    if (!fields.age.value.trim()) {
      const ageMatch = content.match(/(\d+\s*(?:yaşında|yaş|yıl|yil)|yeni yapı|sıfır|201[0-9]|202[0-9])/i);
      if (ageMatch) fields.age.value = ageMatch[0].trim();
    }

    if (!fields.reference.value.trim()) {
      const refMatch = content.match(/(?:ilan\s*(?:no|nolu)|#\s*)?\d{5,}/i);
      if (refMatch) fields.reference.value = refMatch[0].replace(/[^\d]/g, '');
    }

    if (!fields.features.value.trim()) {
      const featureWords = [
        'asansör', 'site içi', 'güvenlik', 'balkon', 'esyali', 'krediye uygun',
        'otopark', 'manzara', 'çocuk parkı', 'hijyenik', 'sıfır', '360 kamera', 'isitma'
      ];
      const detected = [];
      featureWords.forEach((word) => {
        if (new RegExp(word, 'i').test(content) && !detected.includes(word)) {
          detected.push(word.charAt(0).toUpperCase() + word.slice(1));
        }
      });
      if (detected.length) fields.features.value = detected.join('\n');
    }

    if (!fields.description.value.trim()) {
      const descriptionLines = lines.filter((line) => line.length > 20 && !/(fiyat|ilan no|metrekare|m²|m2|oda|kat|yaş)/i.test(line));
      if (descriptionLines.length) {
        const selected = descriptionLines.slice(0, 6).join('\n\n');
        fields.description.value = selected;
      }
    }

    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const imageUrls = [...doc.querySelectorAll('img')]
      .map((img) => img.currentSrc || img.src || img.getAttribute('src'))
      .filter((src) => src && /^https?:\/\//i.test(src));

    if (imageUrls.length) {
      const unique = [...new Set(imageUrls)].filter((url) => !/logo|avatar|icon|sprite/i.test(url));
      photos = [...new Set([...photos, ...unique])].slice(0, 12);
      if (photos.length) activePhoto = 0;
    }

    updatePreview();

    const status = $('#paste-status');
    status.textContent = `İçerik alındı${photos.length ? ` · ${photos.length} fotoğraf` : ''}`;
    notify('İlan içeriği aktarıldı. Alanları kontrol edip düzenleyebilirsiniz.');
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return reject(new Error('Bu dosya bir görsel değil.'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Görsel okunamadı.'));
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.naturalWidth * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = () => reject(new Error('Görsel açılamadı.'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function addImageFiles(files) {
    const available = Math.max(0, 12 - photos.length);
    if (!available) {
      notify('En fazla 12 fotoğraf ekleyebilirsiniz.');
      return;
    }

    const selected = [...files].filter((file) => file.type.startsWith('image/')).slice(0, available);
    try {
      const images = await Promise.all(selected.map(compressImage));
      photos.push(...images);
      activePhoto = photos.length - 1;
      updatePreview();
      $('#paste-status').textContent = `${photos.length} fotoğraf sunuma eklendi`;
    } catch (error) {
      notify(error.message || 'Fotoğraf eklenemedi.');
    }
  }

  function safeListing() {
    const data = listingData();
    if (!data.title) {
      fields.title.focus();
      notify('Lütfen ilan başlığını girin.');
      return null;
    }
    return data;
  }

  function encodeListing(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let binary = '';
    bytes.forEach((byte) => binary += String.fromCharCode(byte));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function decodeListing(encoded) {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function renderPresentation(data, ownerView = false) {
    builder.hidden = true;
    presentation.hidden = false;

    const safePhotos = Array.isArray(data.photos) ? data.photos.filter((src) => typeof src === 'string' && /^(data:image\/(?:jpeg|png|webp);base64,|https?:\/\/)/i.test(src)).slice(0, 12) : [];
    const title = data.title || 'Daire ilanı';
    const price = data.price || 'Fiyat için görüşün';
    const locationText = data.location || 'Konum bilgisi';
    const phone = String(data.phone || '').replace(/[^+\d]/g, '');
    const features = Array.isArray(data.features) ? data.features.slice(0, 8) : [];

    const gallery = safePhotos.map((src, index) => `<button type="button" data-gallery-index="${index}" aria-label="Fotoğraf ${index + 1}"><img src="${src}" alt="Daire fotoğrafı ${index + 1}" loading="lazy"></button>`).join('');

    const featuresHtml = features.length
      ? features.map((item, idx) => `<div class="presentation-feature"><small>ÖZELLİK ${String(idx + 1).padStart(2, '0')}</small><strong>${item}</strong></div>`).join('')
      : '<div class="presentation-feature"><small>ÖZELLİK 01</small><strong>Detay eklenmemiş</strong></div>';

    const ownerTools = ownerView
      ? `<div class="share-tools"><span>Sunum bağlantınız hazır. Müşterinize paylaşabilirsiniz.</span><button id="copy-link" type="button">Bağlantıyı kopyala</button></div><a class="back-link" id="edit-link" href="#">← Düzenlemeye dön</a>`
      : '';

    const refLine = data.reference ? `<div class="presentation-footer">İlan No: ${data.reference}</div>` : '';

    presentation.innerHTML = `
      ${ownerTools}
      <nav class="presentation-nav">
        <a class="brand" href="#"><span class="brand-icon">E</span><span>emlak<span class="brand-light">sunum</span></span></a>
        <span class="presentation-tag">Özel daire ilan sunumu</span>
      </nav>
      <div class="presentation-wrap">
        <section class="presentation-cover">
          ${safePhotos.length ? `<img src="${safePhotos[0]}" alt="${title}">` : '<div style="display:grid;place-items:center;height:100%;color:#b7c1d0;font-size:46px;">⌂</div>'}
          <div class="cover-label">
            <small>${locationText}</small>
            <h1>${title}</h1>
            <div class="cover-price">${price}</div>
          </div>
        </section>

        ${safePhotos.length > 1 ? `<div class="presentation-gallery">${gallery}</div>` : ''}

        <div class="presentation-layout">
          <section class="presentation-panel">
            <h2>İlan özellikleri</h2>
            <div class="presentation-location">⌖ ${locationText}</div>
            <div class="presentation-features">${featuresHtml}</div>
            <h2 style="margin-top:24px">Açıklama</h2>
            <div class="presentation-description">${data.description || 'Açıklama eklenmemiş.'}</div>
          </section>

          <aside class="presentation-panel contact-panel">
            <h2>Teklif</h2>
            <div class="contact-price">${price}</div>
            ${phone ? `<a href="tel:${phone}">☎ ${data.phone}</a><p>Detaylı bilgi almak için arayın.</p>` : '<p>İlan hakkında detay bilgisi için iletişim bilgisi ekleyin.</p>'}
          </aside>
        </div>

        ${refLine}
      </div>
      <div id="gallery-modal" class="gallery-modal" hidden>
        <button type="button" aria-label="Kapat">×</button>
        <img alt="Önizleme büyük fotoğraf" />
      </div>
    `;

    const copyButton = $('#copy-link', presentation);
    if (copyButton) {
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(location.href);
          copyButton.textContent = 'Kopyalandı ✓';
          setTimeout(() => {
            if (copyButton.isConnected) copyButton.textContent = 'Bağlantıyı kopyala';
          }, 2000);
        } catch {
          notify('Bağlantıyı adres çubuğundan kopyalayın.');
        }
      });
    }

    const editLink = $('#edit-link', presentation);
    if (editLink) {
      editLink.addEventListener('click', (event) => {
        event.preventDefault();
        history.replaceState(null, '', location.pathname);
        presentation.hidden = true;
        builder.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const modal = $('#gallery-modal', presentation);
    const modalImg = $('img', modal);
    const galleryButtons = $$('.presentation-gallery button', presentation);

    galleryButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.galleryIndex);
        modalImg.src = safePhotos[index];
        modal.hidden = false;
      });
    });

    $('button', modal).addEventListener('click', () => {
      modal.hidden = true;
    });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.hidden = true;
    });

    document.title = `${title} | EmlakSunum`;
  }

  function publish() {
    const data = safeListing();
    if (!data) return;

    const payload = encodeListing(data);
    history.replaceState(null, '', `#sunum=${payload}`);
    renderPresentation(data, true);
  }

  const pasteArea = $('#paste-area');

  pasteArea.addEventListener('paste', (event) => {
    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const pastedImages = [...clipboard.items]
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter(Boolean);

    if (pastedImages.length) {
      event.preventDefault();
      addImageFiles(pastedImages);
    }

    setTimeout(() => {
      const text = pasteArea.innerText || clipboard.getData('text/plain');
      if (text.trim()) extractListing(text, clipboard.getData('text/html'));
    }, 0);
  });

  pasteArea.addEventListener('input', () => {
    const text = pasteArea.innerText.trim();
    if (text) extractListing(text, pasteArea.innerHTML);
  });

  $('#clear-paste').addEventListener('click', () => {
    pasteArea.innerHTML = '';
    $('#paste-status').textContent = 'İlan içeriğini bekliyor';
  });

  $('#photo-input').addEventListener('change', (event) => {
    addImageFiles(event.target.files);
    event.target.value = '';
  });

  Object.values(fields).forEach((field) => field.addEventListener('input', updatePreview));

  $('#gallery-prev').addEventListener('click', () => {
    if (!photos.length) return;
    activePhoto = (activePhoto - 1 + photos.length) % photos.length;
    updatePreview();
  });

  $('#gallery-next').addEventListener('click', () => {
    if (!photos.length) return;
    activePhoto = (activePhoto + 1) % photos.length;
    updatePreview();
  });

  $('#publish-button').addEventListener('click', publish);

  const shared = location.hash.match(/^#sunum=(.+)$/);
  if (shared) {
    try {
      const data = decodeListing(shared[1]);
      if (!data || typeof data !== 'object') throw new Error('Invalid presentation');
      renderPresentation(data);
    } catch {
      history.replaceState(null, '', location.pathname);
      notify('Sunum bağlantısı okunamadı. Lütfen bağlantının tam olduğundan emin olun.');
    }
  } else {
    updatePreview();
  }
})();
