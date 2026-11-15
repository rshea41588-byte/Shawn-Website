(() => {
  'use strict';
  const form=document.getElementById('booking-form');
  if (!form) return;
  const choices=[...document.querySelectorAll('[data-booking-kind]')];
  const fields=form.querySelector('fieldset');
  const kind=form.elements.kind;
  const status=document.getElementById('booking-status');
  const submit=form.querySelector('[type="submit"]');
  const preview=document.getElementById('booking-email-preview');
  const prepared=document.getElementById('booking-request-text');
  const mailLink=document.getElementById('booking-send-email');
  const emailChoice=document.getElementById('booking-email-choice');
  let busy=false,accepted=false,requestId='',lastPayload='';
  const topic=()=>kind.value==='seminar'?'Seminar':'Private training';
  const updateKind=()=>{
    choices.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.bookingKind===kind.value)));
    document.getElementById('booking-form-title').textContent=`${topic()} enquiry`;
    document.getElementById('booking-message-label').textContent=kind.value==='seminar'?'Group size, experience and seminar goals':'Your experience, training goals and number of participants';
  };
  choices.forEach(button=>button.addEventListener('click',()=>{
    if (busy) return;
    kind.value=button.dataset.bookingKind;
    form.hidden=false;
    accepted=false;
    submit.disabled=false;
    submit.textContent='Send enquiry';
    status.hidden=true;
    preview.hidden=true;
    updateKind();
    form.elements.name.focus({preventScroll:true});
    form.scrollIntoView({block:'start',behavior:'auto'});
  }));
  kind.addEventListener('change',updateKind);
  form.addEventListener('input',()=>{
    if (accepted) { accepted=false; submit.disabled=false; submit.textContent='Send enquiry'; status.hidden=true; }
    preview.hidden=true;
  });
  function details() {
    return Object.fromEntries(['kind','name','email','phone','academy','location','dates','message','website'].map(key=>[key,form.elements[key].value.trim()]));
  }
  function prepareEmail(data) {
    const subject=`${topic()} enquiry | Shawn Melanson`;
    const text=[`Hello Precision,`,``,`I would like to ask about ${data.kind==='seminar'?'a seminar':'private training'} with Shawn Melanson.`,``,
      `Name: ${data.name}`,`Email: ${data.email}`,`Phone: ${data.phone||'Not provided'}`,`Host or academy: ${data.academy||'Not provided'}`,
      `Location: ${data.location||'Not provided'}`,`Preferred dates: ${data.dates||'Flexible'}`,``,data.message].join('\n');
    prepared.textContent=`To: precisionjiujitsu29@gmail.com\nSubject: ${subject}\n\n${text}`;
    mailLink.href=`mailto:precisionjiujitsu29@gmail.com?${new URLSearchParams({subject,body:text}).toString().replaceAll('+','%20')}`;
    document.getElementById('booking-copy-status').textContent='';
    preview.hidden=false;
  }
  emailChoice.addEventListener('click',()=>{
    prepareEmail(details());
    preview.querySelector('h4').focus();
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if (busy || accepted || !form.reportValidity()) return;
    const data=details(),payload=JSON.stringify(data);
    if (payload!==lastPayload) {
      requestId=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
      lastPayload=payload;
    }
    busy=true;
    choices.forEach(button=>{button.disabled=true;});
    fields.disabled=true;
    submit.disabled=true;
    emailChoice.disabled=true;
    submit.setAttribute('aria-busy','true');
    submit.textContent='Sending enquiry…';
    status.hidden=false;
    status.classList.remove('error');
    status.textContent='Sending your enquiry…';
    try {
      const response=await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,requestId}),signal:AbortSignal.timeout(12000)});
      const receipt=await response.json();
      if (!response.ok || receipt.ok!==true) throw new Error('Enquiry not accepted');
      accepted=true;
      preview.hidden=true;
      status.textContent='Your enquiry has been sent. Precision Jiu Jitsu will reply to discuss Shawn’s availability and the details. A date is confirmed only after you hear back.';
      submit.textContent='Enquiry sent';
    } catch {
      status.classList.add('error');
      status.textContent='Your enquiry has not been sent. Copy the prepared message below into an email, or call (603) 459 3610.';
      prepareEmail(data);
      submit.textContent='Try sending again';
    } finally {
      busy=false;
      choices.forEach(button=>{button.disabled=false;});
      fields.disabled=false;
      submit.disabled=accepted;
      emailChoice.disabled=false;
      submit.removeAttribute('aria-busy');
      status.focus();
    }
  });
  document.getElementById('booking-copy').addEventListener('click',async()=>{
    const result=document.getElementById('booking-copy-status');
    try { await navigator.clipboard.writeText(prepared.textContent); result.textContent='Copied. Paste it into your email.'; }
    catch { result.textContent='Select and copy the message above, then paste it into your email.'; }
  });
})();
