import json, sys, base64
from PIL import Image, ImageDraw
items = json.load(open(sys.argv[1])); out = sys.argv[2]; scale = int(sys.argv[3]) if len(sys.argv) > 3 else 3
bg = (0x9a, 0xa8, 0x8a)
cols = 10; cw = 90; ch = 110
rows = (len(items) + cols - 1) // cols
S = Image.new('RGB', (cols * cw * scale // 2, rows * ch * scale // 2), bg)
d = ImageDraw.Draw(S)
for i, it in enumerate(items):
    x = (i % cols) * cw * scale // 2; y = (i // cols) * ch * scale // 2
    if 'err' in it: d.text((x + 4, y + 4), it['k'] + ' ERR', fill=(255, 0, 0)); continue
    im = Image.frombytes('RGBA', (it['w'], it['h']), base64.b64decode(it['data']))
    k = max(1, min(scale, int((cw * scale // 2 - 8) / max(1, it['w'])), int((ch * scale // 2 - 20) / max(1, it['h']))))
    im = im.resize((it['w'] * k, it['h'] * k), Image.NEAREST)
    S.paste(im, (x + 4, y + ch * scale // 2 - 14 - im.height), im)
    d.text((x + 4, y + ch * scale // 2 - 12), it['k'][2:], fill=(20, 20, 20))
S.save(out)
