"""Hair: a cap or shell that follows the skull up to a hairline, plus locks,
buns, braids and curls. Each style is one object named hair_NN, in the order
of HAIR_STYLES in avatarOptions.ts; Glatze (07) has none."""

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from geo import apply_transform, ellipsoid, link, sweep
from head import HC, head_normal, head_on, sphere_mesh

V = Vector
D = math.radians
DOWN = V((0, 0, -1))


def smooth01(a, b, x):
    k = max(0.0, min(1.0, (x - a) / (b - a)))
    return k * k * (3 - 2 * k)


def hairline(front=55, side=96, back=122):
    """Hairline as polar angle per azimuth (degrees in, radians out)."""

    def T(phi):
        c = math.cos(phi)
        base = front + (back - front) * (1 - c) / 2
        side_bump = (side - (front + back) / 2) * math.sin(phi) ** 2
        return D(base + side_bump)

    return T


def cap(name, mat, T, thick=0.05, top=0.03, nu=72, nv=26, edge=0.14, back=0.0):
    """Hair cap from the crown down to the hairline T(phi), thick on top and
    thinning to the scalp at the edge so it never shows an inside."""

    def fn(phi, v):
        t = T(phi) * v
        fall = 1.0 - smooth01(1.0 - edge, 1.0, v)
        b = back * max(0.0, -math.cos(phi)) * math.sin(math.pi * v)
        off = (0.006 + thick * (1 - v * v) + top * (1 - v) ** 2 + b) * math.sqrt(max(0.0, fall)) + 0.004
        return head_on(phi, t, off)

    return sphere_mesh(name, lambda phi, t: fn(phi, t / math.pi), nu=nu, nv=nv, t0=0.0, t1=math.pi, mat=mat, bottom_pole=False)


def hang_pt(phi, t, off, hang):
    """On the head down to the polar angle hang, below it the hair falls
    straight instead of following the jaw inward."""
    if t <= hang:
        return head_on(phi, t, off)
    return head_on(phi, hang, off) + DOWN * ((t - hang) * 0.42)


def shell(name, mat, T, thick=0.045, top=0.02, hang=D(100), nu=96, nv=40, inner=0.004):
    """A closed shell of hair with a blunt edge: outside over the crown down to
    T(phi), a rounded rim, and back up inside. For bobs, fringes and
    slicked-back hair. Below the polar angle hang the hair falls straight."""
    rim = 0.06

    def fn(phi, v):
        if v <= 0.5 - rim / 2:
            k = v / (0.5 - rim / 2)
            return hang_pt(phi, T(phi) * k, inner + thick + top * (1 - k) ** 2, hang)
        if v >= 0.5 + rim / 2:
            k = (1 - v) / (0.5 - rim / 2)
            return hang_pt(phi, T(phi) * k, inner, hang)
        a = (v - (0.5 - rim / 2)) / rim * math.pi
        o = hang_pt(phi, T(phi), inner + thick, hang)
        i = hang_pt(phi, T(phi), inner, hang)
        return (o + i) / 2 + (o - i) / 2 * math.cos(a) + DOWN * (math.sin(a) * (thick / 2 + 0.004))

    return sphere_mesh(name, lambda phi, t: fn(phi, t / math.pi), nu=nu, nv=nv, t0=0.0, t1=math.pi, mat=mat, bottom_pole=True)


