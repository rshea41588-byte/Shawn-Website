const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const KINDS = { seminar:'Seminar', private:'Private training' };
const UNAVAILABLE = 'Your enquiry has not been sent. Please copy it into an email or call (603) 459 3610.';
const json = (body,status=200) => Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const clean = (value,maximum) => typeof value==='string' && value.length<=maximum ? value.trim() : null;

export function createBookingHandler({env=process.env,fetchEmail=fetch,logger=console}={}) {
  return async function handleBooking(request) {
    if (request.method!=='POST') return json({error:'Please use the seminar or private training form.'},405);
    if (!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json')) return json({error:'Please submit the enquiry form.'},415);
    if (Number(request.headers.get('content-length'))>12000) return json({error:'Please shorten your enquiry.'},413);
    const origin=request.headers.get('origin');
    if (origin) {
      const allowed=new Set([new URL(request.url).origin]);
      for (const configured of [env.SITE_URL,env.VERCEL_URL && `https://${env.VERCEL_URL}`]) {
        if (configured) { try { allowed.add(new URL(configured).origin); } catch {} }
      }
      if (!allowed.has(origin)) return json({error:'Please send your enquiry from the gym website.'},403);
    }
    let data;
    try {
      const raw=await request.text();
      if (Buffer.byteLength(raw,'utf8')>12000) return json({error:'Please shorten your enquiry.'},413);
      data=JSON.parse(raw);
    } catch { return json({error:'Please check your details and try again.'},400); }
    if (!data || typeof data!=='object' || Array.isArray(data) || data.website) return json({error:'Please call or email the gym with your enquiry.'},400);
    const name=clean(data.name,120),email=clean(data.email,254),phone=clean(data.phone??'',40);
    const kind=typeof data.kind==='string' && Object.hasOwn(KINDS,data.kind)?data.kind:null;
    const academy=clean(data.academy??'',160),location=clean(data.location??'',160),dates=clean(data.dates??'',160);
    const message=clean(data.message,2000),requestId=clean(data.requestId??'',80);
    if (!name || !email || !EMAIL.test(email) || /[\r\n]/.test(name+email) || !kind || !message || [phone,academy,location,dates].includes(null) || !requestId || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) return json({error:'Please enter your name, a valid email and some details about your enquiry.'},400);
    const recipient=env.BOOKING_TO_EMAIL || env.TRIAL_TO_EMAIL || 'precisionjiujitsu29@gmail.com';
    if (!env.RESEND_API_KEY || !env.TRIAL_FROM_EMAIL || !EMAIL.test(recipient)) return json({error:UNAVAILABLE,fallback:true},503);
    const text=[
      `${KINDS[kind]} enquiry for Shawn Melanson`, '',
      `Name: ${name}`,`Email: ${email}`,`Phone: ${phone||'Not provided'}`,
      `Host or academy: ${academy||'Not provided'}`,`Location: ${location||'Not provided'}`,`Preferred dates: ${dates||'Flexible'}`,
      '', 'Enquiry details:',message,'',
      'Reply to this email to respond directly to the visitor. This enquiry does not reserve a date or confirm a booking.'
    ].join('\n');
    try {
      const response=await fetchEmail('https://api.resend.com/emails',{
        method:'POST',
        headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`precision-booking-${kind}-${requestId}`},
        body:JSON.stringify({from:env.TRIAL_FROM_EMAIL,to:[recipient],reply_to:email,subject:`${KINDS[kind]} enquiry | Shawn Melanson`,text}),
        signal:AbortSignal.timeout(10000)
      });
      const receipt=await response.json().catch(()=>null);
      if (!response.ok || typeof receipt?.id!=='string' || !receipt.id) {
        logger.error('Booking enquiry delivery rejected',{status:response.status});
        return json({error:UNAVAILABLE,fallback:true},502);
      }
      return json({ok:true,message:'Your enquiry has been sent. Precision Jiu Jitsu will reply to discuss Shawn’s availability and the details. A date is confirmed only after you hear back.'});
    } catch (error) {
      logger.error('Booking enquiry delivery unavailable',{type:error.name});
      return json({error:UNAVAILABLE,fallback:true},502);
    }
  };
}
