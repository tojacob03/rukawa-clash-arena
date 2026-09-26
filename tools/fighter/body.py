"""Body, gi, no-gi clothes, belt and extras. The figure stands in a relaxed
stance, facing -Y, feet on z = 0, about two units tall.

Materials: skin (head, ears, hands, feet: plain colour), body (arms, neck,
torso, legs: skin colour plus tattoos from a texture), gi, lapel, belt,
beltbar, stripe, top, topdark, bottom, bottomdark, spats, pad, tape, towel,
medal, ribbon."""

import math

import bmesh
import bpy
from mathutils import Vector

from geo import apply_modifiers, bridge_rings, link, modifier, planar_uv, subdivide, superellipse, sweep

V = Vector

# Joints. +X is on the viewer's right, which is the fighter's left.
SHOULDER = V((0.285, 0.0, 1.0))
ELBOW = V((0.39, 0.03, 0.77))
WRIST = V((0.418, -0.03, 0.578))
FIST = V((0.424, -0.045, 0.508))
HIP = V((0.125, 0.0, 0.56))
KNEE = V((0.16, -0.01, 0.31))
ANKLE = V((0.185, 0.0, 0.10))


def mirror(v, s):
    return V((v.x * s, v.y, v.z))


# The torso as horizontal sections (z, half width, half depth).
TORSO = [
    (0.48, 0.255, 0.165),
    (0.56, 0.245, 0.16),
    (0.64, 0.24, 0.158),
    (0.76, 0.262, 0.168),
    (0.88, 0.285, 0.178),
    (0.96, 0.29, 0.175),
    (1.02, 0.27, 0.16),
    (1.07, 0.21, 0.13),
    (1.105, 0.12, 0.1),
]


def loft(name, sections, n=40, p=2.2, mat=None, closed_bottom=False, closed_top=False):
    bm = bmesh.new()
    rings = []
    for z, rx, ry in sections:
        rings.append([bm.verts.new((x, y, z)) for x, y in superellipse(n, rx, ry, p, -math.pi / 2)])
    bridge_rings(bm, rings)
    for end, ring, dz in ((closed_bottom, rings[0], -0.01), (closed_top, rings[-1], 0.01)):
        if not end:
            continue
        z = ring[0].co.z
        c = bm.verts.new((0, 0, z + dz))
        m = len(ring)
        for j in range(m):
            bm.faces.new((ring[(j + 1) % m], ring[j], c) if dz < 0 else (ring[j], ring[(j + 1) % m], c))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, mat)


def lerp_sections(sections, z):
    for (z0, a0, b0), (z1, a1, b1) in zip(sections, sections[1:]):
        if z0 <= z <= z1:
            k = (z - z0) / (z1 - z0)
            return a0 + (a1 - a0) * k, b0 + (b1 - b0) * k
    return (sections[0][1], sections[0][2]) if z < sections[0][0] else (sections[-1][1], sections[-1][2])


def shell(ob, thickness=0.012, levels=1):
    modifier(ob, "SOLIDIFY", thickness=thickness, offset=-1)
    apply_modifiers(ob)
    if levels:
        subdivide(ob, levels)


def resample(pts, start, to, n=8):
    lens = [0.0]
    for a, b in zip(pts, pts[1:]):
        lens.append(lens[-1] + (b - a).length)
    total = lens[-1]

    def at(k):
        d = k * total
        for i in range(len(pts) - 1):
            if lens[i] <= d <= lens[i + 1] + 1e-9:
                f = (d - lens[i]) / max(1e-9, lens[i + 1] - lens[i])
                return pts[i].lerp(pts[i + 1], f)
        return pts[-1]

    return [at(start + (to - start) * i / n) for i in range(n + 1)]


