// Relève les chiffres des publications (stats/instagram.json), au plus toutes les 3 h.
// likes/commentaires : permission instagram_basic. Reach/enregistrements/partages : nécessitent instagram_manage_insights.
import fs from 'node:fs';
const { IG_USER_ID, IG_TOKEN } = process.env; const G = process.env.IG_API_BASE || 'https://graph.facebook.com/v21.0';
if (!IG_USER_ID || !IG_TOKEN) process.exit(0);
const out = 'stats/instagram.json'; fs.mkdirSync('stats', { recursive: true });
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : {};
if (prev.generated_at && Date.now() - new Date(prev.generated_at) < 3 * 3600e3) process.exit(0);
const get = async (p, q) => { const r = await fetch(`${G}/${p}?` + new URLSearchParams({ ...q, access_token: IG_TOKEN })); const j = await r.json(); if (j.error) throw new Error(j.error.message); return j; };
try {
  const acc = await get(IG_USER_ID, { fields: 'username,followers_count,follows_count,media_count' });
  const m = await get(`${IG_USER_ID}/media`, { fields: 'id,caption,media_type,timestamp,permalink,like_count,comments_count', limit: '50' });
  let insightsOk = null;
  for (const it of m.data) {
    try { const i = await get(`${it.id}/insights`, { metric: 'reach,saved,shares,total_interactions' }); it.insights = Object.fromEntries(i.data.map(x => [x.name, x.values[0].value])); insightsOk = true; }
    catch (e) { if (insightsOk === null) insightsOk = false; it.insights_error = e.message.slice(0, 120); }
    it.caption = (it.caption || '').split('\n')[0].slice(0, 120);
  }
  fs.writeFileSync(out, JSON.stringify({ generated_at: new Date().toISOString(), account: acc, insights_available: insightsOk, media: m.data }, null, 2));
  console.log('Stats relevées :', m.data.length, 'publications, insights =', insightsOk);
} catch (e) { console.log('Stats ignorées :', e.message); }
