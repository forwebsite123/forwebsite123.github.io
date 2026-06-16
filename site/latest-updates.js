(function () {
  const list = document.getElementById('latest-updates-list');
  if (!list) return;

  const MAX_UPDATES = 5;

  // Add future public JSON sources here. For activity-style files shaped like
  // { "entries": [...] }, one config line is enough: file, page, icon, label, type.
  // Supported type values:
  // - "activity": generic entries[] adapter using date, location, record_caption, note.
  // - "fragments": entries[] adapter using date, text, and tags.
  // Keep this list explicit; static sites cannot safely auto-scan directories.
  const UPDATE_SOURCES = [
    { file: 'diving.json', page: 'diving.html', icon: '🫧', label: 'Diving', type: 'activity' },
    { file: 'found-fragments.json', page: 'found-fragments.html', icon: '✦', label: 'Fragments', type: 'fragments' },
    { file: 'snowboarding.json', page: 'snowboarding.html', icon: '🏂', label: 'Snow', type: 'activity' },
    { file: 'horse-riding.json', page: 'horse-riding.html', icon: '🐎', label: 'Riding', type: 'activity' },
    { file: 'kitesurfing.json', page: 'kitesurfing.html', icon: '🪁', label: 'Kite', type: 'activity' }
  ];

  const ADAPTERS = {
    activity: collectActivityEntries,
    fragments: collectFoundFragments
  };

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
      const date = parseDateRange(entry.date);
      if (!date) return null;
      const title = compactText(entry.record_caption || entry.note || entry.location, 'new trace');
      const location = entry.location ? ` · ${entry.location}` : '';
      return {
        icon: source.icon,
        label: source.label,
        title: `${title}${location}`,
        date,
        href: `${source.page}#${anchorFrom(date, entry.location || source.label)}`
      };
    }).filter(Boolean);
  }

  function collectFoundFragments(data, source) {
    const entries = Array.isArray(data && data.entries) ? data.entries : [];
    return entries.map((entry) => {
      const date = parseDateRange(entry.date);
      if (!date) return null;
      return {
        icon: source.icon,
        label: source.label,
        title: compactText(entry.text || (entry.tags || []).join(', '), 'a found fragment'),
        date,
        href: `${source.page}#${anchorFrom(date)}`
      };
    }).filter(Boolean);
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
    return String(value).replace(/[&<>\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
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