def strand(phi, t, dphi, dt, lift=(0.03, 0.08), width=0.12, thick=0.05, n=14, out=0.0, drop=0.0, curl=0.0, hump=0.0, taper=1.0, tip=0.004, fall=0.0, fall_out=0.0):
    """A tapered, flattened lock of hair. It starts on the head at (phi, t),
    travels over the skull by (dphi, dt) radians while lifting off it (t may
    run through the crown to the other side), may leave the surface (out,
    drop, curl) and then fall straight down by fall."""
    pts, rad = [], []
    for i in range(n + 1):
        k = i / n
        tt = t + dt * k
        p = head_on(phi + dphi * k, tt, lift[0] + (lift[1] - lift[0]) * k ** 1.5 + hump * math.sin(math.pi * k))
        nrm = head_normal(phi + dphi * k, tt)
        p = p + nrm * (out * k ** 2) + V((0, 0, -drop * k ** 2 + curl * k ** 4))
        pts.append(p)
    if fall:
        last = pts[-1]
        away = V((last.x - HC.x, last.y - HC.y, 0))
        away = away.normalized() if away.length > 1e-6 else V((0, 1, 0))
        m = max(3, int(n * 0.8))
        for j in range(1, m + 1):
            k = j / m
            pts.append(last + DOWN * (fall * k) + away * (fall_out * math.sin(math.pi * k * 0.8)))
    total = len(pts) - 1
    for i in range(total + 1):
        f = 1 - taper * (i / total) ** 1.3
        rad.append((max(tip * 0.6, thick * f), max(tip, width * f)))
    return pts, rad, head_normal(phi, t)


def locks(name, mat, specs, p=2.3):
    objs = []
    for i, sp in enumerate(specs):
        pts, rad, nrm = strand(**sp)
        objs.append(sweep(f"{name}_{i}", pts, rad, n=14, p=p, up=tuple(nrm), mat=mat, round_caps=(True, False)))
    return objs


def blob(name, c, r, n=18, tilt=0.0):
    ob = ellipsoid(name, (0, 0, 0), r, n=n, rings=12)
    if tilt:
        ob.data.transform(Matrix.Rotation(tilt, 4, "Y"))
    ob.data.transform(Matrix.Translation(c))
    return ob


def tip_uv(ob, r0=0.36, r1=0.62):
    """UV v runs from the root (1) to the tip (0) of the hair by distance from
    the head centre, so the app can colour the tips (hairTexture)."""
    me = ob.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    layer = me.uv_layers.active.data
    for poly in me.polygons:
        for li in poly.loop_indices:
            d = (me.vertices[me.loops[li].vertex_index].co - HC).length
            layer[li].uv = (0.5, 1.0 - smooth01(r0, r1, d))


def merge(name, objs, mat, uv=True):
    bm = bmesh.new()
    for o in objs:
        bm.from_mesh(o.data)
        bpy.data.objects.remove(o)
    ob = link(name, bm, mat)
    if uv:
        tip_uv(ob)
    return ob


def fringe(n=5, spread=44, t0=12, length=62, width=0.13, sweep_=0.0, out=0.04, lift=(0.06, 0.03)):
    specs = []
    for i in range(n):
        f = (i / (n - 1)) * 2 - 1 if n > 1 else 0
        specs.append(dict(phi=D(f * spread), t=D(t0), dphi=f * 0.3 + sweep_, dt=D(length - abs(f) * 8), lift=lift, width=width - abs(f) * 0.01, thick=0.05, out=out))
    return specs


NEAT = hairline(front=50, side=94, back=120)


def wrap_deg(phi):
    return abs(math.degrees(math.atan2(math.sin(phi), math.cos(phi))))


# ── Styles ────────────────────────────────────────────────────────────────


def s00_short(m):
    """Kurz: a close cap with a textured crown and a short fringe."""
    parts = [cap("c", m, NEAT, thick=0.035, top=0.025)]
    specs = [dict(phi=D(az), t=D(8), dphi=0.0, dt=D(62), lift=(0.04, 0.03), width=0.15, thick=0.04, out=0.02) for az in range(-150, 181, 36)]
    specs += fringe(n=5, spread=40, length=48, width=0.12, out=0.02, lift=(0.045, 0.02))
    return parts + locks("l", m, specs)


