// Publie sur Instagram (API officielle) les carrousels dont "publish_at" est passé.
// Secrets requis : IG_USER_ID, IG_TOKEN. Les images viennent du dépôt public daily-driver-media.
import fs from 'node:fs'; import path from 'node:path';
const { IG_USER_ID, IG_TOKEN } = process.env;
if (!IG_USER_ID || !IG_TOKEN) { console.log('Secrets IG_USER_ID / IG_TOKEN absents : rien à faire.'); process.exit(0); }
// IG_API_BASE : https://graph.instagram.com/v21.0 (connexion Instagram) ou https://graph.facebook.com/v21.0 (Facebook Login)
const G = process.env.IG_API_BASE || 'https://graph.instagram.com/v21.0';
const MEDIA = 'https://raw.githubusercontent.com/alexisdangad/daily-driver-media/main';
const call = async (p, body) => {
  const r = await fetch(`${G}/${p}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ ...body, access_token: IG_TOKEN }) });
  const j = await r.json(); if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j)); return j;
};
const get = async (p, q = {}) => { const r = await fetch(`${G}/${p}?` + new URLSearchParams({ ...q, access_token: IG_TOKEN })); const j = await r.json(); if (!r.ok || j.error) throw new Error(JSON.stringify(j.error || j)); return j; };
const caption = (i) => [i.hook, i.caption, i.credit, 'Sources :\n' + i.sources.map(s => '• ' + s).join('\n'), i.hashtags].join('\n\n');

// Renouvelle le jeton longue durée (valable 60 jours) à chaque passage.
if (G.includes('graph.instagram.com')) try { const r = await get('refresh_access_token', { grant_type: 'ig_refresh_token' }); console.log('Jeton renouvelé, expire dans', r.expires_in, 's'); } catch (e) { console.log('Renouvellement du jeton ignoré :', e.message); }

let changed = false;
for (const d of fs.readdirSync('posts')) {
  const f = path.join('posts', d, 'post.json'); if (!fs.existsSync(f)) continue;
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!p.publish_at || p.ig_published || p.ig_error) continue;
  if (new Date(p.publish_at) > new Date()) continue;
  try {
    const kids = [];
    for (let n = 1; n <= 4; n++) kids.push((await call(`${IG_USER_ID}/media`, { image_url: `${MEDIA}/${d}/slide-${n}.jpg`, is_carousel_item: 'true' })).id);
    const c = await call(`${IG_USER_ID}/media`, { media_type: 'CAROUSEL', children: kids.join(','), caption: caption(p.instagram) });
    for (let t = 0; t < 12; t++) { const s = await get(c.id, { fields: 'status_code' }); if (s.status_code === 'FINISHED') break; if (s.status_code === 'ERROR') throw new Error('Traitement Instagram en erreur'); await new Promise(r => setTimeout(r, 5000)); }
    const pub = await call(`${IG_USER_ID}/media_publish`, { creation_id: c.id });
    p.ig_published = { id: pub.id, at: new Date().toISOString() }; console.log('Publié', d, pub.id);
  } catch (e) { p.ig_error = String(e.message).slice(0, 500); console.log('Erreur', d, p.ig_error); }
  fs.writeFileSync(f, JSON.stringify(p, null, 2)); changed = true;
}
process.exit(0);
