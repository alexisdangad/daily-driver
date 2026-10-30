// Daily Driver — génère les 4 slides d'un post à partir de posts/<slug>/post.json
// Usage : node render/render.mjs [slug ...]   (sans argument : tous les posts sans visuels)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { typoDeep, noWidow } from './typo.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lines = s => esc(s).replace(/(\d)(er|re|e)\b/g, '$1<sup>$2</sup>').replace(/\\n|\n/g, '<br>');
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
    if (s.layout === 'photo') return `<div class="img"><img src="file://${f}" style="object-position:${focus};transform:scale(${zoom});transform-origin:${focus}"></div><div class="shade2"></div>`;
    if (s.layout === 'fit') return `<div class="img"><img class="bg" src="file://${f}"><img class="fg" src="file://${f}" style="object-position:${focus}"></div><div class="shade"></div>`;
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
  const f0 = photoFiles[post.slides[0].photo ?? 0], fc = post.storyFocus ?? post.slides[0].focus ?? '50% 50%';
  const story = `
<section class="story" id="story">
  <img class="sbg" src="file://${f0}"><img class="sfg" src="file://${f0}" style="object-position:${fc}">
  <div class="sshade"></div>
  <div class="scopy">
    <div class="t big">${esc(c.big)}<small>${esc(c.unit ?? '')}</small></div>
    <div class="scap">${lines(c.caption)}</div>
    <div class="cta">Détails dans la légende du post ↓</div>
  </div>
  <div class="credit sc">Photo ${credit(0)}</div>
  <img class="sicon lw" src="${A('logos/logo-01.svg')}"><div class="sbrand"><img class="lw" src="${A('logos/logo-02.svg')}"></div>
</section>`;
  const rest = post.slides.slice(1).map((s, k) => s.layout === 'photo' ? `
<section class="slide" id="s${k + 2}">${img(k + 1)}
  <div class="credit">Photo ${credit(k + 1)}</div>
  <div class="foot"><img class="lw" src="${A('logos/logo-02.svg')}"></div>
</section>` : `
<section class="slide" id="s${k + 2}">${img(k + 1)}
  <div class="copy">
    <div class="t h">${lines(s.title)}</div>
    <div class="sub">${lines(noWidow(s.text))}</div>
  </div>
  <div class="credit">Photo ${credit(k + 1)}</div>
  <img class="mark lw" src="${A('logos/logo-01.svg')}">
</section>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Werk Neue";font-weight:900;font-style:italic;src:url("${A('fonts/WerkNeue-BlackItalic.otf')}")}
@font-face{font-family:"Werk Neue";font-weight:800;font-style:normal;src:url("${A('fonts/WerkNeue-ExtraBold.otf')}")}
@font-face{font-family:"Werk Neue";font-weight:600;font-style:normal;src:url("${A('fonts/WerkNeue-SemiBold.otf')}")}
@font-face{font-family:"Werk Neue";font-weight:600;font-style:italic;src:url("${A('fonts/WerkNeue-SemiBoldItalic.otf')}")}
@font-face{font-family:"Figtree";font-weight:400;src:url("${A('fonts/Figtree-400.woff2')}")}
@font-face{font-family:"Figtree";font-weight:600;src:url("${A('fonts/Figtree-600.woff2')}")}
@font-face{font-family:"Figtree";font-weight:700;src:url("${A('fonts/Figtree-700.woff2')}")}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#111}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;color:#fff;font-family:"Figtree",sans-serif;background:#0e0e10}
.lw{filter:invert(1)}
.img{position:absolute;inset:0;overflow:hidden}
.img img{width:100%;height:100%;object-fit:cover;display:block}
.img img.bg{position:absolute;inset:-60px;width:calc(100% + 120px);height:calc(100% + 120px);filter:blur(46px) brightness(.5) saturate(1.1)}
.img img.fg{position:absolute;top:0;left:0;width:100%;height:880px;-webkit-mask-image:linear-gradient(to bottom,#000 78%,transparent 100%);mask-image:linear-gradient(to bottom,#000 78%,transparent 100%)}
.shade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.22) 0%,rgba(0,0,0,0) 20%,rgba(0,0,0,.05) 45%,rgba(0,0,0,.86) 100%)}
.shade2{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 0%,rgba(0,0,0,0) 78%,rgba(0,0,0,.72) 100%)}
.copy{position:absolute;left:72px;right:72px;bottom:150px;font-family:"Werk Neue",sans-serif}
.t{font-weight:900;font-style:italic;letter-spacing:-.025em;line-height:1.02;white-space:nowrap}
.t.h{font-weight:900;font-size:104px;white-space:normal;line-height:1;letter-spacing:-.03em;max-width:936px}
sup{font-size:.55em;line-height:0;vertical-align:.5em}
.sub{margin-top:24px;font-family:"Figtree";font-weight:400;font-size:32px;line-height:1.35;color:rgba(255,255,255,.88);max-width:780px}
.credit{position:absolute;left:72px;bottom:62px;font-size:19px;font-weight:600;letter-spacing:.01em;color:rgba(255,255,255,.85)}
.credit.r{left:auto;right:72px;text-align:right}
.mark{position:absolute;right:72px;bottom:52px;height:42px}
.s1 .copy{bottom:200px}
.t.big{font-size:260px;line-height:.86;letter-spacing:-.04em}
.t.big small{font-size:100px;letter-spacing:0;margin-left:10px;font-style:normal}
.s1 .t.big{font-size:160px}
.s1 .t.big small{font-size:64px}
.s1 .cap .fit{font-size:38px}
.cap{margin-top:26px;display:flex;align-items:flex-end;gap:30px}
.cap .fit{font-weight:800;font-size:50px;line-height:1.08;letter-spacing:-.015em;white-space:nowrap}
.cap svg{flex:none;margin-bottom:14px}
.foot{position:absolute;left:0;right:0;bottom:50px;display:flex;justify-content:center}
.foot img{width:250px}

.story{position:relative;width:1080px;height:1920px;overflow:hidden;color:#fff;background:#0e0e10;font-family:"Figtree",sans-serif}
.story .sbg{position:absolute;inset:-80px;width:calc(100% + 160px);height:calc(100% + 160px);object-fit:cover;filter:blur(60px) brightness(.45) saturate(1.15)}
.story .sfg{position:absolute;top:0;left:0;width:100%;height:1000px;object-fit:cover;-webkit-mask-image:linear-gradient(to bottom,#000 80%,transparent 100%);mask-image:linear-gradient(to bottom,#000 80%,transparent 100%)}
.story .sshade{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.45) 0%,rgba(0,0,0,0) 18%,rgba(0,0,0,0) 45%,rgba(0,0,0,.92) 72%,#000 100%)}
.story .sicon{position:absolute;top:120px;left:0;right:0;margin:auto;height:110px}.story .sbrand{position:absolute;left:0;right:0;bottom:130px;display:flex;justify-content:center}.story .sbrand img{height:74px}
.story .scopy{position:absolute;left:72px;right:72px;bottom:370px;font-family:"Werk Neue",sans-serif}
.story .tag{display:inline-block;font-weight:800;font-size:26px;letter-spacing:.14em;text-transform:uppercase;border:2px solid #fff;border-radius:40px;padding:10px 24px;margin-bottom:34px}
.story .scap{margin-top:26px;font-weight:800;font-size:56px;line-height:1.08;letter-spacing:-.015em}
.story .cta{margin-top:40px;font-family:"Figtree";font-weight:600;font-size:30px;color:rgba(255,255,255,.88)}
.story .credit.sc{left:72px;bottom:290px;font-size:20px}
</style></head><body>${s1}${rest}${story}</body></html>`;
}

