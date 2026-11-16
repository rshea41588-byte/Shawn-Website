(() => {
  'use strict';
  const maxAge=180*24*60*60*1000;
  function parse(raw,now=Date.now()) {
    try {
      const value=JSON.parse(raw);
      if (!value || value.version!==1 || typeof value.maps!=='boolean' || typeof value.videos!=='boolean' || !Number.isFinite(value.updatedAt) || value.updatedAt>now || now-value.updatedAt>=maxAge) return null;
      return {version:1,maps:value.maps,videos:value.videos,updatedAt:value.updatedAt};
    } catch { return null; }
  }
  function create(flags,now=Date.now()) {
    return {version:1,maps:flags.maps===true,videos:flags.videos===true,updatedAt:now};
  }
  window.PrecisionPrivacyPreferences=Object.freeze({key:'precision_privacy_v1',maxAge,parse,create});
})();
