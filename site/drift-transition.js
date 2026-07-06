(function () {
  'use strict';

  const POEM_LINES = [
    '我轻松愉快地走上大路',
    '我健康自由，世界在我面前',
    '长长的褐色的大路',
    '在我面前',
    '指向我想去的任何地方',
    '从此',
    '我不再希求幸福，我自己便是幸福',
    '凡是我遇见的我都喜欢',
    '一切都被接受',
    '从此',
    '我不受限制',
    '我使我自己自由',
    '我走到我所愿去的任何地方，我完全而绝对地主持着我。',
    '——沃尔特·惠特曼《大路之歌》'
  ];

  const NORMAL_LINE_DELAY = 620;
  const REDUCED_LINE_DELAY = 35;
  const FINAL_HOLD = 1900;
  const REDUCED_FINAL_HOLD = 360;
  const EXIT_DURATION = 1050;
  const REDUCED_EXIT_DURATION = 180;

  function isPlainLeftClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  function makeOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'drift-transition-overlay';
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-label', 'Drift Coordinates poem transition');

    const poem = document.createElement('div');
    poem.className = 'drift-transition-poem';

    POEM_LINES.forEach((line, index) => {
      const row = document.createElement('div');
      row.className = 'drift-transition-line';
      if (index === POEM_LINES.length - 1) row.classList.add('is-credit');
      row.textContent = line;
      poem.appendChild(row);
    });

    overlay.appendChild(poem);
    document.body.appendChild(overlay);
    return overlay;
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function playTransition(targetHref) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lineDelay = reducedMotion ? REDUCED_LINE_DELAY : NORMAL_LINE_DELAY;
    const finalHold = reducedMotion ? REDUCED_FINAL_HOLD : FINAL_HOLD;
    const exitDuration = reducedMotion ? REDUCED_EXIT_DURATION : EXIT_DURATION;
    const overlay = makeOverlay();
    const lines = overlay.querySelectorAll('.drift-transition-line');

    document.body.classList.add('drift-transition-soften');
    await wait(reducedMotion ? 20 : 80);
    overlay.classList.add('is-visible');
    await wait(reducedMotion ? 110 : 650);

    for (const line of lines) {
      line.classList.add('is-shown');
      await wait(lineDelay);
    }

    await wait(finalHold);
    overlay.classList.add('is-poem-leaving', 'is-leaving');
    await wait(exitDuration);
    window.location.href = targetHref;
  }

  function boot() {
    const driftCard = document.querySelector('a[data-drift-transition-trigger][href$="Drift-coordinates.html"]');
    if (!driftCard) return;

    let isPlaying = false;
    driftCard.addEventListener('click', (event) => {
      if (!isPlainLeftClick(event) || driftCard.target === '_blank') return;
      event.preventDefault();
      if (isPlaying) return;
      isPlaying = true;
      playTransition(driftCard.href);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
