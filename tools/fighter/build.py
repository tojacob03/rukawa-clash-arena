"""Builds public/arc/fighter/*.glb, the 3D fighter of Waza Arc: base.glb
(body, clothes, head, beards, ears) and one file per hair style and per
headwear style.

Run with Blender's Python module (pip install bpy==5.0.1) and Node on the path
(the files are compressed with gltf-transform via npx):
    python tools/fighter/build.py [--preview out.png] [--no-export] [--no-pack]

Every part is its own object; the app shows and colours them per look and gear
(see src/arc/fighter3d). Materials are named after the colour slot the app
fills in: skin, gi, lapel, belt, beltbar, stripe, hair, face, ...
"""

import math
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bpy  # noqa: E402
from mathutils import Vector  # noqa: E402

import body  # noqa: E402
import facial  # noqa: E402
import hair  # noqa: E402
import hats  # noqa: E402
from head import build_head  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

PREVIEW = {
    "skin": (0.94, 0.77, 0.62),
    "body": (0.94, 0.77, 0.62),
    "top": (0.2, 0.3, 0.7),
    "topdark": (0.1, 0.1, 0.12),
    "bottom": (0.1, 0.1, 0.14),
    "bottomdark": (0.05, 0.05, 0.06),
    "spats": (0.1, 0.1, 0.14),
    "pad": (0.16, 0.16, 0.2),
    "tape": (0.97, 0.96, 0.92),
    "towel": (0.44, 0.7, 0.79),
    "medal": (0.95, 0.75, 0.34),
    "ribbon": (0.78, 0.19, 0.16),
    "bead": (0.95, 0.75, 0.34),
    "tie": (0.78, 0.19, 0.16),
    "gold": (0.95, 0.75, 0.34),
    "cauli": (0.84, 0.66, 0.53),
    "hw1": (0.78, 0.19, 0.16),
    "hw2": (0.1, 0.1, 0.12),
    "hw3": (0.95, 0.75, 0.34),
    "hwd": (0.5, 0.12, 0.1),
    "hwband": (0.96, 0.95, 0.92),
    "hwbandend": (0.96, 0.95, 0.92),
    "white": (0.98, 0.97, 0.95),
    "rib0": (0.0, 0.34, 0.72),
    "rib1": (1.0, 0.84, 0.0),
    "rib2": (0.78, 0.06, 0.18),
    "rib3": (0.25, 0.48, 0.23),
    "gi": (0.95, 0.94, 0.91),
    "lapel": (0.9, 0.87, 0.8),
    "belt": (0.18, 0.36, 0.78),
    "beltbar": (0.05, 0.05, 0.06),
    "stripe": (0.97, 0.96, 0.92),
    "hair": (0.08, 0.07, 0.09),
    "face": (0.94, 0.77, 0.62),
}


def srgb_to_lin(c):
    return tuple((x / 12.92) if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def material(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    col = srgb_to_lin(PREVIEW.get(name, (0.8, 0.8, 0.8)))
    bsdf.inputs["Base Color"].default_value = (*col, 1)
    bsdf.inputs["Roughness"].default_value = 0.8
    return m


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def build():
    reset()
    mats = {k: material(k) for k in PREVIEW}
    parts = {}
    parts.update(body.body(mats))
    parts.update(body.gi(mats))
    parts.update(body.nogi(mats))
    parts.update(body.extras(mats))
    head, face = build_head(mats["skin"], mats["face"])
    parts["head"] = head
    parts["face"] = face
    parts.update(hair.build_all(mats))
    parts.update(facial.beards(mats))
    parts.update(facial.ears(mats))
    parts.update(hats.hats(mats))
    return parts


def preview(path, parts, yaw=-22, size=(720, 900)):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.samples = 48
    sc.cycles.device = "CPU"
    sc.render.resolution_x, sc.render.resolution_y = size
    sc.render.film_transparent = False
    sc.view_settings.view_transform = "AgX"
    world = bpy.data.worlds.new("w")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.02, 0.016, 0.014, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 1.0
    sc.world = world
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.lens = 70
    sc.collection.objects.link(cam)
    a = math.radians(yaw)
    dist = 7.2
    target = Vector((0, 0, 1.0))
    cam.location = target + Vector((math.sin(a) * dist, -math.cos(a) * dist, 0.9))
    d = target - cam.location
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    sc.camera = cam
    key = bpy.data.objects.new("key", bpy.data.lights.new("key", "AREA"))
    key.data.energy = 900
    key.data.size = 3
    key.data.color = (1.0, 0.93, 0.84)
    key.location = (-3, -4, 4)
    key.rotation_euler = (Vector((0, 0, 1)) - key.location).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(key)
    rim = bpy.data.objects.new("rim", bpy.data.lights.new("rim", "AREA"))
    rim.data.energy = 600
    rim.data.size = 2
    rim.data.color = (1.0, 0.8, 0.45)
    rim.location = (3, 3, 3)
    rim.rotation_euler = (Vector((0, 0, 1)) - rim.location).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(rim)
    fill = bpy.data.objects.new("fill", bpy.data.lights.new("fill", "AREA"))
    fill.data.energy = 250
    fill.data.size = 4
    fill.location = (4, -3, 1)
    fill.rotation_euler = (Vector((0, 0, 1)) - fill.location).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(fill)
    bpy.ops.mesh.primitive_plane_add(size=8)
    floor = bpy.context.active_object
    fm = bpy.data.materials.new("floor")
    fm.use_nodes = True
    fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.04, 0.03, 1)
    floor.data.materials.append(fm)
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def export(path, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_morph=True,
        export_morph_normal=False,
        export_materials="EXPORT",
        export_normals=True,
        export_texcoords=True,
        export_cameras=False,
        export_lights=False,
        export_extras=True,
    )


def groups():
    """The base model (body, head, ears), the gi, the no-gi clothes, the
    extras, and one file per beard, hair style and headwear style, so the app
    only loads what a figure wears."""
    out = {"base": []}
    for o in bpy.context.scene.objects:
        if o.type != "MESH":
            continue
        n = o.name
        m = re.match(r"^(hair_\d\d|beard_\d|hw_[a-z]+)", n)
        if m:
            key = m.group(1)
        elif n.startswith(("gi_", "belt")):
            key = "gi"
        elif n.startswith("ng_"):
            key = "nogi"
        elif n.startswith("x_"):
            key = "extras"
        else:
            key = "base"
        out.setdefault(key, []).append(o)
    return out


def export_all(folder, pack=True):
    os.makedirs(folder, exist_ok=True)
    for f in os.listdir(folder):
        if f.endswith(".glb"):
            os.remove(os.path.join(folder, f))
    files = []
    for name, objs in groups().items():
        path = os.path.join(folder, f"{name}.glb")
        export(path, objs)
        files.append(path)
    if pack:
        # Quantise and compress with meshopt (EXT_meshopt_compression).
        for path in files:
            subprocess.run(["npx", "--yes", "@gltf-transform/cli@4.5.0", "meshopt", path, path], check=True, stdout=subprocess.DEVNULL)
    return files


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    parts = build()
    if "--no-export" not in args:
        out = args[args.index("--out") + 1] if "--out" in args else os.path.join(ROOT, "public", "arc", "fighter")
        export_all(out, pack="--no-pack" not in args)
    if "--preview" in args:
        out = args[args.index("--preview") + 1]
        yaw = float(args[args.index("--yaw") + 1]) if "--yaw" in args else -22
        preview(out, parts, yaw)
