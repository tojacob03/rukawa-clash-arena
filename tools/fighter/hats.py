"""Headwear: the hachimaki, bandana and ear guards of the item list and the
traditional headwear of the countries (src/arc/core/headwear.ts).

Objects are named hw_<style>, hw_<style>_<part> or hw_<style>@<trim>_<part>
(parts only shown with that trim). Materials: hw1 (colour c), hw2 (c2), hw3
(c3), hwd (c darker), hwband (a texture for headbands, see
src/arc/fighter3d/hats.ts), rib0-rib3 (ribbon stripes), gold. Hats that
cover the crown carry a custom property clip = (height, tilt): the app cuts
the hair above that plane so no lock pokes through."""

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from geo import apply_modifiers, bridge_rings, ellipsoid, link, modifier, subdivide, sweep
from head import HC, HEAD_SCALE, head_on

V = Vector
D = math.radians
N = 48
C_TOP = 0.41 * HEAD_SCALE
AIR = 0.05  # room for the hair under a hat


def phi_of(i, n=N):
    return math.tau * i / n


def head_ring(zr, off=AIR, n=N, tilt=0.0, lift=None):
    """A ring around the head at height zr above its centre (lower at the
    front by tilt), off above the skull."""
    out = []
    for i in range(n):
        phi = phi_of(i, n)
        z = zr - tilt * math.cos(phi) + (lift(phi) if lift else 0.0)
        t = math.acos(max(-0.98, min(0.98, z / C_TOP)))
        out.append(head_on(phi, t, off))
    return out


def oval(z, rx, ry=None, cx=0.0, cy=0.0, n=N):
    ry = rx if ry is None else ry
    return [V((HC.x + cx + rx * math.sin(phi_of(i, n)), HC.y + cy - ry * math.cos(phi_of(i, n)), HC.z + z)) for i in range(n)]


def scaled(ring, s, dz=0.0, dy=0.0, dx=0.0):
    """A ring scaled about the head axis and moved."""
    return [V((HC.x + (p.x - HC.x) * s + dx, HC.y + (p.y - HC.y) * s + dy, p.z + dz)) for p in ring]


def out_dir(p):
    d = V((p.x - HC.x, p.y - HC.y, 0))
    return d.normalized() if d.length > 1e-6 else V((0, -1, 0))


def loft(name, rings, mat, top=True, bottom=False, top_lift=0.0, smooth=True, levels=1):
    bm = bmesh.new()
    vr = [[bm.verts.new(p) for p in r] for r in rings]
    bridge_rings(bm, vr)
    for do, ring, sign in ((top, vr[-1], 1), (bottom, vr[0], -1)):
        if not do:
            continue
        c = sum((v.co for v in ring), V()) / len(ring) + V((0, 0, top_lift * sign))
        cv = bm.verts.new(c)
        m = len(ring)
        for j in range(m):
            bm.faces.new((ring[j], ring[(j + 1) % m], cv) if sign > 0 else (ring[(j + 1) % m], ring[j], cv))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = link(name, bm, mat, smooth=smooth)
    if levels:
        subdivide(ob, levels)
    return ob


def thicken(ob, t=0.018, levels=1):
    modifier(ob, "SOLIDIFY", thickness=t, offset=0)
    apply_modifiers(ob)
    if levels:
        subdivide(ob, levels)
    return ob


def brim(name, mat, base, width, lift=lambda phi, k: 0.0, m=6, thick=0.02):
    """A brim from a ring outward; width and lift may depend on the azimuth."""
    n = len(base)
    rings = []
    for j in range(m + 1):
        k = j / m
        ring = []
        for i, p in enumerate(base):
            phi = phi_of(i, n)
            w = width(phi) if callable(width) else width
            ring.append(p + out_dir(p) * (w * k) + V((0, 0, lift(phi, k))))
        rings.append(ring)
    ob = loft(name, rings, mat, top=False, levels=0)
    return thicken(ob, thick)


def band(name, mat, lower, upper, out=0.012):
    """A thick band between two rings, standing out by out."""
    lo_o = [p + out_dir(p) * out for p in lower]
    up_o = [p + out_dir(p) * out for p in upper]
    lo_i = [p - out_dir(p) * 0.004 for p in lower]
    up_i = [p - out_dir(p) * 0.004 for p in upper]
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in r] for r in (lo_i, lo_o, up_o, up_i)]
    bridge_rings(bm, rings, closed_loop=True)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    ob = link(name, bm, mat)
    subdivide(ob, 1)
    return ob


def band_uv(ob):
    """u around the head (0.5 at the front), v across the band: for hwband."""
    me = ob.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    zs = [v.co.z for v in me.vertices]
    z0, z1 = min(zs), max(zs)
    layer = me.uv_layers.active.data
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            a = math.atan2(co.x - HC.x, -(co.y - HC.y))
            layer[li].uv = (0.5 + a / math.tau, (co.z - z0) / max(1e-6, z1 - z0))


def bumpy(ob, amp=0.012, freq=38.0, seed=1):
    """Curly fur or felt: small bumps along the normals."""
    rnd = random.Random(seed)
    ph = [rnd.uniform(0, 6.28) for _ in range(6)]
    me = ob.data
    me.calc_normals_split() if hasattr(me, "calc_normals_split") else None
    for v in me.vertices:
        p = v.co
        n = v.normal
        h = math.sin(p.x * freq + ph[0]) * math.sin(p.y * freq + ph[1]) * math.sin(p.z * freq + ph[2])
        h += 0.5 * math.sin(p.x * freq * 2.1 + ph[3]) * math.sin(p.z * freq * 1.9 + ph[4])
        v.co = p + n * (amp * h)
    return ob


def pompom(name, mat, c, r):
    ob = ellipsoid(name, c, (r, r, r * 0.95), n=24, rings=16, mat=mat)
    return bumpy(ob, r * 0.12, 90.0, 3)


def merge(name, objs, mat=None):
    bm = bmesh.new()
    for o in objs:
        bm.from_mesh(o.data)
        bpy.data.objects.remove(o)
    ob = link(name, bm, mat or None)
    if mat is None and objs:
        pass
    return ob


