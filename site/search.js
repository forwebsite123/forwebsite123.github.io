(function () {
  'use strict';

  function detectScope() {
    if (window.SEARCH_SCOPE) return window.SEARCH_SCOPE;
    const p = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (p === '' || p === '/home' || p === '/index' || p === '/index.html') return 'all';
    const activityPages = ['snowboarding', 'diving', 'horse-riding', 'kitesurfing'];
    for (const a of activityPages) { if (p.includes(a)) return 'activity:' + a; }
    if (p.includes('found-fragments')) return 'fragments';
    if (p.includes('into-the-wild')) return 'activities';
    if (p.includes('drift-coordinates')) return 'photos';
    if (p.includes('tag')) {
      const tag = new URLSearchParams(window.location.search).get('tag');
      return tag ? 'tag:' + tag : 'photos';
    }
    const photosIndexPages = ['europe', 'asia', 'africa', 'oceania', 'north-america', 'south-america', 'antarctica', 'china'];
    for (const idx of photosIndexPages) { if (p.includes(idx)) return 'photos'; }
    const pageName = window.location.pathname.split('/').pop();
    if (pageName) return 'album:' + (pageName.endsWith('.html') ? pageName : pageName + '.html');
    return 'all';
  }

  const ACTIVITY_LABELS = {
    'snowboarding': '🏂 滑雪', 'diving': '🤿 潜水',
    'horse-riding': '🐴 骑马', 'kitesurfing': '🪁 风筝冲浪'
  };

  const ALBUM_ZH = {
    'guangzhou': '广州 中国 华南',
    'korea': '韩国 首尔 釜山',
    'japan': '日本 东京 京都 大阪',
    'thailand': '泰国 曼谷 清迈',
    'singapore': '新加坡',
    'egypt': '埃及 开罗',
    'tanzania': '坦桑尼亚 非洲',
    'australia': '澳大利亚 澳洲 悉尼',
    'brazil': '巴西 里约',
    'canada': '加拿大',
    'uk': '英国 伦敦 杜伦 爱丁堡 贝尔法斯特 英格兰 苏格兰 北爱尔兰',
    'usa': '美国 纽约 洛杉矶 华盛顿',
    'italy': '意大利 罗马 米兰 佛罗伦萨 威尼斯',
    'vatican': '梵蒂冈',
    'switzerland': '瑞士',
    'denmark': '丹麦 哥本哈根',
    'austria': '奥地利 维也纳',
    'spain': '西班牙 巴塞罗那 马德里',
    'serbia': '塞尔维亚 贝尔格莱德',
    'france': '法国 巴黎',
    'country': '南极 南极洲'
  };

  async function safeJson(url) {
    try { const r = await fetch(url); if (!r.ok) return null; return await r.json(); }
    catch { return null; }
  }

  function photoUrl(page, image) {
    return '/' + page + '?open=' + encodeURIComponent(image);
  }

  async function loadItems(scope) {
    const items = [];

    if (scope === 'all' || scope === 'photos') {
      const data = await safeJson('/photos.json');
      if (data && data.items) {
        const byPage = {};
        for (const item of data.items) {
          const key = item.page;
          if (!byPage[key]) {
            const pageKey = (item.page || '').replace('.html', '').toLowerCase();
            const zhAlias = ALBUM_ZH[pageKey] || '';
            byPage[key] = {
              type: 'photo', icon: '📷',
              title: item.pageLabel || item.page || '',
              section: '漂流坐标', tags: [], url: '/' + item.page,
              text: zhAlias + ' '
            };
          }
          byPage[key].text += ' ' + (item.title || '') + ' ' + (item.tags || []).join(' ');
          byPage[key].tags = [...new Set([...byPage[key].tags, ...(item.tags || [])])].slice(0, 6);
        }
        items.push(...Object.values(byPage));
      }
    }

    if (scope.startsWith('album:')) {
      const albumPage = scope.slice(6);
      const data = await safeJson('/photos.json');
      if (data && data.items) {
        for (const item of data.items) {
          if (item.page !== albumPage) continue;
          items.push({
            type: 'photo', icon: '🖼',
            title: item.title || item.image?.split('/').pop() || '(photo)',
            section: item.pageLabel || albumPage,
            tags: item.tags || [],
            url: photoUrl(item.page, item.image),
            text: (item.title || '') + ' ' + (item.tags || []).join(' ')
          });
        }
      }
    }

    if (scope.startsWith('tag:')) {
      const tag = scope.slice(4);
      const data = await safeJson('/photos.json');
      if (data && data.items) {
        for (const item of data.items) {
          if (!(item.tags || []).includes(tag)) continue;
          items.push({
            type: 'photo', icon: '🖼',
            title: item.title || item.image?.split('/').pop() || '(photo)',
            section: item.pageLabel || item.page || '',
            tags: (item.tags || []).filter(t => t !== tag),
            url: photoUrl(item.page, item.image),
            text: (item.title || '') + ' ' + (item.tags || []).join(' ')
          });
        }
      }
    }

    if (scope === 'all' || scope === 'fragments') {
      const data = await safeJson('/found-fragments.json');
      if (data && data.entries) {
        for (const entry of data.entries) {
          const preview = (entry.text || '').slice(0, 50) + ((entry.text || '').length > 50 ? '…' : '');
          items.push({
            type: 'fragment', icon: '✦',
            title: preview || '(fragment)',
            section: '人间拾遗', tags: entry.tags || [],
            url: '/found-fragments.html',
            text: (entry.text || '') + ' ' + (entry.tags || []).join(' ')
          });
        }
      }
    }

    const activityTypes = ['snowboarding', 'diving', 'horse-riding', 'kitesurfing'];
    const toLoad = scope === 'all' || scope === 'activities' ? activityTypes : scope.startsWith('activity:') ? [scope.slice(9)] : [];
    for (const type of toLoad) {
      const data = await safeJson('/' + type + '.json');
      if (!data || !data.entries) continue;
      for (const entry of data.entries) {
        items.push({
          type: 'activity', icon: ACTIVITY_LABELS[type]?.split(' ')[0] || '◈',
          title: [entry.location, entry.date].filter(Boolean).join(' · ') || type,
          section: ACTIVITY_LABELS[type] || type, tags: [],
          url: '/' + type + '.html',
          text: [entry.location, entry.date, entry.note, entry.record_caption].filter(Boolean).join(' ')
        });
      }
    }

    return items;
  }

  function doSearch(items, query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const words = q.split(/\s+/);
    return items.map(item => {
      const hay = item.text.toLowerCase() + ' ' + item.title.toLowerCase() + ' ' + item.section.toLowerCase() + ' ' + (item.tags || []).join(' ').toLowerCase();
      let score = 0;
      for (const w of words) if (hay.includes(w)) score++;
      return { item, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.item);
  }

  const CSS = `
    #sk-overlay {
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(246, 241, 239, 0.93);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      display: flex; flex-direction: column; align-items: center;
      padding-top: 90px; opacity: 0; pointer-events: none;
    }
    #sk-overlay.sk-open { opacity: 1; pointer-events: all; }
    #sk-input-wrap { position: relative; width: min(560px, 88vw); }
    #sk-input {
      width: 100%; box-sizing: border-box;
      border: none; border-bottom: 1.5px solid #9b7070;
      background: transparent; outline: none;
      font-size: clamp(1.1rem, 2.5vw, 1.5rem); font-family: inherit;
      color: #5c3d42; padding: 6px 36px 6px 4px;
      letter-spacing: 0.03em; caret-color: #9b7070;
    }
    #sk-input::placeholder { color: #c9a8aa; }
    #sk-close {
      position: absolute; right: 0; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer;
      color: #9b7070; font-size: 1rem; padding: 4px; opacity: .7;
      transition: opacity .15s;
    }
    #sk-close:hover { opacity: 1; }
    #sk-hint { margin-top: 10px; font-size: 0.72rem; letter-spacing: 0.1em; color: #c9a8aa; text-transform: uppercase; }
    #sk-hint .sk-scope-label { background: #f0e6e8; color: #9b7070; padding: 2px 10px; border-radius: 20px; font-size: 0.68rem; margin-left: 6px; }
    #sk-results { width: min(560px, 88vw); margin-top: 28px; display: flex; flex-direction: column; gap: 6px; max-height: 55vh; overflow-y: auto; padding-bottom: 40px; scrollbar-width: thin; scrollbar-color: #e0cece transparent; }
    #sk-results::-webkit-scrollbar { width: 4px; }
    #sk-results::-webkit-scrollbar-thumb { background: #e0cece; border-radius: 4px; }
    .sk-result { display: block; text-decoration: none; color: inherit; padding: 14px 18px; border: 1px solid #e8d8db; border-radius: 10px; background: rgba(255,255,255,0.6); transition: background .15s, border-color .15s, transform .12s; }
    .sk-result:hover { background: rgba(255,255,255,0.95); border-color: #c4a0a6; transform: translateX(3px); }
    .sk-result-head { display: flex; align-items: baseline; gap: 8px; }
    .sk-icon { font-size: 0.85rem; flex-shrink: 0; }
    .sk-title { font-size: 0.95rem; color: #5c3d42; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sk-section { font-size: 0.72rem; color: #a08080; flex-shrink: 0; }
    .sk-tags { margin-top: 5px; display: flex; gap: 5px; flex-wrap: wrap; }
    .sk-tag { background: #f5edee; color: #a07880; padding: 2px 8px; border-radius: 20px; font-size: 0.68rem; }
    .sk-empty { text-align: center; color: #b09090; font-size: 0.88rem; margin-top: 24px; letter-spacing: 0.04em; }
    .sk-loading { text-align: center; color: #c4a0a6; font-size: 0.82rem; margin-top: 24px; letter-spacing: 0.08em; }
    .sk-icon-ring { position: fixed; border-radius: 50%; border: 1.5px solid rgba(156, 115, 115, 0.7); pointer-events: none; z-index: 99998; animation: sk-ring-expand 0.55s cubic-bezier(0.2, 0.8, 0.4, 1) forwards; }
    @keyframes sk-ring-expand { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; } 100% { transform: translate(-50%, -50%) scale(3.2); opacity: 0; } }
    #sk-overlay { transform: translateY(-8px); transition: opacity 0.28s cubic-bezier(.4,0,.2,1), transform 0.28s cubic-bezier(.16,1,.3,1); }
    #sk-overlay.sk-open { opacity: 1; pointer-events: all; transform: translateY(0); }
    @media (prefers-color-scheme: dark) {
      #sk-overlay { background: rgba(30, 22, 22, 0.93); }
      #sk-input { color: #e8d0d0; border-bottom-color: #7a5555; }
      .sk-result { background: rgba(40,28,28,0.6); border-color: #5a3838; }
      .sk-result:hover { background: rgba(50,35,35,0.95); }
      .sk-title { color: #e8d0d0; }
      .sk-tag { background: #3a2424; color: #b08080; }
    }
  `;

  function scopeLabel(scope) {
    if (scope === 'all') return '全站';
    if (scope === 'photos') return '漂流坐标';
    if (scope === 'fragments') return '人间拾遗';
    if (scope === 'activities') return '沉浸体验';
    if (scope.startsWith('activity:')) return ACTIVITY_LABELS[scope.slice(9)] || scope.slice(9);
    if (scope.startsWith('album:')) return '当前相册';
    if (scope.startsWith('tag:')) return '#' + scope.slice(4);
    return scope;
  }

  let overlay, input, results, cachedItems = null, isLoaded = false;

  function buildOverlay() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    overlay = document.createElement('div');
    overlay.id = 'sk-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', '搜索');
    overlay.innerHTML = `
      <div id="sk-input-wrap">
        <input id="sk-input" type="search" placeholder="输入关键词…" autocomplete="off" spellcheck="false" />
        <button id="sk-close" aria-label="关闭">✕</button>
      </div>
      <div id="sk-hint"></div>
      <div id="sk-results" role="listbox"></div>
    `;
    document.body.appendChild(overlay);
    input = document.getElementById('sk-input');
    results = document.getElementById('sk-results');
    document.getElementById('sk-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('sk-open')) close(); });
    input.addEventListener('input', () => { if (!isLoaded) return; render(doSearch(cachedItems, input.value)); });
  }

  function render(items) {
    const q = input.value.trim();
    if (!q) { results.innerHTML = ''; return; }
    if (items.length === 0) {
      results.innerHTML = `<div class="sk-empty">没有找到"${escHtml(q)}"的相关内容</div>`;
      return;
    }
    results.innerHTML = items.slice(0, 25).map(item => `
      <a class="sk-result" href="${escHtml(item.url)}" role="option">
        <div class="sk-result-head">
          <span class="sk-icon">${item.icon}</span>
          <span class="sk-title">${escHtml(item.title)}</span>
          <span class="sk-section">${escHtml(item.section)}</span>
        </div>
        ${item.tags.length ? `<div class="sk-tags">${item.tags.map(t => `<span class="sk-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
      </a>
    `).join('');
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fireIconRing() {
    const icon = document.getElementById('search-icon') || document.querySelector('[class*="search"]') || document.querySelector('button, span, div, i, label');
    if (!icon) return;
    const rect = icon.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const size = Math.max(rect.width, rect.height);
    const ring = document.createElement('div');
    ring.className = 'sk-icon-ring';
    ring.style.cssText = `width:${size}px;height:${size}px;left:${cx}px;top:${cy}px;`;
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove());
  }

  async function open() {
    if (!overlay) buildOverlay();
    fireIconRing();
    const scope = detectScope();
    document.getElementById('sk-hint').innerHTML = `按 ESC 关闭 <span class="sk-scope-label">${scopeLabel(scope)}</span>`;
    overlay.classList.add('sk-open');
    input.focus();
    if (!isLoaded) {
      results.innerHTML = '<div class="sk-loading">正在加载…</div>';
      cachedItems = await loadItems(scope);
      isLoaded = true;
      results.innerHTML = '';
      if (input.value.trim()) render(doSearch(cachedItems, input.value));
    }
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('sk-open');
    input.value = '';
    results.innerHTML = '';
  }

  function hookSearchIcon() {
    const byId = document.getElementById('search-icon');
    if (byId) { byId.addEventListener('click', e => { e.preventDefault(); open(); }); return; }
    const all = document.querySelectorAll('a, button, span, div, i, label');
    for (const el of all) {
      const t = el.childNodes.length === 1 ? el.textContent.trim() : el.firstChild?.textContent?.trim() || '';
      if (t === '⌕' || t === '🔍') {
        el.style.cursor = 'pointer';
        el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); open(); });
        return;
      }
    }
    const byClass = document.querySelector('[class*="search"]');
    if (byClass) { byClass.addEventListener('click', e => { e.preventDefault(); open(); }); return; }
    document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); } });
  }

  function isHomePageForVisualPatch() {
    const p = window.location.pathname.toLowerCase().replace(/\/$/, '');
    return p === '' || p === '/' || p === '/home' || p === '/home.html' || p === '/index' || p === '/index.html';
  }

  function injectHomeGrowthSignStyle() {
    if (!isHomePageForVisualPatch() || document.getElementById('home-growth-sign-position-patch')) return;
    const style = document.createElement('style');
    style.id = 'home-growth-sign-position-patch';
    style.textContent = `
      @media (min-width: 901px) {
        .growth-sign {
          right: 0.8% !important;
          top: 61.4% !important;
          text-align: center !important;
          align-items: center !important;
        }

        .growth-title,
        .growth-sub,
        .growth-cn,
        .growth-en {
          width: 100% !important;
          text-align: center !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }

        .growth-title {
          transform: translateX(-11px) !important;
        }

        .growth-sign .chain,
        .chain {
          left: 50% !important;
          transform: translateX(-50%) !important;
        }
      }

      @media (max-width: 900px) {
        .tree-area,
        .tree-stage,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          min-height: clamp(548px, 139vw, 672px) !important;
          height: clamp(548px, 139vw, 672px) !important;
          margin: 0 auto !important;
          overflow: visible !important;
        }

        .tree-main,
        .main-tree,
        .growth-tree-main,
        .tree-image,
        .tree-art {
          width: min(calc(100vw - 18px), 580px) !important;
          max-height: 820px !important;
          display: block !important;
          margin-left: auto !important;
          margin-right: auto !important;
          object-fit: contain !important;
          object-position: center top !important;
          border-radius: 40px !important;
          -webkit-mask-image: radial-gradient(ellipse 82% 92% at 50% 52%, #000 50%, rgba(0,0,0,.76) 76%, rgba(0,0,0,0) 100%) !important;
          mask-image: radial-gradient(ellipse 82% 92% at 50% 52%, #000 50%, rgba(0,0,0,.76) 76%, rgba(0,0,0,0) 100%) !important;
        }

        .corner-top-left img,
        .floral-top-left img,
        .botanical-top-left img,
        .home-corner-tl img,
        .corner-tl img,
        .flora-tl img,
        img[src*="home-corner-tl"],
        img[src*="corner-tl"],
        img[src*="top-left"] {
          opacity: .96 !important;
          filter: saturate(1.08) contrast(1.12) brightness(1.02) !important;
          image-rendering: auto !important;
          -webkit-font-smoothing: antialiased !important;
          backface-visibility: hidden !important;
        }

        .right-side,
        .right-col,
        .right-column,
        .latest-area,
        .latest-panel-wrap,
        .bottom-panels {
          width: min(84vw, 390px) !important;
          max-width: min(84vw, 390px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
          transform: translateX(2vw) !important;
          align-items: stretch !important;
          align-self: center !important;
          box-sizing: border-box !important;
        }

        .latest-card,
        .latest-panel,
        .panel-card,
        .updates-card {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          box-sizing: border-box !important;
        }

        .side-links,
        .behind-wrap,
        .behind-pixels {
          width: min(84vw, 390px) !important;
          max-width: min(84vw, 390px) !important;
          margin-left: auto !important;
          margin-right: auto !important;
          text-align: center !important;
          justify-content: center !important;
          align-items: center !important;
          transform: none !important;
          align-self: center !important;
          box-sizing: border-box !important;
        }

        .cards .card img,
        .cards .entry-card img,
        .cards .portal-card img,
        .grid .card img,
        .grid .entry-card img,
        .grid .portal-card img,
        .left-side .card img,
        .left-side .entry-card img,
        .left-side .portal-card img,
        .left-col .card img,
        .left-col .entry-card img,
        .left-col .portal-card img,
        .left-column .card img,
        .left-column .entry-card img,
        .left-column .portal-card img {
          max-width: 36% !important;
          width: clamp(86px, 24vw, 128px) !important;
          height: auto !important;
          transform: translate(2px, 7px) scale(.84) !important;
          transform-origin: left center !important;
          opacity: .68 !important;
        }

        .node,
        .school-node,
        .milestone-node {
          min-width: clamp(118px, 34vw, 152px) !important;
          padding: clamp(7px, 2vw, 9px) clamp(10px, 3vw, 14px) !important;
          transform: translateX(-50%) scale(.78) !important;
          transform-origin: center center !important;
        }

        .node-u { top: 34.8% !important; left: 72.8% !important; }
        .node-s { top: 49.4% !important; left: 45.7% !important; }
        .node-j { top: 60.4% !important; left: 44.6% !important; }
        .node-p { top: 70.0% !important; left: 50.2% !important; }
        .node-k { top: 80.6% !important; left: 65.0% !important; }

        .growth-sign {
          width: clamp(78px, 22vw, 98px) !important;
          right: -5% !important;
          top: 59.8% !important;
          padding: clamp(9px, 2.6vw, 13px) clamp(5px, 1.6vw, 7px) clamp(7px, 2vw, 9px) !important;
          text-align: center !important;
          align-items: center !important;
          overflow: visible !important;
          line-height: 1.05 !important;
        }

        .growth-title {
          font-size: clamp(11.5px, 3.2vw, 15px) !important;
          line-height: 1.03 !important;
          transform: translateX(-3px) !important;
          white-space: normal !important;
          word-break: keep-all !important;
          overflow-wrap: normal !important;
          hyphens: none !important;
          text-wrap: balance !important;
        }

        .growth-sub {
          font-size: clamp(8.2px, 2.35vw, 10px) !important;
          line-height: 1.08 !important;
        }

        .growth-cn {
          font-size: clamp(6.8px, 2.05vw, 8.8px) !important;
          line-height: 1.12 !important;
          white-space: nowrap !important;
        }

        .growth-en {
          font-size: clamp(5.4px, 1.65vw, 7px) !important;
          line-height: 1.12 !important;
          white-space: normal !important;
        }

        .growth-sign .chain,
        .chain {
          left: 50% !important;
          width: clamp(58px, 16vw, 72px) !important;
          height: clamp(40px, 11vw, 50px) !important;
          top: clamp(-50px, -11vw, -40px) !important;
          transform: translateX(-50%) !important;
        }

        .footer-text,
        .site-quote,
        .home-quote,
        footer {
          margin-top: -22px !important;
          transform: translateY(-22px) !important;
        }
      }

      @media (max-width: 520px) {
        .tree-area,
        .tree-stage,
        .tree-shell,
        .center-stage,
        .center-col,
        .center-column {
          min-height: clamp(508px, 145vw, 625px) !important;
          height: clamp(508px, 145vw, 625px) !important;
        }

        .tree-main,
        .main-tree,
        .growth-tree-main,
        .tree-image,
        .tree-art {
          width: min(calc(100vw - 18px), 548px) !important;
          max-height: 760px !important;
          display: block !important;
          margin-left: auto !important;
          margin-right: auto !important;
          object-position: center top !important;
          -webkit-mask-image: radial-gradient(ellipse 80% 92% at 50% 52%, #000 48%, rgba(0,0,0,.72) 74%, rgba(0,0,0,0) 100%) !important;
          mask-image: radial-gradient(ellipse 80% 92% at 50% 52%, #000 48%, rgba(0,0,0,.72) 74%, rgba(0,0,0,0) 100%) !important;
        }

        .cards .card img,
        .cards .entry-card img,
        .cards .portal-card img,
        .grid .card img,
        .grid .entry-card img,
        .grid .portal-card img,
        .left-side .card img,
        .left-side .entry-card img,
        .left-side .portal-card img,
        .left-col .card img,
        .left-col .entry-card img,
        .left-col .portal-card img,
        .left-column .card img,
        .left-column .entry-card img,
        .left-column .portal-card img {
          max-width: 32% !important;
          width: clamp(76px, 21vw, 112px) !important;
          transform: translate(2px, 6px) scale(.78) !important;
        }

        .node,
        .school-node,
        .milestone-node {
          transform: translateX(-50%) scale(.70) !important;
        }

        .growth-sign {
          width: clamp(72px, 23vw, 92px) !important;
          right: -6.5% !important;
          top: 61.2% !important;
          padding: clamp(8px, 2.4vw, 11px) clamp(4px, 1.4vw, 6px) clamp(6px, 1.8vw, 8px) !important;
        }

        .growth-title {
          font-size: clamp(10.5px, 3.1vw, 14px) !important;
          transform: translateX(-2px) !important;
        }

        .growth-sub {
          font-size: clamp(7.6px, 2.22vw, 9.3px) !important;
        }

        .growth-cn {
          font-size: clamp(6.2px, 1.95vw, 8px) !important;
        }

        .growth-en {
          font-size: clamp(5px, 1.55vw, 6.6px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function applyHomeGrowthSignPatch() {
    if (!isHomePageForVisualPatch()) return;
    document.documentElement.style.setProperty('--home-behind-x', '0px');
    injectHomeGrowthSignStyle();

    const sign = document.querySelector('.growth-sign');
    if (sign) {
      sign.style.right = window.innerWidth <= 520 ? '-6.5%' : (window.innerWidth <= 900 ? '-5%' : '0.8%');
      sign.style.top = window.innerWidth <= 520 ? '61.2%' : (window.innerWidth <= 900 ? '59.8%' : '61.4%');
      sign.style.textAlign = 'center';
      sign.style.alignItems = 'center';
      if (window.innerWidth <= 900) sign.style.overflow = 'visible';
    }

    document.querySelectorAll('.growth-title, .growth-sub, .growth-cn, .growth-en').forEach((element) => {
      element.style.width = '100%';
      element.style.textAlign = 'center';
      element.style.marginLeft = 'auto';
      element.style.marginRight = 'auto';
      if (element.classList.contains('growth-title')) {
        element.style.transform = window.innerWidth <= 520 ? 'translateX(-2px)' : (window.innerWidth <= 900 ? 'translateX(-3px)' : 'translateX(-11px)');
        element.style.wordBreak = 'keep-all';
        element.style.overflowWrap = 'normal';
        element.style.hyphens = 'none';
      }
    });

    document.querySelectorAll('.growth-sign .chain, .chain').forEach((element) => {
      element.style.left = '50%';
      element.style.transform = 'translateX(-50%)';
    });
  }

  function scheduleHomeGrowthSignPatch() {
    if (!isHomePageForVisualPatch()) return;
    const run = () => requestAnimationFrame(applyHomeGrowthSignPatch);
    run();
    setTimeout(run, 120);
    setTimeout(run, 450);
    setTimeout(run, 1200);
    window.addEventListener('resize', run, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', run, { passive: true });
  }

  function boot() {
    hookSearchIcon();
    scheduleHomeGrowthSignPatch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.siteSearch = { open, close };
})();