def s01_spiky(m):
    """Stachelig: thick locks swept up and back into points, a fringe of
    points over the brow."""
    T = hairline(front=48, side=92, back=120)
    parts = [cap("c", m, T, thick=0.055, top=0.04, back=0.02)]
    specs = []
    for az in range(-165, 181, 30):
        phi = D(az)
        back = max(0.0, -math.cos(phi))
        specs.append(dict(phi=phi, t=D(14), dphi=0.0, dt=D(62 + 18 * back), lift=(0.05, 0.1), width=0.15, thick=0.06, out=0.16 + 0.05 * back, curl=0.05))
    for az in range(-150, 151, 30):
        if abs(az) >= 50:
            specs.append(dict(phi=D(az), t=D(50), dphi=0.0, dt=D(48), lift=(0.03, 0.06), width=0.13, thick=0.05, out=0.1, drop=0.02))
    specs += fringe()
    return parts + locks("l", m, specs)


def s02_undercut(m):
    """Undercut: buzzed sides, a long top swept over and back."""
    parts = [cap("c", m, NEAT, thick=0.008, top=0.0, edge=0.3)]
    top = hairline(front=46, side=58, back=78)
    parts.append(cap("t", m, top, thick=0.07, top=0.04, edge=0.35))
    # Locks combed back over the top, the front ones lifting into a quiff.
    specs = [dict(phi=D(az), t=D(44), dphi=D(az) * -0.15, dt=D(-100), lift=(0.085, 0.06), hump=0.04, width=0.14, thick=0.05, taper=0.9) for az in range(-36, 37, 12)]
    specs += [dict(phi=D(az), t=D(50), dphi=0.0, dt=D(-34), lift=(0.09, 0.17), width=0.14, thick=0.05, out=0.03, taper=1.0) for az in (-22, 0, 22)]
    return parts + locks("l", m, specs)


def grooves(T, n=9, lift=0.03, thick=0.02, width=0.09, back=D(-70)):
    """Combed lines: locks from the back of the head forward, thinning out
    just behind the hairline so the front edge stays clean."""
    specs = []
    for i in range(n):
        az = D(-60 + 120 * i / (n - 1))
        # A negative polar angle lies on the far side of the crown.
        specs.append(dict(phi=az, t=back, dphi=0.0, dt=T(az) - D(8) - back, lift=(lift, lift), width=width, thick=thick, taper=1.0, n=18))
    return specs


def sleek(m, T=NEAT, n=9):
    parts = [cap("c", m, T, thick=0.028, top=0.012)]
    return parts + (locks("g", m, grooves(T, n)) if n else [])


def s03_bun(m):
    """Dutt: combed back into a round bun on the crown."""
    parts = sleek(m)
    c = head_on(math.pi, D(30), 0.1)
    parts.append(blob("b", c, (0.12, 0.11, 0.1)))
    for i in range(6):
        a = i * math.tau / 6
        parts.append(blob(f"bb{i}", c + V((math.cos(a) * 0.06, math.sin(a) * 0.06, 0.02)), (0.07, 0.07, 0.06)))
    return parts


def s04_ponytail(m):
    """Pferdeschwanz: combed back, tied at the back of the head, the tail
    falling down between the shoulders."""
    parts = sleek(m)
    tie = head_on(math.pi, D(72), 0.03)
    back = head_normal(math.pi, D(72))
    path = [tie, tie + back * 0.09 + V((0, 0, 0.02)), tie + back * 0.16 + V((0, 0, -0.1)), tie + back * 0.16 + V((0, 0, -0.26)), tie + back * 0.12 + V((0, 0, -0.42)), tie + back * 0.1 + V((0, 0, -0.52))]
    parts.append(sweep("tail", path, [(0.05, 0.06), (0.08, 0.09), (0.085, 0.1), (0.07, 0.085), (0.045, 0.06), (0.004, 0.01)], n=16, up=(1, 0, 0)))
    band = sweep("tie", [tie + back * 0.02, tie + back * 0.06], (0.058, 0.058), n=16, round_caps=(False, False))
    return parts, [band]


