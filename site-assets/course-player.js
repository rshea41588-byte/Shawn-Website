(() => {
  'use strict';
  const player = document.querySelector('.public-player');
  if (!player) return;
  const choices = [...document.querySelectorAll('.preview-choice')];
  function load() {
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
  player.querySelector('.player-load').addEventListener('click',load);
  choices.forEach(choice=>choice.addEventListener('click',()=>{
    if (choice.getAttribute('aria-pressed')==='true') return;
    choices.forEach(other=>other.setAttribute('aria-pressed',String(other===choice)));
    player.dataset.video=choice.dataset.video;
    player.dataset.label=choice.dataset.label;
    const button=document.createElement('button');
    button.type='button'; button.className='player-load';
    const icon=document.createElement('span');icon.className='play-symbol';icon.textContent='▶';icon.setAttribute('aria-hidden','true');
    const title=document.createElement('strong');title.textContent='Load '+choice.textContent.toLowerCase();
    const provider=document.createElement('span');provider.textContent='Official BJJ Fanatics player';
    button.append(icon,title,provider);button.addEventListener('click',load);player.replaceChildren(button);
  }));
})();
