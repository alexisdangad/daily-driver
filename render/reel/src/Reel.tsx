import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, interpolate, spring, Img, Easing} from 'remotion';
import {Audio} from '@remotion/media';
import data from './data.json';

// ——— Thème Daily Driver ———
const TH = {
  display: 'WerkNeue, Figtree, sans-serif', body: 'Figtree, sans-serif',
  out: Easing.bezier(0.16, 1, 0.3, 1), inn: Easing.bezier(0.7, 0, 0.84, 0),
  // Zones de sécurité Reels 1080x1920 : haut 250, bas 420, droite 140
  safe: {top: 250, bottom: 1500, left: 80, right: 940},
  subY: 1020,
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
type G = {start: number; end: number; small: {t: string; at: number}[]; big: {t: string; at: number}; after: {t: string; at: number}[]};
type S = {dur: number; groups: G[]; cuts: {src: string; at: number}[]};
const SC = data as S[];
const END = 40;
export const TOTAL = SC.reduce((a, s) => a + s.dur, 0) + END;
const starts = SC.reduce<number[]>((a, s, i) => (a.push(i ? a[i - 1] + SC[i - 1].dur : 0), a), []);

const Fonts = () => <style>{`
@font-face{font-family:WerkNeue;font-weight:600;font-style:italic;src:url(${staticFile('fonts/WerkNeue-SemiBoldItalic.otf')})}
@font-face{font-family:WerkNeue;font-weight:900;font-style:italic;src:url(${staticFile('fonts/WerkNeue-BlackItalic.otf')})}
@font-face{font-family:Figtree;font-weight:400;src:url(${staticFile('fonts/Figtree-400.woff2')})}
@font-face{font-family:Figtree;font-weight:700;src:url(${staticFile('fonts/Figtree-700.woff2')})}`}</style>;

// ——— Couches : photo (Ken Burns + grade), dégradés, grain, vignette ———
const Shot: React.FC<{src: string; len: number; first: boolean; dir: number}> = ({src, len, first, dir}) => {
  const f = useCurrentFrame();
  const punch = interpolate(f, [0, 9], [first ? 1.22 : 1.1, 1.0], {...clamp, easing: TH.out});
  const kb = interpolate(f, [0, len], [1, 1.07], clamp);
  const px = interpolate(f, [0, len], [50 - 14 * dir, 50 + 14 * dir], {...clamp, easing: Easing.inOut(Easing.quad)});
  const blur = first ? 0 : interpolate(f, [0, 6], [10, 0], clamp);
  return <AbsoluteFill style={{overflow: 'hidden'}}>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${px}% 50%`,
      transform: `scale(${punch * kb})`, filter: `blur(${blur}px) contrast(1.08) saturate(.88) brightness(.97)`}} />
  </AbsoluteFill>;
};
const Grade: React.FC = () => {
  const f = useCurrentFrame();
  return <>
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,.05) 45%, rgba(0,0,0,.6) 72%, rgba(0,0,0,.8) 100%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,.55) 100%)'}} />
    <AbsoluteFill style={{opacity: .12, mixBlendMode: 'overlay', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='${f % 5}'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>")`}} />
  </>;
};

