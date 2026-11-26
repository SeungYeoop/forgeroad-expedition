import json, sys, base64
from PIL import Image
d = json.load(open(sys.argv[1])); out = sys.argv[2]
ims = []
for zid, v in d.items():
    if v.get('err'): print(zid, v['err']); continue
    sky = Image.frombytes('RGBA', (640, 360), base64.b64decode(v['sky']))
    comp = sky.copy()
    for l, off in zip(v['L'], [-180, -200, -220]):
        im = Image.frombytes('RGBA', (640, 600), base64.b64decode(l))
        comp.alpha_composite(im, (0, off))
    ims.append(comp.convert('RGB'))
cols = 2; W = 640; H = 360
S = Image.new('RGB', (W * cols, H * ((len(ims) + cols - 1) // cols)))
for i, im in enumerate(ims): S.paste(im, ((i % cols) * W, (i // cols) * H))
S.save(out)
