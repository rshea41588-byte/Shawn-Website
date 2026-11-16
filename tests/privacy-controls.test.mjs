import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { compilePages } from '../scripts/build-site.mjs';

const pages=await compilePages();
const scripts=new Map(await Promise.all(['privacy-preferences','privacy','course-player','profile-media'].map(async name=>[name,await readFile(new URL(`../site-assets/${name}.js`,import.meta.url),'utf8')])));
const key='precision_privacy_v1';
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function page(name='index.html',{saved,blocked=false}={}) {
  // Only trusted local scripts are evaluated. Resource loading stays disabled.
  const dom=new JSDOM(pages.get(name),{url:'https://review.example/'+name,runScripts:'outside-only'});
  const {window}=dom;
  if (!window.HTMLDialogElement.prototype.showModal) window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  if (!window.HTMLDialogElement.prototype.close) window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
  if (saved) window.localStorage.setItem(key,saved);
  if (blocked) Object.defineProperty(window,'localStorage',{get(){throw new window.DOMException('Storage blocked','SecurityError');}});
  for (const name of ['privacy-preferences','privacy','course-player','profile-media']) window.eval(scripts.get(name));
  return {dom,window,document:window.document,click:selector=>window.document.querySelector(selector).click()};
}

test('necessary only keeps optional embeds off and is remembered on another page',async()=>{
  const first=page();
  assert.equal(first.document.getElementById('privacy-banner').hidden,false);
  assert.equal(first.document.querySelectorAll('iframe').length,0);
  first.click('#privacy-banner [data-privacy-choice="necessary"]');
  const saved=first.window.localStorage.getItem(key);
  assert.equal(first.document.getElementById('privacy-banner').hidden,true);
  assert.equal(first.document.querySelectorAll('iframe').length,0);
  const next=page('cookies.html',{saved});
  assert.equal(next.document.getElementById('privacy-banner').hidden,true);
  assert.equal(next.window.PrecisionPrivacy.allows('maps'),false);
  assert.equal(next.window.PrecisionPrivacy.allows('videos'),false);
  first.dom.window.close();next.dom.window.close();
});

test('the map requires permission and withdrawal removes its iframe',async()=>{
  const current=page();
  current.click('[data-load-map]');
  assert.equal(current.document.getElementById('privacy-dialog').open,true);
  assert.equal(current.document.getElementById('privacy-maps').checked,false);
  assert.equal(current.document.querySelectorAll('iframe').length,0);
  current.document.getElementById('privacy-maps').checked=true;
  current.click('#privacy-save');await tick();
  assert.equal(current.document.querySelectorAll('.map-embed iframe').length,1);
  assert.match(current.document.querySelector('.map-embed iframe').src,/^https:\/\/www.google.com\/maps\/embed\?pb=/);
  assert.equal(current.window.PrecisionPrivacy.allows('videos'),false);
  current.click('.footer-policies [data-privacy-settings]');
  current.click('#privacy-dialog [data-privacy-choice="necessary"]');await tick();
  assert.equal(current.document.querySelectorAll('iframe').length,0);
  assert.ok(current.document.querySelector('[data-load-map]'));
  assert.equal(current.document.querySelector('.trial-form button[type="submit"]').disabled,false);
  current.dom.window.close();
});

test('course players wait for a separate video choice and stop when it is withdrawn',async()=>{
  const current=page('instructionals/arm-bar-it-all.html');
  current.click('.player-load');
  assert.equal(current.document.querySelectorAll('iframe').length,0);
  current.click('#privacy-dialog [data-privacy-choice="necessary"]');await tick();
  assert.equal(current.document.querySelectorAll('iframe').length,0);
  current.click('.player-load');
  current.document.getElementById('privacy-videos').checked=true;
  current.click('#privacy-save');await tick();
  const frame=current.document.querySelector('.public-player iframe');
  assert.equal(new URL(frame.src).origin,'https://iframe.mediadelivery.net');
  assert.equal(new URL(frame.src).searchParams.get('autoplay'),'false');
  current.click('.footer-policies [data-privacy-settings]');
  current.document.getElementById('privacy-videos').checked=false;
  current.click('#privacy-save');await tick();
  assert.equal(current.document.querySelectorAll('iframe').length,0);
  assert.ok(current.document.querySelector('.player-load'));
  current.dom.window.close();
});

test('Air Jail permission can be withdrawn and enabled again without losing the play button',async()=>{
  const current=page('shawn-melanson.html');
  for (let attempt=0;attempt<2;attempt++) {
    current.click('#load-air-jail');
    assert.equal(current.document.querySelectorAll('iframe').length,0);
    current.document.getElementById('privacy-videos').checked=true;
    current.click('#privacy-save');await tick();
    const url=new URL(current.document.querySelector('#air-jail-player iframe').src);
    assert.equal(url.origin,'https://www.youtube-nocookie.com');
    assert.equal(url.searchParams.get('mute'),'1');
    assert.equal(url.searchParams.get('start'),'1644');
    assert.equal(url.searchParams.get('end'),'1698');
    current.click('.footer-policies [data-privacy-settings]');
    current.click('#privacy-dialog [data-privacy-choice="necessary"]');await tick();
    assert.equal(current.document.querySelectorAll('iframe').length,0);
    assert.ok(current.document.querySelector('#load-air-jail'));
  }
  current.dom.window.close();
});

test('closing settings is not permission and does not leave a pending player request',async()=>{
  const current=page('instructionals/arm-bar-it-all.html');
  current.click('.player-load');
  current.click('#privacy-dialog .close-dialog');await tick();
  assert.equal(current.window.localStorage.getItem(key),null);
  assert.equal(current.window.PrecisionPrivacy.allows('videos'),false);
  current.click('#privacy-banner [data-privacy-choice="all"]');await tick();
  assert.equal(current.window.PrecisionPrivacy.allows('videos'),true);
  assert.equal(current.document.querySelectorAll('iframe').length,0,'A cancelled play request must not resume later');
  current.dom.window.close();
});

test('blocked storage and changes from another tab fail safely',async()=>{
  const blocked=page('index.html',{blocked:true});
  blocked.click('#privacy-banner [data-privacy-choice="all"]');await tick();
  assert.equal(blocked.document.querySelectorAll('.map-embed iframe').length,1);
  assert.match(blocked.document.getElementById('privacy-status').textContent,/could not save/);
  const current=page();
  current.click('#privacy-banner [data-privacy-choice="all"]');
  assert.equal(current.document.querySelectorAll('.map-embed iframe').length,1);
  current.window.dispatchEvent(new current.window.StorageEvent('storage',{key,newValue:JSON.stringify({version:1,maps:false,videos:false,updatedAt:Date.now()})}));
  assert.equal(current.document.querySelectorAll('iframe').length,0);
  assert.equal(current.window.PrecisionPrivacy.allows('maps'),false);
  blocked.dom.window.close();current.dom.window.close();
});
