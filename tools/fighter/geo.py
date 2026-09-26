"""Geometry helpers for the fighter: sweeps, lathes, grids from a surface
function. Everything is built with bmesh so the build is a plain script with
no hand-made .blend file behind it."""

import math

import bmesh
import bpy
from mathutils import Matrix, Vector

TAU = math.tau


def link(name, bm, mat=None, smooth=True, parent=None):
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    if smooth:
        me.shade_smooth()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat is not None:
        me.materials.append(mat)
    if parent is not None:
        ob.parent = parent
    return ob


def superellipse(n, rx, ry, p=2.0, phase=0.0):
    """Points of a superellipse (p=2 ellipse, larger p boxier) in the plane."""
    out = []
    for i in range(n):
        a = phase + TAU * i / n
        c, s = math.cos(a), math.sin(a)
        x = rx * math.copysign(abs(c) ** (2.0 / p), c)
        y = ry * math.copysign(abs(s) ** (2.0 / p), s)
        out.append((x, y))
    return out


def frames(path, up=None):
    """Parallel-transport frames (tangent, normal, binormal) along a polyline."""
    n = len(path)
    tan = []
    for i in range(n):
        a = path[max(0, i - 1)]
        b = path[min(n - 1, i + 1)]
        tan.append((b - a).normalized())
    hint = Vector(up) if up is not None else Vector((1, 0, 0))
    if abs(hint.dot(tan[0])) > 0.95:
        hint = Vector((0, 1, 0))
    nor = (hint - tan[0] * hint.dot(tan[0])).normalized()
    out = []
    for i in range(n):
        if i > 0:
            axis = tan[i - 1].cross(tan[i])
            if axis.length > 1e-8:
                ang = math.asin(max(-1.0, min(1.0, axis.length)))
                if tan[i - 1].dot(tan[i]) < 0:
                    ang = math.pi - ang
                nor = Matrix.Rotation(ang, 3, axis.normalized()) @ nor
            nor = (nor - tan[i] * nor.dot(tan[i])).normalized()
        out.append((tan[i], nor, tan[i].cross(nor)))
    return out


def bridge_rings(bm, rings, closed_loop=False):
    faces = []
    count = len(rings)
    last = count if closed_loop else count - 1
    for i in range(last):
        a = rings[i]
        b = rings[(i + 1) % count]
        m = len(a)
        for j in range(m):
            f = bm.faces.new((a[j], a[(j + 1) % m], b[(j + 1) % m], b[j]))
            faces.append(f)
    return faces


def cap(bm, ring, tip, flip=False):
    v = bm.verts.new(tip)
    m = len(ring)
    for j in range(m):
        q = (ring[j], ring[(j + 1) % m], v)
        bm.faces.new(tuple(reversed(q)) if flip else q)


def sweep(name, path, radii, n=20, p=2.0, up=None, caps=(True, True), round_caps=(True, True), mat=None, closed=False, twist=0.0, open_ends=False, parent=None):
    """Sweep a (super)ellipse along a polyline. radii: float or (rx, ry) per point.
    round_caps closes an end with a dome, otherwise with a flat fan."""
    path = [Vector(q) for q in path]
    fr = frames(path, up)
    bm = bmesh.new()
    rings = []
    for i, (t, nrm, bi) in enumerate(fr):
        r = radii[i] if isinstance(radii, list) else radii
        rx, ry = (r, r) if isinstance(r, (int, float)) else r
        tw = twist * i / max(1, len(path) - 1)
        pts = superellipse(n, max(rx, 1e-4), max(ry, 1e-4), p, tw)
        rings.append([bm.verts.new(path[i] + nrm * x + bi * y) for x, y in pts])
    bridge_rings(bm, rings, closed)
    if not closed and not open_ends:
        for end, idx, sign in ((0, 0, -1), (1, -1, 1)):
            if not caps[end]:
                continue
            t, nrm, bi = fr[idx]
            r = radii[idx] if isinstance(radii, list) else radii
            rx, ry = (r, r) if isinstance(r, (int, float)) else r
            ring = rings[idx]
            if round_caps[end] and max(rx, ry) > 1e-3:
                steps = 4
                prev = ring
                for k in range(1, steps):
                    th = (math.pi / 2) * k / steps
                    c = path[idx] + t * sign * math.sin(th) * min(rx, ry)
                    pts = superellipse(n, rx * math.cos(th), ry * math.cos(th), p, twist if idx == -1 else 0)
                    cur = [bm.verts.new(c + nrm * x + bi * y) for x, y in pts]
                    if sign < 0:
                        bridge_rings(bm, [cur, prev])
                    else:
                        bridge_rings(bm, [prev, cur])
                    prev = cur
                cap(bm, prev, path[idx] + t * sign * min(rx, ry), flip=sign < 0)
            else:
                cap(bm, ring, path[idx], flip=sign < 0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, mat, parent=parent)


