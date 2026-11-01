#!/usr/bin/env python3
# Agrandit des photos paysage pour un plein cadre 9:16 (hauteur 2150 px, lanczos + netteté + grain léger).
# usage: python3 prep_photos.py <dossier_candidates> 01 06 08 ...   -> public/img/upXX.jpg
import sys,os; from PIL import Image, ImageFilter; import numpy as np
src=sys.argv[1]; out=os.path.dirname(os.path.abspath(__file__))+'/public/img'; os.makedirs(out,exist_ok=True)
for n in sys.argv[2:]:
    im=Image.open(f'{src}/{n}.jpg').convert('RGB'); w,h=im.size; H=2150; W=int(w*H/h)
    im=im.resize((W,H),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2,percent=90,threshold=2))
    a=np.array(im).astype('float32'); a+=np.random.normal(0,3.0,a.shape)
    Image.fromarray(np.clip(a,0,255).astype('uint8')).save(f'{out}/up{n}.jpg',quality=92); print('up'+n)
