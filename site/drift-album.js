window.initDriftAlbum = async function initDriftAlbum(options = {}) {
  const page = options.page || location.pathname.split('/').pop();
  const masonry = document.getElementById(options.masonryId || 'masonry');
  const lightbox = document.getElementById(options.lightboxId || 'lightbox');
  const lightboxImg = document.getElementById(options.lightboxImgId || 'lightbox-img');
  const eagerCount = Number.isFinite(options.eagerCount) ? options.eagerCount : 6;

  if (!masonry) return;

  const showAlbumMessage = message => {
    masonry.innerHTML = `
      <div class="photo-item drift-photo-reveal is-visible" style="padding: 28px; text-align: center; font-style: italic; color: rgba(122, 87, 87, 0.72);">
        ${message}
      </div>`;
  };

  let items = [];

  try {
    const res = await fetch('/photos.json');
    if (!res.ok) throw new Error(`Unable to load photos.json: ${res.status}`);

    const data = await res.json();
    items = (data.items || []).filter(p => p.page === page);
  } catch (error) {
    console.warn('Drift album failed to load:', error);
    showAlbumMessage('The album is taking a little longer to load. Please refresh this page in a moment.');
    return;
  }

  if (!items.length) {
    showAlbumMessage('This album is waiting for its first fragment.');
    return;
  }

  const html = items.map((p, index) => {
    if (p.video) {
      return `
        <div class="video-item drift-photo-reveal">
          <iframe
            src="//player.bilibili.com/player.html?bvid=${p.video}&autoplay=0&high_quality=1"
            scrolling="no"
            frameborder="no"
            allowfullscreen="true">
          </iframe>
        </div>`;
    }

    const isEager = index < eagerCount;
    const loadingAttr = isEager ? 'eager' : 'lazy';
    const fetchPriorityAttr = index === 0 ? ' fetchpriority="high"' : '';

    return `
      <div class="photo-item drift-photo-reveal">
        <img
          src="${p.image}"
          alt="${p.title || ''}"
          class="zoomable"
          loading="${loadingAttr}"
          decoding="async"${fetchPriorityAttr}>
      </div>`;
  }).join('');

  masonry.innerHTML = html;

  if (lightbox && lightboxImg) {
    masonry.addEventListener('click', event => {
      const img = event.target.closest('.zoomable');
      if (!img) return;

      lightbox.style.display = 'flex';
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || 'large preview';
    });

    lightbox.addEventListener('click', () => {
      lightbox.style.display = 'none';
      lightboxImg.src = '';
    });
  }

  const openParam = new URLSearchParams(location.search).get('open');
  if (openParam) {
    const target = [...masonry.querySelectorAll('.zoomable')]
      .find(img => img.getAttribute('src') === openParam || img.src.endsWith(openParam));
    if (target) target.click();
  }
};
