// Orthotypographie française — appliquée à tous les textes (visuels, légendes, posts X).
const NB = ' ';           // espace insécable
const UNITS = 'ch|cv|kW|kWh|kg|km\\/h|km|m|cm|mm|L|l|Nm|g|s|min|h|t|ans|an|mois|jours|places|portes|cylindres|tr\\/min|€|\\$|£|%';
export function typo(input) {
  if (typeof input !== 'string') return input;
  let s = input;
  s = s.replace(/\.\.\./g, '…');
  s = s.replace(/[‘`]/g, '’').replace(/(\w)'(\w)/g, '$1’$2').replace(/'/g, '’');
  // guillemets droits → « »
  s = s.replace(/"([^"]+)"/g, '«$1»');
  s = s.replace(/«\s*/g, '«' + NB).replace(/\s*»/g, NB + '»');
  // ponctuation double : espace insécable avant : ; ! ? (sauf URL http: et heures 10:30)
  s = s.replace(/\s*([;!?])/g, NB + '$1').replace(/(?<![\d/])\s*:(?!\/\/|\d)/g, NB + ':');
  s = s.replace(/(!|\?) (?=[!?])/g, '$1');
  // nombres : séparateur de milliers insécable, unités collées au chiffre
  s = s.replace(/(\d)\s(\d{3})(?!\d)/g, '$1' + NB + '$2');
  s = s.replace(new RegExp('(\\d)\\s*(' + UNITS + ')(?![\\p{L}])', 'gu'), '$1' + NB + '$2');
  s = s.replace(/\bN°\s*/g, 'N°' + NB).replace(/\bn°\s*/g, 'n°' + NB);
  s = s.replace(/\bx(?=\d)/g, '×');
  return s;
}
// évite la ligne orpheline : lie les deux derniers mots
export const noWidow = s => typeof s === 'string' ? s.replace(/\s+(\S+)\s*$/, NB + '$1') : s;
const SKIP = new Set(['url', 'page', 'credit', 'slug', 'status', 'hashtags', 'focus', 'layout', 'photo', 'zoom', 'sources_urls']);
export function typoDeep(v, key) {
  if (SKIP.has(key)) return v;
  if (typeof v === 'string') return typo(v);
  if (Array.isArray(v)) return v.map(x => typoDeep(x, key));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typoDeep(x, k)]));
  return v;
}
// CLI : node render/typo.mjs posts/<slug>/post.json  (réécrit le fichier normalisé)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const f of process.argv.slice(2)) fs.writeFileSync(f, JSON.stringify(typoDeep(JSON.parse(fs.readFileSync(f, 'utf8'))), null, 2) + '\n');
}
