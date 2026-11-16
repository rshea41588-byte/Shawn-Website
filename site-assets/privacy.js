(() => {
  'use strict';
  const model=window.PrecisionPrivacyPreferences;
  const banner=document.getElementById('privacy-banner');
  const dialog=document.getElementById('privacy-dialog');
  if (!model || !banner || !dialog) return;
  const mapsInput=document.getElementById('privacy-maps');
  const videosInput=document.getElementById('privacy-videos');
  const status=document.getElementById('privacy-status');
  const requestNote=document.getElementById('privacy-request');
  const mapBlocks=[...document.querySelectorAll('[data-map-src]')];
  const placeholders=new Map(mapBlocks.map(block=>[block,block.firstElementChild.cloneNode(true)]));
  let choice=null,pending=null,opener=null;
  try {
    const raw=localStorage.getItem(model.key);
    choice=model.parse(raw);
    if (raw!==null && !choice) localStorage.removeItem(model.key);
  } catch {}
  const allows=category=>['maps','videos'].includes(category) && choice?.[category]===true;
  function updateMaps() {
    for (const block of mapBlocks) {
      if (allows('maps')) {
        if (block.querySelector('iframe')) continue;
        const url=new URL(block.dataset.mapSrc);
        if (url.origin!=='https://www.google.com' || url.pathname!=='/maps/embed') continue;
        const frame=document.createElement('iframe');
        frame.src=url.href;
        frame.title='Google Maps: Precision Jiu Jitsu, 14 Brady Drive, Hudson, New Hampshire';
        frame.width='600';frame.height='290';frame.loading='lazy';frame.allowFullscreen=true;
        frame.referrerPolicy='strict-origin-when-cross-origin';
        block.replaceChildren(frame);
      } else if (block.querySelector('iframe')) block.replaceChildren(placeholders.get(block).cloneNode(true));
    }
  }
  function close() {
    if (dialog.open) dialog.close();
    document.body.classList.remove('modal-open');
  }
  function save(flags) {
    choice=model.create(flags);
    let stored=true;
    try { localStorage.setItem(model.key,JSON.stringify(choice)); } catch { stored=false; }
    banner.hidden=true;
    const resume=pending;pending=null;
    updateMaps();
    window.dispatchEvent(new CustomEvent('precision:privacychange',{detail:{maps:choice.maps,videos:choice.videos}}));
    close();
    status.textContent=stored?'Your cookie choices have been saved.':'Your choices apply to this page. Your browser could not save them for a later visit.';
    if (resume && allows(resume.category)) resume.callback();
  }
  function openSettings(category=null) {
    opener=document.activeElement;
    mapsInput.checked=allows('maps');videosInput.checked=allows('videos');
    requestNote.hidden=!category;
    requestNote.textContent=category==='maps'?'To show the gym map here, allow Google Maps and save your choices.':category==='videos'?'To watch this player here, allow External videos and save your choices.':'';
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('modal-open');
    (category==='maps'?mapsInput:category==='videos'?videosInput:dialog.querySelector('.close-dialog')).focus();
  }
  function request(category,callback) {
    if (!['maps','videos'].includes(category)) return;
    if (allows(category)) { callback();return; }
    pending={category,callback};
    openSettings(category);
  }
  window.PrecisionPrivacy=Object.freeze({allows,request,openSettings:()=>{pending=null;openSettings();}});
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-privacy-settings')) { pending=null;openSettings(); }
    if (button.hasAttribute('data-load-map')) request('maps',updateMaps);
    if (button.dataset.privacyChoice) {
      const allow=button.dataset.privacyChoice==='all';
      save({maps:allow,videos:allow});
    }
  });
  document.getElementById('privacy-save').addEventListener('click',()=>save({maps:mapsInput.checked,videos:videosInput.checked}));
  dialog.querySelector('.close-dialog').addEventListener('click',close);
  dialog.addEventListener('close',()=>{
    pending=null;document.body.classList.remove('modal-open');
    if (opener?.isConnected) opener.focus();
  });
  window.addEventListener('storage',event=>{
    if (event.key!==model.key && event.key!==null) return;
    choice=event.key===null?null:model.parse(event.newValue);
    banner.hidden=Boolean(choice);updateMaps();
    window.dispatchEvent(new CustomEvent('precision:privacychange',{detail:{maps:allows('maps'),videos:allows('videos')}}));
  });
  banner.hidden=Boolean(choice);
  updateMaps();
})();
