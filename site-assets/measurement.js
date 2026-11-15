(() => {
  'use strict';
  // A provider can subscribe to this event after its privacy requirements are met.
  // No analytics service, cookies, form values or storage are installed here.
  const allowed = new Set(['phone_click','email_click','trial_request_accepted','instructional_click_out','course_player_loaded']);
  function track(name, properties={}) {
    if (!allowed.has(name)) return;
    const detail={name,path:window.location.pathname};
    for (const key of ['course','placement']) if (typeof properties[key]==='string') detail[key]=properties[key].slice(0,100);
    window.dispatchEvent(new CustomEvent('precision:measurement',{detail}));
  }
  window.PrecisionMeasurement=Object.freeze({track});
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href]'); if (!link) return;
    const href=link.getAttribute('href');
    if (href.startsWith('tel:')) track('phone_click',{placement:'contact'});
    else if (href.startsWith('mailto:')) track('email_click',{placement:'contact'});
    else if (link.dataset.course) track('instructional_click_out',{course:link.dataset.course,placement:link.dataset.placement||'page'});
  });
})();
