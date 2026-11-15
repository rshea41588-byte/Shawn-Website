import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrialHandler } from '../server/trial-handler.mjs';

const details = { name:'Website Review', email:'review@example.com', phone:'', experience:"I'm new to jiu jitsu", message:'Tuesday works for me.', website:'', requestId:'12345678-1234-1234-1234-123456789012' };
const env = { RESEND_API_KEY:'test-key', TRIAL_FROM_EMAIL:'Precision <contact@example.com>', TRIAL_TO_EMAIL:'gym@example.com' };
function request(data = details, headers = {}) {
  return new Request('https://precisionjiujitsunh.com/api/trial', { method:'POST', headers:{'Content-Type':'application/json',Origin:'https://precisionjiujitsunh.com',...headers}, body:JSON.stringify(data) });
}
const logger = { error(){} };

test('sends only to the configured gym with the visitor as reply recipient', async () => {
  let sent;
  const handler = createTrialHandler({env,logger,fetchEmail:async (url,options)=>{ sent={url,options,body:JSON.parse(options.body)}; return Response.json({id:'delivery-123'}); }});
  const response = await handler(request());
  assert.equal(response.status,200);
  assert.equal((await response.json()).ok,true);
  assert.deepEqual(sent.body.to,['gym@example.com']);
  assert.equal(sent.body.reply_to,'review@example.com');
  assert.match(sent.body.text,/Tuesday works for me/);
  assert.equal(sent.options.headers['Idempotency-Key'],`precision-trial-${details.requestId}`);
});
test('does not claim delivery when email service is unconfigured', async () => {
  const handler=createTrialHandler({env:{},logger,fetchEmail:()=>{throw new Error('Must not call email service');}});
  const response=await handler(request());
  assert.equal(response.status,503); assert.equal((await response.json()).fallback,true);
});
test('rejects invalid visitor data without contacting the email service', async () => {
  const handler=createTrialHandler({env,logger,fetchEmail:()=>{throw new Error('Must not send');}});
  for (const patch of [{email:'bad'}, {name:'Name\r\nInjected'}, {experience:'Unknown'}, {message:'x'.repeat(2001)}, {requestId:''}, {website:'spam'}]) {
    assert.equal((await handler(request({...details,...patch}))).status,400);
  }
});
test('rejects requests from a different origin', async () => {
  const handler=createTrialHandler({env,logger});
  assert.equal((await handler(request(details,{Origin:'https://other.example'}))).status,403);
});
test('does not accept an unsuccessful or malformed email receipt as success', async () => {
  for (const upstream of [()=>Response.json({error:'failed'},{status:422}),()=>Response.json({}),()=>{throw new Error('Offline');}]) {
    const handler=createTrialHandler({env,logger,fetchEmail:async()=>upstream()});
    const response=await handler(request());
    assert.equal(response.status,502); assert.equal((await response.json()).fallback,true);
  }
});
test('limits request size and accepts only JSON submissions', async () => {
  const handler=createTrialHandler({env,logger});
  assert.equal((await handler(request(details,{'Content-Length':'12001'}))).status,413);
  assert.equal((await handler(request(details,{'Content-Type':'text/plain'}))).status,415);
  assert.equal((await handler(new Request('https://precisionjiujitsunh.com/api/trial'))).status,405);
});
