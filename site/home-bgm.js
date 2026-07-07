(function () {
  'use strict';

  const path = window.location.pathname.replace(/\/+$/, '');
  const lowerPath = path.toLowerCase();
  const isSpecialAudioPage = lowerPath.endsWith('/about') || lowerPath.endsWith('/about.html') || lowerPath.endsWith('/jianmu') || lowerPath.endsWith('/jianmu.html');
  if (isSpecialAudioPage) return;

  const HOME_AUDIO_SRC = '/audio/home-bgm-guqin-reflection-420788.mp3';
  const HOME_AUDIO_VOLUME = 0.052;
  const HOME_AUDIO_FADE_IN = 1800;
  const HOME_AUDIO_FADE_OUT = 850;
  const HOME_AUDIO_TIME_KEY = 'home-bgm-current-time';
  const HOME_AUDIO_MUTED_KEY = 'home-bgm-muted';
  const HOME_AUDIO_READY_KEY = 'home-bgm-ready';

  let audio = null;
  let toggle = null;
  let saveTimer = null;
  let mutedByUser = localStorage.getItem(HOME_AUDIO_MUTED_KEY) === 'true';
  let isUnavailable = false;

  function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
  }

  function fadeAudio(fromVolume, toVolume, duration, done) {
    if (!audio) return;
    if (duration <= 0) {
      audio.volume = clampVolume(toVolume);
      if (done) done();
      return;
    }

    const startedAt = window.performance.now();
    const start = clampVolume(fromVolume);
    const end = clampVolume(toVolume);

    function tick(now) {
      if (!audio) return;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 2);
      audio.volume = clampVolume(start + (end - start) * eased);
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else if (done) {
        done();
      }
    }

    window.requestAnimationFrame(tick);
  }

  function getSavedTime() {
    const raw = Number(localStorage.getItem(HOME_AUDIO_TIME_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
  }

  function saveTime() {
    if (!audio || !Number.isFinite(audio.currentTime)) return;
    localStorage.setItem(HOME_AUDIO_TIME_KEY, String(Math.max(0, audio.currentTime)));
  }

  function updateToggle(visible) {
    if (!toggle) return;
    if (isUnavailable) {
      toggle.classList.remove('is-visible', 'is-playing');
      toggle.setAttribute('aria-hidden', 'true');
      return;
    }
    if (visible) toggle.classList.add('is-visible');
    const isPlaying = !!audio && !audio.paused && !mutedByUser;
    toggle.classList.toggle('is-playing', isPlaying);
    toggle.textContent = isPlaying ? '♫' : '♪';
    toggle.setAttribute('aria-pressed', String(isPlaying));
    toggle.setAttribute('aria-label', isPlaying ? '关闭 Home 背景音乐' : '打开 Home 背景音乐');
  }

  function createToggle() {
    const style = document.createElement('style');
    style.textContent = `
      .home-audio-toggle{position:fixed;right:18px;bottom:18px;z-index:90;width:38px;height:38px;border:1px solid rgba(122,87,87,.15);border-radius:999px;background:rgba(255,251,249,.70);color:rgba(122,87,87,.52);box-shadow:0 10px 26px rgba(122,87,87,.055);cursor:pointer;font-family:"Times New Roman",Georgia,serif;font-size:15px;line-height:1;opacity:0;pointer-events:none;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:opacity .55s ease,color .35s ease,background .35s ease,transform .35s ease}
      .home-audio-toggle.is-visible{opacity:.55;pointer-events:auto}
      .home-audio-toggle.is-playing{color:rgba(122,87,87,.70);background:rgba(255,251,249,.82)}
      .home-audio-toggle:hover{opacity:.90;transform:translateY(-1px)}
    `;
    document.head.appendChild(style);

    toggle = document.createElement('button');
    toggle.className = 'home-audio-toggle';
    toggle.type = 'button';
    toggle.textContent = '♪';
    toggle.setAttribute('aria-label', '打开 Home 背景音乐');
    toggle.setAttribute('aria-pressed', 'false');
    document.body.appendChild(toggle);

    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (!audio || isUnavailable) return;
      if (!audio.paused && !mutedByUser) pauseByUser();
      else resumeByUser();
    });
  }

  function bindFirstGestureFallback() {
    const options = { once: true, passive: true };
    const retry = function () { startAudio(true); };
    document.addEventListener('pointerdown', retry, options);
    document.addEventListener('keydown', retry, options);
    document.addEventListener('touchstart', retry, options);
  }

  function startSaving() {
    if (saveTimer) return;
    saveTimer = window.setInterval(saveTime, 900);
  }

  function startAudio(showToggleAfterStart) {
    if (!audio || isUnavailable) return Promise.resolve(false);
    if (mutedByUser) {
      updateToggle(true);
      return Promise.resolve(false);
    }

    const savedTime = getSavedTime();
    if (savedTime > 0 && Math.abs(audio.currentTime - savedTime) > 1.2) {
      try { audio.currentTime = savedTime; } catch (e) {}
    }

    const playPromise = audio.play();
    if (!playPromise || typeof playPromise.then !== 'function') {
      fadeAudio(audio.volume, HOME_AUDIO_VOLUME, HOME_AUDIO_FADE_IN);
      updateToggle(showToggleAfterStart);
      startSaving();
      return Promise.resolve(true);
    }

    return playPromise.then(function () {
      localStorage.setItem(HOME_AUDIO_READY_KEY, 'true');
      fadeAudio(audio.volume, HOME_AUDIO_VOLUME, HOME_AUDIO_FADE_IN);
      updateToggle(showToggleAfterStart);
      startSaving();
      return true;
    }).catch(function () {
      updateToggle(true);
      bindFirstGestureFallback();
      return false;
    });
  }

  function pauseByUser() {
    if (!audio) return;
    mutedByUser = true;
    localStorage.setItem(HOME_AUDIO_MUTED_KEY, 'true');
    saveTime();
    fadeAudio(audio.volume, 0, HOME_AUDIO_FADE_OUT, function () {
      audio.pause();
      updateToggle(true);
    });
  }

  function resumeByUser() {
    mutedByUser = false;
    localStorage.setItem(HOME_AUDIO_MUTED_KEY, 'false');
    startAudio(true);
  }

  function suspendForTransition(duration) {
    if (!audio || isUnavailable) return;
    saveTime();
    if (audio.paused || mutedByUser) return;
    fadeAudio(audio.volume, 0, duration || HOME_AUDIO_FADE_OUT, function () {
      saveTime();
      audio.pause();
      updateToggle(true);
    });
  }

  function resumeAfterTransition() {
    if (!audio || isUnavailable || mutedByUser) return;
    startAudio(false);
  }

  function registerInjector() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/home-bgm-sw.js').catch(function () {});
  }

  function boot() {
    createToggle();

    audio = new Audio(HOME_AUDIO_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0;
    audio.setAttribute('playsinline', '');
    audio.setAttribute('aria-hidden', 'true');

    audio.addEventListener('error', function () {
      isUnavailable = true;
      updateToggle(false);
      if (saveTimer) window.clearInterval(saveTimer);
    });
    audio.addEventListener('play', function () { updateToggle(true); });
    audio.addEventListener('pause', function () { updateToggle(true); });

    window.addEventListener('pagehide', saveTime);
    window.addEventListener('beforeunload', saveTime);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveTime();
    });

    window.HomeBgm = {
      saveTime: saveTime,
      suspendForTransition: suspendForTransition,
      resumeAfterTransition: resumeAfterTransition,
      start: function () { return startAudio(true); },
      pause: suspendForTransition
    };

    registerInjector();
    startAudio(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
