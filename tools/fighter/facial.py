"""Beards, ears and earrings.

Beards are shells over the lower face whose thickness follows a mask drawn
in the coordinates of the flat SVG face (head centre 120/96, see
src/arc/fighter3d/face.ts). Outside the mask the shell sinks under the skin,
so its edge is a clean line on the face. Each beard has the six face shapes
as shape keys, like the head."""

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

from geo import ellipsoid, link, sweep
from head import HC, HEAD_SCALE, SHAPES, head_normal, head_pt, sphere_mesh

V = Vector
D = math.radians
K = 0.43 * HEAD_SCALE / 46


def smooth01(a, b, x):
    k = max(0.0, min(1.0, (x - a) / (b - a)))
    return k * k * (3 - 2 * k)


def svg_xy(p):
    """A point on the head in the flat face's SVG coordinates."""
    return 120 + (p.x - HC.x) / K, 96 - (p.z - HC.z) / K


def lerp(a, b, k):
    return a + (b - a) * k


def upper_full(dx):
    # The top edge of a full beard: under the nose, dipping at the mouth
    # corners, rising along the jaw to the ears.
    if dx < 14:
        return lerp(122.5, 124, dx / 14)
    if dx < 24:
        return lerp(124, 122, (dx - 14) / 10)
    return lerp(122, 100, min(1.0, (dx - 24) / 20))


def mouth_hole(X, Y):
    d = ((X - 120) / 11.5) ** 2 + ((Y - 129) / 4.8) ** 2
    return smooth01(0.8, 1.25, d)


def full_mask(X, Y, front):
    dx = abs(X - 120)
    m = smooth01(-1.5, 2.5, Y - upper_full(dx)) * mouth_hole(X, Y)
    return m * front


BEARDS = {
    # kind: (mask, thickness)
    2: (lambda X, Y, f: full_mask(X, Y, f), 0.03),
    3: (lambda X, Y, f: smooth01(-1, 2, Y - 134) * smooth01(-18, -12, -abs(X - 120)) * f, 0.03),
    4: (lambda X, Y, f: smooth01(-1, 1.5, Y - 122.2) * smooth01(-1, 1.5, 125.6 - Y) * smooth01(-15, -10, -abs(X - 120)) * f, 0.024),
    5: (
        lambda X, Y, f: max(
            smooth01(-1, 1.5, Y - 122.2) * smooth01(-1, 1.5, 125.6 - Y) * smooth01(-14, -9, -abs(X - 120)),
            smooth01(-1, 2, Y - 134) * smooth01(-11, -6, -abs(X - 120)),
        )
        * f,
        0.026,
    ),
    6: (lambda X, Y, f: full_mask(X, Y, f), 0.04),
    7: (lambda X, Y, f: smooth01(-1, 2, abs(X - 120) - 36) * smooth01(-1, 2, 126 - Y) * smooth01(-1, 2, Y - 92) * f, 0.018),
}


def beard(kind, mat):
    mask, thick = BEARDS[kind]

    def off(phi, t):
        p = head_pt(phi, t)
        X, Y = svg_xy(p)
        front = 1.0 - smooth01(D(95), D(115), abs(phi))
        m = mask(X, Y, front)
        # Fuller at the chin, where it hangs below the jaw.
        chin = 1.0 + 1.8 * smooth01(D(128), D(170), t) * (1.0 - smooth01(D(40), D(90), abs(phi)))
        return -0.016 + (0.016 + thick * chin) * m

    def fn(phi, t, s=None):
        return head_pt(phi, t, s) + head_normal(phi, t, s) * off(phi, t)

    keys = [(f"shape{i}", (lambda s: lambda phi, t: fn(phi, t, s))(SHAPES[i])) for i in range(1, len(SHAPES))]
    ob = sphere_mesh(f"beard_{kind}", fn, nu=64, nv=36, t0=D(70), t1=D(179), u0=D(-125), u1=D(125), mat=mat, shape_fns=keys)
    return ob


def long_tail(mat):
    """The long beard's point, hanging from the chin to the chest."""
    chin = head_pt(0.0, D(172))
    pts = [chin + V((0, -0.05, 0.03)), chin + V((0, -0.1, -0.05)), chin + V((0, -0.115, -0.15)), chin + V((0, -0.1, -0.25)), chin + V((0, -0.085, -0.31))]
    return sweep("beard_6_tail", pts, [(0.05, 0.13), (0.055, 0.12), (0.045, 0.09), (0.03, 0.05), (0.006, 0.01)], n=18, up=(0, -1, 0), mat=mat)


