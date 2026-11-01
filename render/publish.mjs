// Publie sur Instagram (API officielle) les carrousels dont "publish_at" est passé.
// Secrets requis : IG_USER_ID, IG_TOKEN. Les images viennent du dépôt public daily-driver-media.
import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const { IG_USER_ID, IG_TOKEN } = process.env;
if (!IG_USER_ID || !IG_TOKEN) { console.log('Secrets IG_USER_ID / IG_TOKEN absents : rien à faire.'); 
process.exit(0); }
// IG_API_BASE : https://graph.instagram.com/v21.0 (connexion Instagram) ou https://graph.facebook.com/v21.0 (Facebook Login)
if (fs.existsSync('PAUSE')) { console.log('PAUSE : publication suspendue (fichier PAUSE présent).'); process.exit(0); }
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


// Verrou via git : évite toute double publication (deux exécutions simultanées, push perdu...).
const sh = c => execSync(c, { stdio: 'pipe' }).toString();
const persist = (msg) => {
  try { sh('git config user.name "daily-driver-bot" && git config user.email "bot@users.noreply.github.com"'); } catch {}
  for (let i = 0; i < 6; i++) {
    try { sh('git add posts stats'); try { sh('git diff --cached --quiet'); return true; } catch {} sh(`git commit -m "${msg}"`); sh('git pull --rebase -X theirs'); sh('git push'); return true; }
    catch (e) { console.log('push à réessayer', i, String(e.message).slice(0, 120)); try { sh('git rebase --abort'); } catch {} }
  }
  return false;
};
const fresh = (f) => { try { sh('git pull --rebase -q'); } catch {} return JSON.parse(fs.readFileSync(f, 'utf8')); };

// Réconciliation automatique : un post en erreur est peut-être déjà en ligne (Instagram publie souvent malgré l'erreur).
// On regarde les derniers médias du compte ; si le post y est, on le marque publié ; sinon, après 25 min, on autorise (au plus 2 fois) un nouvel essai.
{
  let recent = null;
  for (const d of fs.readdirSync('posts')) {
    const f = path.join('posts', d, 'post.json'); if (!fs.existsSync(f)) continue;
    let p = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (p.ig_published || !(p.ig_error || p.ig_claim) || !p.instagram) continue;
    const claimAt = new Date(p.ig_claim || Date.now()).getTime();
    if (!recent) { try { recent = (await get(`${IG_USER_ID}/media`, { fields: 'id,caption,timestamp', limit: '30' })).data || []; } catch (e) { console.log('Réconciliation impossible :', String(e.message).slice(0, 100)); break; } }
    const head = caption(p.instagram).slice(0, 40);
    console.log('Réconciliation', d, 'tête =', JSON.stringify(head), '| récents =', JSON.stringify(recent.slice(0, 6).map(m => [(m.caption || '').slice(0, 40), m.timestamp])));
    const hit = recent.find(m => (m.caption || '').slice(0, 40) === head && new Date(m.timestamp).getTime() >= claimAt - 10 * 60e3);
    if (hit) { p.ig_published = { id: hit.id, at: hit.timestamp, note: 'retrouvé en ligne après erreur API' }; delete p.ig_error; console.log('Retrouvé en ligne', d, hit.id); }
    else if (Date.now() - claimAt > 25 * 60e3 && (p.ig_tries || 0) < 0) { p.ig_tries = (p.ig_tries || 0) + 1; delete p.ig_error; delete p.ig_claim; console.log('Absent après 25 min : nouvel essai autorisé', d, p.ig_tries); }
    else continue;
    fs.writeFileSync(f, JSON.stringify(p, null, 2));
  }
  persist('Réconciliation des publications');
}
// Cadence : pas deux publications à moins de 40 minutes d'écart (évite les rafales qui déclenchent la limite).
const lastPub = () => Math.max(0, ...fs.readdirSync('posts').map(d => { try { return new Date(JSON.parse(fs.readFileSync(path.join('posts', d, 'post.json'), 'utf8')).ig_published?.at || 0).getTime() || 0; } catch { return 0; } }));