def s05_long(m):
    """Lang: a side fringe and long locks down the back past the shoulders."""
    parts = [cap("c", m, NEAT, thick=0.04, top=0.03)]
    specs = []
    for az in range(95, 266, 17):
        phi = D(az)
        specs.append(dict(phi=phi, t=D(20), dphi=0.0, dt=D(118), lift=(0.045, 0.05), width=0.16, thick=0.045, taper=0.85, fall=0.38 + 0.05 * math.cos(3 * phi), fall_out=0.04, n=12))
    for az in (-78, 78):
        specs.append(dict(phi=D(az), t=D(25), dphi=D(12) * (1 if az > 0 else -1), dt=D(95), lift=(0.045, 0.05), width=0.14, thick=0.045, taper=0.85, fall=0.22, fall_out=0.06, n=12))
    specs += fringe(n=4, spread=36, length=58, sweep_=0.25, out=0.03)
    return parts + locks("l", m, specs)


def s06_curls(m):
    """Locken: a crown of round curls."""
    T = hairline(front=48, side=94, back=122)
    parts = [cap("c", m, T, thick=0.035, top=0.02)]
    rnd = random.Random(6)
    n = 70
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        z = 1 - (i + 0.5) / n
        phi = (i * ga) % math.tau - math.pi
        t = math.acos(z)
        if t > T(phi) * 0.96:
            continue
        r = 0.052 + rnd.random() * 0.02
        parts.append(blob(f"k{i}", head_on(phi, t, 0.05), (r, r, r * 0.9), n=12))
    for az in range(-50, 51, 20):
        parts.append(blob(f"f{az}", head_on(D(az), D(50), 0.035), (0.05, 0.045, 0.05), n=12))
    return parts


def s08_buzz(m):
    """Buzzcut: only a shadow of hair."""
    return [cap("c", m, NEAT, thick=0.004, top=0.0, edge=0.25)]


def s09_sidepart(m):
    """Seitenscheitel: parted on the left, combed over to the right."""
    parts = [cap("c", m, NEAT, thick=0.04, top=0.03)]
    # From the parting over to the right, the front lock sweeping across the brow.
    specs = [dict(phi=D(-40), t=D(12 + i * 8), dphi=D(100 - i * 6), dt=D(8 + i * 3), lift=(0.05, 0.04), hump=0.03, width=0.13, thick=0.045, taper=0.85) for i in range(6)]
    specs.append(dict(phi=D(-42), t=D(52), dphi=D(78), dt=D(16), lift=(0.055, 0.045), hump=0.03, width=0.14, thick=0.05, out=0.02, taper=0.95))
    specs += [dict(phi=D(-40), t=D(16 + i * 12), dphi=D(-48), dt=D(22), lift=(0.045, 0.035), width=0.12, thick=0.04, taper=0.85) for i in range(4)]
    return parts + locks("l", m, specs)


def s10_bangs(m):
    """Pony: a straight blunt fringe to the brows, the sides to the ears."""

    def T(phi):
        a = wrap_deg(phi)
        if a < 62:
            return D(74)
        if a < 90:
            return D(74 + (a - 62) / 28 * 46)
        return D(120 + (a - 90) / 90 * 10)

    return [shell("s", m, T, thick=0.045, top=0.03, hang=D(100))]


def s11_mohawk(m):
    """Irokese: buzzed sides, a crest of points along the middle."""
    parts = [cap("c", m, NEAT, thick=0.006, top=0.0, edge=0.25)]
    specs = [dict(phi=0.0, t=D(t), dphi=0.0, dt=D(-8), lift=(0.02, 0.05), width=0.06, thick=0.12, out=0.26 + 0.03 * math.sin(i), taper=0.85, n=10) for i, t in enumerate(range(40, -121, -20))]
    return parts + locks("l", m, specs, p=2.2)


