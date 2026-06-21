(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  function setupExitTransition() {
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      if (link.target === '_blank') return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (link.id === 'search-icon' || link.classList.contains('search-btn')) return;

      const isDriftLink =
        href.includes('.html') ||
        href.startsWith('/') ||
        href.startsWith('./') ||
        href.startsWith('../');

      if (!isDriftLink) return;

      event.preventDefault();

      const activeCard = link.closest('.country-card, .continent-card, .region-card, .drift-preview-card, .photo-card, .gallery-item, figure');
      if (activeCard) activeCard.classList.add('drift-picking-up');

      document.body.classList.add('drift-page-leaving');

      window.setTimeout(() => {
        window.location.href = href;
      }, reduceMotion ? 40 : 220);
    });
  }

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
