"""Review sheets from real browser captures; no changes to rendered scene content."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'samkok/artifacts/ui'
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
def grid(items,cols,w,h,file):
 im=Image.new('RGB',(w*cols,(h+36)*((len(items)+cols-1)//cols)),'#142c2c');d=ImageDraw.Draw(im)
 for i,(title,path) in enumerate(items):
  pic=Image.open(path).convert('RGB');pic.thumbnail((w,h));x=i%cols*w;y=i//cols*(h+36);im.paste(pic,(x+(w-pic.width)//2,y+(h-pic.height)//2));d.text((x+12,y+h+5),title,font=font,fill='#ffe8ad')
 im.save(file,quality=92)
grid([(name,OUT/f'{name}-mobile.png') for name in ['city','battle','viewer']],3,390,844,OUT/'showcase.jpg')
grid([('Before',OUT/'battle-before.png'),('After',OUT/'battle-mobile.png')],2,390,844,OUT/'before-after.jpg')
