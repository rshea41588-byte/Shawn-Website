(() => {
  'use strict';
  const button=document.getElementById('load-air-jail');
  const player=document.getElementById('air-jail-player');
  if (!button || !player) return;
  button.addEventListener('click',()=>{
    const iframe=document.createElement('iframe');
    iframe.src='https://www.youtube-nocookie.com/embed/1JDTXXYuwZU?start=1644&end=1698&autoplay=0&mute=1&playsinline=1&rel=0';
    iframe.title='Shawn Melanson explains Air Jail | 54 second excerpt from Fighting for Your Life Podcast';
    iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    iframe.allowFullscreen=true;
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    player.replaceChildren(iframe);
  },{once:true});
})();
