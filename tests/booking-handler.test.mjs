import test from 'node:test';
import assert from 'node:assert/strict';
import { createBookingHandler } from '../server/booking-handler.mjs';

const details={kind:'seminar',name:'Website Review',email:'review@example.com',phone:'',academy:'Example Academy',location:'Boston, USA',dates:'Flexible',message:'A seminar for 20 students.',website:'',requestId:'12345678-1234-1234-1234-123456789012'};
const env={RESEND_API_KEY:'test-key',TRIAL_FROM_EMAIL:'Precision <contact@example.com>',TRIAL_TO_EMAIL:'gym@example.com'};
const logger={error(){}};
const request=(data=details,headers={})=>new Request('https://precisionjiujitsunh.com/api/booking',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://precisionjiujitsunh.com',...headers},body:JSON.stringify(data)});

test('seminar and private enquiries use distinct subjects and a fixed gym recipient',async()=>{
  for (const kind of ['seminar','private']) {
    let sent;
    const handler=createBookingHandler({env,logger,fetchEmail:async(url,options)=>{
      sent={url,options,body:JSON.parse(options.body)};
      return Response.json({id:'delivery-123'});
    }});
    const response=await handler(request({...details,kind,to:'attacker@example.com'}));
    assert.equal(response.status,200);
    assert.equal((await response.json()).ok,true);
    assert.equal(sent.url,'https://api.resend.com/emails');
    assert.deepEqual(sent.body.to,['gym@example.com']);
    assert.equal(sent.body.reply_to,details.email);
    assert.equal(sent.body.subject,`${kind==='seminar'?'Seminar':'Private training'} enquiry | Shawn Melanson`);
    assert.match(sent.body.text,/Boston, USA/);
    assert.match(sent.body.text,/does not reserve a date/);
    assert.equal(sent.options.headers['Idempotency-Key'],`precision-booking-${kind}-${details.requestId}`);
  }
});

test('booking inbox override is server controlled',async()=>{
  let sent;
  const handler=createBookingHandler({env:{...env,BOOKING_TO_EMAIL:'booking@example.com'},logger,fetchEmail:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({id:'accepted'});}});
  assert.equal((await handler(request())).status,200);
  assert.deepEqual(sent.to,['booking@example.com']);
});

test('invalid booking data is rejected before the email provider is contacted',async()=>{
  const handler=createBookingHandler({env,logger,fetchEmail:()=>{throw new Error('Must not send');}});
  for (const patch of [{kind:'trial'},{kind:'__proto__'},{kind:{}},{name:'A\r\nB'},{email:'bad'},{message:''},{message:'x'.repeat(2001)},{academy:'x'.repeat(161)},{requestId:''},{website:'spam'}]) assert.equal((await handler(request({...details,...patch}))).status,400);
  for (const data of [null,[],true]) assert.equal((await handler(request(data))).status,400);
});

test('booking accepts JSON only, limits payload size and rejects outside origins',async()=>{
  const handler=createBookingHandler({env,logger,fetchEmail:()=>{throw new Error('Must not send');}});
  assert.equal((await handler(request(details,{Origin:'https://other.example'}))).status,403);
  assert.equal((await handler(request(details,{'Content-Length':'12001'}))).status,413);
  assert.equal((await handler(request({...details,message:'x'.repeat(12001)}))).status,413);
  assert.equal((await handler(request(details,{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await handler(new Request('https://precisionjiujitsunh.com/api/booking'))).status,405);
  assert.equal((await handler(new Request('https://precisionjiujitsunh.com/api/booking',{method:'POST',headers:{'Content-Type':'application/json'},body:'{' }))).status,400);
});

test('booking never shows success without configuration and an accepted provider receipt',async()=>{
  const unconfigured=createBookingHandler({env:{},logger,fetchEmail:()=>{throw new Error('Must not send');}});
  const unavailable=await unconfigured(request());
  assert.equal(unavailable.status,503);
  assert.equal((await unavailable.json()).fallback,true);
  for (const upstream of [()=>Response.json({error:'failed'},{status:422}),()=>Response.json({}),()=>{throw new Error('Offline');}]) {
    const handler=createBookingHandler({env,logger,fetchEmail:async()=>upstream()});
    const result=await handler(request());
    assert.equal(result.status,502);
    assert.equal((await result.json()).fallback,true);
  }
});
