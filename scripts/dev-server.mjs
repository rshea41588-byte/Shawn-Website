import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { createTrialHandler } from '../server/trial-handler.mjs';
import { createBookingHandler } from '../server/booking-handler.mjs';
import { pages, defaultOrigin } from './site-data.mjs';
import { compilePages, robotsText, sitemapText } from './build-site.mjs';
import { notFound } from './render-pages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8765);
const trial = createTrialHandler();
const booking = createBookingHandler();
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.webmanifest':'application/manifest+json', '.json':'application/json', '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.vtt':'text/vtt; charset=utf-8', '.xml':'application/xml', '.txt':'text/plain' };
const redirects = { '/services':'/#schedule', '/about':'/#coaches', '/contact':'/#trial' };

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (['/api/trial','/api/booking'].includes(url.pathname)) {
      const request = new Request(url, { method:req.method, headers:req.headers,
        ...(req.method === 'GET' || req.method === 'HEAD' ? {} : { body:Readable.toWeb(req), duplex:'half' }) });
      const response = await (url.pathname==='/api/booking'?booking:trial)(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const redirected = redirects[url.pathname.replace(/\/$/,'')];
    if (redirected) { res.writeHead(308, { Location:redirected }); res.end(); return; }
    let pathname = decodeURIComponent(url.pathname);
    if (['/new index.html','/index.html'].includes(pathname)) { res.writeHead(308,{Location:'/'});res.end();return; }
    const normalized=pathname.replace(/\/$/,'').replace(/\.html$/,'')||'/';
    const page=pages.find(candidate=>candidate.route===normalized);
    if (page) {
      if (pathname!==page.route) { res.writeHead(308,{Location:page.route});res.end();return; }
      const compiled=await compilePages();
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'});
      res.end(req.method==='HEAD'?undefined:compiled.get(page.output));return;
    }
    if (pathname==='/robots.txt' || pathname==='/sitemap.xml') {
      res.writeHead(200,{'Content-Type':pathname.endsWith('.xml')?'application/xml':'text/plain'});
      res.end(req.method==='HEAD'?undefined:pathname==='/robots.txt'?robotsText(defaultOrigin,false):sitemapText(defaultOrigin,false));return;
    }
    const allowedAsset=/^\/(site-assets|review-assets|Gym pics|Video)\/[^/]+\.(css|js|webp|jpe?g|png|svg|mp4|vtt)$/i.test(pathname);
    if (!allowedAsset && !['/llms.txt','/site.webmanifest'].includes(pathname)) {
      res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'});res.end(req.method==='HEAD'?undefined:notFound());return;
    }
    const path = resolve(root, `.${pathname}`);
    const relative = path.slice(root.length + 1);
    if (!path.startsWith(root + sep) || relative.split(/[\\/]/).some(part=>part.startsWith('.')) || /^(server|api|tests|precisionjiujitsunh\.com-audit)[\\/]/.test(relative)) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const info = await stat(path);
    if (!info.isFile()) { res.writeHead(404); res.end('Not found'); return; }
    const headers = { 'Content-Type':mime[extname(path).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges':'bytes', 'Cache-Control':'no-store' };
    if (req.headers.range) {
      const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (!match) { res.writeHead(416, { 'Content-Range':`bytes */${info.size}` }); res.end(); return; }
      const start = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), info.size-1) : info.size-1;
      if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range':`bytes */${info.size}` }); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Length':end-start+1, 'Content-Range':`bytes ${start}-${end}/${info.size}` });
      if (req.method === 'HEAD') res.end(); else createReadStream(path,{start,end}).pipe(res);
    } else {
      res.writeHead(200, { ...headers, 'Content-Length':info.size });
      if (req.method === 'HEAD') res.end(); else createReadStream(path).pipe(res);
    }
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}/`));
