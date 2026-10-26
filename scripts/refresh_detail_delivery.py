"""Package measured native checks and unaltered render/screenshot contact sheets."""
from pathlib import Path
import json,hashlib
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',22)
def labelled_grid(items,cols,tile,out):
 w,h=tile;rows=(len(items)+cols-1)//cols;canvas=Image.new('RGB',(w*cols,(h+38)*rows),'#111c24');draw=ImageDraw.Draw(canvas)
 for i,(label,path) in enumerate(items):
  im=Image.open(path).convert('RGB');im.thumbnail((w,h));x=(i%cols)*w;y=(i//cols)*(h+38);canvas.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2));draw.text((x+12,y+h+5),label,font=font,fill='white')
 canvas.save(out,quality=91)
records=[json.loads((ROOT/'docs'/f'{i:02d}.json').read_text()) for i in range(1,70)]
assert all(r.get('graphics_revision')==4 for r in records[:68])
manifest=json.loads((ROOT/'docs/manifest.json').read_text());manifest.update(graphics_revision=4,assets=records,detailed_character_meshes=204,likeness='NOT_APPROVED');(ROOT/'docs/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
checks=json.loads((ROOT/'docs/validation.json').read_text());assert len(checks)==69 and not any('FAIL' in c['checks'].values() for c in checks)
summary=json.loads((ROOT/'docs/validation-summary.json').read_text());summary.update(graphics_revision=4,character_action_tests=sum(len(c['animations']) for r in checks for c in r['characters']),technical_result='PASS',likeness='NOT_APPROVED');(ROOT/'docs/validation-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(ROOT/'docs/SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+str(p.relative_to(ROOT))+'\n' for p in sorted((ROOT/'assets').glob('*.blend'))))
labelled_grid([(f'{i:02d}',ROOT/'previews'/f'{i:02d}.png') for i in range(1,70)],6,(240,160),ROOT/'previews/catalog.jpg')
labelled_grid([('Before',ROOT/'previews/details/67-before.png'),('After',ROOT/'previews/details/67-three-quarter.png')],2,(600,750),ROOT/'previews/detail-before-after.jpg')
labelled_grid([(id,ROOT/'samkok/artifacts'/f'hero-{id}-v4.png') for id in ['liubei_y','guanyu','zhangfei','zhaoyun','zhuge','guanyinping']],3,(420,296),ROOT/'samkok/artifacts/main-generals-v4.jpg')
print('DELIVERY_SUMMARY',summary)
