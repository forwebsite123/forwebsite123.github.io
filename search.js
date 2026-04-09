(function () {
  'use strict';

  function detectScope() {
    if (window.SEARCH_SCOPE) return window.SEARCH_SCOPE;
    const p = window.location.pathname.toLowerCase().replace(/\/$/, '');
    if (p === '' || p === '/home' || p === '/index' || p === '/index.html') return 'all';
    const activityPages = ['snowboarding', 'diving', 'horse-riding', 'kitesurfing'];
    for (const a of activityPages) { if (p.includes(a)) return 'activity:' + a; }
    if (p.includes('found-fragments')) return 'fragments';
    if (p.includes('into-the-wild'))  return 'activities';
    if (p.includes('drift-coordinates')) return 'photos';
    if (p.includes('tag')) {
      const tag = new URLSearchParams(window.location.search).get('tag');
      return tag ? 'tag:' + tag : 'photos';
    }
    const photosIndexPages = ['europe', 'asia', 'africa', 'oceania',
                              'north-america', 'south-america', 'antarctica', 'china'];
    for (const idx of photosIndexPages) { if (p.includes(idx)) return 'photos'; }
    const pageName = window.location.pathname.split('/').pop();
    if (pageName) return 'album:' + (pageName.endsWith('.html') ? pageName : pageName + '.html');
    return 'all';
  }

  const ACTIVITY_LABELS = {
    'snowboarding': '🏂 滑雪', 'diving': '🤿 潜水',
    'horse-riding': '🐴 骑马', 'kitesurfing': '🪁 风筝冲浪'
  };

  // 相册中英文对照，搜索时自动补充
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
    'usa': '美国 纽约 洛杉矶',
    'italy': '意大利 罗马 米兰 佛罗伦萨',
    'vatican': '梵蒂冈',
    'switzerland': '瑞士',
    'denmark': '丹麦 哥本哈根',
    'austria': '奥地利 维也纳',
    'spain': '西班牙 巴塞罗那 马德里',
    'serbia': '塞尔维亚 贝尔格莱德',
    'france': '法国 巴黎',
    'country': '南极 南极洲',
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

    /* All photos / photos index — grouped by album */
    if (scope === 'all' || scope === 'photos') {
      const data = await safeJson('/photos.json');
      if (data && data.items) {
        const byPage = {};
        for (const item of data.items) {
          const key = item.page;
          if (!byPage[key]) {
            const pageKey = (item.page || '').replace('.html','').toLowerCase();
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

    /* Album scope — individual photos with lightbox links */
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

    /* Tag scope — individual photos with that tag */
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

    /* Found Fragments */
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

    /* Activity entries */
    const activityTypes = ['snowboarding', 'diving', 'horse-riding', 'kitesurfing'];
    const toLoad = scope === 'all' || scope === 'activities'
      ? activityTypes
      : scope.startsWith('activity:') ? [scope.slice(9)] : [];
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
    return items
      .map(item => {
        const hay = item.text.toLowerCase() + ' ' + item.title.toLowerCase()
                  + ' ' + item.section.toLowerCase()
                  + ' ' + (item.tags || []).join(' ').toLowerCase();
        let score = 0;
        for (const w of words) if (hay.includes(w)) score++;
        return { item, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
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
    #sk-hint .sk-scope-label {
      background: #f0e6e8; color: #9b7070;
      padding: 2px 10px; border-radius: 20px; font-size: 0.68rem; margin-left: 6px;
    }
    #sk-results {
      width: min(560px, 88vw); margin-top: 28px;
      display: flex; flex-direction: column; gap: 6px;
      max-height: 55vh; overflow-y: auto; padding-bottom: 40px;
      scrollbar-width: thin; scrollbar-color: #e0cece transparent;
    }
    #sk-results::-webkit-scrollbar { width: 4px; }
    #sk-results::-webkit-scrollbar-thumb { background: #e0cece; border-radius: 4px; }
    .sk-result {
      display: block; text-decoration: none; color: inherit;
      padding: 14px 18px; border: 1px solid #e8d8db; border-radius: 10px;
      background: rgba(255,255,255,0.6);
      transition: background .15s, border-color .15s, transform .12s;
    }
    .sk-result:hover { background: rgba(255,255,255,0.95); border-color: #c4a0a6; transform: translateX(3px); }
    .sk-result-head { display: flex; align-items: baseline; gap: 8px; }
    .sk-icon { font-size: 0.85rem; flex-shrink: 0; }
    .sk-title { font-size: 0.95rem; color: #5c3d42; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sk-section { font-size: 0.72rem; color: #a08080; flex-shrink: 0; }
    .sk-tags { margin-top: 5px; display: flex; gap: 5px; flex-wrap: wrap; }
    .sk-tag { background: #f5edee; color: #a07880; padding: 2px 8px; border-radius: 20px; font-size: 0.68rem; }
    .sk-empty { text-align: center; color: #b09090; font-size: 0.88rem; margin-top: 24px; letter-spacing: 0.04em; }
    .sk-loading { text-align: center; color: #c4a0a6; font-size: 0.82rem; margin-top: 24px; letter-spacing: 0.08em; }
    .sk-icon-ring {
      position: fixed; border-radius: 50%;
      border: 1.5px solid rgba(156, 115, 115, 0.7);
      pointer-events: none; z-index: 99998;
      animation: sk-ring-expand 0.55s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
    }
    @keyframes sk-ring-expand {
      0%   { transform: translate(-50%, -50%) scale(1);    opacity: 0.85; }
      100% { transform: translate(-50%, -50%) scale(3.2);  opacity: 0;    }
    }
    #sk-overlay {
      transform: translateY(-8px);
      transition: opacity 0.28s cubic-bezier(.4,0,.2,1), transform 0.28s cubic-bezier(.16,1,.3,1);
    }
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
    if (scope === 'all')       return '全站';
    if (scope === 'photos')    return '漂流坐标';
    if (scope === 'fragments') return '人间拾遗';
    if (scope === 'activities') return '沉浸体验';
    if (scope.startsWith('activity:')) return ACTIVITY_LABELS[scope.slice(9)] || scope.slice(9);
    if (scope.startsWith('album:')) return '当前相册';
    if (scope.startsWith('tag:'))   return '#' + scope.slice(4);
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

    input   = document.getElementById('sk-input');
    results = document.getElementById('sk-results');

    document.getElementById('sk-close').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('sk-open')) close();
    });
    input.addEventListener('input', () => {
      if (!isLoaded) return;
      render(doSearch(cachedItems, input.value));
    });
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
        ${item.tags.length ? `<div class="sk-tags">${item.tags.map(t =>
          `<span class="sk-tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
      </a>
    `).join('');
  }

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function fireIconRing() {
    const icon = document.getElementById('search-icon')
      || document.querySelector('[class*="search"]')
      || document.querySelector('button, span, div, i, label');
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
    document.getElementById('sk-hint').innerHTML =
      `按 ESC 关闭 <span class="sk-scope-label">${scopeLabel(scope)}</span>`;
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
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookSearchIcon);
  } else {
    hookSearchIcon();
  }

  window.siteSearch = { open, close };
})();
