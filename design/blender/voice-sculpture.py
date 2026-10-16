"""SpeakGrade voice sculpture: a recorded talk as a row of ceramic capsules on a glossy stage.

Run (Windows): blender --background --python design/blender/voice-sculpture.py -- <out.png> [samples]
The filler cluster is glazed red; the pause is a run of short capsules.
"""
import bpy, math, os, sys, random
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.join(os.path.dirname(os.path.abspath(__file__)), "voice-sculpture.png")
SAMPLES = int(argv[1]) if len(argv) > 1 else 160

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def principled(name, rgb, rough, coat=0.0, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = (*rgb, 1)
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Coat Weight"].default_value = coat
    bs.inputs["Coat Roughness"].default_value = 0.08
    if emission:
        bs.inputs["Emission Color"].default_value = (*emission, 1)
        bs.inputs["Emission Strength"].default_value = strength
    return m


ivory = principled("Ivory ceramic", (0.80, 0.78, 0.74), 0.34, coat=0.35)
ember = principled("Filler glaze", (0.62, 0.035, 0.02), 0.24, coat=0.7,
                   emission=(1.0, 0.09, 0.04), strength=0.18)
stage = principled("Black lacquer stage", (0.004, 0.004, 0.005), 0.1, coat=0.8)


def capsule(name, x, h, mat, w=0.082):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=w / 2, depth=max(h - w, 0.001),
                                        location=(x, 0, 0))
    body = bpy.context.object
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=w / 2,
                                         location=(x, 0, (h - w) / 2))
    top = bpy.context.object
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=w / 2,
                                         location=(x, 0, -(h - w) / 2))
    bot = bpy.context.object
    for o in (body, top, bot):
        o.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    bpy.ops.object.shade_smooth()
    body.name = name
    body.data.materials.append(mat)
    return body


# A plausible speech envelope: phrases, one pause, one filler cluster.
random.seed(7)
N = 96
SPACING = 0.15
CENTER_Z = 1.38
PAUSE = range(34, 40)
FILLERS = range(57, 64)
for i in range(N):
    p = i / (N - 1)
    phrase = 0.55 + 0.45 * math.sin(p * math.pi * 5.2 + 0.4) ** 2
    swell = 0.6 + 0.4 * math.sin(p * math.pi)
    h = 0.35 + 2.15 * phrase * swell * (0.72 + 0.28 * random.random())
    if i in PAUSE:
        h = 0.13 + 0.03 * random.random()
    if i in FILLERS:
        h = 0.55 + 0.45 * random.random()
    mat = ember if i in FILLERS else ivory
    o = capsule(f"Voice {i:02d}", (i - (N - 1) / 2) * SPACING, max(h, 0.13), mat)
    o.location.z = CENTER_Z

bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
floor = bpy.context.object
floor.name = "Stage"
floor.data.materials.append(stage)

world = bpy.data.worlds.new("Night")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.0035, 0.0035, 0.004, 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1.0
scene.world = world


def area(name, loc, target, size, energy, color=(1, 1, 1), shape="RECTANGLE", size_y=None):
    d = bpy.data.lights.new(name, "AREA")
    d.shape = shape
    d.size = size
    if size_y:
        d.size_y = size_y
    d.energy = energy
    d.color = color
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    direction = Vector(target) - Vector(loc)
    o.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    return o


area("Key softbox", (-4.5, -6.5, 7.0), (0, 0, 1.4), 6.0, 2600, (1.0, 0.97, 0.93))
area("Rim strip", (3.0, 5.5, 4.2), (0, 0, 1.5), 14.0, 1500, (0.86, 0.9, 1.0), size_y=0.6)
area("Low fill", (6.0, -6.0, 0.6), (0, 0, 1.2), 4.0, 220, (1.0, 0.95, 0.9))

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 50
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 2.4
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
cam.location = (-12.6, -9.8, 1.75)
look = Vector((-0.35, 0, 1.3))
cam.rotation_euler = (look - cam.location).to_track_quat("-Z", "Y").to_euler()
focus = bpy.data.objects.new("Focus", None)
scene.collection.objects.link(focus)
focus.location = ((60 - (N - 1) / 2) * SPACING, 0, CENTER_Z)
cam_data.dof.focus_object = focus
scene.camera = cam

scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.device = "CPU"
scene.render.resolution_x = 2400
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_depth = "8"
scene.render.filepath = OUT

bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(OUT)[0] + ".blend")
bpy.ops.render.render(write_still=True)
print("RENDERED", OUT)
