import json, sys, base64
from PIL import Image, ImageDraw
d = json.load(open(sys.argv[1])); out = sys.argv[2]; sc = int(sys.argv[3]) if len(sys.argv) > 3 else 3
rows = []
for r in d:
    if r.get('err'): continue
    fw, fh = r['fw'], r['fh']
    row = Image.new('RGB', (len(r['frames']) * (fw * sc + 6) + 150, fh * sc + 6), (0x9a, 0xa8, 0x8a))
    dr = ImageDraw.Draw(row); dr.text((4, 4), r['id'], fill=(0, 0, 0))
    for i, f in enumerate(r['frames']):
        im = Image.frombytes('RGBA', (fw, fh), base64.b64decode(f)).resize((fw * sc, fh * sc), Image.NEAREST)
        row.paste(im, (150 + i * (fw * sc + 6), 3), im)
    rows.append(row)
W = max(r.width for r in rows); H = sum(r.height for r in rows)
S = Image.new('RGB', (W, H), (40, 40, 40)); y = 0
for r in rows: S.paste(r, (0, y)); y += r.height
S.save(out)
