(() => {
  'use strict';
  const player = document.querySelector('.public-player');
  if (!player) return;
  const choices = [...document.querySelectorAll('.preview-choice')];
  function load() {
    if (!window.PrecisionPrivacy?.allows('videos')) return;
    const url = new URL(player.dataset.video);
    if (url.origin !== 'https://iframe.mediadelivery.net' || !url.pathname.startsWith('/embed/596460/')) return;
    url.searchParams.set('autoplay','false');
    const iframe = document.createElement('iframe');
    iframe.src = url.href;
    iframe.title = player.dataset.label;
    iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(iframe);
    window.PrecisionMeasurement?.track('course_player_loaded',{course:player.dataset.course,placement:choices.find(c=>c.getAttribute('aria-pressed')==='true')?.textContent.trim()==='Free sample'?'sample':'preview'});
  }
  function resetPlayer() {
    const selected=choices.find(choice=>choice.getAttribute('aria-pressed')==='true');
    const button=document.createElement('button');
    button.type='button';button.className='player-load';
    const icon=document.createElement('span');icon.className='play-symbol';icon.textContent='▶';icon.setAttribute('aria-hidden','true');
    const title=document.createElement('strong');title.textContent='Load '+selected.textContent.toLowerCase();
    const provider=document.createElement('span');provider.textContent='Official BJJ Fanatics player';
    button.append(icon,title,provider);player.replaceChildren(button);
  }
  player.addEventListener('click',event=>{
    if (event.target.closest('.player-load')) window.PrecisionPrivacy?.request('videos',load);
  });
  window.addEventListener('precision:privacychange',()=>{
    if (!window.PrecisionPrivacy?.allows('videos') && player.querySelector('iframe')) resetPlayer();
  });
  choices.forEach(choice=>choice.addEventListener('click',()=>{
    if (choice.getAttribute('aria-pressed')==='true') return;
    choices.forEach(other=>other.setAttribute('aria-pressed',String(other===choice)));
    player.dataset.video=choice.dataset.video;
    player.dataset.label=choice.dataset.label;
    resetPlayer();
  }));
})();
