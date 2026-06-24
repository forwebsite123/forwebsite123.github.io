(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTagLikePage =
    /(^|\/)tag\.html$/i.test(window.location.pathname) ||
    window.location.search.includes('tag=') ||
    window.location.search.includes('filter=') ||
    window.location.search.includes('camera=');

  function stabilizeLeafletPopups() {
    if (!window.L || !window.L.Popup || !window.L.Popup.prototype) return;
    const popupProto = window.L.Popup.prototype;
    if (popupProto.__driftStablePopupPan) return;
    popupProto.__driftStablePopupPan = true;
    popupProto._adjustPan = function () {};
  }

  function prefetchResource(href, asType) {
    if (!href) return;
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return;

    const finalHref = url.pathname + url.search;
    if (document.querySelector(`link[rel="prefetch"][href="${finalHref}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = finalHref;
    if (asType) link.as = asType;
    document.head.appendChild(link);
  }

  function setupMapAlbumPrefetch() {
    if (!document.querySelector('.region-map-card')) return;

    prefetchResource('/photos.json', 'fetch');
    prefetchResource('/drift-album.js', 'script');

    const prefetchFromEvent = event => {
      const link = event.target.closest('.leaflet-popup.drift-preview a[href], .country-card[href]');
      if (!link) return;
      prefetchResource(link.getAttribute('href'), 'document');
    };

    document.addEventListener('pointerover', prefetchFromEvent, { passive: true });
    document.addEventListener('touchstart', prefetchFromEvent, { passive: true });
    document.addEventListener('focusin', prefetchFromEvent);
  }

  stabilizeLeafletPopups();

  if (!isTagLikePage) {
    document.body.classList.add('drift-page-enter');
  } else {
    document.documentElement.classList.add('drift-no-page-reveal');
    document.documentElement.classList.add('drift-no-photo-reveal');
  }

  function readyPage() {
    requestAnimationFrame(() => {
      document.body.classList.add('drift-page-ready');
      document.body.classList.remove('drift-page-enter');
    });
  }

  function revealSequential(selector, baseDelay, stepDelay) {
    const items = Array.from(document.querySelectorAll(selector));
    items.forEach((el, index) => {
      window.setTimeout(() => {
        el.classList.add('is-visible');
      }, reduceMotion ? 0 : baseDelay + index * stepDelay);
    });
  }

  function setupScrollReveal() {
    const seen = new WeakSet();

    if (reduceMotion || !('IntersectionObserver' in window)) {
      const showAll = root => {
        root.querySelectorAll('.drift-photo-reveal').forEach(el => el.classList.add('is-visible'));
      };
      showAll(document);
      new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;
            if (node.matches('.drift-photo-reveal')) node.classList.add('is-visible');
            showAll(node);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    const observeItem = el => {
      if (seen.has(el)) return;
      seen.add(el);
      observer.observe(el);
    };

    document.querySelectorAll('.drift-photo-reveal').forEach(observeItem);

    new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.matches('.drift-photo-reveal')) observeItem(node);
          node.querySelectorAll('.drift-photo-reveal').forEach(observeItem);
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }


  function setupStaticPhotoRevealForTagPage() {
    const applyStatic = node => {
      if (!(node instanceof Element)) return;

      if (node.matches('.drift-photo-reveal')) {
        node.classList.add('is-visible');
        node.classList.add('is-static');
      }

      node.querySelectorAll?.('.drift-photo-reveal').forEach(el => {
        el.classList.add('is-visible');
        el.classList.add('is-static');
      });
    };

    document.querySelectorAll('.drift-photo-reveal').forEach(el => {
      el.classList.add('is-visible');
      el.classList.add('is-static');
    });

    const target =
      document.getElementById('masonry') ||
      document.querySelector('.masonry') ||
      document.querySelector('.gallery') ||
      document.querySelector('.photo-grid');

    if (!target) return;

    new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          applyStatic(node);
        }
      }
    }).observe(target, { childList: true });
  }

  function shouldSkipExitTransition(link, event) {
    if (!link) return true;
    if (link.target === '_blank') return true;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;

    const href = link.getAttribute('href') || '';
    if (!href) return true;
    if (href.startsWith('#')) return true;
    if (href.startsWith('javascript:')) return true;
    if (href === window.location.pathname || href === window.location.href) return true;

    if (/tag\.html/i.test(href)) return true;
    if (href.includes('tag=')) return true;
    if (href.includes('camera=')) return true;
    if (href.includes('filter=')) return true;

    if (link.classList.contains('back')) return true;
    if (link.matches('[aria-label*="Back" i]')) return true;
    if ((link.textContent || '').trim().startsWith('← Back')) return true;
    if ((link.textContent || '').trim() === 'Back') return true;
    if ((link.textContent || '').trim() === '← 返回') return true;

    if (link.id === 'search-icon') return true;
    if (link.classList.contains('search-btn')) return true;

    const skipSelectors = [
      '.tag',
      '.filter-tag',
      '.tag-chip',
      '.tag-button',
      '.filter-button',
      '[data-tag]',
      '[data-filter]',
      '[data-category]',
      '[data-album-filter]',
      '[data-no-transition]',
      '.no-transition',
      '.no-page-transition'
    ];

    if (skipSelectors.some(selector => link.closest(selector) || link.matches(selector))) {
      return true;
    }

    const url = new URL(href, window.location.href);

    if (url.origin !== window.location.origin) return true;

    const samePage =
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

    if (samePage) return true;

    return false;
  }

  function setupExitTransition() {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (shouldSkipExitTransition(link, event)) return;

      event.preventDefault();

      const href = link.getAttribute('href') || '';
      const activeCard = link.closest('.country-card, .continent-card, .region-card, .drift-preview-card, .photo-card, .gallery-item, figure');

      if (activeCard) activeCard.classList.add('drift-picking-up');

      document.body.classList.add('drift-page-leaving');

      window.setTimeout(() => {
        window.location.href = href;
      }, reduceMotion ? 40 : 180);

      window.setTimeout(() => {
        document.body.classList.remove('drift-page-leaving');
      }, 900);
    });
  }

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('drift-page-leaving');

    if (isTagLikePage) {
      document.body.classList.remove('drift-page-enter');
      document.body.classList.add('drift-page-ready');
    }
  });

  function boot() {
    stabilizeLeafletPopups();
    setupMapAlbumPrefetch();

    if (isTagLikePage) {
      document.body.classList.remove('drift-page-enter');
      document.body.classList.remove('drift-page-leaving');
      document.body.classList.add('drift-page-ready');

      document.querySelectorAll(
        '.drift-reveal, .drift-card-reveal, .drift-map-reveal, .drift-photo-reveal'
      ).forEach(el => {
        el.classList.add('is-visible');
        el.classList.add('is-static');
      });

      setupStaticPhotoRevealForTagPage();
      setupExitTransition();
      return;
    }

    readyPage();

    revealSequential('.drift-reveal', 120, 90);
    revealSequential('.drift-card-reveal', 260, 75);
    revealSequential('.drift-map-reveal', 520, 120);

    setupScrollReveal();
    setupExitTransition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
