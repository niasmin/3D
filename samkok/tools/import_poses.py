#!/usr/bin/env python3
"""Turn 2x2 pose atlases (<id>_poses.png: ready, wind-up, action, recover) into battle frames.

Usage: python3 -I tools/import_poses.py <folder with *_poses.png> <output ui/pose folder>
All four frames share one scale and are bottom-aligned on a square canvas so the feet stay put.
"""
import glob, os, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
S, PX = 768, 300
for f in sorted(glob.glob(os.path.join(src, '*_poses.png'))):
    hid = os.path.basename(f)[:-len('_poses.png')]
    atlas = Image.open(f).convert('RGBA'); w, h = atlas.width // 2, atlas.height // 2
    cells = [atlas.crop((c * w, r * h, (c + 1) * w, (r + 1) * h)) for r in range(2) for c in range(2)]
    cuts = []
    for c in cells:
        bb = c.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
        cuts.append(c.crop(bb) if bb else c)
    scale = (S * 0.76) / max(c.height for c in cuts)
    for k, c in enumerate(cuts):
        c = c.resize((max(1, int(c.width * scale)), max(1, int(c.height * scale))), Image.LANCZOS)
        if c.width > S: c = c.resize((S, int(c.height * S / c.width)), Image.LANCZOS)
        canvas = Image.new('RGBA', (S, S)); canvas.paste(c, ((S - c.width) // 2, S - c.height - 2))
        canvas.resize((PX, PX), Image.LANCZOS).save(os.path.join(out, f'{hid}_{k}.webp'), quality=84, method=4)
    print('imported', hid)
