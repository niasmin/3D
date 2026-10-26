"""Arrange unaltered WebGL/game captures into review sheets (requires Pillow)."""
from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'samkok/artifacts'
PROFILES=json.loads((ROOT/'samkok/three/src/skill-profiles.json').read_text())
FONT=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
def grid(items,cols,w,h,out):
 canvas=Image.new('RGB',(cols*w,((len(items)+cols-1)//cols)*(h+30)),'#142832');draw=ImageDraw.Draw(canvas)
 for i,(label,file) in enumerate(items):
  im=Image.open(file).convert('RGB');im.thumbnail((w,h));x=i%cols*w;y=i//cols*(h+30)
  canvas.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2));draw.text((x+8,y+h+4),label,font=FONT,fill='#ffe6ac')
 canvas.save(out,quality=92)
grid([(id,OUT/'skills'/f'{id}.png') for id in PROFILES],5,256,192,OUT/'skills-catalog.jpg')
grid([(id,OUT/'skills'/f'game-{id}.png') for id in ['guanyu','simayi','zhouyu','zhangjiao','huatuo','yueying','caiwenji','caoren','boss']],3,360,304,OUT/'skills-showcase.jpg')
