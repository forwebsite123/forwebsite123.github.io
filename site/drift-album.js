window.initDriftAlbum = async function initDriftAlbum(options = {}) {
  const page = options.page || location.pathname.split('/').pop();
  const masonry = document.getElementById(options.masonryId || 'masonry');
  const lightbox = document.getElementById(options.lightboxId || 'lightbox');
  const lightboxImg = document.getElementById(options.lightboxImgId || 'lightbox-img');

  if (!masonry) return;

  const res = await fetch('/photos.json');
  const data = await res.json();
  const items = (data.items || []).filter(p => p.page === page);

  const html = items.map(p => {
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

    return `
      <div class="photo-item drift-photo-reveal">
        <img
          src="${p.image}"
          alt="${p.title || ''}"
          class="zoomable"
          loading="lazy"
          decoding="async">
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
