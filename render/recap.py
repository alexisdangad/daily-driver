#!/usr/bin/env python3
# Génère les visuels du « Résumé de la semaine » (design validé par Alexis le 01/11/2026).
# usage: python3 render/recap.py posts/<slug>/recap.json   -> posts/<slug>/visuels/slide-N.png
import json,sys,os
from playwright.sync_api import sync_playwright
cfg=json.load(open(sys.argv[1])); D=os.path.dirname(os.path.abspath(sys.argv[1]))
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
F=R+'assets/fonts/'; L=R+'assets/logos/'
C=lambda n: os.path.join(D,'candidates',n+'.jpg')
base=f"""
@font-face{{font-family:Werk;font-weight:600;font-style:italic;src:url('{F}WerkNeue-SemiBoldItalic.otf')}}
@font-face{{font-family:Figtree;font-weight:400;src:url('{F}Figtree-400.woff2')}}
@font-face{{font-family:Figtree;font-weight:700;src:url('{F}Figtree-700.woff2')}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;background:#000;color:#fff;font-family:Figtree;position:relative;overflow:hidden}}
.lw{{filter:invert(1)}}
h1{{font-family:Werk;font-weight:600;font-style:italic;line-height:.95;letter-spacing:-2px}}
.ph{{position:absolute;inset:0;background-size:cover;background-position:50% 50%}}
.fade{{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 22%,rgba(0,0,0,0) 50%,rgba(0,0,0,.92) 86%)}}
.enc{{position:absolute;background:#000;border:2px solid #fff;display:flex;align-items:center;justify-content:center;transform:rotate(-5deg);z-index:6}}
.num{{left:56px;top:70px;padding:0 34px;height:86px;font-family:Werk;font-weight:600;font-style:italic;font-size:54px}}
.num i{{font-family:Figtree;font-style:normal;font-weight:400;font-size:30px;opacity:.75;margin-left:12px}}
.ico{{right:56px;bottom:56px;width:104px;height:104px}}.ico img{{height:76px}}
.tx{{position:absolute;left:56px;right:200px;bottom:70px}}
.tx h1{{font-size:118px}}.tx p{{font-size:32px;line-height:1.3;margin-top:20px;max-width:760px}}
.cr{{position:absolute;left:56px;bottom:28px;font-size:18px;opacity:.7}}
.film{{position:absolute;left:80px;top:-120px;width:430px;height:1700px;background:#000;transform:rotate(7deg);padding:22px;display:flex;flex-direction:column;gap:22px;z-index:1}}
.f{{flex:1;background-size:cover;background-position:center}}
.card{{position:absolute;background:#fff;color:#000;transform:rotate(-5deg);z-index:2}}
.lbox{{left:214px;top:672px;width:360px;height:78px;overflow:hidden;z-index:6}}.lbox img{{height:104px}}
.ybox{{left:812px;top:640px;width:200px;height:78px;font-family:Werk;font-weight:600;font-style:italic;font-size:48px;letter-spacing:1px}}
.ibox{{left:226px;top:1038px;width:128px;height:128px}}.ibox img{{height:96px}}
.pill{{position:absolute;right:56px;bottom:56px;padding:22px 40px;background:#000;border:2px solid #fff;font-weight:700;font-size:30px;letter-spacing:4px;z-index:6}}
"""
def film(ph): return '<div class=film>'+''.join(f'<div class=f style="background-image:url({C(n)})"></div>' for n in ph)+'</div>'
def cover():
    return f"""<div class=ph style="background-image:url({C(cfg['cover']['bg'])})"></div>{film(cfg['cover']['strip'])}
<div class=card style="left:250px;top:700px;padding:56px 64px"><h1 style="font-size:90px;white-space:nowrap">Le résumé<br>de la semaine</h1><p style="font-size:38px;font-weight:700;margin-top:32px;white-space:nowrap">{cfg['dates']}</p></div>
<div class="enc lbox"><img class=lw src="{L}logo-02.svg"></div><div class="enc ybox">{cfg['year']}</div><div class="enc ibox"><img class=lw src="{L}logo-01.svg"></div><div class=pill>SWIPE &nbsp;→</div>"""
def sujet(i,s,n):
    return f"""<div class=ph style="background-image:url({C(s['photo'])});background-position:{s.get('focus','50% 50%')}"></div><div class=fade></div><div class="enc num">{i:02d}<i>/ {n:02d}</i></div><div class=tx><h1>{s['title']}</h1><p>{s['text']}</p></div><div class=cr>Photo {s['credit']}</div><div class="enc ico"><img class=lw src="{L}logo-01.svg"></div>"""