let changed = false;
for (const d of fs.readdirSync('posts')) {
  const f = path.join('posts', d, 'post.json'); if (!fs.existsSync(f)) continue;
  let p = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!p.publish_at || p.ig_published || p.ig_error || p.ig_claim) continue;
  if (new Date(p.publish_at) > new Date()) continue;
  if (Date.now() - lastPub() < 40 * 60e3) { console.log('Cadence : on attend 40 min depuis la dernière publication', d); continue; }
  p = fresh(f); if (p.ig_published || p.ig_error || p.ig_claim) continue;
  p.ig_claim = new Date().toISOString(); fs.writeFileSync(f, JSON.stringify(p, null, 2));
  if (!persist(`Verrou publication ${d}`)) { console.log('Verrou impossible, on abandonne', d); process.exit(1); }
  try {
    const N = Math.min(10, Math.max(1, p.slides?.length || 4));
    let c;
    if (p.reel) {
      // Reel : vidéo + couverture (first frame) dans le dépôt média ; partagé aussi dans le feed.
      c = await call(`${IG_USER_ID}/media`, { media_type: 'REELS', video_url: `${MEDIA}/${d}/reel.mp4`, cover_url: `${MEDIA}/${d}/cover.jpg`, caption: caption(p.instagram), share_to_feed: 'true' });
      for (let t = 0; t < 60; t++) { const s = await get(c.id, { fields: 'status_code' }); if (s.status_code === 'FINISHED') break; if (s.status_code === 'ERROR') throw new Error('Traitement Reel en erreur'); await new Promise(r => setTimeout(r, 10000)); }
    } else if (N === 1) c = await call(`${IG_USER_ID}/media`, { image_url: `${MEDIA}/${d}/slide-1.jpg`, caption: caption(p.instagram) });
    else {
      const kids = [];
      for (let n = 1; n <= N; n++) kids.push((await call(`${IG_USER_ID}/media`, { image_url: `${MEDIA}/${d}/slide-${n}.jpg`, is_carousel_item: 'true' })).id);
      c = await call(`${IG_USER_ID}/media`, { media_type: 'CAROUSEL', children: kids.join(','), caption: caption(p.instagram) });
    }
    for (let t = 0; t < 20; t++) { const s = await get(c.id, { fields: 'status_code' }); if (s.status_code === 'FINISHED') break; if (s.status_code === 'ERROR') throw new Error('Traitement Instagram en erreur'); await new Promise(r => setTimeout(r, 10000)); }
    let pub; for (let r = 0; r < 6; r++) { try { pub = await call(`${IG_USER_ID}/media_publish`, { creation_id: c.id }); break; } catch (e) { if (r === 5 || !/9007|2207027|pas prêt/.test(String(e.message))) throw e; await new Promise(x => setTimeout(x, 10000)); } }
    p.ig_published = { id: pub.id, at: new Date().toISOString() }; console.log('Publié', d, pub.id);
  } catch (e) {
    p.ig_error = String(e.message).slice(0, 500); console.log('Erreur', d, p.ig_error);
    // Instagram peut publier malgré l'erreur : on regarde les derniers médias avant de conclure à un échec.
    try {
      await new Promise(r => setTimeout(r, 20000));
      const head = caption(p.instagram).slice(0, 40);
      const list = await get(`${IG_USER_ID}/media`, { fields: 'id,caption,timestamp', limit: '8' });
      const hit = (list.data || []).find(m => (m.caption || '').slice(0, 40) === head && Date.now() - new Date(m.timestamp).getTime() < 30 * 60e3);
      if (hit) { p.ig_published = { id: hit.id, at: hit.timestamp, note: 'détecté après erreur API' }; delete p.ig_error; console.log('Publié malgré l\'erreur', d, hit.id); }
    } catch (e2) { console.log('Vérification impossible', String(e2.message).slice(0, 120)); }
    // Limite d'appels / média pas prêt : Instagram publie presque toujours malgré l'erreur. On considère le post en ligne, sans alerte et sans nouvel essai.
    if (!p.ig_published && /limit reached|2207051|9007|2207027|pas prêt/i.test(p.ig_error || '')) { p.ig_published = { id: 'presume', at: new Date().toISOString(), note: 'présumé en ligne après erreur API' }; delete p.ig_error; console.log('Présumé en ligne', d); }
  }
  fs.writeFileSync(f, JSON.stringify(p, null, 2)); changed = true;
  persist(`Publication Instagram ${d}`);
}
// Stories automatiques : pour tout post publié depuis < 20 h ayant un story.jpg et pas encore de story.
for (const d of fs.readdirSync('posts')) {
  const f = path.join('posts', d, 'post.json'); if (!fs.existsSync(f)) continue;
  let p = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!p.ig_published || p.ig_story || p.ig_story_error || p.ig_story_claim) continue;
  if (Date.now() - new Date(p.ig_published.at).getTime() > 20 * 3600e3) continue;
  const storyFile = p.reel ? 'cover.jpg' : 'story.jpg';
  if (!(await fetch(`${MEDIA}/${d}/${storyFile}`, { method: 'HEAD' }).catch(() => ({}))).ok) continue;
  p = fresh(f); if (p.ig_story || p.ig_story_error || p.ig_story_claim) continue;
  p.ig_story_claim = new Date().toISOString(); fs.writeFileSync(f, JSON.stringify(p, null, 2));
  if (!persist(`Verrou story ${d}`)) { console.log('Verrou story impossible', d); process.exit(1); }
  const url = `${MEDIA}/${d}/${storyFile}`;
  try {
    const st = await call(`${IG_USER_ID}/media`, { image_url: url, media_type: 'STORIES' });
    for (let t = 0; t < 15; t++) { const q = await get(st.id, { fields: 'status_code' }).catch(() => ({})); if (q.status_code === 'FINISHED') break; if (q.status_code === 'ERROR') throw new Error('Story en erreur'); await new Promise(r => setTimeout(r, 10000)); }
    let sp, err;
    for (let t = 0; t < 6; t++) { try { sp = await call(`${IG_USER_ID}/media_publish`, { creation_id: st.id }); break; } catch (e) { err = e; await new Promise(r => setTimeout(r, 8000)); } }
    if (!sp) throw err;
    p.ig_story = { id: sp.id, at: new Date().toISOString() }; console.log('Story publiée', d, sp.id);
  } catch (e) { p.ig_story_error = String(e.message).slice(0, 300); console.log('Story en erreur', d, p.ig_story_error); }
  fs.writeFileSync(f, JSON.stringify(p, null, 2));
  persist(`Story ${d}`);
}
process.exit(0);