def s12_cornrows(m):
    """Cornrows: rows front to back, four braids with gold beads at the back."""
    parts = [cap("c", m, NEAT, thick=0.01, top=0.0, edge=0.2)]
    specs = [dict(phi=D(az), t=D(52 + abs(az) * 0.5), dphi=0.0, dt=D(-150 + abs(az) * 0.6), lift=(0.016, 0.016), width=0.024, thick=0.017, taper=0.2, n=22) for az in range(-60, 61, 20)]
    parts += locks("r", m, specs, p=2.0)
    beads = []
    for i, az in enumerate((-150, -168, 168, 150)):
        start = head_on(D(az), D(118), 0.02)
        pts = [start + V((0, 0.02 * i / 3, -0.06 * k)) for k in range(6)]
        parts.append(sweep(f"br{i}", pts, 0.022, n=10))
        beads.append(blob(f"bead{i}", pts[-1] + V((0, 0, -0.02)), (0.026, 0.026, 0.03), n=12))
    return parts, beads


def s13_afro(m):
    """Afro: a big round cloud of hair."""
    T = hairline(front=54, side=100, back=126)
    parts = [cap("c", m, T, thick=0.1, top=0.03, edge=0.3)]
    rnd = random.Random(13)
    n = 150
    ga = math.pi * (3 - math.sqrt(5))
    for i in range(n):
        z = 1 - (i + 0.5) / n
        phi = (i * ga) % math.tau - math.pi
        t = math.acos(z)
        v = t / T(phi)
        if v > 0.97:
            continue
        off = 0.03 + 0.1 * math.sqrt(max(0.0, 1 - smooth01(0.6, 1.0, v)))
        r = (0.06 + rnd.random() * 0.025) * (1 - 0.4 * smooth01(0.7, 1.0, v))
        parts.append(blob(f"k{i}", head_on(phi, t, off), (r, r, r * 0.92), n=12))
    return parts


def s14_messy(m):
    """Wuschelkopf: short locks sticking out every which way."""
    parts = [cap("c", m, NEAT, thick=0.05, top=0.03)]
    rnd = random.Random(14)
    specs = []
    for _ in range(26):
        phi = rnd.uniform(-math.pi, math.pi)
        t = rnd.uniform(5, 85) * (1.0 if abs(phi) > 1.0 else 0.8)
        specs.append(dict(phi=phi, t=D(t), dphi=rnd.uniform(-0.5, 0.5), dt=D(rnd.uniform(20, 40)), lift=(0.05, 0.07), width=0.1, thick=0.045, out=rnd.uniform(0.04, 0.12), curl=rnd.uniform(0, 0.08)))
    specs += fringe(n=5, spread=42, length=56, out=0.06)
    return parts + locks("l", m, specs)


def s15_topknot(m):
    """Samurai-Knoten: combed up into a folded knot on the crown."""
    parts = sleek(m, hairline(front=46, side=94, back=122))
    base = head_on(math.pi, D(12), 0.04)
    parts.append(blob("k", base + V((0, 0, 0.03)), (0.05, 0.05, 0.05)))
    fold = [base + V((0, 0, 0.06)), base + V((0, -0.08, 0.09)), base + V((0, -0.17, 0.08)), base + V((0, -0.21, 0.05))]
    parts.append(sweep("f", fold, [0.034, 0.036, 0.034, 0.03], n=14))
    tie = sweep("tie", [base + V((0, 0.0, 0.03)), base + V((0, -0.03, 0.08))], (0.04, 0.04), n=14, round_caps=(False, False))
    return parts, [tie]


def s16_bob(m):
    """Bob: rounded, to the jaw, with a fringe."""

    def T(phi):
        a = wrap_deg(phi)
        if a < 58:
            return D(76 + a * 0.08)
        if a < 80:
            return D(80 + (a - 58) / 22 * 62)
        return D(142 + (a - 80) / 100 * 6)

    return [shell("s", m, T, thick=0.05, top=0.035, hang=D(98))]