def arm_path(s, to=1.0, start=0.0):
    """Shoulder (0) to wrist (1), resampled to nine points."""
    sh, el, wr = mirror(SHOULDER, s), mirror(ELBOW, s), mirror(WRIST, s)
    return resample([sh, sh.lerp(el, 0.5) + V((0.012 * s, 0, 0)), el, el.lerp(wr, 0.5), wr], start, to)


def arm_r(k):
    return 0.092 - 0.026 * k ** 1.2


def leg_path(s, to=1.0, start=0.0):
    """Hip (0) to ankle (1), resampled to nine points."""
    hp, kn, an = mirror(HIP, s), mirror(KNEE, s), mirror(ANKLE, s)
    return resample([hp, hp.lerp(kn, 0.5), kn, kn.lerp(an, 0.5), an], start, to)


def leg_r(k):
    return 0.11 - 0.04 * k


def merge(name, objs, mat):
    bm = bmesh.new()
    for o in objs:
        bm.from_mesh(o.data)
        bpy.data.objects.remove(o)
    return link(name, bm, mat)


def body(m):
    out = {}
    out["torso"] = loft("torso", TORSO, n=36, mat=m["body"], closed_bottom=True, closed_top=True)
    subdivide(out["torso"], 1)
    out["neck"] = sweep("neck", [V((0, 0.012, 1.0)), V((0, 0.01, 1.1)), V((0, 0.005, 1.2))], [0.088, 0.085, 0.084], n=24, mat=m["body"])
    for s, side in ((-1, "R"), (1, "L")):
        out[f"arm{side}"] = sweep(f"arm{side}", arm_path(s), [arm_r(i / 8) for i in range(9)], n=22, mat=m["body"])
        out[f"fist{side}"] = fist(f"fist{side}", mirror(FIST, s), s, m["skin"])
        out[f"leg{side}"] = sweep(f"leg{side}", leg_path(s), [leg_r(i / 8) for i in range(9)], n=22, mat=m["body"])
        out[f"foot{side}"] = foot(f"foot{side}", mirror(ANKLE, s), s, m["skin"])
    for k in ("torso", "neck", "armL", "armR", "legL", "legR"):
        planar_uv(out[k])
    return out


def fist(name, c, s, mat):
    """A closed hand: a rounded block, four curled fingers across the front
    and the thumb over them."""
    palm = sweep(name + "p", [c + V((0, 0.005, 0.055)), c + V((0, 0.0, 0.005)), c + V((0, -0.004, -0.04))], [(0.064, 0.066), (0.07, 0.074), (0.058, 0.062)], n=20, p=2.8, up=(1, 0, 0))
    parts = [palm]
    for i in range(4):
        a = c + V((0, 0, 0.028 - i * 0.024))
        fx = 0.058 - abs(i - 1.5) * 0.004
        parts.append(sweep(f"{name}f{i}", [a + V((-fx * s * 0.2, -0.052, 0)), a + V((fx * s * 0.55, -0.058, 0))], 0.0165, n=10))
    parts.append(sweep(name + "t", [c + V((-0.035 * s, -0.05, 0.045)), c + V((-0.02 * s, -0.074, 0.02)), c + V((0.012 * s, -0.078, 0.012))], [0.024, 0.022, 0.019], n=12))
    return merge(name, parts, mat)


def foot(name, ankle, s, mat):
    # Bare feet, toes a little out, flat soles.
    ang = math.radians(10) * s
    d = V((math.sin(ang), -math.cos(ang), 0))
    heel = ankle + V((0, 0.035, -0.05))
    toe = ankle + d * 0.19 + V((0, 0, -0.06))
    path = [heel, heel.lerp(toe, 0.35) + V((0, 0, 0.012)), heel.lerp(toe, 0.75), toe]
    ob = sweep(name, path, [(0.055, 0.064), (0.06, 0.076), (0.045, 0.08), (0.03, 0.07)], n=20, p=2.6, up=(0, 0, 1))
    for v in ob.data.vertices:
        if v.co.z < 0.0:
            v.co.z *= 0.15
    ob.data.materials.append(mat)
    return ob


