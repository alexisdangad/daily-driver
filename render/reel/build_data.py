#!/usr/bin/env python3
# Construit src/data.json (scènes, groupes de sous-titres, coupes) à partir d'un reel.json + des alignements ElevenLabs.
# usage: python3 build_data.py <dossier_reel>   (contient reel.json et audio/voix-N.mp3 + voix-N.json)
# reel.json : {"scenes":[{"groups":[{"small":[["mot",idx],...],"big":["MOT-CLÉ",idx],"after":[["mot",idx]]}],"cuts":[["up08",idx],...]}], "cover":{...}}
# cuts : [photo, idx] ou [photo, "f:6"] (frame fixe, pour le montage-éclair de l'accroche)
# idx = index du mot prononcé dans la scène (balises [excited] ignorées).
import json,subprocess,sys,os
R=sys.argv[1]; FPS=30
spec=json.load(open(f'{R}/reel.json'))
def starts(n):
    a=json.load(open(f'{R}/audio/voix-{n}.json'))['alignment']; out=[];cur='';t0=None
    for c,s in zip(a['characters'],a['character_start_times_seconds']):
        if c.isspace():
            if cur and not cur.startswith('['): out.append(t0)
            cur=''; continue
        if not cur: t0=s
        cur+=c
    if cur and not cur.startswith('['): out.append(t0)
    return out
scenes=[]
for n,sc in enumerate(spec['scenes']):
    tt=starts(n); f=lambda i: round(tt[i]*FPS)
    dur=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'{R}/audio/voix-{n}.mp3']))
    D=round((dur+0.35)*FPS); G=sc['groups']; gs=[]
    for k,g in enumerate(G):
        first=min([i for _,i in g.get('small',[])]+[g['big'][1]])
        nx=G[k+1] if k+1<len(G) else None
        end=min([i for _,i in nx.get('small',[])]+[nx['big'][1]]) if nx else None
        gs.append({"start":f(first),"end":f(end) if end is not None else D,
                   "small":[{"t":w,"at":f(i)} for w,i in g.get('small',[])],"big":{"t":g['big'][0],"at":f(g['big'][1])},
                   "after":[{"t":w,"at":f(i)} for w,i in g.get('after',[])]})
    cuts=[{"src":f"img/{s}.jpg","at":(int(i[2:]) if isinstance(i,str) else f(i))} for s,i in sc['cuts']]
    if cuts: cuts[0]["at"]=0  # pas d'image noire au début d'une scène
    scenes.append({"dur":D,"groups":gs,"cuts":cuts}); continue
    scenes.append({"dur":D,"groups":gs,"cuts":[{"src":f"img/{s}.jpg","at":(int(i[2:]) if isinstance(i,str) else f(i))} for s,i in sc['cuts']]})
os.makedirs(os.path.dirname(os.path.abspath(__file__))+'/src',exist_ok=True)
json.dump(scenes,open(os.path.dirname(os.path.abspath(__file__))+'/src/data.json','w'),ensure_ascii=False,indent=1)
print('scènes',[s['dur'] for s in scenes],'frames',sum(s['dur'] for s in scenes))