def lathe(name, profile, n=48, mat=None, xs=1.0, ys=1.0, center=(0, 0, 0), parent=None, closed_top=True, closed_bottom=True):
    """Revolve (r, z) around Z. Points with r == 0 become poles."""
    bm = bmesh.new()
    cx, cy, cz = center
    rings = []
    poles = []
    for r, z in profile:
        if r <= 1e-6:
            poles.append((len(rings), bm.verts.new((cx, cy, cz + z))))
            rings.append(None)
            continue
        ring = []
        for i in range(n):
            a = TAU * i / n
            ring.append(bm.verts.new((cx + math.cos(a) * r * xs, cy + math.sin(a) * r * ys, cz + z)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        a, b = rings[i], rings[i + 1]
        if a is not None and b is not None:
            bridge_rings(bm, [a, b])
        elif a is None and b is not None:
            cap(bm, b, poles[[k for k, _ in poles].index(i)][1].co, flip=False)
        elif a is not None and b is None:
            cap(bm, a, poles[[k for k, _ in poles].index(i + 1)][1].co, flip=True)
    for idx, v in poles:
        if not v.link_faces:
            bm.verts.remove(v)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, mat, parent=parent)


def grid_surface(name, fn, nu, nv, wrap_u=False, mat=None, uv=None, parent=None):
    """Mesh from a parametric surface fn(u, v) -> Vector with u, v in [0, 1].
    uv(u, v, co) -> (s, t) sets a UV map when given."""
    bm = bmesh.new()
    cols = nu if wrap_u else nu + 1
    verts = [[bm.verts.new(fn(i / nu, j / nv)) for i in range(cols)] for j in range(nv + 1)]
    layer = bm.loops.layers.uv.new("UVMap") if uv else None
    for j in range(nv):
        for i in range(nu):
            i2 = (i + 1) % cols if wrap_u else i + 1
            quad = (verts[j][i], verts[j][i2], verts[j + 1][i2], verts[j + 1][i])
            if len({id(q) for q in quad}) < 4:
                continue
            try:
                f = bm.faces.new(quad)
            except ValueError:
                continue
            if layer is not None:
                for loop in f.loops:
                    loop[layer].uv = uv(loop.vert.co)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return link(name, bm, mat, parent=parent)


def ellipsoid(name, c, r, n=24, rings=16, mat=None, parent=None):
    rx, ry, rz = r
    prof = [(math.sin(math.pi * k / rings), -math.cos(math.pi * k / rings)) for k in range(rings + 1)]
    ob = lathe(name, [(pr * 1.0, pz) for pr, pz in prof], n=n, mat=mat, parent=parent)
    ob.scale = (rx, ry, rz)
    ob.location = c
    apply_transform(ob)
    return ob


def apply_transform(ob):
    me = ob.data
    me.transform(ob.matrix_basis)
    ob.matrix_basis = Matrix.Identity(4)


def modifier(ob, kind, **kw):
    m = ob.modifiers.new(kind.lower(), kind)
    for k, v in kw.items():
        setattr(m, k, v)
    return m


def apply_modifiers(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = ob.data
    ob.modifiers.clear()
    ob.data = me
    bpy.data.meshes.remove(old)


def subdivide(ob, levels=1):
    modifier(ob, "SUBSURF", levels=levels, render_levels=levels)
    apply_modifiers(ob)
    ob.data.shade_smooth()


def join(name, objs):
    bm = bmesh.new()
    for o in objs:
        me = o.data.copy()
        me.transform(o.matrix_world)
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
    mat = objs[0].data.materials[0] if objs[0].data.materials else None
    for o in objs:
        bpy.data.objects.remove(o)
    return link(name, bm, mat)


def set_origin(ob, point):
    """Move the object's origin to point, keeping the mesh where it is."""
    p = Vector(point)
    ob.data.transform(Matrix.Translation(-p))
    ob.location = p


# The body frame: clothes, skin tattoos and patches share one planar UV
# projection from the front, x in [-0.6, 0.6], z in [0, 1.2]. The app draws
# the patterns into a canvas in the same frame (fighter3d/textures.ts).
BODY_FRAME = (-0.6, 0.0, 1.2)


def planar_uv(ob, frame=BODY_FRAME):
    x0, z0, size = frame
    me = ob.data
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    layer = me.uv_layers.active.data
    for poly in me.polygons:
        for li in poly.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            layer[li].uv = ((co.x - x0) / size, (co.z - z0) / size)
