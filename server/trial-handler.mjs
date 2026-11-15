const EXPERIENCE = new Set([
  "I'm new to jiu jitsu",
  "I've trained before",
  "I'm asking about kids classes",
  "I'd like to visit an open mat"
]);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const EMAIL_MESSAGE = 'Online requests are temporarily unavailable. Please use the email option below or call (603) 459 3610.';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function clean(value, maximum) {
  if (typeof value !== 'string' || value.length > maximum) return null;
  return value.trim();
}

export function createTrialHandler({ env = process.env, fetchEmail = fetch, logger = console } = {}) {
  return async function handleTrial(request) {
    if (request.method !== 'POST') return json({ error: 'Please use the class request form.' }, 405);
    const type = request.headers.get('content-type') || '';
    if (!type.toLowerCase().startsWith('application/json')) return json({ error: 'Please submit the class request form.' }, 415);
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > 12000) return json({ error: 'Please shorten your message and try again.' }, 413);

    const origin = request.headers.get('origin');
    if (origin) {
      const allowed = new Set([new URL(request.url).origin]);
      for (const configured of [env.SITE_URL, env.VERCEL_URL && `https://${env.VERCEL_URL}`]) {
        if (configured) { try { allowed.add(new URL(configured).origin); } catch {} }
      }
      if (!allowed.has(origin)) return json({ error: 'Please send your request from the gym website.' }, 403);
    }

    let data;
    try {
      const raw = await request.text();
      if (Buffer.byteLength(raw, 'utf8') > 12000) return json({ error: 'Please shorten your message and try again.' }, 413);
      data = JSON.parse(raw);
    } catch { return json({ error: 'Please check your details and try again.' }, 400); }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ error: 'Please check your details and try again.' }, 400);
    if (data.website) return json({ error: 'Please call or email the gym to arrange your visit.' }, 400);
    const name = clean(data.name, 120);
    const email = clean(data.email, 254);
    const phone = clean(data.phone ?? '', 40);
    const experience = clean(data.experience, 100);
    const message = clean(data.message ?? '', 2000);
    const requestId = clean(data.requestId ?? '', 80);
    if (!name || !email || !EMAIL.test(email) || /[\r\n]/.test(name + email) || phone === null || message === null || !EXPERIENCE.has(experience) || !requestId || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
      return json({ error: 'Please enter your name, a valid email, and your starting point.' }, 400);
    }
    const recipient = env.TRIAL_TO_EMAIL || 'precisionjiujitsu29@gmail.com';
    if (!env.RESEND_API_KEY || !env.TRIAL_FROM_EMAIL || !EMAIL.test(recipient)) return json({ error: EMAIL_MESSAGE, fallback: true }, 503);

    const text = [
      'New class request from the Precision Jiu Jitsu website', '',
      `Name: ${name}`, `Email: ${email}`, `Phone: ${phone || 'Not provided'}`,
      `Starting point: ${experience}`, '',
      'Questions or preferred class:', message || 'Please help me choose a first class.', '',
      'Reply to this email to respond directly to the visitor. This request does not confirm a booking.'
    ].join('\n');

    try {
      const result = await fetchEmail('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `precision-trial-${requestId}`
        },
        body: JSON.stringify({
          from: env.TRIAL_FROM_EMAIL,
          to: [recipient],
          reply_to: email,
          subject: 'Free class request | Precision Jiu Jitsu',
          text
        }),
        signal: AbortSignal.timeout(10000)
      });
      const receipt = await result.json().catch(() => null);
      if (!result.ok || typeof receipt?.id !== 'string' || !receipt.id) {
        logger.error('Trial request delivery rejected', { status: result.status });
        return json({ error: EMAIL_MESSAGE, fallback: true }, 502);
      }
      return json({ ok: true, message: 'Your request has been sent. The gym will contact you to arrange your visit. Your class is confirmed when you hear back.' });
    } catch (error) {
      logger.error('Trial request delivery unavailable', { type: error.name });
      return json({ error: EMAIL_MESSAGE, fallback: true }, 502);
    }
  };
}