def s17_dreads(m):
    """Dreadlocks: thick ropes to the shoulders."""
    parts = [cap("c", m, NEAT, thick=0.03, top=0.02)]
    rnd = random.Random(17)
    specs = []
    for az in range(-180, 180, 18):
        a = abs(az)
        if a >= 55:
            specs.append(dict(phi=D(az), t=D(30), dphi=0.0, dt=D(78 + (a - 55) * 0.3), lift=(0.03, 0.04), width=0.03, thick=0.03, taper=0.25, fall=0.28 + rnd.uniform(-0.04, 0.05), fall_out=0.03, n=10))
    for az in (-40, -20, 0, 20, 40):
        specs.append(dict(phi=D(az), t=D(15), dphi=D(az) * 0.012, dt=D(38), lift=(0.04, 0.04), width=0.03, thick=0.03, taper=0.2, out=0.03, n=10))
    return parts + locks("d", m, specs, p=2.0)


def s18_slick(m):
    """Zurückgegelt: combed straight back, close to the head."""
    T = hairline(front=44, side=92, back=118)
    parts = [shell("s", m, T, thick=0.035, top=0.03, hang=D(125))]
    return parts + locks("g", m, grooves(T, 7, lift=0.05, thick=0.018, width=0.08))


def s19_twobuns(m):
    """Zwei Dutts: two buns on top."""
    parts = sleek(m, n=0)
    for s in (-1, 1):
        parts.append(blob(f"b{s}", head_on(D(62 * s), D(38), 0.08), (0.095, 0.09, 0.085)))
    return parts


def s20_braid(m):
    """Langer Zopf: combed back into one long braid down the back."""
    parts = sleek(m)
    start = head_on(math.pi, D(100), 0.03)
    for i in range(9):
        c = start + V((0, 0.05 + 0.012 * i, -0.06 - i * 0.062))
        s = 1.0 - i * 0.04
        parts.append(blob(f"z{i}", c, (0.055 * s, 0.04 * s, 0.045 * s), n=14, tilt=math.radians(28 if i % 2 else -28)))
    end = start + V((0, 0.16, -0.62))
    tie = sweep("tie", [end + V((0, 0, 0.03)), end], (0.036, 0.036), n=14, round_caps=(False, False))
    parts.append(sweep("tuft", [end, end + V((0, 0.01, -0.05)), end + V((0, 0.02, -0.09))], [0.035, 0.03, 0.004], n=12))
    return parts, [tie]


def s21_middle(m):
    """Mittelscheitel: parted in the middle, curtains to the chin."""

    def T(phi):
        a = wrap_deg(phi)
        if a < 24:
            return D(50 + a * 1.1)
        if a < 62:
            return D(76 + (a - 24) * 0.12)
        if a < 82:
            return D(81 + (a - 62) / 20 * 64)
        return D(145)

    parts = [shell("s", m, T, thick=0.04, top=0.03, hang=D(100))]
    specs = [dict(phi=D(6 * s), t=D(8 + i * 12), dphi=D(60) * s, dt=D(50), lift=(0.05, 0.06), width=0.08, thick=0.02, taper=0.7) for s in (-1, 1) for i in range(3)]
    return parts + locks("g", m, specs)


STYLES = [
    s00_short,
    s01_spiky,
    s02_undercut,
    s03_bun,
    s04_ponytail,
    s05_long,
    s06_curls,
    None,
    s08_buzz,
    s09_sidepart,
    s10_bangs,
    s11_mohawk,
    s12_cornrows,
    s13_afro,
    s14_messy,
    s15_topknot,
    s16_bob,
    s17_dreads,
    s18_slick,
    s19_twobuns,
    s20_braid,
    s21_middle,
]


def build_all(mats, only=None):
    """hair_NN objects, plus hair_NN_x accessories (ties, beads) in their own material."""
    out = {}
    for i, fn in enumerate(STYLES):
        if fn is None or (only is not None and i not in only):
            continue
        name = f"hair_{i:02d}"
        res = fn(mats["hair"])
        parts, extra = res if isinstance(res, tuple) else (res, [])
        out[name] = merge(name, parts, mats["hair"])
        if extra:
            out[name + "_x"] = merge(name + "_x", extra, mats["bead"] if i == 12 else mats["tie"], uv=False)
    return out