def tassel(name, mat, top, length=0.12, r=0.02, n=7, spread=0.018, seed=2):
    rnd = random.Random(seed)
    parts = [ellipsoid(name + "k", top, (r, r, r), n=12, rings=8)]
    for i in range(n):
        a = math.tau * i / n
        d = V((math.cos(a) * spread, math.sin(a) * spread, 0))
        pts = [top + d * 0.3, top + d + V((0, 0, -length * 0.5)), top + d * 1.2 + V((0, 0, -length * rnd.uniform(0.85, 1.0)))]
        parts.append(sweep(f"{name}{i}", pts, [0.006, 0.006, 0.004], n=6))
    ob = merge(name, parts)
    ob.data.materials.append(mat)
    return ob


# ── Hats ──────────────────────────────────────────────────────────────────


class Kit:
    def __init__(self, mats):
        self.m = mats
        self.out = {}

    def add(self, name, ob, clip=None, unless=None):
        ob.name = name
        ob.data.name = name
        if clip is not None:
            ob["clip"] = list(clip)
        if unless:
            # Hidden when the hat's trim brings its own version of this part.
            ob["unless"] = list(unless)
        self.out[name] = ob
        return ob


def hat_band(k, m):
    """Hachimaki: a band round the forehead, knotted at the back, two tails."""
    lo = head_ring(0.1, 0.035, tilt=0.03)
    up = head_ring(0.19, 0.035, tilt=0.03)
    b = band("hw_band", k.m["hwband"], lo, up, out=0.012)
    band_uv(b)
    k.add("hw_band", b)
    back = head_on(math.pi, D(70), 0.06)
    knot = ellipsoid("knot", back, (0.05, 0.035, 0.04), n=14, rings=10)
    tails = []
    for s in (-1, 1):
        pts = [back, back + V((0.04 * s, 0.05, -0.04)), back + V((0.07 * s, 0.07, -0.14)), back + V((0.08 * s, 0.06, -0.22))]
        tails.append(sweep(f"tail{s}", pts, (0.01, 0.034), n=10, p=3, up=(0, 1, 0), round_caps=(False, False)))
    k.add("hw_band_knot", merge("x", [knot] + tails, k.m["hwbandend"]))


def hat_bandana(k, m):
    """Bandana: a cloth tight over the crown, knotted at the back."""
    rings = [head_ring(z, 0.04 + 0.004 * (1 - z / 0.38), tilt=0.02) for z in (0.12, 0.2, 0.27, 0.32, 0.355)]
    ob = loft("hw_bandana", rings, k.m["hw1"], top=True, top_lift=0.004)
    k.add("hw_bandana", ob, clip=(0.12, 0.02))
    back = head_on(math.pi, D(76), 0.07)
    knot = ellipsoid("knot", back, (0.045, 0.04, 0.04), n=14, rings=10)
    tails = []
    for s in (-1, 1):
        pts = [back, back + V((0.05 * s, 0.05, -0.05)), back + V((0.06 * s, 0.07, -0.15))]
        tails.append(sweep(f"t{s}", pts, [(0.012, 0.03), (0.012, 0.05), (0.01, 0.02)], n=10, p=3, up=(0, 1, 0)))
    k.add("hw_bandana_knot", merge("x", [knot] + tails, k.m["hw1"]))
    # White dots on the cloth.
    dots = []
    rnd = random.Random(4)
    for i in range(26):
        phi = rnd.uniform(-math.pi, math.pi)
        t = rnd.uniform(8, 58)
        c = head_on(phi, D(t), 0.049)
        dots.append(ellipsoid(f"d{i}", c, (0.011, 0.011, 0.011), n=8, rings=6))
    k.add("hw_bandana_dots", merge("x", dots, k.m["white"]))


def hat_ears(k, m):
    """Ear guards: a strap over the head and two round cups."""
    strap = [head_on(D(90), D(a), 0.05) if a >= 0 else head_on(D(-90), D(-a), 0.05) for a in range(96, -97, -12)]
    k.add("hw_ears", sweep("hw_ears", strap, (0.012, 0.03), n=12, p=3, up=(0, 1, 0), mat=k.m["hw1"]))
    cups = []
    for s in (-1, 1):
        c = head_on(D(90) * s, D(100), 0.06)
        d = V((s, 0, 0))
        cups.append(sweep(f"cup{s}", [c - d * 0.02, c + d * 0.03], (0.085, 0.1), n=24, round_caps=(True, True)))
    k.add("hw_ears_cups", merge("x", cups, k.m["hw1"]))
    rings = []
    for s in (-1, 1):
        c = head_on(D(90) * s, D(100), 0.06) + V((0.048 * s, 0, 0))
        ring = [c + V((0, math.sin(a) * 0.055, math.cos(a) * 0.065)) for a in [math.tau * i / 24 for i in range(24)]]
        rings.append(sweep(f"r{s}", ring, 0.012, n=8, closed=True))
    k.add("hw_ears_rings", merge("x", rings, k.m["hwd"]))


def crown_hat(k, style, base_z=0.17, tilt=0.03, profile=((0, 1.0), (0.12, 1.02), (0.22, 0.98), (0.28, 0.9)), top_lift=0.02, mat="hw1", suffix="", clip=True, crease=0.0, pinch=0.0):
    """A crown standing on a ring round the head: profile is (height above
    the band, scale) pairs. crease dents the top front to back, pinch the
    front sides."""
    base = head_ring(base_z, AIR, tilt=tilt)
    rings = []
    for h, s in profile:
        r = scaled(base, s, h)
        if crease or pinch:
            top_k = h / profile[-1][0]
            r2 = []
            for i, p in enumerate(r):
                phi = phi_of(i)
                dz = -crease * top_k ** 3 * math.cos(phi) ** 2 * 0.0
                q = V(p)
                if pinch:
                    q = q - out_dir(q) * (pinch * top_k ** 2 * max(0.0, -math.cos(phi)) * abs(math.sin(phi)) ** 0.5)
                r2.append(q + V((0, 0, dz)))
            r = r2
        rings.append(r)
    ob = loft(f"hw_{style}{suffix}", rings, k.m[mat], top=True, top_lift=top_lift - crease)
    return ob, base


