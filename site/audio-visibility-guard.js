(function () {
  'use strict';

  if (window.__siteAudioVisibilityGuardInstalled) return;
  window.__siteAudioVisibilityGuardInstalled = true;

  const NativeAudio = window.Audio;
  const trackedMedia = new Set();
  const hiddenState = new WeakMap();

  function track(media) {
    if (!media || trackedMedia.has(media)) return media;
    trackedMedia.add(media);
    media.addEventListener('ended', function () {
      hiddenState.delete(media);
    });
    return media;
  }

  if (typeof NativeAudio === 'function') {
    window.Audio = function SiteTrackedAudio() {
      const media = new (Function.prototype.bind.apply(NativeAudio, [null].concat(Array.prototype.slice.call(arguments))))();
      return track(media);
    };
    window.Audio.prototype = NativeAudio.prototype;
    Object.setPrototypeOf(window.Audio, NativeAudio);
  }

  function trackExistingMedia() {
    document.querySelectorAll('audio, video').forEach(track);
  }

  function pauseForHidden() {
    trackExistingMedia();
    trackedMedia.forEach(function (media) {
      if (!media || media.paused || media.ended) return;
      hiddenState.set(media, {
        shouldResume: true,
        volume: media.volume
      });
      try { media.pause(); } catch (e) {}
    });
  }

  function resumeForVisible() {
    trackedMedia.forEach(function (media) {
      const state = hiddenState.get(media);
      if (!media || !state || !state.shouldResume || media.ended) return;
      hiddenState.delete(media);
      try {
        media.volume = state.volume;
        const playPromise = media.play();
        if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(function () {});
      } catch (e) {}
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') pauseForHidden();
    else resumeForVisible();
  });

  window.addEventListener('pagehide', pauseForHidden);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackExistingMedia);
  else trackExistingMedia();
}());