def beards(mats):
    out = {}
    for kind in BEARDS:
        out[f"beard_{kind}"] = beard(kind, mats["hair"])
    tail = long_tail(mats["hair"])
    out["beard_6_tail"] = tail
    for ob in out.values():
        # The hair tip colour stays off beards: the whole beard is "root".
        me = ob.data
        if not me.uv_layers:
            me.uv_layers.new(name="UVMap")
        for d in me.uv_layers.active.data:
            d.uv = (0.5, 1.0)
    return out


# ── Ears ──────────────────────────────────────────────────────────────────

EAR_AT = (D(90), D(99))


def ear_frame(s):
    """Where the ear sits (fighter's left is +X) and the local axes: out, forward, up."""
    phi, t = EAR_AT
    p = head_pt(phi * s, t)
    return p


def one_ear(name, s, shape, mat):
    p = ear_frame(s)
    if shape == 3:
        # Pointed: the rim runs up and back into a tip.
        path = [p + V((0.0, 0.0, -0.07)), p + V((0.012 * s, 0.01, -0.02)), p + V((0.02 * s, 0.03, 0.04)), p + V((0.03 * s, 0.07, 0.1))]
        ob = sweep(name, path, [(0.022, 0.04), (0.026, 0.05), (0.022, 0.04), (0.004, 0.006)], n=16, up=(1, 0, 0), mat=mat)
        return ob
    scale = {0: 1.0, 1: 0.76, 2: 1.12}.get(shape, 1.0)
    rx, ry, rz = 0.028, 0.055 * scale, 0.082 * scale
    ob = ellipsoid(name, (0, 0, 0), (rx, ry, rz), n=20, rings=12)
    # A shallow bowl: push the outer face in a little around the middle.
    for v in ob.data.vertices:
        if v.co.x > 0:
            k = max(0.0, 1 - (v.co.y / ry) ** 2 - (v.co.z / rz) ** 2)
            v.co.x -= 0.018 * k
    ob.data.materials.append(mat)
    turn = D(38 if shape != 2 else 62)
    # The outer face turns a little forward, protruding ears further.
    rot = Matrix.Rotation(-turn, 4, "Z") if s > 0 else Matrix.Rotation(turn, 4, "Z") @ Matrix.Rotation(math.pi, 4, "Z")
    ob.data.transform(rot)
    ob.data.transform(Matrix.Translation(p + V((0.03 * s, 0.022, -0.005))))
    return ob


def ears(mats):
    out = {}
    for shape in range(4):
        for s, side in ((-1, "R"), (1, "L")):
            out[f"ear{shape}{side}"] = one_ear(f"ear{shape}{side}", s, shape, mats["skin"])
    # A cauliflower ear on the fighter's right (the viewer's left).
    p = ear_frame(-1)
    lumps = []
    for i, (dx, dy, dz, r) in enumerate(((0.0, 0.01, 0.03, 0.045), (-0.012, 0.02, -0.02, 0.045), (0.004, -0.015, -0.045, 0.035), (0.0, 0.03, 0.01, 0.035))):
        lumps.append(ellipsoid(f"cl{i}", p + V((-0.035 + dx, 0.015 + dy, dz)), (r * 0.8, r, r), n=14, rings=10))
    bm = bmesh.new()
    for o in lumps:
        bm.from_mesh(o.data)
        bpy.data.objects.remove(o)
    out["ear_cauli"] = link("ear_cauli", bm, mats["cauli"])
    # Earrings on the lobes of the normal ear.
    for s, side in ((-1, "R"), (1, "L")):
        lobe = ear_frame(s) + V((0.045 * s, 0.0, -0.075))
        out[f"ring_stud{side}"] = ellipsoid(f"ring_stud{side}", lobe, (0.012, 0.012, 0.012), n=12, rings=8, mat=mats["gold"])
        ring = [lobe + V((0.004 * s, math.sin(a) * 0.026, -0.026 + math.cos(a) * 0.026)) for a in [math.tau * i / 24 for i in range(24)]]
        out[f"ring_hoop{side}"] = sweep(f"ring_hoop{side}", ring, 0.005, n=8, closed=True, mat=mats["gold"])
    return out