def brimmed(k, style, crown_profile, brim_w, brim_lift=lambda phi, k: 0.0, band_h=0.05, base_z=0.17, tilt=0.03, crease=0.0, pinch=0.0, band_mat="hw2", brim_mat="hw1", trim="", unless=None):
    t = f"@{trim}" if trim else ""
    crown, base = crown_hat(k, style, base_z, tilt, crown_profile, crease=crease, pinch=pinch, suffix=t)
    k.add(f"hw_{style}{t}", crown, clip=(base_z + 0.01, tilt), unless=unless)
    k.add(f"hw_{style}{t}_brim", brim("b", k.m[brim_mat], scaled(base, 1.0, 0.004), brim_w, brim_lift), unless=unless)
    if band_h:
        lower = scaled(base, crown_profile[0][1], 0.012)
        upper = scaled(base, crown_profile[1][1] if len(crown_profile) > 1 else 1.0, band_h)
        k.add(f"hw_{style}{t}_band", band("bd", k.m[band_mat], lower, upper, out=0.008), unless=unless)
    return base


def hats(mats):
    k = Kit(mats)
    hat_band(k, mats)
    hat_bandana(k, mats)
    hat_ears(k, mats)

    # Sombrero: a tall rounded crown, a very wide brim turned up at the edge.
    brimmed(k, "sombrero", ((0, 1.0), (0.1, 1.0), (0.26, 0.92), (0.4, 0.72), (0.48, 0.45), (0.5, 0.1)), 0.52, lambda phi, t: 0.12 * t ** 3 - 0.02 * t, band_h=0.07)
    # Bowler: a round dome, a narrow brim curled up at the sides.
    brimmed(k, "bowler", ((0, 1.0), (0.1, 1.03), (0.2, 1.0), (0.28, 0.82), (0.33, 0.5), (0.345, 0.1)), 0.075, lambda phi, t: 0.035 * t ** 2 * abs(math.sin(phi)) ** 1.5, band_h=0.04)
    # Tyrolean: a creased crown, the brim up at the back, a cord and a trim.
    base = brimmed(k, "tyrolean", ((0, 1.0), (0.1, 0.98), (0.2, 0.9), (0.27, 0.74), (0.3, 0.45)), 0.1, lambda phi, t: 0.05 * t ** 2 * max(0.0, math.cos(phi + math.pi)) + 0.01 * t, band_h=0.045, pinch=0.05)
    side = scaled(base, 1.0, 0.03)[N // 4]  # the fighter's left side
    feather = [side + V((0.02, 0.02, 0.0)), side + V((0.04, 0.05, 0.12)), side + V((0.03, 0.09, 0.24)), side + V((0.0, 0.12, 0.3))]
    k.add("hw_tyrolean@feather_f", sweep("f", feather, [(0.006, 0.018), (0.008, 0.03), (0.007, 0.028), (0.003, 0.004)], n=10, p=2.5, up=(1, 0, 0), mat=mats["hw3"]))
    k.add("hw_tyrolean@crane_f", sweep("f", [side + V((0.015, 0.02, 0.0)), side + V((0.03, 0.06, 0.16)), side + V((0.02, 0.1, 0.32)), side + V((0.0, 0.12, 0.38))], [(0.005, 0.016), (0.007, 0.024), (0.006, 0.02), (0.003, 0.003)], n=10, p=2.5, up=(1, 0, 0), mat=mats["hw3"]))
    tuft = []
    for i in range(9):
        a = D(-40 + i * 10)
        tip = side + V((0.03, 0.03 + 0.1 * math.sin(a), 0.2 * math.cos(a)))
        tuft.append(sweep(f"g{i}", [side + V((0.02, 0.02, 0)), side.lerp(tip, 0.5) + V((0.03, 0, 0)), tip], [0.01, 0.016, 0.004], n=8))
    k.add("hw_tyrolean@gamsbart_t", merge("x", tuft, mats["hw3"]))
    shells = [ellipsoid(f"s{i}", p + out_dir(p) * 0.012 + V((0, 0, 0.03)), (0.014, 0.014, 0.01), n=10, rings=6) for i, p in enumerate(scaled(base, 1.0, 0.0)) if i % 4 == 0]
    k.add("hw_tyrolean@shells_s", merge("x", shells, mats["hw3"]))

    # Cowboy: a creased crown, a wide brim swept up at the sides.
    brimmed(k, "cowboy", ((0, 1.0), (0.1, 1.0), (0.22, 0.95), (0.3, 0.84), (0.33, 0.6)), 0.26, lambda phi, t: 0.13 * t ** 2 * abs(math.sin(phi)) ** 2 - 0.02 * t * max(0.0, math.cos(phi)), band_h=0.045, crease=0.035, pinch=0.06, unless=["bush"])
    brimmed(k, "cowboy", ((0, 1.0), (0.1, 1.0), (0.22, 0.95), (0.3, 0.84), (0.33, 0.6)), 0.26, lambda phi, t: 0.04 * t ** 2 * abs(math.sin(phi)) - 0.03 * t, band_h=0.045, crease=0.035, pinch=0.06, trim="bush")
    # Flat brim (cordobés): a flat-topped cylinder and a flat brim.
    brimmed(k, "flatbrim", ((0, 1.0), (0.14, 0.98), (0.25, 0.97), (0.27, 0.9), (0.275, 0.1)), 0.26, band_h=0.045)
    # Straw hat: a round crown, a wide brim drooping a little.
    brimmed(k, "straw", ((0, 1.0), (0.1, 1.0), (0.2, 0.92), (0.26, 0.72), (0.29, 0.1)), 0.27, lambda phi, t: -0.05 * t ** 2, band_h=0.045)
    # Panama: a creased crown, a medium brim down at the front.
    brimmed(k, "panama", ((0, 1.0), (0.1, 0.99), (0.2, 0.93), (0.26, 0.8), (0.28, 0.5)), 0.15, lambda phi, t: -0.035 * t ** 2 * max(0.0, math.cos(phi)) + 0.02 * t ** 2 * max(0.0, -math.cos(phi)), band_h=0.045, crease=0.03, pinch=0.05)
    stripes = []
    for j, w in enumerate((0.05, 0.1)):
        ring = [p + out_dir(p) * w + V((0, 0, 0.016 - 0.035 * (w / 0.15) ** 2 * max(0.0, math.cos(phi_of(i))) + 0.02 * (w / 0.15) ** 2 * max(0.0, -math.cos(phi_of(i))))) for i, p in enumerate(head_ring(0.17, AIR, tilt=0.03))]
        stripes.append(sweep(f"s{j}", ring, (0.003, 0.012), n=6, closed=True, up=(0, 0, 1)))
    k.add("hw_panama@stripes_s", merge("x", stripes, mats["hw2"]))
    # Boater: a flat low crown and a flat brim.
    brimmed(k, "boater", ((0, 1.0), (0.12, 1.0), (0.175, 0.98), (0.18, 0.1)), 0.15, band_h=0.06, base_z=0.26, tilt=0.02)
    # Welsh hat: a tall, slightly tapered crown and a flat brim.
    brimmed(k, "welsh", ((0, 1.0), (0.2, 0.95), (0.4, 0.88), (0.46, 0.86), (0.47, 0.1)), 0.14, band_h=0.05)
    # Couro: the brim folded up in front like a half moon, gold stars on it.
    brimmed(k, "couro", ((0, 1.0), (0.1, 1.0), (0.2, 0.92), (0.26, 0.72), (0.28, 0.2)), lambda phi: 0.2 * (0.5 + 0.5 * math.cos(phi)) + 0.05, lambda phi, t: 0.22 * t * max(0.0, math.cos(phi)) ** 2, band_h=0.04)
    base = head_ring(0.17, AIR, tilt=0.03)
    stars = []
    for j, a in enumerate((-0.45, -0.22, 0.0, 0.22, 0.45)):
        i = int(round((a / math.tau) * N)) % N
        p = base[i]
        w = 0.2 * (0.5 + 0.5 * math.cos(phi_of(i))) + 0.05
        c = p + out_dir(p) * (w * 0.62) + V((0, 0, 0.22 * 0.62 * math.cos(phi_of(i)) ** 2 + 0.012))
        stars.append(ellipsoid(f"st{j}", c + V((0, -0.012, 0)), (0.02, 0.008, 0.02), n=10, rings=6))
    k.add("hw_couro_stars", merge("x", stars, mats["hw3"]))

    # Beret: a soft cushion over the crown, slouching to one side, a stalk on top.
    base = head_ring(0.2, AIR, tilt=0.02)

    def slouch(ring):
        return [V((q.x - 0.03 * ((q.z - base[0].z) / 0.2), q.y, q.z + 0.12 * (q.x - HC.x) * ((q.z - base[0].z) / 0.2))) for q in ring]

    rings = [base, slouch(scaled(base, 1.16, 0.06)), slouch(scaled(base, 1.2, 0.12)), slouch(scaled(base, 1.1, 0.19)), slouch(scaled(base, 0.8, 0.23)), slouch(scaled(base, 0.3, 0.245))]
    k.add("hw_beret", loft("br", rings, mats["hw1"], levels=2), clip=(0.21, 0.02))
    top_c = V((HC.x - 0.03, HC.y, base[0].z + 0.25))
    k.add("hw_beret_stalk", sweep("s", [top_c + V((0, 0, -0.01)), top_c + V((0.01, 0.0, 0.05))], 0.014, n=10, mat=mats["hw1"]), unless=["tam"])
    k.add("hw_beret@tam_p", pompom("p", mats["hw2"], top_c + V((0.0, 0.0, 0.05)), 0.07))
    k.add("hw_beret@tam_b", band("bd", mats["hw2"], head_ring(0.2, 0.06), head_ring(0.25, 0.06), out=0.01))

    # Flat cap: a rounded crown sloping forward onto a short peak.
    base = head_ring(0.16, AIR, tilt=0.05)
    rings = [scaled(base, 1.0), scaled(base, 1.03, 0.1, dy=-0.02), scaled(base, 1.02, 0.19, dy=-0.05), scaled(base, 0.88, 0.25, dy=-0.07), scaled(base, 0.5, 0.28, dy=-0.07)]
    k.add("hw_flatcap", loft("fc", rings, mats["hw1"]), clip=(0.17, 0.05))
    peak = [p for p in scaled(base, 1.0, 0.01)]
    k.add("hw_flatcap_peak", brim("pk", mats["hwd"], peak, lambda phi: 0.1 * max(0.0, math.cos(phi)) ** 1.5, lambda phi, t: -0.02 * t, thick=0.018))

    # Fisherman's cap: a soft crown, a shiny peak, a cord above it.
    base = head_ring(0.16, AIR, tilt=0.05)
    rings = [scaled(base, 1.0), scaled(base, 1.02, 0.1), scaled(base, 1.06, 0.2, dy=-0.01), scaled(base, 0.98, 0.26, dy=-0.01), scaled(base, 0.5, 0.28)]
    k.add("hw_fisher", loft("f", rings, mats["hw1"]), clip=(0.17, 0.05))
    k.add("hw_fisher_peak", brim("pk", mats["hw3"], scaled(base, 1.0, 0.005), lambda phi: 0.11 * max(0.0, math.cos(phi)) ** 1.5, lambda phi, t: -0.03 * t, thick=0.016))
    front = [p + out_dir(p) * 0.012 + V((0, 0, 0.04)) for p in base[N - 9 :] + base[: 10]]
    k.add("hw_fisher_cord", sweep("c", front, 0.008, n=8, mat=mats["hw2"]))

    # Fez: a truncated cone with a tassel; the chechia is short and soft.
    base = head_ring(0.12, AIR, tilt=0.02)
    rings = [scaled(base, 1.0), scaled(base, 0.94, 0.13), scaled(base, 0.86, 0.29), scaled(base, 0.84, 0.31)]
    k.add("hw_fez", loft("fz", rings, mats["hw1"], top_lift=0.0), clip=(0.13, 0.02), unless=["short"])
    k.add("hw_fez_tassel", tassel("t", mats["hw2"], V((0.05, 0.03, base[0].z + 0.315)), 0.2), unless=["short"])
    rings = [scaled(base, 1.0), scaled(base, 1.0, 0.12), scaled(base, 0.9, 0.24), scaled(base, 0.55, 0.3)]
    k.add("hw_fez@short", loft("fzs", rings, mats["hw1"]), clip=(0.13, 0.02))

    # Knit cap: a beanie with a folded cuff and a bobble.
    rings = [head_ring(z, 0.05 + 0.02 * (z / 0.38), tilt=0.02) for z in (0.06, 0.16, 0.26, 0.33, 0.37)]
    rings.append(scaled(rings[-1], 0.5, 0.03))
    k.add("hw_knit", loft("k", rings, mats["hw1"]), clip=(0.07, 0.02))
    k.add("hw_knit_cuff", band("c", mats["hw2"], head_ring(0.05, 0.055, tilt=0.02), head_ring(0.14, 0.058, tilt=0.02), out=0.016))
    k.add("hw_knit_bobble", pompom("p", mats["hw2"], HC + V((0, 0.02, 0.5)), 0.08))

    # Papakha, kalpak: fur, tall and low.
    for style, h in (("papakha", 0.34), ("kalpak", 0.28)):
        base = head_ring(0.12, AIR, tilt=0.02)
        rings = [scaled(base, 1.02), scaled(base, 1.1, h * 0.5), scaled(base, 1.1, h), scaled(base, 0.7, h + 0.02)]
        ob = loft(style, rings, mats["hw1"], levels=2)
        k.add(f"hw_{style}", bumpy(ob, 0.012, 45.0, 7), clip=(0.13, 0.02))

    # Borik: a velvet crown in a fur rim, gold embroidery.
    base = head_ring(0.12, AIR, tilt=0.02)
    rings = [scaled(base, 0.98, 0.04), scaled(base, 0.98, 0.18), scaled(base, 0.85, 0.3), scaled(base, 0.4, 0.34)]
    k.add("hw_borik", loft("bk", rings, mats["hw2"]), clip=(0.13, 0.02))
    rim = [scaled(base, 1.08, 0.0), scaled(base, 1.14, 0.06), scaled(base, 1.08, 0.12), scaled(base, 0.98, 0.1)]
    k.add("hw_borik_fur", bumpy(loft("fur", rim, mats["hw1"], top=False, levels=2), 0.01, 50.0, 9))
    k.add("hw_borik_gold", sweep("g", [p + out_dir(p) * 0.012 + V((0, 0, 0.2)) for p in scaled(base, 0.93)], 0.008, n=8, closed=True, mat=mats["hw3"]))

    # Ushanka: fur crown, the front flap up, the ear flaps down.
    base = head_ring(0.12, AIR, tilt=0.02)
    rings = [scaled(base, 1.02), scaled(base, 1.05, 0.12), scaled(base, 0.95, 0.26), scaled(base, 0.5, 0.3)]
    k.add("hw_ushanka", bumpy(loft("u", rings, mats["hw2"], levels=2), 0.008, 40.0, 5), clip=(0.13, 0.02))
    flaps = []
    for s in (-1, 1):
        c = head_on(D(88) * s, D(100), 0.08)
        flaps.append(sweep(f"fl{s}", [c + V((0, 0, 0.12)), c, c + V((0, 0, -0.1))], [(0.03, 0.12), (0.035, 0.13), (0.03, 0.1)], n=16, p=2.6, up=(1, 0, 0)))
    front = [p + out_dir(p) * 0.03 for p in scaled(base, 1.0)]
    flaps.append(sweep("fr", [front[N - 8]] + front[N - 7 :] + front[:8], (0.06, 0.03), n=12, p=2.6, up=(0, 0, 1)))
    k.add("hw_ushanka_flaps", bumpy(merge("x", flaps, mats["hw1"]), 0.008, 40.0, 6))

    # Svan: a round felt cap with a border.
    base = head_ring(0.16, AIR, tilt=0.03)
    rings = [scaled(base, 1.0), scaled(base, 1.02, 0.1), scaled(base, 0.92, 0.22), scaled(base, 0.4, 0.28)]
    k.add("hw_svan", loft("sv", rings, mats["hw1"]), clip=(0.17, 0.03))
    k.add("hw_svan_border", band("b", mats["hw2"], scaled(base, 1.0, 0.0), scaled(base, 1.02, 0.045), out=0.01))

    # Ak-kalpak: a tall white felt cone, the black brim turned up.
    base = head_ring(0.14, AIR, tilt=0.02)
    rings = [scaled(base, 1.0), scaled(base, 0.92, 0.12), scaled(base, 0.7, 0.3), scaled(base, 0.35, 0.46), scaled(base, 0.1, 0.52)]
    k.add("hw_akkalpak", loft("ak", rings, mats["hw1"]), clip=(0.15, 0.02))
    k.add("hw_akkalpak_brim", brim("br", mats["hw2"], scaled(base, 1.0, 0.0), 0.06, lambda phi, t: 0.08 * t, thick=0.014))
    # Janjin: a pointed cap, turned-up brim, a knot on top and ribbons.
    rings = [scaled(base, 1.0), scaled(base, 0.95, 0.12), scaled(base, 0.7, 0.28), scaled(base, 0.3, 0.42), scaled(base, 0.05, 0.46)]
    k.add("hw_janjin", loft("jj", rings, mats["hw1"]), clip=(0.15, 0.02))
    k.add("hw_janjin_brim", brim("br", mats["hw1"], scaled(base, 1.0, 0.0), 0.07, lambda phi, t: 0.1 * t, thick=0.014))
    k.add("hw_janjin_knot", ellipsoid("kn", V((HC.x, HC.y, base[0].z + 0.47)), (0.04, 0.04, 0.045), n=14, rings=10, mat=mats["hw2"]))
    back = scaled(base, 1.0, 0.02)[N // 2]
    rib = [sweep(f"r{s}", [back + V((0.02 * s, 0.01, 0)), back + V((0.04 * s, 0.05, -0.12)), back + V((0.05 * s, 0.06, -0.3))], (0.006, 0.03), n=8, p=3, up=(0, 1, 0)) for s in (-1, 1)]
    k.add("hw_janjin_rib", merge("x", rib, mats["hw3"]))

    # Gat: a tall narrow crown and a very wide thin brim.
    base = head_ring(0.18, AIR, tilt=0.0)
    rings = [scaled(base, 0.78), scaled(base, 0.74, 0.18), scaled(base, 0.72, 0.3), scaled(base, 0.1, 0.31)]
    k.add("hw_gat", loft("g", rings, mats["hw1"]), clip=(0.19, 0.0))
    k.add("hw_gat_brim", brim("b", mats["hw1"], scaled(base, 1.0, 0.0), 0.36, lambda phi, t: -0.02 * t, thick=0.01))

    # Conical: a wide cone of palm leaf; the douli is flatter.
    for trim, h, w in (("", 0.34, 0.66), ("@flat", 0.18, 0.7)):
        apex = V((HC.x, HC.y, HC.z + 0.24 + h))
        cone = [ [V((HC.x + math.sin(phi_of(i)) * w * r, HC.y - math.cos(phi_of(i)) * w * r * 0.97, apex.z - h * r)) for i in range(N)] for r in (0.02, 0.35, 0.7, 1.0)]
        ob = thicken(loft(f"cn{trim}", cone, mats["hw1"], top=False, levels=0), 0.014, 1)
        k.add(f"hw_conical{trim}", ob, clip=(0.2, 0.0), unless=None if trim else ["flat"])
        rings = [sweep(f"w{j}", [V((HC.x + math.sin(phi_of(i)) * w * r, HC.y - math.cos(phi_of(i)) * w * r * 0.97, apex.z - h * r + 0.009)) for i in range(N)], 0.005, n=6, closed=True) for j, r in enumerate((0.3, 0.55, 0.8))]
        k.add(f"hw_conical{trim}_rings", merge("x", rings, mats["hw2"]), unless=None if trim else ["flat"])

    # Salakot: a rattan dome with a spike on top.
    apex = V((HC.x, HC.y, HC.z + 0.5))
    rings = [[V((HC.x + math.sin(phi_of(i)) * 0.56 * r, HC.y - math.cos(phi_of(i)) * 0.55 * r, apex.z - 0.3 * r ** 1.6)) for i in range(N)] for r in (0.02, 0.3, 0.6, 0.85, 1.0)]
    k.add("hw_salakot", thicken(loft("sk", rings, mats["hw1"], top=False, levels=0), 0.016, 1), clip=(0.22, 0.0))
    k.add("hw_salakot_spike", sweep("sp", [apex + V((0, 0, -0.01)), apex + V((0, 0, 0.06)), apex + V((0, 0, 0.12))], [0.03, 0.02, 0.003], n=12, mat=mats["hw2"]))

    # Mongkol: a thick corded ring round the head, its tail standing out at the back.
    ring = head_ring(0.12, 0.07, tilt=0.03)
    k.add("hw_mongkol", sweep("m", ring, 0.035, n=14, closed=True, mat=mats["hw1"]))
    cord = []
    for i in range(96):
        a = i / 96 * math.tau
        p = ring[int(i / 2) % N]
        d = out_dir(p)
        cord.append(p + d * math.cos(a * 12) * 0.036 + V((0, 0, math.sin(a * 12) * 0.036)))
    k.add("hw_mongkol_cord", sweep("c", cord, 0.008, n=6, closed=True, mat=mats["hw2"]))
    back = ring[N // 2]
    k.add("hw_mongkol_tail", sweep("t", [back, back + V((0, 0.08, 0.02)), back + V((0, 0.16, 0.08)), back + V((0, 0.2, 0.16))], [0.03, 0.028, 0.022, 0.01], n=12, mat=mats["hw3"]))

    # Wreath: leaves round the head, flowers and ribbons by trim.
    ring = head_ring(0.24, 0.05, tilt=0.04)
    leaves = []
    for i in range(0, N, 2):
        p = ring[i]
        d = out_dir(p)
        a = math.atan2(d.y, d.x)
        lf = ellipsoid(f"l{i}", V((0, 0, 0)), (0.05, 0.02, 0.028), n=10, rings=6)
        lf.data.transform(Matrix.Rotation(D(25 if i % 4 else -25), 4, "X"))
        lf.data.transform(Matrix.Rotation(a + math.pi / 2, 4, "Z"))
        lf.data.transform(Matrix.Translation(p + d * 0.01))
        leaves.append(lf)
    k.add("hw_wreath", merge("x", leaves, mats["hw1"]))
    for trim, r, step in (("flowers", 0.03, 4), ("hibiscus", 0.05, 8)):
        fl = []
        for i in range(0, N, step):
            if trim == "flowers" or abs(math.cos(phi_of(i))) > 0.2:
                p = ring[i] + out_dir(ring[i]) * 0.03
                fl.append(ellipsoid(f"f{i}", p, (r, r, r * 0.6), n=10, rings=6))
        k.add(f"hw_wreath@{trim}_f", merge("x", fl, mats["hw2"]))
        dots = [ellipsoid(f"d{i}", ring[i] + out_dir(ring[i]) * (0.03 + r * 0.55), (r * 0.35, r * 0.35, r * 0.35), n=8, rings=6) for i in range(0, N, step) if trim == "flowers" or abs(math.cos(phi_of(i))) > 0.2]
        k.add(f"hw_wreath@{trim}_c", merge("x", dots, mats["hw3"]))
    acorns = [ellipsoid(f"a{i}", ring[i] + out_dir(ring[i]) * 0.03, (0.02, 0.02, 0.026), n=8, rings=6) for i in range(3, N, 8)]
    k.add("hw_wreath@oak_a", merge("x", acorns, mats["hw2"]))
    back = ring[N // 2]
    for j in range(4):
        dx = (j - 1.5) * 0.03
        pts = [back + V((dx, 0.02, 0)), back + V((dx * 1.4, 0.06, -0.15)), back + V((dx * 1.8, 0.08, -0.34 - 0.03 * j))]
        k.add(f"hw_wreath@flowers_r{j}", sweep(f"r{j}", pts, (0.005, 0.016), n=8, p=3, up=(0, 1, 0), mat=mats[f"rib{j}"]))

    # Keffiyeh: a cloth over the head and down to the shoulders, an agal on top.
    def T(phi):
        a = abs(math.degrees(math.atan2(math.sin(phi), math.cos(phi))))
        return D(62) if a < 58 else D(62 + min(1.0, (a - 58) / 20) * 88)

    from hair import shell

    cloth = shell("kf", mats["hw1"], T, thick=0.03, top=0.02, hang=D(92), nu=96, nv=44, inner=0.05)
    k.add("hw_keffiyeh", cloth, clip=(0.0, 0.0))
    for j, z in enumerate((0.2, 0.245)):
        k.add(f"hw_keffiyeh_agal{j}", sweep(f"a{j}", head_ring(z, 0.095, tilt=0.03), 0.018, n=10, closed=True, mat=mats["hw2"]))
    pat = []
    for j, t in enumerate((70, 90, 110, 130)):
        pts = []
        for i in range(0, 25):
            phi = D(-150 + i * 12.5)
            if abs(math.degrees(phi)) < 64:
                continue
            pts.append((phi, D(t)))
        for i, (phi, t2) in enumerate(pts):
            pat.append(ellipsoid(f"p{j}{i}", head_on(phi, min(t2, D(92)), 0.085) + V((0, 0, -max(0.0, t2 - D(92)) * 0.42)), (0.012, 0.012, 0.012), n=6, rings=4))
    k.add("hw_keffiyeh@pattern_p", merge("x", pat, mats["hw3"]))

    # Wraps: a wound cloth; the pagri tall and bright, fringe or check by trim.
    def wrap_rings(scale=1.0):
        rs = []
        for j in range(7):
            z = 0.1 + j * 0.045
            tilt = 0.06 * (1 if j % 2 else -1)
            rs.append(head_ring(z, 0.06 + 0.025 * math.sin(j * 1.3) * scale, tilt=tilt))
        return rs

    rings = wrap_rings() + [scaled(head_ring(0.36, 0.05), 0.6, 0.02)]
    k.add("hw_wrap", loft("wr", rings, mats["hw1"], levels=1), clip=(0.1, 0.03))
    folds = [sweep(f"fo{j}", scaled(head_ring(0.12 + j * 0.07, 0.085, tilt=0.07 * (1 if j % 2 else -1)), 1.0), 0.016, n=8, closed=True) for j in range(4)]
    k.add("hw_wrap_folds", merge("x", folds, mats["hwd"]))
    fr = [sweep(f"t{i}", [head_ring(0.1, 0.08)[i], head_ring(0.1, 0.08)[i] + V((0, -0.01, -0.07))], [0.006, 0.004], n=6) for i in list(range(N - 6, N)) + list(range(0, 7))]
    k.add("hw_wrap@fringe_f", merge("x", fr, mats["hw2"]))
    ch = [sweep(f"c{j}", head_ring(0.12 + j * 0.05, 0.1, tilt=0.03), 0.006, n=6, closed=True) for j in range(5)]
    k.add("hw_wrap@check_c", merge("x", ch, mats["hw2"]))
    k.add("hw_wrap@pagri_top", loft("pg", [head_ring(0.3, 0.09), scaled(head_ring(0.3, 0.09), 1.05, 0.08, dy=0.02), scaled(head_ring(0.3, 0.09), 0.6, 0.14, dy=0.03)], mats["hw2"]))

    # Chullo: a knitted cap with ear flaps and strings.
    rings = [head_ring(z, 0.05 + 0.015 * (z / 0.38), tilt=0.02) for z in (0.06, 0.16, 0.26, 0.33, 0.37)]
    rings.append(scaled(rings[-1], 0.4, 0.05))
    k.add("hw_chullo", loft("ch", rings, mats["hw1"]), clip=(0.07, 0.02))
    k.add("hw_chullo_band", band("b", mats["hw2"], head_ring(0.05, 0.055, tilt=0.02), head_ring(0.12, 0.057, tilt=0.02), out=0.01))
    k.add("hw_chullo_band2", band("b2", mats["hw3"], head_ring(0.2, 0.06, tilt=0.02), head_ring(0.24, 0.062, tilt=0.02), out=0.008))
    flaps = []
    for s in (-1, 1):
        c = head_on(D(88) * s, D(104), 0.065)
        flaps.append(sweep(f"fl{s}", [c + V((0, 0, 0.1)), c, c + V((0, 0, -0.1)), c + V((0, 0, -0.14))], [(0.02, 0.1), (0.025, 0.1), (0.02, 0.06), (0.01, 0.01)], n=14, p=2.4, up=(1, 0, 0)))
        flaps.append(sweep(f"st{s}", [c + V((0, 0, -0.14)), c + V((0.01 * s, 0, -0.26))], 0.008, n=6))
        flaps.append(pompom(f"pp{s}", None, c + V((0.01 * s, 0, -0.28)), 0.025))
    k.add("hw_chullo_flaps", merge("x", flaps, mats["hw1"]))
    k.add("hw_chullo_top", pompom("tp", mats["hw2"], HC + V((0, 0.02, 0.48)), 0.045))

    # Stocking cap: a long cap falling to the back, a red rim.
    base = head_ring(0.08, 0.05, tilt=0.02)
    rings = [base]
    for j, (h, s, dy) in enumerate(((0.2, 1.0, 0.0), (0.33, 0.9, 0.05), (0.38, 0.65, 0.16), (0.33, 0.4, 0.3), (0.2, 0.22, 0.38))):
        rings.append(scaled(base, s, h, dy=dy))
    k.add("hw_stocking", loft("sk", rings, mats["hw1"]), clip=(0.09, 0.02))
    k.add("hw_stocking_rim", band("r", mats["hw2"], head_ring(0.07, 0.055, tilt=0.02), head_ring(0.13, 0.057, tilt=0.02), out=0.014))

    # Šajkača: a boat-shaped cap dipping in the middle.
    base = head_ring(0.16, AIR, tilt=0.02)
    rings = [scaled(base, 1.0)]
    for h, s in ((0.1, 1.0), (0.2, 0.9)):
        rings.append([V((q.x, q.y, q.z + h * (1 - 0.35 * abs(math.sin(phi_of(i))) ** 3))) for i, q in enumerate(scaled(base, s))])
    ridge = [V((HC.x + (q.x - HC.x) * 0.2, q.y, q.z + 0.3 - 0.07 * (1 - abs(math.cos(phi_of(i)))))) for i, q in enumerate(base)]
    rings.append(ridge)
    k.add("hw_sajkaca", loft("sj", rings, mats["hw1"], top=False), clip=(0.17, 0.02))

    # Lika and Montenegrin caps: a flat round cap, a black border.
    base = head_ring(0.24, AIR, tilt=0.02)
    rings = [scaled(base, 1.0), scaled(base, 1.0, 0.16), scaled(base, 0.95, 0.19)]
    k.add("hw_capa", loft("cp", rings, mats["hw1"], top_lift=0.0), clip=(0.25, 0.02))
    k.add("hw_capa_side", band("s", mats["hw2"], scaled(base, 1.0, 0.0), scaled(base, 1.0, 0.1), out=0.006))
    back = scaled(base, 1.0, 0.16)
    fringe = [sweep(f"f{i}", [back[i], back[i] + out_dir(back[i]) * 0.02 + V((0, 0.0, -0.18))], [0.006, 0.004], n=6) for i in range(N // 2 - 8, N // 2 + 9)]
    k.add("hw_capa@fringe_f", merge("x", fringe, mats["hw2"]))
    k.add("hw_capa@gold_g", merge("x", [sweep(f"g{j}", scaled(base, 0.8 - j * 0.2, 0.192), 0.008, n=6, closed=True) for j in range(3)], mats["hw3"]))

    # Fila: a soft tall cap folded over to one side.
    base = head_ring(0.12, AIR, tilt=0.02)
    rings = [scaled(base, 1.0), scaled(base, 1.02, 0.12), scaled(base, 0.98, 0.24, dx=0.04), scaled(base, 0.9, 0.3, dx=0.12), scaled(base, 0.7, 0.28, dx=0.24), scaled(base, 0.5, 0.22, dx=0.3)]
    k.add("hw_fila", loft("fl", rings, mats["hw1"]), clip=(0.13, 0.02))
    k.add("hw_fila_band", band("b", mats["hw2"], scaled(base, 1.0, 0.0), scaled(base, 1.01, 0.04), out=0.008))

    # Caps by trim: Käppi, Qeleshe, Doppi, Guapi, Kumma, Peci.
    base = head_ring(0.16, AIR, tilt=0.03)
    shapes = {
        "kaeppi": [(0, 1.0), (0.1, 1.0), (0.21, 0.86), (0.27, 0.4)],
        "qeleshe": [(0, 1.0), (0.12, 1.02), (0.24, 0.9), (0.3, 0.55), (0.32, 0.1)],
        "doppi": [(0, 1.0), (0.14, 1.0), (0.26, 0.98), (0.275, 0.2)],
        "guapi": [(0, 1.0), (0.12, 1.0), (0.23, 0.85), (0.28, 0.3)],
        "kumma": [(0, 1.0), (0.12, 1.0), (0.24, 0.9), (0.27, 0.3)],
        "peci": [(0, 1.0), (0.16, 0.99), (0.26, 0.95), (0.27, 0.1)],
    }
    for trim, prof in shapes.items():
        rings = [scaled(base, s, h) for h, s in prof]
        if trim == "doppi":
            rings = [[V((HC.x + (q.x - HC.x) * (1 + 0.08 * abs(math.sin(2 * phi_of(i))) ** 4), HC.y + (q.y - HC.y) * (1 + 0.08 * abs(math.sin(2 * phi_of(i))) ** 4), q.z)) for i, q in enumerate(r)] for r in rings]
        k.add(f"hw_cap@{trim}", loft(f"c{trim}", rings, mats["hw1"]), clip=(0.17, 0.03))
    k.add("hw_cap@kaeppi_band", band("b", mats["hw3"], scaled(base, 1.0, 0.0), scaled(base, 1.0, 0.04), out=0.008))
    k.add("hw_cap@kaeppi_flower", merge("x", [ellipsoid(f"e{j}", scaled(base, 1.0, 0.1)[0] + V((0.022 * math.cos(j * 1.047), -0.012, 0.022 * math.sin(j * 1.047))), (0.012, 0.006, 0.012), n=8, rings=6) for j in range(6)], mats["hw2"]))
    k.add("hw_cap@guapi_knob", ellipsoid("kn", V((HC.x, HC.y, base[0].z + 0.29)), (0.035, 0.035, 0.03), n=14, rings=10, mat=mats["hw2"]))
    seams = [sweep(f"s{j}", [scaled(base, 1.0 + 0.004, 0.02)[j * 8], scaled(base, 0.88, 0.23)[j * 8], V((HC.x, HC.y, base[0].z + 0.28))], 0.005, n=6) for j in range(6)]
    k.add("hw_cap@guapi_seams", merge("x", seams, mats["hwd"]))
    peppers = []
    for j in range(4):
        p = scaled(base, 1.0, 0.07)[j * 12 + 6]
        peppers.append(ellipsoid(f"pp{j}", p + out_dir(p) * 0.008, (0.03, 0.03, 0.025), n=10, rings=6))
    k.add("hw_cap@doppi_p", merge("x", peppers, mats["hw2"]))
    kum = [sweep(f"k{j}", scaled(base, 1.0 - j * 0.03, 0.03 + j * 0.06), 0.008, n=6, closed=True) for j in range(3)]
    k.add("hw_cap@kumma_b", merge("x", kum, mats["hw2"]))
    k.add("hw_cap@kumma_c", sweep("kc", scaled(base, 1.0, 0.055), 0.007, n=6, closed=True, mat=mats["hw3"]))

    for ob in k.out.values():
        if not ob.data.materials:
            ob.data.materials.append(mats["hw1"])
    return k.out
