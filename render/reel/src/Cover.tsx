import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
// Couverture du Reel (first frame) : 1080x1920, contenu clé dans la zone centrale 4:5 (y 285 → 1635) vue sur la grille du profil
export const Cover: React.FC<{photo: string; kicker: string; title: string; sub: string; pos?: string}> = ({photo, kicker, title, sub, pos = '50% 50%'}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <style>{`
@font-face{font-family:WerkNeue;font-weight:900;font-style:italic;src:url(${staticFile('fonts/WerkNeue-BlackItalic.otf')})}
@font-face{font-family:WerkNeue;font-weight:600;font-style:italic;src:url(${staticFile('fonts/WerkNeue-SemiBoldItalic.otf')})}
@font-face{font-family:Figtree;font-weight:700;src:url(${staticFile('fonts/Figtree-700.woff2')})}`}</style>
    <Img src={staticFile(photo)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos, filter: 'contrast(1.08) saturate(.9)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,.1) 50%, rgba(0,0,0,.85) 82%)'}} />
    <Img src={staticFile('img/logo-01.svg')} style={{position: 'absolute', top: 330, left: 0, right: 0, margin: '0 auto', height: 110, filter: 'invert(1)'}} />
    <div style={{position: 'absolute', left: 80, right: 80, top: 1240, textAlign: 'center', color: '#fff'}}>
      <div style={{fontFamily: 'Figtree', fontWeight: 700, fontSize: 30, letterSpacing: 9}}>{kicker}</div>
      <div style={{fontFamily: 'WerkNeue', fontStyle: 'italic', fontWeight: 900, fontSize: 112, lineHeight: .92, letterSpacing: -4, whiteSpace: 'nowrap', marginTop: 18, textShadow: '0 6px 40px rgba(0,0,0,.5)'}}>{title}</div>
      {sub ? <div style={{fontFamily: 'WerkNeue', fontStyle: 'italic', fontWeight: 600, fontSize: 52, marginTop: 22}}>{sub}</div> : null}
    </div>
    <Img src={staticFile('img/logo-02.svg')} style={{position: 'absolute', top: 1545, left: 0, right: 0, margin: '0 auto', height: 92, filter: 'invert(1)'}} />
  </AbsoluteFill>
);