// ——— Sous-titres dynamiques (petits mots + mot-clé géant) ———
const Word: React.FC<{t: string; at: number}> = ({t, at}) => {
  const f = useCurrentFrame();
  const s = spring({frame: f - at, fps: 30, config: {damping: 18, stiffness: 220}});
  return <span style={{display: 'inline-block', marginRight: 14, opacity: Math.min(1, s * 1.4), translate: `0 ${(1 - s) * 18}px`}}>{t}</span>;
};
const Group: React.FC<{g: G}> = ({g}) => {
  const f = useCurrentFrame();
  const out = interpolate(f, [g.end - g.start - 5, g.end - g.start], [1, 0], {...clamp, easing: TH.inn});
  const bAt = g.big.at - g.start;
  const s = spring({frame: f - bAt, fps: 30, config: {damping: 14, stiffness: 180}});
  const glow = interpolate(f - bAt, [0, 4, 22], [0, 1, 0.35], clamp);
  const len = g.big.t.length;
  const size = Math.min(170, Math.floor(1100 / Math.max(len, 4)));
  return <div style={{position: 'absolute', left: TH.safe.left, right: 1080 - TH.safe.right, top: TH.subY, textAlign: 'center', opacity: out,
    filter: `blur(${(1 - out) * 8}px)`}}>
    {g.small.length > 0 && <div style={{fontFamily: TH.body, fontWeight: 700, fontSize: 48, color: '#fff', letterSpacing: .5, lineHeight: 1.1,
      textShadow: '0 2px 18px rgba(0,0,0,.7)', marginBottom: 6}}>
      {g.small.map((w, i) => <Word key={i} t={w.t} at={w.at - g.start} />)}</div>}
    <div style={{fontFamily: TH.display, fontStyle: 'italic', fontWeight: 900, fontSize: size, lineHeight: 1, letterSpacing: -size * 0.025, color: '#fff',
      whiteSpace: 'nowrap', opacity: f >= bAt ? Math.min(1, s * 1.5) : 0, scale: `${1.25 - 0.25 * Math.min(1, s)}`, filter: `blur(${Math.max(0, 1 - s) * 10}px)`,
      textShadow: `0 0 ${40 * glow}px rgba(255,255,255,${0.55 * glow}), 0 4px 30px rgba(0,0,0,.6)`}}>{g.big.t}</div>
    {g.after.length > 0 && <div style={{fontFamily: TH.body, fontWeight: 700, fontSize: 48, color: '#fff', marginTop: 10, textShadow: '0 2px 18px rgba(0,0,0,.7)'}}>
      {g.after.map((w, i) => <Word key={i} t={w.t} at={w.at - g.start} />)}</div>}
  </div>;
};

// ——— Libellé haut (élégant, discret) ———
const Label: React.FC = () => {
  const f = useCurrentFrame();
  const s = interpolate(f, [18, 40], [0, 1], {...clamp, easing: TH.out});
  const line = interpolate(f, [24, 54], [0, 1], {...clamp, easing: TH.out});
  return <div style={{position: 'absolute', top: TH.safe.top + 80, left: 0, right: 0, textAlign: 'center', opacity: s * 0.92}}>
    <div style={{fontFamily: TH.body, fontWeight: 700, fontSize: 24, letterSpacing: 8, color: '#fff'}}>ASTON MARTIN</div>
    <div style={{width: 90 * line, height: 2, background: '#fff', margin: '14px auto', opacity: .8}} />
    <div style={{fontFamily: TH.display, fontStyle: 'italic', fontWeight: 600, fontSize: 40, color: '#fff'}}>Valhalla Spider</div>
  </div>;
};
// Marque : icône en haut, wordmark en bas, tout le long
const Brand: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [6, 24], [0, 1], {...clamp, easing: TH.out});
  return <>
    <Img src={staticFile('img/logo-01.svg')} style={{position: 'absolute', top: TH.safe.top, left: 0, right: 0, margin: '0 auto', height: 66, filter: 'invert(1)', opacity: o * 0.95}} />
    <Img src={staticFile('img/logo-02.svg')} style={{position: 'absolute', top: 1405, left: 0, right: 0, margin: '0 auto', height: 92, filter: 'invert(1) drop-shadow(0 2px 10px rgba(0,0,0,.5))', opacity: o * 0.95}} />
  </>;
};
const Flash: React.FC<{at: number; strength?: number}> = ({at, strength = 0.8}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + 5], [0, strength, 0], clamp);
  return <AbsoluteFill style={{background: '#fff', opacity: o, pointerEvents: 'none'}} />;
};
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const s = spring({frame: f, fps: 30, config: {damping: 200}, durationInFrames: 18});
  return <AbsoluteFill style={{background: '#050505', alignItems: 'center', justifyContent: 'center'}}>
    <div style={{opacity: s, translate: `0 ${(1 - s) * 30}px`, textAlign: 'center', marginTop: -120}}>
      <Img src={staticFile('img/logo-02.svg')} style={{height: 150, filter: 'invert(1)', margin: '-40px 0'}} />
      <div style={{fontFamily: TH.body, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: '#fff', marginTop: 40, opacity: .85}}>@DAILYDRIVER_MEDIA</div>
    </div>
  </AbsoluteFill>;
};

