"""The head as an analytic surface, so hair and headwear can sit exactly on it
and the six face shapes are shape keys of one mesh."""

import math

import bmesh
from mathutils import Vector

from geo import link

HC = Vector((0.0, 0.0, 1.45))
# The whole head a touch smaller than the first cut, for a sturdier body.
HEAD_SCALE = 0.93

# Face shapes, in the order of FACE_SHAPES in avatarOptions.ts:
# Oval, Rund, Kantig, Herz, Lang, Breit.
SHAPES = [
    dict(a=0.43, b=0.40, c=0.41, lo=1.00, taper=0.26, box=2.0, chin=0.0),
    dict(a=0.445, b=0.41, c=0.40, lo=0.96, taper=0.12, box=2.0, chin=0.0),
    dict(a=0.43, b=0.40, c=0.41, lo=0.95, taper=0.06, box=3.2, chin=0.0),
    dict(a=0.44, b=0.40, c=0.41, lo=1.02, taper=0.40, box=2.0, chin=0.05),
    dict(a=0.415, b=0.39, c=0.41, lo=1.14, taper=0.24, box=2.0, chin=0.0),
    dict(a=0.475, b=0.41, c=0.40, lo=0.98, taper=0.20, box=2.4, chin=0.0),
]


def head_pt(phi, t, s=None, off=0.0):
    """Point on the head. phi: azimuth, 0 = the face (-Y), grows towards +X.
    t: polar angle from the top of the head. off pushes it outward."""
    s = s or SHAPES[0]
    st, ct = math.sin(t), math.cos(t)
    sp, cp = math.sin(phi), math.cos(phi)
    # Horizontal section: a superellipse, boxier for the square jaw.
    k = max(0.0, -ct)
    p = 2.0 + (s["box"] - 2.0) * min(1.0, k * 1.6)
    ex = math.copysign(abs(sp) ** (2.0 / p), sp)
    ey = math.copysign(abs(cp) ** (2.0 / p), cp)
    x = s["a"] * st * ex
    y = -s["b"] * st * ey
    z = s["c"] * ct
    # A big skull and a small jaw: the lower half narrows.
    narrow = 1.0 - s["taper"] * k ** 1.6
    x *= narrow
    if y < 0:
        y *= 0.90 * (1.0 - 0.25 * s["taper"] * k ** 1.6)  # a flatter face
    else:
        y *= 1.04
    if ct > 0:
        x *= 1.0 + 0.03 * ct
    else:
        z *= s["lo"]
    # A slightly pointed chin for the heart shape.
    if s["chin"] and ct < 0:
        z -= s["chin"] * max(0.0, cp) * k ** 4
    v = Vector((x, y, z)) * HEAD_SCALE
    if off:
        v += v.normalized() * off
    return HC + v


def head_normal(phi, t, s=None):
    e = 1e-3
    a = head_pt(phi + e, t, s) - head_pt(phi - e, t, s)
    b = head_pt(phi, t + e, s) - head_pt(phi, t - e, s)
    n = b.cross(a)
    if n.length < 1e-9:
        return (head_pt(phi, t, s) - HC).normalized()
    n.normalize()
    if n.dot(head_pt(phi, t, s) - HC) < 0:
        n = -n
    return n


def head_on(phi, t, off, s=None):
    return head_pt(phi, t, s) + head_normal(phi, t, s) * off


def sphere_mesh(name, fn, nu=64, nv=40, t0=0.0, t1=math.pi, u0=None, u1=None, mat=None, uv=None, shape_fns=None, bottom_pole=True):
    """A lat-long mesh over fn(phi, t). A full turn gets poles; a patch
    (u0, u1 given) is an open grid. shape_fns become shape keys."""
    full = u0 is None
    bm = bmesh.new()
    params = []
    rows = []
    for j in range(nv + 1):
        t = t0 + (t1 - t0) * j / nv
        pole = full and (j == 0 and t0 <= 1e-6 or j == nv and t1 >= math.pi - 1e-6 and bottom_pole)
        if pole:
            params.append((0.0, t))
            rows.append([bm.verts.new(fn(0.0, t))])
            continue
        row = []
        cols = nu if full else nu + 1
        for i in range(cols):
            phi = (math.tau * i / nu - math.pi) if full else u0 + (u1 - u0) * i / nu
            params.append((phi, t))
            row.append(bm.verts.new(fn(phi, t)))
        rows.append(row)
    layer = bm.loops.layers.uv.new("UVMap") if uv else None
    for j in range(nv):
        a, b = rows[j], rows[j + 1]
        if len(a) == 1:
            for i in range(len(b)):
                f = bm.faces.new((a[0], b[(i + 1) % len(b)], b[i]))
        elif len(b) == 1:
            for i in range(len(a)):
                f = bm.faces.new((a[i], a[(i + 1) % len(a)], b[0]))
        else:
            m = len(a)
            for i in range(m if full else m - 1):
                i2 = (i + 1) % m
                f = bm.faces.new((a[i], a[i2], b[i2], b[i]))
                if layer is not None:
                    for loop in f.loops:
                        loop[layer].uv = uv(loop.vert.co)
    bm.verts.index_update()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Normals point out of the head.
    for f in bm.faces:
        if f.normal.dot(f.calc_center_median() - HC) < 0:
            f.normal_flip()
    ob = link(name, bm, mat)
    if shape_fns:
        ob.shape_key_add(name="Basis")
        for key, sfn in shape_fns:
            sk = ob.shape_key_add(name=key)
            for idx, (phi, t) in enumerate(params):
                sk.data[idx].co = sfn(phi, t)
    return ob


# The face decal: front of the head, planar UVs in a 1 x 1 frame around the
# head centre. The face texture is drawn in the same frame (see face.ts).
FACE_FRAME = 1.0


def face_uv(co):
    return (0.5 + (co.x - HC.x) / FACE_FRAME, 0.5 + (co.z - HC.z) / FACE_FRAME)


def build_head(mat_skin, mat_face):
    keys = [(f"shape{i}", (lambda s: lambda phi, t: head_pt(phi, t, s))(SHAPES[i])) for i in range(1, len(SHAPES))]
    head = sphere_mesh("head", lambda phi, t: head_pt(phi, t), nu=72, nv=48, mat=mat_skin, shape_fns=keys)
    fkeys = [(k, (lambda s: lambda phi, t: head_pt(phi, t, s, 0.004))(SHAPES[i + 1])) for i, (k, _) in enumerate(keys)]
    face = sphere_mesh(
        "face",
        lambda phi, t: head_pt(phi, t, None, 0.004),
        nu=40,
        nv=40,
        t0=math.radians(38),
        t1=math.radians(176),
        u0=-math.radians(78),
        u1=math.radians(78),
        mat=mat_face,
        uv=face_uv,
        shape_fns=fkeys,
    )
    return head, face
