"""The kintsugi kanji of the start page (src/arc/three/kintsugi.ts).

Takes 技 from the app's own font (Shippori Mincho B1, weight 800, the kanji
subset in src/arc/fonts), breaks it along a crack from the top right to the
bottom left with three hairline branches, and writes the outline of the
lacquer (the glyph minus the cracks) and of the gold in the cracks as
polygon rings to src/arc/three/kintsugi.json, in em units (y up).

Run: python tools/props/kanji.py  (needs fonttools, brotli, shapely)
"""

import json
from pathlib import Path

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "src/arc/fonts/shippori-mincho-b1-800-kanji.woff2"
OUT = ROOT / "src/arc/three/kintsugi.json"
GLYPH = "技"
STEPS = 10


class Flatten(BasePen):
    """Contours as lists of points, curves cut into straight steps."""

    def __init__(self, glyphs):
        super().__init__(glyphs)
        self.rings, self.cur = [], []

    def _moveTo(self, p):
        self.cur = [p]

    def _lineTo(self, p):
        self.cur.append(p)

    def _qCurveToOne(self, c, p):
        a = self.cur[-1]
        for i in range(1, STEPS + 1):
            t = i / STEPS
            self.cur.append(((1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * p[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * p[1]))

    def _curveToOne(self, c1, c2, p):
        a = self.cur[-1]
        for i in range(1, STEPS + 1):
            t = i / STEPS
            u = 1 - t
            self.cur.append((u**3 * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t**3 * p[0], u**3 * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t**3 * p[1]))

    def _closePath(self):
        if len(self.cur) > 2:
            self.rings.append(self.cur)
        self.cur = []

    _endPath = _closePath


def seam(points):
    """The crack of the drawn cover (a 400 × 600 box) laid over the glyph."""
    return [(507 + (x - 220) * 2.25, 900 - y / 600 * 1020) for x, y in points]


MAIN = seam([(252, 0), (244, 58), (262, 104), (236, 162), (258, 214), (221, 266), (247, 318), (208, 372), (231, 430), (196, 488), (214, 546), (189, 600)])
TWIGS = [
    seam([(236, 162), (206, 186), (214, 214), (188, 236)]),
    seam([(221, 266), (262, 290), (286, 282), (305, 306)]),
    seam([(231, 430), (266, 452), (262, 478)]),
]


def rings(geom):
    polys = geom.geoms if isinstance(geom, MultiPolygon) else [geom]
    out = []
    for p in polys:
        if p.is_empty or p.area < 30:
            continue
        p = p.simplify(0.6)
        out.append([[[round(x / 1000, 4), round(y / 1000, 4)] for x, y in list(r.coords)[:-1]] for r in [p.exterior, *p.interiors]])
    return out


def main():
    font = TTFont(FONT)
    gs = font.getGlyphSet()
    pen = Flatten(gs)
    gs[font.getBestCmap()[ord(GLYPH)]].draw(pen)
    glyph = Polygon()
    for r in pen.rings:
        glyph = glyph.symmetric_difference(Polygon(r).buffer(0))
    crack = unary_union([LineString(MAIN).buffer(12, join_style=2), *[LineString(t).buffer(5, join_style=2) for t in TWIGS]])
    body = glyph.difference(crack)
    gold = glyph.intersection(crack)
    minx, miny, maxx, maxy = glyph.bounds
    data = {"glyph": GLYPH, "bounds": [round(v / 1000, 4) for v in (minx, miny, maxx, maxy)], "body": rings(body), "gold": rings(gold)}
    OUT.write_text(json.dumps(data, separators=(",", ":")))
    print(f"{OUT.name}: {len(data['body'])} lacquer pieces, {len(data['gold'])} gold, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
