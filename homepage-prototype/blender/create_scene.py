"""Rebuild the original SpeakGrade voice-to-feedback sculpture with Blender 5.2.
Run: blender --background --python blender/create_scene.py
All geometry, materials, typography, camera and lighting are editable in the .blend.
"""
import bpy, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for block in bpy.data.materials:
    bpy.data.materials.remove(block)

def material(name, color, roughness=.38, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = roughness
    bs.inputs['Metallic'].default_value = metallic
    return m

paper = material('Warm porcelain', (.91,.89,.82))
white = material('Report / ivory', (.985,.975,.93))
green = material('Forest green', (.009,.055,.03))
sage = material('Soft sage', (.38,.53,.39))
mint = material('Mint ceramic', (.65,.76,.62))
orange = material('Voice / glazed apricot', (.67,.18,.045), .29, .12)
pale = material('Quiet chart track', (.79,.82,.73))
ink = material('Report ink', (.012,.027,.017))

def cube(name, loc, scale, mat, bevel=.08):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(mat)
    b=o.modifiers.new('Soft crafted edges', 'BEVEL'); b.width=bevel; b.segments=5
    o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o

font_path='C:/Windows/Fonts/segoeui.ttf'
font=bpy.data.fonts.load(font_path) if os.path.exists(font_path) else None
def label(name, body, x,y,z,size,mat=ink):
    c=bpy.data.curves.new(name,'FONT'); c.body=body; c.size=size
    c.extrude=.0008; c.space_character=1.05
    if font: c.font=font
    o=bpy.data.objects.new(name,c); bpy.context.collection.objects.link(o)
    o.location=(x,y,z); o.rotation_euler=(math.pi/2,0,0); c.materials.append(mat)
    return o

# A single recording becomes a report: the objects are a physical product diagram.
cube('Recording tray',(-1.8,-.25,.20),(4.05,2.2,.35),paper,.19)
cube('Recording tray inset',(-1.8,-.25,.395),(3.75,1.9,.07),white,.17)
heights=[.32,.5,.85,1.35,1.9,2.38,1.78,1.17,.7,1.22,1.73,2.1,1.4,.85,.45]
for i,h in enumerate(heights):
    x=-3.45+i*.235
    cube('Voice amplitude %02d'%i,(x,-.22,.52+h/2),(.145,.38,h),orange,.072)

# A small microphone icon embossed into the input tray.
cube('Microphone capsule',(-2.05,-1.08,.48),(.13,.02,.24),green,.06)
label('Recording caption','YOUR RECORDING',-3.32,-1.367,.17,.17,green)

# Connector pips lead toward the report, keeping the metaphor directional.
for i in range(4):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=.055,location=(.15+i*.23,-.44,.49))
    bpy.context.object.name='Signal to insight %d'%i; bpy.context.object.data.materials.append(sage)

# Upright, readable report with a ceramic stand.
cube('Report pedestal',(2,.58,.23),(3.14,1.8,.45),mint,.2)
cube('Speech report',(1.95,.65,2.25),(2.72,.16,3.63),white,.13)
label('Report eyebrow','SPEECH REPORT',.83,.555,3.66,.16,green)
label('Report heading','A clearer way forward.',.83,.548,3.31,.20)
cube('Report heading rule',(1.94,.55,3.08),(2.24,.015,.015),pale,.005)
rows=[('Pacing',.76,green),('Filler words',.48,orange),('Vocal variety',.67,sage),('Structure',.9,green)]
for i,(title,amount,mat) in enumerate(rows):
    z=2.82-i*.44
    label('Metric label '+title,title,.83,.548,z,.145)
    cube('Track '+title,(1.94,.545,z-.14),(2.22,.035,.065),pale,.025)
    cube('Score '+title,(.83+2.22*amount/2,.515,z-.14),(2.22*amount,.04,.07),mat,.027)
cube('Next step highlight',(1.94,.53,.88),(2.29,.035,.43),mint,.05)
label('Next step title','YOUR NEXT STEP',.91,.497,.94,.115,green)
label('Next step advice','Pause. Let your point land.',.91,.494,.76,.135,green)

# Warm studio floor. Transparency lets the web page supply its own paper color.
floor=cube('Studio floor',(0,0,-.055),(200,200,.08),paper,.01)
floor.hide_render=True
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=48
scene.cycles.use_denoising=True
scene.render.resolution_x=1500; scene.render.resolution_y=1250
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'; scene.render.image_settings.color_mode='RGBA'
scene.render.film_transparent=True
scene.world.color=(.3,.3,.3)
world=scene.world; world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.78,.82,.75,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.3

def light(name,loc,power,size,color):
    d=bpy.data.lights.new(name,'AREA'); d.energy=power; d.shape='DISK'; d.size=size; d.color=color
    o=bpy.data.objects.new(name,d); bpy.context.collection.objects.link(o); o.location=loc
    o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox / key',(-3,-5,8),700,7,(1,.91,.78))
light('Soft fill',(5,-2,5),350,5,(.81,.94,1))
light('Rim / report edge',(1,4,7),750,4,(1,.96,.86))
bpy.ops.object.camera_add(location=(6.2,-12.5,8.3))
cam=bpy.context.object; cam.name='Hero / orthographic camera'
cam.rotation_euler=(Vector((-.15,0,1.65))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO'; cam.data.ortho_scale=8.9; scene.camera=cam
scene.view_settings.view_transform='AgX'
scene.render.filepath=os.path.join(ROOT,'assets','voice-to-feedback.png')
# Pack the font for a genuinely self-contained, editable Blender source.
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'blender','voice-to-feedback.blend'))
bpy.ops.render.render(write_still=True)
