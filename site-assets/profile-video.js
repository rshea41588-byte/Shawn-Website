(() => {
  'use strict';
  const video=document.getElementById('profile-video');
  if (!video) return;
  let inView=true;
  video.muted=true;
  video.defaultMuted=true;
  function syncPlayback() {
    if (document.hidden || !inView) {
      video.pause();
      return;
    }
    video.play().catch(()=>{ /* Keep the poster if the browser declines autoplay. */ });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      inView=entries[0].isIntersecting;
      syncPlayback();
    },{threshold:.01}).observe(video);
  }
  document.addEventListener('visibilitychange',syncPlayback);
  window.addEventListener('pageshow',syncPlayback);
  syncPlayback();
})();
