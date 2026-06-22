(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTagLikePage =
    /(^|\/)tag\.html$/i.test(window.location.pathname) ||
    window.location.search.includes('tag=') ||
    window.location.search.includes('filter=') ||
    window.location.search.includes('camera=');

  document.body.classList.add('drift-page-enter');

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
    if (isTagLikePage) {
      document.documentElement.classList.add('drift-no-photo-reveal');

      const showAll = root => {
        root.querySelectorAll('.drift-photo-reveal').forEach(el => {
          el.classList.add('is-visible');
          el.classList.add('is-static');
        });
      };

      showAll(document);

      new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          mutation.addedNodes.forEach(node => {
            if (!(node instanceof Element)) return;

            if (node.matches('.drift-photo-reveal')) {
              node.classList.add('is-visible');
              node.classList.add('is-static');
            }

            showAll(node);
          });
        });
      }).observe(document.body, { childList: true, subtree: true });

      return;
    }

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

  function shouldSkipExitTransition(link, event) {
    if (!link) return true;
    if (link.target === '_blank') return true;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return true;

    const href = link.getAttribute('href');
    if (!href) return true;
    if (href.startsWith('#')) return true;
    if (href.startsWith('javascript:')) return true;
    if (href === window.location.pathname || href === window.location.href) return true;

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

      const href = link.getAttribute('href');
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
  });

  function boot() {
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
