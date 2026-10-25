# Build four key-pose frames (ready, wind-up, strike, recover) from a single portrait by bending the body smoothly
# from the feet (fixed) to the head (most movement). Mesh warp, so there is no seam at the waist.
import sys, glob, os
from PIL import Image
H, OUT = sys.argv[1], sys.argv[2]
SKIP = set(sys.argv[3].split(','))
S = 512
def canvas(id):
    im = Image.open(f'{H}/{id}_full.png').convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox(); im = im.crop(bb)
    h = int(S * 0.76); w = int(im.width * h / im.height)
    if w > S * 0.9: w = int(S * 0.9); h = int(im.height * w / im.width)
    im = im.resize((w, h), Image.LANCZOS)
    c = Image.new('RGBA', (S, S)); c.paste(im, ((S - w) // 2, S - h - 2)); return c
def bend(im, lean, shift, squash, bands=48):
    # output row y takes source row ys; horizontal offset grows with height above the feet
    W, Hh = im.size; foot = Hh - 2; mesh = []
    def src(x, y):
        t = max(0.0, (foot - y) / foot) ** 1.4
        ys = foot - (foot - y) / squash
        return (x - lean * W * t - shift * W, ys)
    for b in range(bands):
        y0 = int(Hh * b / bands); y1 = int(Hh * (b + 1) / bands)
        ul = src(0, y0); ll = src(0, y1); lr = src(W, y1); ur = src(W, y0)
        mesh.append(((0, y0, W, y1), (*ul, *ll, *lr, *ur)))
    return im.transform((W, Hh), Image.MESH, mesh, resample=Image.BICUBIC)
done = 0
for f in sorted(glob.glob(f'{H}/*_full.png')):
    id = os.path.basename(f)[:-9]
    if id in SKIP: continue
    base = canvas(id)
    frames = [base, bend(base, -0.09, -0.02, 0.95), bend(base, 0.15, 0.05, 1.03), bend(base, 0.035, 0.01, 0.99)]
    for k, fr in enumerate(frames):
        fr.resize((360, 360), Image.LANCZOS).save(f'{OUT}/{id}_{k}.webp', quality=84, method=4)
    done += 1
print('heroes', done)
