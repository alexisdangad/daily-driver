#!/usr/bin/env python3
# Prépare un Reel pour publication automatique (APRÈS le « go » d'Alexis).
# usage: python3 render/reel/prep_reel.py <slug> <reel.mp4> <cover.png> <publish_at ISO+01:00> <instagram.json>
#   instagram.json = {"hook","caption","credit","sources":[...],"hashtags"}  (mêmes règles que les carrousels)
# -> daily-driver-media/<slug>/reel.mp4 (faststart) + cover.jpg ; daily-driver/posts/<slug>/post.json {reel:true}
import sys,os,json,subprocess
from PIL import Image
slug,mp4,cover,at,ig=sys.argv[1:6]
R='/home/claude/daily-driver'; M='/home/claude/daily-driver-media'
os.makedirs(f'{M}/{slug}',exist_ok=True); os.makedirs(f'{R}/posts/{slug}',exist_ok=True)
subprocess.run(['ffmpeg','-y','-loglevel','error','-i',mp4,'-c','copy','-movflags','+faststart',f'{M}/{slug}/reel.mp4'],check=True)
Image.open(cover).convert('RGB').save(f'{M}/{slug}/cover.jpg',quality=93,subsampling=0)
p={"slug":slug,"status":"auto","reel":True,"publish_at":at,"instagram":json.load(open(ig)),
   "published":{"mode":"github","date":at[:10],"note":"API Instagram (Reel)"}}
json.dump(p,open(f'{R}/posts/{slug}/post.json','w'),ensure_ascii=False,indent=2)
print('Reel prêt',slug,at,os.path.getsize(f'{M}/{slug}/reel.mp4')//1e6,'Mo')
