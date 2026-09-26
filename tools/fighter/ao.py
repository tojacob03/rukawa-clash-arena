"""Ambient occlusion baked into vertex colours, so creases, the inside of
sleeves, the neck under the chin and the roots of the hair darken the way
they would under soft light. Each part is baked among the parts it is worn
with; the app multiplies the colour into the material (vertexColors)."""

import re

import bpy

BODY = ("torso", "neck", "armL", "armR", "fistL", "fistR", "legL", "legR", "footL", "footR")
HEAD = ("head", "ear0L", "ear0R")
NOGI = ("ng_top", "ng_collar", "ng_longL", "ng_longR", "ng_longcuffL", "ng_longcuffR", "ng_shorts")
STRENGTH = 0.7


def context_for(name, names):
    base = set(BODY) | set(HEAD)
    if name.startswith(("gi_", "belt", "x_")):
        return base | {n for n in names if n.startswith(("gi_", "belt"))}
    if name.startswith("ng_"):
        return base | set(NOGI)
    m = re.match(r"^(hair_\d\d|beard_\d)", name)
    if m:
        return base | {n for n in names if n.startswith(m.group(1))}
    m = re.match(r"^hw_([a-z]+)(@[a-z]+)?", name)
    if m:
        style, trim = m.group(1), m.group(2)
        mates = set()
        for n in names:
            k = re.match(r"^hw_([a-z]+)(@[a-z]+)?", n)
            if k and k.group(1) == style and (k.group(2) in (None, trim)):
                mates.add(n)
        return base | mates
    return base


def smooth(vals, me, passes=2):
    """Average each vertex with its neighbours: takes out the sampling grain."""
    nb = [[] for _ in vals]
    for e in me.edges:
        a, b = e.vertices
        nb[a].append(b)
        nb[b].append(a)
    for _ in range(passes):
        vals = [(v + sum(vals[j] for j in n)) / (1 + len(n)) if n else v for v, n in zip(vals, nb)]
    return vals


def bake(objects, samples=64, distance=0.22):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    if sc.world is None:
        sc.world = bpy.data.worlds.new("ao")
    sc.world.light_settings.distance = distance
    names = [o.name for o in objects]
    by_name = {o.name: o for o in objects}
    for ob in objects:
        me = ob.data
        attr = me.color_attributes.new("ao", "BYTE_COLOR", "POINT")
        me.color_attributes.active_color = attr
        if ob.name == "face" or ob.name.startswith("ring_"):
            for d in attr.data:
                d.color = (1, 1, 1, 1)
            continue
        ctx = context_for(ob.name, names) | {ob.name}
        for o in objects:
            o.hide_render = o.name not in ctx
        bpy.ops.object.select_all(action="DESELECT")
        ob.select_set(True)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
        vals = smooth([d.color[0] for d in attr.data], me)
        for d, a in zip(attr.data, vals):
            v = 1.0 - STRENGTH * (1.0 - a)
            d.color = (v, v, v, 1.0)
    for o in by_name.values():
        o.hide_render = False
