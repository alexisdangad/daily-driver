// Daily Driver — génère les 4 slides d'un post à partir de posts/<slug>/post.json
// Usage : node render/render.mjs [slug ...]   (sans argument : tous les posts sans visuels)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = s => esc(s).replace(/\\n|\n/g, '<br>');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function download(url, dest, referer) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/avif,image/webp,image/*,*/*;q=0.8', ...(referer ? { Referer: referer } : {}) }, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 5000) throw new Error(`Image trop petite (${buf.length} o) : ${url}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

function html(post, photoFiles) {
  const A = p => 'file://' + path.join(ROOT, 'assets', p);
  const credit = i => esc(post.photos?.[post.slides[i].photo ?? 0]?.credit ?? '@source');
  const img = i => {
    const s = post.slides[i];
    const f = photoFiles[s.photo ?? 0];
    const zoom = s.zoom ?? 1, focus = s.focus ?? '50% 50%';
    return `<div class="img"><img src="file://${f}" style="object-position:${focus};transform:scale(${zoom});transform-origin:${focus}"></div><div class="shade"></div>`;
  };
  const c = post.cover;
  const s1 = `
<section class="slide s1" id="s1">${img(0)}
  <div class="copy">
    <div class="t big">${esc(c.big)}<small>${esc(c.unit ?? '')}</small></div>
    <div class="cap"><div class="fit">${lines(c.caption)}</div>
      <svg width="88" height="22" viewBox="0 0 88 22" fill="none" stroke="#fff" stroke-width="1.75" aria-hidden="true"><path d="M0 11H86M76 1.5L86 11L76 20.5"/></svg></div>
  </div>
  <div class="foot"><img class="lw" src="${A('logos/logo-02.svg')}"></div>
  <div class="credit r">Photo ${credit(0)}</div>
</section>`;
  const rest = post.slides.slice(1).map((s, k) => `
<section class="slide" id="s${k + 2}">${img(k + 1)}
  <div class="copy">
    <div class="t h">${lines(s.title)}</div>
    <div class="sub">${esc(s.text)}</div>
  </div>
  <div class="credit">Photo ${credit(k + 1)}</div>
  <img class="mark lw" src="${A('logos/logo-01.svg')}">
</section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Werk Neue";font-weight:900;font-style:italic;src:url("${A('fonts/WerkNeue-BlackItalic.otf')}")}
@font-face{font-family:"Werk Neue";font-weight:800;src:url("${A('fonts/WerkNeue-ExtraBold.otf')}")}
@font-face{font-family:"Figtree";font-weight:600;src:url("${A('fonts/Figtree-600.woff2')}")}
@font-face{font-family:"Figtree";font-weight:700;src:url("${A('fonts/Figtree-700.woff2')}")}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#111}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;color:#fff;font-family:"Figtree",sans-serif;background:#0e0e10}
.lw{filter:invert(1)}
.img{position:absolute;inset:0;overflow:hidden}
.img img{width:100%;height:100%;object-fit:cover;display:block}
.shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.22) 0%,rgba(0,0,0,0) 20%,rgba(0,0,0,.05) 45%,rgba(0,0,0,.86) 100%)}
.copy{position:absolute;left:72px;right:72px;bottom:150px;font-family:"Werk Neue",sans-serif}
.t{font-weight:900;font-style:italic;text-transform:uppercase;letter-spacing:-.02em;line-height:.98;white-space:nowrap}
.t.h{font-size:132px}
.sub{margin-top:26px;font-family:"Figtree";font-weight:600;font-size:36px;line-height:1.3;color:rgba(255,255,255,.92);max-width:820px}
.credit{position:absolute;left:72px;bottom:62px;font-size:20px;font-weight:600;letter-spacing:.01em;color:rgba(255,255,255,.85)}
.credit.r{left:auto;right:72px;text-align:right}
.mark{position:absolute;right:72px;bottom:52px;height:42px}
.s1 .copy{bottom:200px}
.t.big{font-size:300px;line-height:.82}
.t.big small{font-size:112px;letter-spacing:0;margin-left:14px}
.cap{margin-top:34px;display:flex;align-items:flex-end;gap:30px}
.cap .fit{font-weight:800;text-transform:uppercase;font-size:54px;line-height:1.06;white-space:nowrap}
.cap svg{flex:none;margin-bottom:14px}
.foot{position:absolute;left:0;right:0;bottom:50px;display:flex;justify-content:center}
.foot img{width:250px}
</style></head><body>${s1}${rest}</body></html>`;
}

async function renderPost(slug) {
  const dir = path.join(ROOT, 'posts', slug);
  const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
  fs.mkdirSync(path.join(dir, 'photos'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'visuels'), { recursive: true });
  const files = [];
  for (const [i, p] of (post.photos ?? []).entries()) {
    const dest = path.join(dir, 'photos', `photo-${i + 1}.jpg`);
    if (!fs.existsSync(dest)) { const n = await download(p.url, dest, p.page); console.log(`  photo ${i + 1} : ${n} o`); }
    files.push(dest);
  }
  if (!files.length) throw new Error('post.json sans photo');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  const tmp = path.join(dir, '.render.html');
  fs.writeFileSync(tmp, html(post, files));
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {   // réduit un titre qui déborderait
    document.querySelectorAll('.t, .cap .fit').forEach(el => {
      const box = el.closest('.copy');
      let fs = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > box.clientWidth - (el.classList.contains('fit') ? 120 : 0) && fs > 40) { fs -= 4; el.style.fontSize = fs + 'px'; }
    });
  });
  for (let i = 1; i <= post.slides.length; i++) {
    await (await page.$('#s' + i)).screenshot({ path: path.join(dir, 'visuels', `slide-${i}.png`) });
  }
  await browser.close();
  fs.rmSync(tmp, { force: true });
  fs.rmSync(path.join(dir, 'render-error.txt'), { force: true });
  console.log(`OK ${slug} : ${post.slides.length} slides`);
}

const args = process.argv.slice(2);
const all = fs.existsSync(path.join(ROOT, 'posts')) ? fs.readdirSync(path.join(ROOT, 'posts')).filter(d => fs.existsSync(path.join(ROOT, 'posts', d, 'post.json'))) : [];
const todo = args.length ? args : all.filter(d => !fs.existsSync(path.join(ROOT, 'posts', d, 'visuels', 'slide-4.png')));
let failed = 0;
for (const slug of todo) {
  try { console.log('→', slug); await renderPost(slug); }
  catch (e) { failed++; console.error('ERREUR', slug, e.message); fs.writeFileSync(path.join(ROOT, 'posts', slug, 'render-error.txt'), e.message + '\n'); }
}
process.exit(0);