def final():
    f=cfg['final']
    return f"""<div class=ph style="background-image:url({C(f['bg'])})"></div>{film(f['strip'])}
<div class=card style="left:150px;top:480px;width:780px;padding:90px 64px 80px;text-align:left"><h1 style="font-size:112px;white-space:nowrap">Abonne-toi</h1><p style="font-size:38px;font-weight:700;margin-top:30px">{f['handle']}</p><p style="font-size:30px;margin-top:14px">{f['line']}</p></div>
<div class="enc" style="left:120px;top:430px;width:360px;height:78px;overflow:hidden;z-index:6"><img class=lw style="height:104px" src="{L}logo-02.svg"></div>
<div class="enc ico"><img class=lw src="{L}logo-01.svg"></div><div class=pill style="left:50%;right:auto;transform:translateX(-50%);bottom:150px">S'ABONNER &nbsp;→</div>"""
def story():
    b=cover().replace('top:700px','top:1000px')
    return b
STORY_CSS="""body{height:1920px}.film{height:2400px}.lbox{top:972px}.ybox{top:940px}.ibox{top:1338px}.pill{bottom:140px}"""
pages=[cover()]+[sujet(i,s,len(cfg['sujets'])) for i,s in enumerate(cfg['sujets'],1)]+[final()]
os.makedirs(D+'/visuels',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1350})
    for i,body in enumerate(pages,1):
        open('/tmp/_recap.html','w').write(f'<html><head><meta charset=utf-8><style>{base}</style></head><body>{body}</body></html>')
        pg.goto('file:///tmp/_recap.html'); pg.wait_for_timeout(500); pg.screenshot(path=f'{D}/visuels/slide-{i}.png')
    b.close()
    pg=b2=None
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1920})
    open('/tmp/_recap.html','w').write(f'<html><head><meta charset=utf-8><style>{base}{STORY_CSS}</style></head><body>{story()}</body></html>')
    pg.goto('file:///tmp/_recap.html'); pg.wait_for_timeout(500); pg.screenshot(path=f'{D}/visuels/story.png'); b.close()
print(len(pages),'slides + story')

# --- Frames 9:16 pour Reels (reel-0 = couverture, reel-1..n = sujets, reel-last = abonne-toi)
if '--reel' in sys.argv:
    RCSS="body{height:1920px}.film{height:2400px}.lbox{top:972px}.ybox{top:940px}.ibox{top:1338px}.pill{bottom:140px}.tx{bottom:150px}.cr{bottom:90px}.ico{bottom:120px}.tx h1{font-size:132px}.tx p{font-size:38px;max-width:820px}"
    fin=final().replace('top:480px','top:800px').replace('top:430px','top:750px').replace('bottom:150px','bottom:260px')
    frames=[story()]+[sujet(i,x,len(cfg['sujets'])) for i,x in enumerate(cfg['sujets'],1)]+[fin]
    with sync_playwright() as p:
        b=p.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1920})
        for i,body in enumerate(frames):
            open('/tmp/_recap.html','w').write(f'<html><head><meta charset=utf-8><style>{base}{RCSS}</style></head><body>{body}</body></html>')
            pg.goto('file:///tmp/_recap.html'); pg.wait_for_timeout(500); pg.screenshot(path=f'{D}/visuels/reel-{i}.png')
        b.close()
    print(len(frames),'frames reel')
