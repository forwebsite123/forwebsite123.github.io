(function () {
  'use strict';

  const KINDERGARTEN_URL = 'https://baike.baidu.com/item/%E4%B8%AD%E5%9B%BD%E4%BA%BA%E6%B0%91%E8%A7%A3%E6%94%BE%E5%86%9B%E5%B9%BF%E4%B8%9C%E7%9C%81%E5%86%9B%E5%8C%BA%E7%AC%AC%E4%B8%80%E5%B9%BC%E5%84%BF%E5%9B%AD/67472209';

  injectHomeFavicon();
  injectHomeCanvasPatch();
  scheduleHomeDirectAdjustments();

  const list = document.getElementById('latest-updates-list');
  if (!list) return;

  const MAX_UPDATES = 5;
  const UPDATE_SOURCES = [
    { file: 'diving.json', page: 'diving.html', icon: '🫧', label: 'Diving', type: 'activity' },
    { file: 'found-fragments.json', page: 'found-fragments.html', icon: '✦', label: 'Fragments', type: 'fragments' },
    { file: 'snowboarding.json', page: 'snowboarding.html', icon: '🏂', label: 'Snow', type: 'activity' },
    { file: 'horse-riding.json', page: 'horse-riding.html', icon: '🐎', label: 'Riding', type: 'activity' },
    { file: 'kitesurfing.json', page: 'kitesurfing.html', icon: '🪁', label: 'Kite', type: 'activity' },
    { file: 'photos.json', icon: '📷', label: 'Drift', type: 'photos' }
  ];

  function isHomeLikePage() {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    return path === '' || path === '/' || path === '/home' || path === '/home.html' ||
      path === '/index' || path === '/index.html' || /home-growth-tree-preview/i.test(path) ||
      /a place to leave traces/i.test(document.title || '');
  }

  function injectHomeFavicon() {
    if (!isHomeLikePage()) return;
    if (document.querySelector('link[rel~="icon"]')) return;
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🌿%3C/text%3E%3C/svg%3E";
    document.head.appendChild(icon);
  }

  function injectHomeCanvasPatch() {
    if (!isHomeLikePage() || document.getElementById('home-canvas-mobile-patch')) return;

    setHomeViewportVars();
    window.addEventListener('resize', setHomeViewportVars, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setHomeViewportVars, { passive: true });
      window.visualViewport.addEventListener('scroll', setHomeViewportVars, { passive: true });
    }

    const style = document.createElement('style');
    style.id = 'home-canvas-mobile-patch';
    style.textContent = `
      :root {
        --home-vh: 100dvh;
        --home-tree-scale: .86;
        --home-shared-x: -20px;
        --home-tree-x: -86px;
        --home-tree-y: -100px;
        --home-cards-y: -84px;
        --home-latest-x: -12px;
        --home-latest-y: 24px;
        --home-behind-x: -34px;
        --home-behind-y: -112px;
      }

      html { min-height: 100%; overflow-x: hidden; }
      body { min-height: 100dvh; overflow-x: hidden; }

      @media (min-width: 901px) {
        html,
        body {
          height: var(--home-vh) !important;
          max-height: var(--home-vh) !important;
          overflow-x: hidden !important;
          overflow-y: hidden !important;
        }

        .page,
        main,
        .home-stage {
          height: var(--home-vh) !important;
          min-height: 0 !important;
          max-height: var(--home-vh) !important;
          padding-top: clamp(24px, 3.2vh, 42px) !important;
          padding-bottom: 0 !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }

        .layout,
        .home-layout,
        .home-feature-layout {
          height: calc(var(--home-vh) - clamp(42px, 5.4vh, 66px)) !important;
          min-height: 0 !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          align-items: center !important;
        }

        .cards,
        .grid,
        .left-side,
        .left-col,
        .left-column {
          padding-top: 0 !important;
          gap: clamp(13px, 2vh, 21px) !important;
          transform: translate(var(--home-shared-x), var(--home-cards-y)) !important;
          translate: none !important;
        }

        .card,
        .entry-card,
        .portal-card {
          width: 92% !important;
          max-width: 92% !important;
          min-height: clamp(114px, 15.2vh, 146px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }

        .card img,
        .entry-card img,
        .portal-card img {
          transform: translateX(-6px) !important;
          translate: none !important;
          z-index: 1 !important;
          opacity: .76 !important;
          pointer-events: none !important;
          clip-path: none !important;
        }

        .tree-area,
        .tree-stage,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          overflow: visible !important;
        }

        .tree-area,
        .tree-stage,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          transform: translate(var(--home-tree-x), var(--home-tree-y)) scale(var(--home-tree-scale)) !important;
          transform-origin: center center !important;
          scale: none !important;
          translate: none !important;
        }

        .tree-main,
        .main-tree,
        .growth-tree-main,
        .tree-image,
        .tree-art {
          max-height: none !important;
          height: auto !important;
          object-fit: contain !important;
        }

        .right-side,
        .right-col,
        .right-column,
        .latest-area,
        .latest-panel-wrap {
          padding-top: clamp(22px, 3.6vh, 48px) !important;
          transform: translate(var(--home-latest-x), var(--home-latest-y)) !important;
          translate: none !important;
        }

        .latest-card,
        .latest-panel,
        .panel-card,
        .updates-card {
          min-height: clamp(320px, 41vh, 430px) !important;
          padding: clamp(20px, 2.5vh, 28px) clamp(22px, 2.8vw, 32px) !important;
          box-sizing: border-box !important;
        }

        #latest-updates-list { gap: clamp(9px, 1.15vh, 14px) !important; }
        #latest-updates-list .update-item {
          font-size: clamp(10.2px, .70vw, 12px) !important;
          line-height: 1.35 !important;
          column-gap: 10px !important;
        }
        #latest-updates-list .update-link { min-width: 0 !important; }
        #latest-updates-list .update-text {
          white-space: normal !important;
          overflow: hidden !important;
          display: -webkit-box !important;
          -webkit-line-clamp: 2 !important;
          -webkit-box-orient: vertical !important;
        }
        #latest-updates-list .update-date {
          font-size: clamp(9px, .60vw, 10.4px) !important;
          white-space: nowrap !important;
        }

        .side-links,
        .behind-wrap,
        .behind-pixels {
          transform: translate(var(--home-behind-x), var(--home-behind-y)) !important;
          translate: none !important;
        }

        .footer-text,
        .site-quote,
        .home-quote,
        footer {
          position: fixed !important;
          left: 0 !important;
          right: 0 !important;
          bottom: clamp(3px, .7vh, 8px) !important;
          z-index: 2 !important;
          margin: 0 !important;
          text-align: center !important;
          pointer-events: none !important;
        }

        img[src*="home-corner-tl"],
        img[src*="corner-tl"],
        img[src*="top-left"],
        .corner-tl,
        .home-corner-tl,
        .corner-top-left,
        .floral-top-left,
        .botanical-top-left {
          transform: translate(-36px, -8px) !important;
          translate: none !important;
          opacity: .86 !important;
          filter: saturate(1.12) contrast(1.04) !important;
        }

        img[src*="home-corner-bl"],
        img[src*="corner-bl"],
        img[src*="bottom-left"],
        .corner-bl,
        .home-corner-bl,
        .corner-bottom-left,
        .floral-bottom-left,
        .botanical-bottom-left,
        .flora-bl img {
          position: fixed !important;
          left: 0 !important;
          right: auto !important;
          top: auto !important;
          bottom: clamp(-26px, -2.4vh, -18px) !important;
          display: block !important;
          visibility: visible !important;
          width: clamp(104px, 9.4vw, 168px) !important;
          height: auto !important;
          transform: translate(18px, 0) rotate(-90deg) !important;
          transform-origin: center center !important;
          translate: none !important;
          z-index: 4 !important;
          pointer-events: none !important;
          opacity: .86 !important;
          filter: saturate(1.12) contrast(1.04) !important;
        }

        img[src*="home-corner-br"],
        img[src*="corner-br"],
        img[src*="bottom-right"],
        .corner-br,
        .home-corner-br,
        .corner-bottom-right,
        .floral-bottom-right,
        .botanical-bottom-right,
        .flora-br img {
          transform: rotate(90deg) scale(1.08) !important;
          transform-origin: center center !important;
        }
      }

      @media (max-width: 900px) {
        body { min-height: 100dvh; overflow-x: hidden !important; overflow-y: auto !important; }
        .page,
        main,
        .home-stage,
        .home-layout,
        .layout,
        .home-feature-layout {
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          height: auto !important;
          margin: 0 auto !important;
          padding: clamp(18px, 5vw, 28px) clamp(15px, 4.8vw, 24px) 44px !important;
          transform: none !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: clamp(18px, 5vw, 28px) !important;
          overflow-x: hidden !important;
        }
        .site-note,
        .topline,
        .tagline { max-width: calc(100vw - 76px) !important; }
        #search-icon,
        .search-btn,
        .search-icon {
          transform: none !important;
          font-size: clamp(22px, 6vw, 30px) !important;
          z-index: 20 !important;
        }
        .tree-area,
        .tree-stage,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          order: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: clamp(500px, 140vw, 690px) !important;
          height: clamp(500px, 140vw, 690px) !important;
          margin: 0 auto !important;
          transform: none !important;
          overflow: visible !important;
        }
        .tree-main,
        .main-tree,
        .growth-tree-main,
        .tree-image,
        .tree-art {
          max-width: none !important;
          width: min(118vw, 560px) !important;
          height: auto !important;
        }
        .node,
        .school-node,
        .milestone-node {
          transform: translateX(-50%) scale(.68) !important;
          transform-origin: center center !important;
        }
        .growth-wrap,
        .growth-ring-wrap,
        .growth-sign-wrap {
          transform: scale(.66) !important;
          transform-origin: top center !important;
        }
        .right-side,
        .right-col,
        .right-column,
        .latest-area,
        .latest-panel-wrap,
        .bottom-panels {
          order: 2 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          padding-top: 0 !important;
          transform: none !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 18px !important;
        }
        .latest-card,
        .latest-panel,
        .panel-card,
        .updates-card {
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          padding: 22px 20px !important;
          box-sizing: border-box !important;
        }
        .side-links,
        .behind-wrap,
        .behind-pixels { margin-top: 4px !important; transform: none !important; }
        .cards,
        .grid,
        .left-side,
        .left-col,
        .left-column {
          order: 3 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto !important;
          padding-top: 0 !important;
          transform: none !important;
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: clamp(15px, 4.5vw, 22px) !important;
        }
        .card,
        .entry-card,
        .portal-card {
          width: 100% !important;
          max-width: 100% !important;
          min-height: clamp(112px, 30vw, 148px) !important;
          padding: clamp(18px, 5vw, 26px) !important;
          box-sizing: border-box !important;
        }
        .cn { font-size: clamp(30px, 10.8vw, 46px) !important; }
        .en { font-size: clamp(18px, 5.6vw, 24px) !important; }
        #latest-updates-list .update-item { grid-template-columns: minmax(0, 1fr) !important; row-gap: 4px !important; }
        #latest-updates-list .update-date { justify-self: start !important; }
        .footer-text,
        .site-quote,
        .home-quote,
        footer { order: 4 !important; margin-top: 4px !important; text-align: center !important; }
      }

      @media (max-width: 520px) {
        .tree-area,
        .tree-stage,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          min-height: clamp(470px, 148vw, 630px) !important;
          height: clamp(470px, 148vw, 630px) !important;
        }
        .node,
        .school-node,
        .milestone-node { transform: translateX(-50%) scale(.58) !important; }
        .growth-wrap,
        .growth-ring-wrap,
        .growth-sign-wrap { transform: scale(.56) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function setHomeViewportVars() {
    if (!isHomeLikePage()) return;
    const root = document.documentElement;
    const height = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight || 820);
    root.style.setProperty('--home-vh', `${height}px`);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    let treeScale = .86;
    let treeY = -100;
    let cardsY = -84;
    let behindY = -112;
    let latestY = 24;

    if (height < 850) {
      treeScale = .83;
      treeY = -124;
      cardsY = -92;
      behindY = -128;
      latestY = 18;
    }
    if (height < 780) {
      treeScale = .80;
      treeY = -150;
      cardsY = -102;
      behindY = -144;
      latestY = 12;
    }
    if (height < 720) {
      treeScale = .77;
      treeY = -172;
      cardsY = -110;
      behindY = -156;
      latestY = 6;
    }

    if (isSafari) {
      treeY -= 6;
    } else {
      treeY += 22;
    }

    root.style.setProperty('--home-tree-scale', String(treeScale));
    root.style.setProperty('--home-shared-x', '-20px');
    root.style.setProperty('--home-tree-x', '-86px');
    root.style.setProperty('--home-tree-y', `${treeY}px`);
    root.style.setProperty('--home-cards-y', `${cardsY}px`);
    root.style.setProperty('--home-latest-x', '-12px');
    root.style.setProperty('--home-latest-y', `${latestY}px`);
    root.style.setProperty('--home-behind-x', '-34px');
    root.style.setProperty('--home-behind-y', `${behindY}px`);
  }

  function scheduleHomeDirectAdjustments() {
    if (!isHomeLikePage()) return;
    const run = () => {
      setHomeViewportVars();
      setKindergartenLink();
      moveCornerImagesDirectly();
      if (window.innerWidth <= 900) return;
      nudgeElementByText(/Kindergarten|幼儿园/, 10, 0, { minWidth: 80, minHeight: 28, maxWidth: 280, maxHeight: 140 });
      nudgeElementByText(/Growth\s*Rings/, 12, -10, { minWidth: 160, minHeight: 70, maxWidth: 440, maxHeight: 280 });
      moveTreeGroupDirectly();
      moveLatestPanelDirectly();
      fixLeftCardIllustrationsDirectly();
    };
    window.addEventListener('load', run, { once: true });
    setTimeout(run, 120);
    setTimeout(run, 450);
    setTimeout(run, 1200);
    window.addEventListener('resize', run, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', run, { passive: true });
  }

  function setKindergartenLink() {
    const target = findSmallestElementByText(/Kindergarten|幼儿园/);
    if (!target) return;
    const plaque = findReasonablePlaque(target, { minWidth: 80, minHeight: 28, maxWidth: 280, maxHeight: 140 });
    const anchor = (plaque && plaque.closest('a')) || target.closest('a');
    const clickable = anchor || plaque || target;
    if (anchor) {
      anchor.href = KINDERGARTEN_URL;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    } else {
      clickable.style.cursor = 'pointer';
      clickable.setAttribute('role', 'link');
      clickable.setAttribute('tabindex', '0');
      clickable.onclick = () => window.open(KINDERGARTEN_URL, '_blank', 'noopener,noreferrer');
      clickable.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') window.open(KINDERGARTEN_URL, '_blank', 'noopener,noreferrer');
      };
    }
  }

  function moveTreeGroupDirectly() {
    const tree = findTreeGroupElement();
    if (!tree) return;
    tree.style.transform = `translate(var(--home-tree-x), var(--home-tree-y)) scale(var(--home-tree-scale))`;
    tree.style.transformOrigin = 'center center';
    tree.style.translate = 'none';
    tree.style.scale = 'none';
  }

  function findTreeGroupElement() {
    const candidates = Array.from(document.querySelectorAll('body *')).filter((element) => {
      const text = (element.textContent || '').replace(/\s+/g, ' ');
      if (!/Durham University/.test(text) || !/Growth\s*Rings/.test(text)) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width < 260 || rect.height < 360) return false;
      if (rect.width > window.innerWidth * 0.72 || rect.height > window.innerHeight * 1.2) return false;
      if (rect.left < window.innerWidth * 0.18 || rect.right > window.innerWidth * 0.88) return false;
      return true;
    });
    return candidates.sort((a, b) => area(a) - area(b))[0] || null;
  }

  function moveLatestPanelDirectly() {
    const latestList = document.getElementById('latest-updates-list');
    if (!latestList) return;
    let panel = latestList;
    while (panel.parentElement && panel.parentElement !== document.body) {
      const rect = panel.parentElement.getBoundingClientRect();
      if (rect.width >= 180 && rect.height >= 120 && rect.width <= 560 && rect.height <= 520) {
        panel = panel.parentElement;
      }
      if (/latest|panel|card|updates/i.test(panel.className || '')) break;
      panel = panel.parentElement;
    }
    panel.style.transform = `translate(var(--home-latest-x), var(--home-latest-y))`;
    panel.style.translate = 'none';
  }

  function moveCornerImagesDirectly() {
    const imgs = Array.from(document.images || []);
    const vw = window.innerWidth || 1200;
    const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight || 820;
    const candidates = imgs.map((img) => ({ img, rect: img.getBoundingClientRect() }))
      .filter(({ img, rect }) => !isInsidePortalCard(img) && rect.width >= 70 && rect.height >= 70 && rect.width <= 460 && rect.height <= 460);

    const topLeft = candidates
      .filter(({ rect }) => rect.left < vw * 0.35 && rect.top < vh * 0.35)
      .sort((a, b) => (a.rect.left + a.rect.top) - (b.rect.left + b.rect.top))[0];

    if (topLeft) {
      topLeft.img.style.transform = 'translate(-36px, -8px)';
      topLeft.img.style.translate = 'none';
      topLeft.img.style.opacity = '.86';
      topLeft.img.style.filter = 'saturate(1.12) contrast(1.04)';
    }

    const floraBlImg = document.querySelector('.flora-bl img');
    if (floraBlImg && (!topLeft || floraBlImg !== topLeft.img)) {
      floraBlImg.style.position = 'fixed';
      floraBlImg.style.left = '0';
      floraBlImg.style.right = 'auto';
      floraBlImg.style.top = 'auto';
      floraBlImg.style.bottom = 'clamp(-26px, -2.4vh, -18px)';
      floraBlImg.style.display = 'block';
      floraBlImg.style.visibility = 'visible';
      floraBlImg.style.width = 'clamp(104px, 9.4vw, 168px)';
      floraBlImg.style.height = 'auto';
      floraBlImg.style.transform = 'translate(18px, 0) rotate(-90deg)';
      floraBlImg.style.transformOrigin = 'center center';
      floraBlImg.style.translate = 'none';
      floraBlImg.style.zIndex = '4';
      floraBlImg.style.pointerEvents = 'none';
      floraBlImg.style.opacity = '.86';
      floraBlImg.style.filter = 'saturate(1.12) contrast(1.04)';
    }

    const floraBrImg = document.querySelector('.flora-br img');
    if (floraBrImg) {
      floraBrImg.style.transform = 'rotate(90deg) scale(1.08)';
      floraBrImg.style.transformOrigin = 'center center';
    }
  }

  function isInsidePortalCard(element) {
    return Boolean(element.closest('.card, .entry-card, .portal-card'));
  }

  function fixLeftCardIllustrationsDirectly() {
    const labels = [/Drift Coordinates|漂流坐标/, /Dopamine Receipts|多巴胺账本/, /Found Fragments|人间拾遗/, /Into the Wild|沉浸体验/];
    labels.forEach((pattern) => {
      const textNode = findSmallestElementByText(pattern);
      const card = textNode && findReasonablePlaque(textNode, { minWidth: 180, minHeight: 70, maxWidth: 760, maxHeight: 260 });
      if (!card) return;
      card.style.overflow = 'hidden';
      const rect = card.getBoundingClientRect();
      Array.from(document.images || []).forEach((img) => {
        const imgRect = img.getBoundingClientRect();
        const intersects = imgRect.right > rect.left - 24 && imgRect.left < rect.right && imgRect.bottom > rect.top && imgRect.top < rect.bottom;
        if (!intersects || imgRect.width > 240 || imgRect.height > 240) return;
        img.style.transform = 'translateX(-6px)';
        img.style.translate = 'none';
        img.style.zIndex = '1';
        img.style.opacity = '.76';
        img.style.pointerEvents = 'none';
        img.style.clipPath = 'none';
      });
    });
  }

  function findSmallestElementByText(pattern) {
    return Array.from(document.querySelectorAll('body *'))
      .filter((element) => {
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (!pattern.test(text)) return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .sort((a, b) => area(a) - area(b))[0] || null;
  }

  function findReasonablePlaque(start, limits) {
    let target = start;
    while (target && target !== document.body) {
      const rect = target.getBoundingClientRect();
      const fitsMin = rect.width >= limits.minWidth && rect.height >= limits.minHeight;
      const fitsMax = rect.width <= limits.maxWidth && rect.height <= limits.maxHeight;
      if (fitsMin && fitsMax) return target;
      target = target.parentElement;
    }
    return start;
  }

  function nudgeElementByText(pattern, dx, dy, limits) {
    const textNode = findSmallestElementByText(pattern);
    if (!textNode) return;
    const target = findReasonablePlaque(textNode, limits);
    target.style.translate = `${dx}px ${dy}px`;
  }

  function area(element) {
    const rect = element.getBoundingClientRect();
    return rect.width * rect.height;
  }

  function safeJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .catch(() => null);
  }

  function parseContentUpdatedAt(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const date = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function parseDateRange(value) {
    if (!value || typeof value !== 'string') return null;
    const first = value.trim().split(/\s*-\s*/)[0].replace(/\//g, '.');
    let date = null;
    if (/^\d{4}-\d{2}-\d{2}/.test(first)) date = new Date(first);
    const full = first.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (full) date = new Date(Date.UTC(Number(full[1]), Number(full[2]) - 1, Number(full[3])));
    return date && !Number.isNaN(date.getTime()) ? date : null;
  }

  function formatMachineDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString('en-CA', {
      timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit'
    });
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 36);
  }

  function anchorFrom(date, extra) {
    const slug = slugify(extra || '');
    return slug ? `entry-${formatMachineDate(date)}-${slug}` : `entry-${formatMachineDate(date)}`;
  }

  function compactText(value, fallback) {
    const text = String(value || fallback || '').replace(/\s+/g, ' ').trim();
    return text.length > 72 ? `${text.slice(0, 69)}…` : text;
  }

  function collectActivityEntries(data, source) {
    const entries = Array.isArray(data && data.entries) ? data.entries : [];
    return entries.map((entry) => {
      const updatedDate = parseContentUpdatedAt(entry.contentUpdatedAt);
      if (!updatedDate) return null;
      const anchorDate = parseDateRange(entry.date);
      const title = compactText(entry.record_caption || entry.note || entry.location, 'new trace');
      const location = entry.location ? ` · ${entry.location}` : '';
      return {
        icon: source.icon,
        label: source.label,
        title: `${title}${location}`,
        date: updatedDate,
        href: anchorDate ? `${source.page}#${anchorFrom(anchorDate, entry.location || source.label)}` : source.page
      };
    }).filter(Boolean);
  }

  function collectFoundFragments(data, source) {
    const entries = Array.isArray(data && data.entries) ? data.entries : [];
    return entries.map((entry) => {
      const updatedDate = parseContentUpdatedAt(entry.contentUpdatedAt);
      if (!updatedDate) return null;
      const anchorDate = parseDateRange(entry.date);
      return {
        icon: source.icon,
        label: source.label,
        title: compactText(entry.text || (entry.tags || []).join(', '), 'a found fragment'),
        date: updatedDate,
        href: anchorDate ? `${source.page}#${anchorFrom(anchorDate)}` : source.page
      };
    }).filter(Boolean);
  }

  function collectPhotoAlbumUpdates(data, source) {
    const items = Array.isArray(data && data.items) ? data.items : [];
    const byPage = new Map();

    items.forEach((item) => {
      if (!item || !item.page) return;
      const updatedDate = parseContentUpdatedAt(item.contentUpdatedAt);
      if (!updatedDate) return;
      const existing = byPage.get(item.page);
      if (existing && existing.date >= updatedDate) return;
      const label = compactText(item.pageLabel || item.page.replace(/\.html$/i, ''), 'Album');
      byPage.set(item.page, {
        icon: source.icon,
        label: source.label,
        title: `${label} photos updated`,
        date: updatedDate,
        href: item.page
      });
    });

    return [...byPage.values()];
  }

  function collectUpdates(data, source) {
    if (source.type === 'activity') return collectActivityEntries(data, source);
    if (source.type === 'fragments') return collectFoundFragments(data, source);
    if (source.type === 'photos') return collectPhotoAlbumUpdates(data, source);
    return [];
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function render(updates) {
    if (!updates.length) {
      list.innerHTML = '<li class="update-empty">最近的痕迹还在路上，晚一点再来看看。</li>';
      return;
    }

    list.innerHTML = updates.slice(0, MAX_UPDATES).map((update) => `
      <li class="update-item">
        <a class="update-link" href="${escapeAttribute(update.href)}">
          <span class="update-icon" aria-hidden="true">${escapeHtml(update.icon)}</span>
          <span class="update-text"><span class="update-category">${escapeHtml(update.label)}</span>${escapeHtml(update.title)}</span>
        </a>
        <time class="update-date" datetime="${formatMachineDate(update.date)}">${formatDisplayDate(update.date)}</time>
      </li>
    `).join('');
  }

  Promise.allSettled(UPDATE_SOURCES.map((source) =>
    safeJson(source.file).then((data) => collectUpdates(data, source))
  ))
    .then((results) => {
      const updates = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
        .sort((a, b) => b.date - a.date);
      render(updates);
    })
    .catch(() => render([]));
}());