const Sfx: React.FC<{n: string; at: number; v?: number}> = ({n, at, v = .6}) =>
  <Sequence from={Math.max(0, at)}><Audio src={staticFile(`audio/${n}.mp3`)} volume={v} /></Sequence>;

export const Reel: React.FC = () => {
  return <AbsoluteFill style={{background: '#000'}}>
    <Fonts />
    {SC.map((s, i) => <Sequence key={i} from={starts[i]} durationInFrames={s.dur}>
      {s.cuts.map((c, k) => {
        const end = k + 1 < s.cuts.length ? s.cuts[k + 1].at : s.dur;
        return <Sequence key={k} from={c.at} durationInFrames={end - c.at}><Shot src={c.src} len={end - c.at} first={i === 0 && c.at < 30} dir={(i + k) % 2 ? 1 : -1} /></Sequence>;
      })}
      <Grade />
      {s.groups.map((g, k) => <Sequence key={k} from={g.start} durationInFrames={g.end - g.start}><Group g={g} /></Sequence>)}
      <Audio src={staticFile(`audio/voix-${i}.mp3`)} />
    </Sequence>)}
    <Sequence from={0} durationInFrames={starts[4] + SC[4].dur}><Label /></Sequence>
    <Sequence from={0} durationInFrames={TOTAL - END}><Brand /></Sequence>
    <Flash at={0} strength={0.35} />
    {SC[0].cuts.filter(c => c.at > 0 && c.at < 30).map((c, k) => <Flash key={`fl${k}`} at={c.at} strength={0.4} />)}
    <Sequence from={TOTAL - END}><EndCard /></Sequence>

    {/* ——— Son (kit d'Alexis) ——— */}
    <Audio src={staticFile('audio/bed.mp3')} loop volume={(f) => 0.14 * interpolate(f, [0, 30, TOTAL - 30, TOTAL], [0.4, 1, 1, 0], clamp)} />
    <Sfx n="engine" at={0} v={.55} />
    <Sequence from={0}><Audio src={staticFile('audio/whoosh-hit-5.wav')} trimBefore={14} volume={.7} /></Sequence>
    {/* accroche : clic photo sur chaque plan du montage éclair */}
    {SC[0].cuts.filter(c => c.at < 30).map((c, k) => <Sequence key={`cc${k}`} from={c.at}><Audio src={staticFile('audio/camera-click.mp3')} volume={.75} playbackRate={[1, 1.06, 0.96, 1.1, 1][k % 5]} /></Sequence>)}
    {/* coupes : grosses = whoosh-hit-2, petites = clic photo */}
    {SC.flatMap((s, i) => s.cuts.map((c, k) => ({i, k, at: starts[i] + c.at}))).filter(x => !(x.i === 0 && x.at < 30)).map((x, j) =>
      x.k === 0 && (x.i === 1 || x.i === 2 || x.i === 4)
        ? <Sequence key={`c${j}`} from={x.at - 19}><Audio src={staticFile('audio/whoosh-hit-2.wav')} volume={.6} /></Sequence>
        : <Sequence key={`c${j}`} from={x.at - 3}><Audio src={staticFile('audio/whoosh-swoosh.wav')} volume={.35} /></Sequence>)}
    {/* ding sur les chiffres, clic souris sur les autres mots-clés */}
    {SC.flatMap((s, i) => s.groups.map((g, k) => /\d/.test(g.big.t)
      ? <Sequence key={`d${i}${k}`} from={starts[i] + g.big.at}><Audio src={staticFile('audio/ding.mp3')} volume={.35} /></Sequence>
      : <Sequence key={`m${i}${k}`} from={starts[i] + g.big.at - 1}><Audio src={staticFile('audio/mouse-click.mp3')} volume={.4} /></Sequence>))}
    <Sequence from={TOTAL - END - 16}><Audio src={staticFile('audio/whoosh-hit-5.wav')} volume={.6} /></Sequence>
  </AbsoluteFill>;
};