# ── Gi ────────────────────────────────────────────────────────────────────

GI_AIR = 0.034
BELT_Z = 0.635


def jacket_sections():
    sec = [
        (0.36, 0.305, 0.215),
        (0.44, 0.29, 0.205),
        (0.54, 0.275, 0.195),
        (0.60, 0.268, 0.19),
        (BELT_Z, 0.262, 0.186),
        (0.67, 0.268, 0.19),
    ]
    for z, rx, ry in TORSO[3:]:
        sec.append((z, rx + GI_AIR, ry + GI_AIR))
    sec[-1] = (1.125, 0.115, 0.1)
    return sec


def gi(m):
    out = {}
    sec = jacket_sections()
    jk = loft("gi_jacket", sec, n=40, p=2.3, mat=m["gi"])
    bm = bmesh.new()
    bm.from_mesh(jk.data)
    # The V of the neck opening; its bottom is where the lapels cross.
    kill = [f for f in bm.faces if (lambda c: c.y < -0.02 and c.z > 0.80 + 2.4 * abs(c.x))(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=kill, context="FACES")
    bm.to_mesh(jk.data)
    bm.free()
    shell(jk, 0.014)
    planar_uv(jk)
    out["gi_jacket"] = jk

    def surf(x, z, lift=0.0):
        rx, ry = lerp_sections(sec, z)
        k = min(0.999, abs(x) / rx)
        return V((x, -ry * math.sqrt(1 - k * k) - lift, z))

    # Lapels: thick bands along the edges of the V, the fighter's left one on top.
    top = [V((0.0, 0.118, 1.12)), V((0.075, 0.1, 1.125)), V((0.12, 0.02, 1.115))]
    for z in (1.06, 1.0, 0.94, 0.88, 0.83, 0.78, 0.72, 0.665):
        top.append(surf(0.13 - (1.06 - z) * 0.64, z, 0.016))
    under = [V((0.0, 0.118, 1.12)), V((-0.075, 0.1, 1.125)), V((-0.12, 0.02, 1.115))]
    for z in (1.06, 1.0, 0.94, 0.88, 0.84, 0.81):
        under.append(surf(-(0.13 - (1.06 - z) * 0.54), z, 0.006))
    out["gi_lapelL"] = sweep("gi_lapelL", top, (0.018, 0.048), n=16, p=3.5, up=(0, -1, 0), mat=m["lapel"])
    out["gi_lapelR"] = sweep("gi_lapelR", under, (0.017, 0.046), n=16, p=3.5, up=(0, -1, 0), mat=m["lapel"])
    for o in (out["gi_lapelL"], out["gi_lapelR"]):
        subdivide(o, 1)

    for s, side in ((-1, "R"), (1, "L")):
        path = [mirror(SHOULDER, s) + V((-0.05 * s, 0, 0.02))] + arm_path(s, 0.8)
        sl = sweep(f"gi_sleeve{side}", path, [0.1] + [0.122 - 0.016 * i / 8 for i in range(9)], n=22, mat=m["gi"], caps=(True, False))
        shell(sl, 0.013)
        planar_uv(sl)
        out[f"gi_sleeve{side}"] = sl
        pts = [mirror(HIP, s) + V((-0.02 * s, 0, 0.08))] + leg_path(s, 0.9)
        leg = sweep(f"gi_leg{side}", pts, [0.13] + [0.132 - 0.016 * i / 8 for i in range(9)], n=22, mat=m["gi"], caps=(True, False))
        shell(leg, 0.013)
        planar_uv(leg)
        out[f"gi_leg{side}"] = leg
    out.update(belt(m))
    return out


def belt(m):
    out = {}
    sec = jacket_sections()
    rx, ry = lerp_sections(sec, BELT_Z)
    loop = [V((math.cos(a) * (rx + 0.012), math.sin(a) * (ry + 0.012), BELT_Z)) for a in [math.tau * i / 48 for i in range(48)]]
    out["belt"] = sweep("belt", loop, (0.034, 0.012), n=12, p=4, up=(0, 0, 1), closed=True, mat=m["belt"])
    front = -(ry + 0.03)
    out["belt_knot"] = sweep("belt_knot", [V((-0.05, front, BELT_Z + 0.004)), V((0.05, front, BELT_Z + 0.004))], (0.042, 0.02), n=14, p=3.2, up=(0, 0, 1), mat=m["belt"])
    ends = {}
    for s, side in ((-1, "R"), (1, "L")):
        path = [V((0.012 * s, front - 0.008, BELT_Z - 0.02)), V((0.045 * s, front - 0.012, BELT_Z - 0.1)), V((0.075 * s, front - 0.006, BELT_Z - 0.2)), V((0.088 * s, front + 0.004, BELT_Z - 0.255))]
        ends[side] = path
        out[f"belt_end{side}"] = sweep(f"belt_end{side}", path, (0.03, 0.009), n=12, p=4, up=(0, -1, 0), mat=m["belt"], round_caps=(False, False))
    # The rank bar near the end of one tail, with room for four stripes.
    p = ends["L"]
    a, b = p[2].lerp(p[3], -0.25), p[3].lerp(p[2], 0.12)
    out["belt_bar"] = sweep("belt_bar", [a, a.lerp(b, 0.5), b], (0.0325, 0.0115), n=12, p=4, up=(0, -1, 0), mat=m["beltbar"], round_caps=(False, False))
    for i in range(4):
        k0 = 0.18 + i * 0.17
        c0, c1 = a.lerp(b, k0), a.lerp(b, k0 + 0.07)
        out[f"belt_stripe{i + 1}"] = sweep(f"belt_stripe{i + 1}", [c0, c1], (0.0335, 0.0125), n=12, p=4, up=(0, -1, 0), mat=m["stripe"], round_caps=(False, False))
    return out


# ── No-gi ─────────────────────────────────────────────────────────────────

TOP_AIR = 0.012


def nogi(m):
    out = {}
    sec = [(0.5, 0.265, 0.175)] + [(z, rx + TOP_AIR, ry + TOP_AIR) for z, rx, ry in TORSO[1:-1]] + [(1.1, 0.13, 0.108)]
    top = loft("ng_top", sec, n=36, p=2.2, mat=m["top"])
    shell(top, 0.01)
    planar_uv(top)
    out["ng_top"] = top
    ring = [V((math.cos(a) * 0.122, math.sin(a) * 0.104 + 0.004, 1.1)) for a in [math.tau * i / 36 for i in range(36)]]
    out["ng_collar"] = sweep("ng_collar", ring, (0.011, 0.012), n=10, closed=True, up=(0, 0, 1), mat=m["topdark"])
    for s, side in ((-1, "R"), (1, "L")):
        for kind, to in (("long", 0.97), ("short", 0.42)):
            path = [mirror(SHOULDER, s) + V((-0.04 * s, 0, 0.015))] + arm_path(s, to)
            r = [0.096] + [arm_r(to * i / 8) + TOP_AIR for i in range(9)]
            sl = sweep(f"ng_{kind}{side}", path, r, n=18, mat=m["top"], caps=(True, False))
            shell(sl, 0.01)
            planar_uv(sl)
            out[f"ng_{kind}{side}"] = sl
            back = path[-1] + (path[-2] - path[-1]).normalized() * 0.02
            out[f"ng_{kind}cuff{side}"] = sweep(f"ng_{kind}cuff{side}", [back, path[-1]], r[-1] + 0.004, n=24, mat=m["topdark"], round_caps=(False, False))
    # Shorts: the seat and two wide legs to mid thigh, with a waistband.
    hip = [(0.44, 0.27, 0.185), (0.52, 0.272, 0.182), (0.6, 0.262, 0.172), (0.68, 0.258, 0.17)]
    parts = [loft("ng_seat", hip, n=32, p=2.2, closed_bottom=True)]
    for s in (-1, 1):
        pts = [mirror(HIP, s) + V((-0.015 * s, 0, 0.04))] + leg_path(s, 0.32)
        parts.append(sweep("ng_shortsleg", pts, [0.142] + [0.148 - 0.006 * i / 8 for i in range(9)], n=20, caps=(True, False)))
    shorts = merge("ng_shorts", parts, m["bottom"])
    shell(shorts, 0.012)
    planar_uv(shorts)
    out["ng_shorts"] = shorts
    band = loft("ng_waist", [(0.655, 0.268, 0.178), (0.70, 0.266, 0.177)], n=44, mat=m["bottomdark"])
    shell(band, 0.01, 0)
    out["ng_waist"] = band
    # Spats: tight to the ankle.
    parts = [loft("ng_spatsseat", [(0.46, 0.258, 0.172), (0.56, 0.255, 0.168), (0.66, 0.25, 0.166)], n=32, closed_bottom=True)]
    for s in (-1, 1):
        pts = [mirror(HIP, s) + V((-0.01 * s, 0, 0.03))] + leg_path(s, 0.93)
        parts.append(sweep("ng_spatsleg", pts, [0.118] + [leg_r(0.93 * i / 8) + 0.009 for i in range(9)], n=18, caps=(True, False)))
    spats = merge("ng_spats", parts, m["spats"])
    shell(spats, 0.008)
    planar_uv(spats)
    out["ng_spats"] = spats
    return out


# ── Extras ────────────────────────────────────────────────────────────────


def extras(m):
    out = {}
    for s, side in ((-1, "R"), (1, "L")):
        k = mirror(KNEE, s)
        out[f"x_knee{side}"] = sweep(f"x_knee{side}", [k + V((0, 0, 0.06)), k + V((0, 0, -0.06))], (0.125, 0.12), n=24, p=2.6, mat=m["pad"], round_caps=(False, False))
        c = mirror(FIST, s)
        bands = []
        for i, dz in enumerate((0.03, 0.006, -0.018)):
            bands.append(sweep(f"x_tape{side}{i}", [c + V((-0.075 * s, -0.012, dz)), c + V((0.075 * s, -0.012, dz))], (0.008, 0.078), n=12, p=2.2, up=(0, 0, 1)))
        out[f"x_tape{side}"] = merge(f"x_tape{side}", bands, m["tape"])
    # A towel over the fighter's left shoulder.
    path = [V((0.14, -0.2, 0.78)), V((0.2, -0.2, 0.96)), V((0.24, -0.13, 1.08)), V((0.25, 0.0, 1.12)), V((0.24, 0.14, 1.06)), V((0.2, 0.2, 0.9))]
    out["x_towel"] = sweep("x_towel", path, (0.012, 0.075), n=16, p=3, up=(0, -1, 0), mat=m["towel"], round_caps=(False, False))
    subdivide(out["x_towel"], 1)
    # A medal on a ribbon.
    rib = [V((-0.12, 0.02, 1.1)), V((-0.08, -0.16, 1.02)), V((0, -0.235, 0.86))]
    rib2 = [V((0.12, 0.02, 1.1)), V((0.08, -0.16, 1.02)), V((0, -0.235, 0.86))]
    out["x_ribbon"] = merge("x_ribbon", [sweep("r1", rib, (0.006, 0.026), n=10, p=3, up=(0, -1, 0)), sweep("r2", rib2, (0.006, 0.026), n=10, p=3, up=(0, -1, 0))], m["ribbon"])
    out["x_medal"] = sweep("x_medal", [V((0, -0.235, 0.8)), V((0, -0.25, 0.8))], (0.06, 0.06), n=32, mat=m["medal"], round_caps=(False, False))
    return out