async function renderPost(slug) {
  const dir = path.join(ROOT, 'posts', slug);
  const post = typoDeep(JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8')));
  fs.mkdirSync(path.join(dir, 'photos'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'visuels'), { recursive: true });
  const files = [];
  for (const [i, p] of (post.photos ?? []).entries()) {
    const dest = path.join(dir, 'photos', `photo-${i + 1}.jpg`);
    if (p.candidate) { fs.copyFileSync(path.join(dir, 'candidates', `${p.candidate}.jpg`), dest); files.push(dest); continue; }
    if (!fs.existsSync(dest)) { const n = await download(p.url, dest, p.page); console.log(`  photo ${i + 1} : ${n} o`); }
    files.push(dest);
  }
  if (!files.length) throw new Error('post.json sans photo');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 4 / 3 });
  const tmp = path.join(dir, '.render.html');
  fs.writeFileSync(tmp, html(post, files));
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {   // réduit un titre qui déborderait
    document.querySelectorAll('.t, .cap .fit').forEach(el => {
      const box = el.closest('.copy, .scopy');
      let fs = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > box.clientWidth - (el.classList.contains('fit') ? 120 : 0) && fs > 40) { fs -= 4; el.style.fontSize = fs + 'px'; }
    });
  });
  for (let i = 1; i <= post.slides.length; i++) {
    await (await page.$('#s' + i)).screenshot({ path: path.join(dir, 'visuels', `slide-${i}.png`) });
  }
  await (await page.$('#story')).screenshot({ path: path.join(dir, 'visuels', 'story.png') });
  await browser.close();
  fs.rmSync(tmp, { force: true });
  fs.rmSync(path.join(dir, 'render-error.txt'), { force: true });
  console.log(`OK ${slug} : ${post.slides.length} slides`);
}

const args = process.argv.slice(2);
const all = fs.existsSync(path.join(ROOT, 'posts')) ? fs.readdirSync(path.join(ROOT, 'posts')).filter(d => fs.existsSync(path.join(ROOT, 'posts', d, 'post.json'))) : [];
const todo = args.length ? args : all.filter(d => { const n = JSON.parse(fs.readFileSync(path.join(ROOT, 'posts', d, 'post.json'), 'utf8')).slides?.length || 4; return !fs.existsSync(path.join(ROOT, 'posts', d, 'visuels', `slide-${n}.png`)); });
let failed = 0;
for (const slug of todo) {
  try { console.log('→', slug); await renderPost(slug); }
  catch (e) { failed++; console.error('ERREUR', slug, e.message); fs.writeFileSync(path.join(ROOT, 'posts', slug, 'render-error.txt'), e.message + '\n'); }
}
process.exit(0);
