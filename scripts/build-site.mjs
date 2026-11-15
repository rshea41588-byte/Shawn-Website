import { mkdir, readFile, writeFile, readdir, copyFile } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const pages = [
  { source:'new index.html', output:'index.html', route:'/' },
  { source:'shawn-melanson.html', output:'shawn-melanson.html', route:'/shawn-melanson' }
];
const origin = new URL(process.env.SITE_URL || 'https://precisionjiujitsunh.com').origin;
if (!origin.startsWith('https://')) throw new Error('SITE_URL must be an HTTPS origin.');
const publicRelease = process.env.VERCEL_ENV === 'production' && process.env.SITE_LAUNCH_READY === 'true';
await mkdir(output, { recursive: true });
for (const page of pages) {
  const source = await readFile(join(root, page.source), 'utf8');
  let html = source.replaceAll('https://precisionjiujitsunh.com/', `${origin}/`);
  html = html.replace(/<meta name="robots" content="[^"]*">/, `<meta name="robots" content="${publicRelease ? 'index, follow, max-image-preview:large' : 'noindex, nofollow'}">`);
  html = html.replaceAll('href="new index.html', 'href="/').replaceAll('href="shawn-melanson.html', 'href="/shawn-melanson');
  if (!html.includes('rel="canonical"') || !html.includes('application/ld+json')) throw new Error(`Missing SEO metadata in ${page.source}.`);
  await writeFile(join(output, page.output), html);
}

async function copyAssets(folder, allowed) {
  const sourceFolder = join(root, folder);
  for (const entry of await readdir(sourceFolder, { withFileTypes: true })) {
    if (!entry.isFile() || !allowed.test(entry.name)) continue;
    const destination = join(output, folder, entry.name);
    if (relative(root, destination).startsWith('..')) throw new Error('Asset outside workspace.');
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(sourceFolder, entry.name), destination);
  }
}
await copyAssets('Gym pics', /\.(webp|png|jpe?g)$/i);
await copyAssets('Video', /\.mp4$/i);
await copyAssets('review-assets', /\.(svg|webp|png|jpe?g|vtt)$/i);
await copyAssets('site-assets', /\.(svg|webp|png|jpe?g|vtt|css|js)$/i);

const robots = publicRelease
  ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
  : 'User-agent: *\nAllow: /\n';
await writeFile(join(output, 'robots.txt'), robots);
const sitemapEntries = publicRelease ? pages.map(page => `  <url><loc>${origin}${page.route}</loc></url>`).join('\n') : '';
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries ? `${sitemapEntries}\n` : ''}</urlset>\n`);
await writeFile(join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found | Precision Jiu Jitsu</title><body style="background:#0c121b;color:#fff;font:18px/1.6 Arial;padding:10vw"><h1>Let’s get you back on the mats.</h1><p>This page could not be found.</p><a style="color:#c8a96e" href="/">Visit Precision Jiu Jitsu</a></body></html>');
console.log(`Built ${pages.length} pages in dist. Indexing: ${publicRelease ? 'public release enabled' : 'review protection enabled'}.`);
