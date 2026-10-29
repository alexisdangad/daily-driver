// Récupère les photos candidates d'un post : posts/<slug>/sources.json  { "pages": ["https://...", ...] }
// → posts/<slug>/candidates/NN.jpg + contact.jpg (planche numérotée) + candidates.json
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MIN_W = 1200;

const abs = (u, base) => { try { return new URL(u.replace(/&amp;/g, '&'), base).href; } catch { return null; } };
function extract(html, base) {
  const out = new Set();
  for (const m of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*content=["']([^"']+)["']/gi)) out.add(abs(m[1], base));
  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image|twitter:image)["']/gi)) out.add(abs(m[1], base));
  for (const m of html.matchAll(/<(?:img|source)[^>]+?(?:data-src|data-lazy-src|data-original|src)=["']([^"']+)["']/gi)) out.add(abs(m[1], base));
  for (const m of html.matchAll(/(?:srcset|data-srcset)=["']([^"']+)["']/gi)) {
    const best = m[1].split(',').map(s => s.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] || 0) - parseInt(a[1] || 0))[0];
    if (best) out.add(abs(best[0], base));
  }
  for (const m of html.matchAll(/href=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi)) out.add(abs(m[1], base));
  return [...out].filter(u => u && /^https?:/.test(u) && !/\.(svg|gif|ico)(\?|$)/i.test(u) && !/(logo|sprite|icon|avatar|banner-ad|pixel|tracking)/i.test(u));
}

async function run(slug) {
  const dir = path.join(ROOT, 'posts', slug);
  const src = JSON.parse(fs.readFileSync(path.join(dir, 'sources.json'), 'utf8'));
  const cdir = path.join(dir, 'candidates');
  fs.rmSync(cdir, { recursive: true, force: true });
  fs.mkdirSync(cdir, { recursive: true });
  let urls = [];
  for (const page of src.pages ?? []) {
    try {
      const r = await fetch(page, { headers: { 'User-Agent': UA, Accept: 'text/html,*/*' }, redirect: 'follow' });
      if (!r.ok) { console.log('page KO', r.status, page); continue; }
      const found = extract(await r.text(), r.url).map(u => ({ url: u, page }));
      console.log(found.length, 'images trouvées sur', page);
      urls.push(...found);
    } catch (e) { console.log('page erreur', page, e.message); }
  }
  for (const u of src.images ?? []) urls.push({ url: u, page: src.pages?.[0] ?? u });
  const seen = new Set(); urls = urls.filter(x => !seen.has(x.url) && seen.add(x.url));
  const kept = [];
  for (const c of urls) {
    if (kept.length >= 24) break;
    try {
      const r = await fetch(c.url, { headers: { 'User-Agent': UA, Referer: c.page, Accept: 'image/*' } });
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 40000) continue;
      const meta = await sharp(buf).metadata();
      if (!meta.width || meta.width < MIN_W) continue;
      const n = String(kept.length + 1).padStart(2, '0');
      await sharp(buf).jpeg({ quality: 92 }).toFile(path.join(cdir, `${n}.jpg`));
      kept.push({ n, url: c.url, page: c.page, width: meta.width, height: meta.height });
      console.log(n, meta.width + 'x' + meta.height, c.url);
    } catch { /* image ignorée */ }
  }
  fs.writeFileSync(path.join(cdir, 'candidates.json'), JSON.stringify(kept, null, 2));
  if (!kept.length) { fs.writeFileSync(path.join(dir, 'candidates-error.txt'), 'Aucune photo ≥ ' + MIN_W + 'px trouvée\n'); return; }
  fs.rmSync(path.join(dir, 'candidates-error.txt'), { force: true });
  // planche contact numérotée
  const cols = 4, W = 480, H = 320, rows = Math.ceil(kept.length / cols);
  const tiles = await Promise.all(kept.map(async (k, i) => ({
    input: await sharp(path.join(cdir, `${k.n}.jpg`)).resize(W, H, { fit: 'cover' }).composite([{
      input: Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="0" width="92" height="52" fill="#000" opacity=".8"/><text x="14" y="38" font-size="34" font-family="Arial" font-weight="700" fill="#fff">${k.n}</text><text x="${W - 10}" y="${H - 12}" text-anchor="end" font-size="20" font-family="Arial" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${k.width}x${k.height}</text></svg>`) }]).jpeg().toBuffer(),
    left: (i % cols) * (W + 6), top: Math.floor(i / cols) * (H + 6)
  })));
  await sharp({ create: { width: cols * (W + 6), height: rows * (H + 6), channels: 3, background: '#222' } }).composite(tiles).jpeg({ quality: 82 }).toFile(path.join(cdir, 'contact.jpg'));
  console.log('OK', slug, kept.length, 'candidates');
}

const all = fs.existsSync(path.join(ROOT, 'posts')) ? fs.readdirSync(path.join(ROOT, 'posts')) : [];
const todo = process.argv.slice(2).length ? process.argv.slice(2)
  : all.filter(d => fs.existsSync(path.join(ROOT, 'posts', d, 'sources.json')) && !fs.existsSync(path.join(ROOT, 'posts', d, 'candidates', 'contact.jpg')) && !fs.existsSync(path.join(ROOT, 'posts', d, 'candidates-error.txt')));
for (const s of todo) { try { console.log('→', s); await run(s); } catch (e) { console.error('ERREUR', s, e.message); } }
