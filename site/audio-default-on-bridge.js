(function () {
  'use strict';

  if (window.__siteAudioDefaultOnBridgeInstalled) return;
  window.__siteAudioDefaultOnBridgeInstalled = true;

  const pairs = [
    ['home-bgm-muted', 'home-bgm-muted-v2'],
    ['about-bgm-muted', 'about-bgm-muted-v2'],
    ['jianmu-bgm-muted', 'jianmu-bgm-muted-v2']
  ];

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  pairs.forEach(function (pair) {
    const legacyKey = pair[0];
    const nextKey = pair[1];
    const nextValue = safeGet(nextKey);

    if (nextValue === 'true' || nextValue === 'false') {
      safeSet(legacyKey, nextValue);
      return;
    }

    if (safeGet(legacyKey) === 'true') {
      safeSet(legacyKey, 'false');
      safeSet(nextKey, 'false');
    }
  });

  const originalSetItem = Storage.prototype.setItem;
  if (!originalSetItem || Storage.prototype.__siteAudioDefaultOnBridgePatched) return;

  Storage.prototype.__siteAudioDefaultOnBridgePatched = true;
  Storage.prototype.setItem = function (key, value) {
    for (let index = 0; index < pairs.length; index += 1) {
      const legacyKey = pairs[index][0];
      const nextKey = pairs[index][1];
      if (key === legacyKey) {
        try { originalSetItem.call(this, nextKey, String(value)); } catch (e) {}
        break;
      }
    }
    return originalSetItem.call(this, key, value);
  };
}());