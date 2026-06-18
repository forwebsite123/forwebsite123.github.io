(function () {
  const list = document.getElementById('latest-updates-list');
  if (!list) return;

  const MAX_UPDATES = 5;
  injectGrowthTreePreviewStyles();
  injectHomeResponsivePatch();

  const UPDATE_SOURCES = [
    { file: 'diving.json', page: 'diving.html', icon: '🫧', label: 'Diving', type: 'activity' },
    { file: 'found-fragments.json', page: 'found-fragments.html', icon: '✦', label: 'Fragments', type: 'fragments' },
    { file: 'snowboarding.json', page: 'snowboarding.html', icon: '🏂', label: 'Snow', type: 'activity' },
    { file: 'horse-riding.json', page: 'horse-riding.html', icon: '🐎', label: 'Riding', type: 'activity' },
    { file: 'kitesurfing.json', page: 'kitesurfing.html', icon: '🪁', label: 'Kite', type: 'activity' },
    { file: 'photos.json', icon: '📷', label: 'Drift', type: 'photos' }
  ];

  const ADAPTERS = {
    activity: collectActivityEntries,
    fragments: collectFoundFragments,
    photos: collectPhotoAlbumUpdates
  };

  function isHomeLikePage() {
    const path = window.location.pathname.toLowerCase().replace(/\/$/, '');
    return path === '' || path === '/' || path === '/home' || path === '/home.html' ||
      path === '/index' || path === '/index.html' || /home-growth-tree-preview/i.test(path) ||
      /a place to leave traces/i.test(document.title || '');
  }

  function injectHomeResponsivePatch() {
    if (!isHomeLikePage() || document.getElementById('home-responsive-fit-patch')) return;

    const style = document.createElement('style');
    style.id = 'home-responsive-fit-patch';
    style.textContent = `
      html {
        min-height: 100%;
        overflow-x: hidden;
      }

      body {
        min-height: 100svh;
        overflow-x: hidden;
      }

      /* Desktop: keep the carefully designed homepage composition visible in one screen when the browser is short. */
      @media (min-width: 901px) {
        body.home-fit-active {
          height: 100svh;
          overflow-y: hidden;
        }

        body.home-fit-active .page,
        body.home-fit-active main,
        body.home-fit-active .home-stage,
        body.home-fit-active .home-layout,
        body.home-fit-active .layout,
        body.home-fit-active .home-feature-layout {
          transform: scale(var(--home-fit-scale, 1));
          transform-origin: top center;
        }
      }

      /* Phone/tablet: do not force the desktop three-column composition into a tiny screen. */
      @media (max-width: 900px) {
        body {
          min-height: 100svh;
          overflow-y: auto;
        }

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
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: clamp(16px, 5vw, 28px) !important;
          padding-right: clamp(16px, 5vw, 28px) !important;
          transform: none !important;
          display: flex !important;
          flex-direction: column !important;
          gap: clamp(18px, 5vw, 30px) !important;
          overflow-x: hidden !important;
        }

        .cards,
        .grid,
        .left-side,
        .left-col,
        .left-column {
          order: 2 !important;
          width: 100% !important;
          max-width: 100% !important;
          transform: none !important;
          padding-top: 0 !important;
          margin-left: auto !important;
          margin-right: auto !important;
          display: grid !important;
          grid-template-columns: 1fr !important;
          gap: clamp(16px, 4.5vw, 24px) !important;
        }

        .tree-area,
        .tree-stage,
        .tree-wrap,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          order: 1 !important;
          width: 100% !important;
          max-width: 100% !important;
          min-height: auto !important;
          transform: none !important;
          margin-left: auto !important;
          margin-right: auto !important;
          overflow: visible !important;
        }

        .right-side,
        .right-col,
        .right-column,
        .bottom-panels,
        .latest-area,
        .latest-panel-wrap {
          order: 3 !important;
          width: 100% !important;
          max-width: 100% !important;
          transform: none !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .card,
        .entry-card,
        .portal-card {
          width: 100% !important;
          max-width: 100% !important;
          min-height: clamp(118px, 31vw, 158px) !important;
          padding: clamp(18px, 5vw, 26px) !important;
        }

        .cn {
          font-size: clamp(30px, 11vw, 46px) !important;
        }

        .en {
          font-size: clamp(18px, 5.8vw, 24px) !important;
        }

        #latest-updates-list .update-item {
          grid-template-columns: minmax(0, 1fr) !important;
          row-gap: 4px !important;
        }

        #latest-updates-list .update-date {
          justify-self: start !important;
        }
      }
    `;
    document.head.appendChild(style);

    const fitSelectors = ['.page', 'main', '.home-stage', '.home-layout', '.layout', '.home-feature-layout'];

    function findFitRoot() {
      for (const selector of fitSelectors) {
        const el = document.querySelector(selector);
        if (el && el.scrollHeight > 0) return el;
      }
      return null;
    }

    function applyDesktopFit() {
      if (window.innerWidth <= 900) {
        document.body.classList.remove('home-fit-active');
        document.documentElement.style.removeProperty('--home-fit-scale');
        return;
      }

      const root = findFitRoot();
      if (!root) return;

      document.body.classList.remove('home-fit-active');
      document.documentElement.style.setProperty('--home-fit-scale', '1');

      window.requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        const availableHeight = Math.max(560, window.innerHeight - 6);
        const availableWidth = Math.max(920, window.innerWidth - 6);
        const heightScale = rect.height > 0 ? availableHeight / rect.height : 1;
        const widthScale = rect.width > 0 ? availableWidth / rect.width : 1;
        const scale = Math.min(1, Math.max(0.76, heightScale, Math.min(heightScale, widthScale)));

        if (scale < 0.985) {
          document.documentElement.style.setProperty('--home-fit-scale', String(scale));
          document.body.classList.add('home-fit-active');
        }
      });
    }

    let resizeTimer;
    function scheduleFit() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(applyDesktopFit, 80);
    }

    window.addEventListener('load', scheduleFit, { once: true });
    window.addEventListener('resize', scheduleFit);
    window.addEventListener('orientationchange', scheduleFit);
    setTimeout(scheduleFit, 250);
    setTimeout(scheduleFit, 900);
  }

  function injectGrowthTreePreviewStyles() {
    const isGrowthTreePreview = /home-growth-tree-preview\.html?$/i.test(window.location.pathname)
      || /home-growth-tree-preview/i.test(window.location.pathname)
      || /Growth Tree Preview/i.test(document.title || '');

    if (!isGrowthTreePreview || document.getElementById('growth-tree-latest-styles')) return;

    const style = document.createElement('style');
    style.id = 'growth-tree-latest-styles';
    style.textContent = `
      #latest-updates-list {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
      }

      #latest-updates-list .update-item {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: start !important;
        column-gap: 9px !important;
        margin: 0 !important;
        padding: 0 !important;
        color: rgba(111, 78, 70, .72) !important;
        font-size: 11.8px !important;
        line-height: 1.32 !important;
      }

      #latest-updates-list .update-link {
        min-width: 0 !important;
        display: flex !important;
        align-items: flex-start !important;
        gap: 5px !important;
        color: inherit !important;
        text-decoration: none !important;
      }

      #latest-updates-list .update-icon {
        flex: 0 0 auto !important;
        opacity: .82 !important;
        line-height: 1.25 !important;
      }

      #latest-updates-list .update-text {
        min-width: 0 !important;
        display: block !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
      }

      #latest-updates-list .update-category {
        margin-right: 5px !important;
        color: rgba(132, 91, 87, .76) !important;
        font-style: italic !important;
        letter-spacing: .02em !important;
      }

      #latest-updates-list .update-date {
        white-space: nowrap !important;
        color: rgba(132, 91, 87, .50) !important;
        font-size: 10.2px !important;
        line-height: 1.32 !important;
      }

      #latest-updates-list .update-empty {
        margin: 0 !important;
        color: rgba(107, 78, 70, .62) !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
      }
    `;
    document.head.appendChild(style);
  }

  function parseDateRange(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    const parts = trimmed.split(/\s*-\s*/);
    const start = parseDatePart(parts[0]);
    if (!start) return null;

    if (parts.length === 1) return start;

    const endRaw = parts[parts.length - 1];
    const end = parseDatePart(endRaw, start);
    return end || start;
  }

  function parseDatePart(value, base) {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.trim().replace(/\//g, '.');

    if (/^\d{4}-\d{2}-\d{2}/.test(normalized)) {
      const date = new Date(normalized);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const full = normalized.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/);
    if (full) return makeDate(full[1], full[2], full[3]);

    const partial = normalized.match(/^(\d{1,2})\.(\d{1,2})$/);
    if (partial && base) return makeDate(base.getUTCFullYear(), partial[1], partial[2]);

    return null;
  }

  function makeDate(year, month, day) {
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function anchorFrom(date, extra) {
    const day = formatMachineDate(date);
    const slug = slugify(extra || '');
    return slug ? `entry-${day}-${slug}` : `entry-${day}`;
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

  function formatMachineDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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

  function parseContentUpdatedAt(value) {
    if (!value || typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const date = makeDate(trimmed.slice(0, 4), trimmed.slice(5, 7), trimmed.slice(8, 10));
    return date && formatMachineDate(date) === trimmed ? date : null;
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  Promise.allSettled(UPDATE_SOURCES.map((source) => {
    const adapter = ADAPTERS[source.type] || collectActivityEntries;

    return fetch(source.file, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${source.file}`);
        return response.json();
      })
      .then((data) => adapter(data, source));
  }))
    .then((results) => {
      const updates = results
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value)
        .sort((a, b) => b.date - a.date);
      render(updates);
    })
    .catch(() => render([]));
}());
