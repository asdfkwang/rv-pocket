"""Build pocket.blend — handheld logo console in inflated 3D-icon style.

Regenerate with Blender (5.2 LTS):
  Blender MCP socket -> exec(open(path).read())
or headless:
  Blender --background --python scripts/build-pocket-blend.py

Output:
  pocket.blend (root, high-subdiv master for reuse + future internals)
  assets/logo-3d.png (2048px transparent)
  assets/logo-3d-small.png (512px web)

Style match targets (from assets/logo.png):
  cream body, dark inset screen, lime pixel smile, dark D-pad,
  2 small pills, 2 red domes diagonal, 2 speaker slits,
  dark + warm back plates, blue left rim / orange right rim, black->transparent bg.
"""
import bpy
import math
import os

REPO = "/Users/kwang/Documents/git-repos/rv-pocket"
BLEND_OUT = os.path.join(REPO, "pocket.blend")
RENDER_BIG = os.path.join(REPO, "assets", "logo-3d.png")
RENDER_SMALL = os.path.join(REPO, "assets", "logo-3d-small.png")

# ---------------------------------------------------------------- clear
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for col in ["COL_pocket_exterior", "COL_controls", "COL_screen", "COL_internals"]:
    c = bpy.data.collections.get(col)
    if c:
        bpy.data.collections.remove(c)

scene = bpy.context.scene
world = scene.world
if world is None:
    world = bpy.data.worlds.new("World")
    scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0, 0, 0, 1)
    bg.inputs["Strength"].default_value = 0.0

# metric, cm-friendly
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0

# ---------------------------------------------------------------- collections
col_ext = bpy.data.collections.new("COL_pocket_exterior")
col_ctl = bpy.data.collections.new("COL_controls")
col_scr = bpy.data.collections.new("COL_screen")
col_int = bpy.data.collections.new("COL_internals")
for c in (col_ext, col_ctl, col_scr, col_int):
    scene.collection.children.link(c)

def link(obj, col):
    try:
        scene.collection.objects.unlink(obj)
    except Exception:
        pass
    col.objects.link(obj)
    return obj

# ---------------------------------------------------------------- materials
def principled(name, base=(1, 1, 1, 1), rough=0.4, metallic=0.0,
               emission=None, emission_strength=0.0, clearcoat=0.0,
               subsurface=0.0, sub_color=None):
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = base
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic
    try:
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = clearcoat
        elif "Clearcoat" in bsdf.inputs:
            bsdf.inputs["Clearcoat"].default_value = clearcoat
    except Exception:
        pass
    if subsurface > 0:
        try:
            bsdf.inputs["Subsurface Weight"].default_value = subsurface
            if sub_color:
                bsdf.inputs["Subsurface Color"].default_value = sub_color
        except Exception:
            pass
    if emission is not None:
        try:
            bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        except Exception:
            pass
    return mat

mat_cream = principled("Mat_Cream", base=(1.0, 0.93, 0.80, 1.0), rough=0.38,
                       clearcoat=0.35, subsurface=0.08, sub_color=(1.0, 0.85, 0.7, 1.0))
mat_back_dark = principled("Mat_BackDark", base=(0.16, 0.11, 0.08, 1.0), rough=0.5)
mat_back_warm = principled("Mat_BackWarm", base=(0.45, 0.33, 0.28, 1.0), rough=0.42, clearcoat=0.3)
mat_screen = principled("Mat_Screen", base=(0.07, 0.08, 0.11, 1.0), rough=0.12, clearcoat=1.0)
mat_pixel = principled("Mat_Pixel", base=(0.0, 0.0, 0.0, 1.0), rough=0.5,
                       emission=(0.62, 1.0, 0.05), emission_strength=7.0)
mat_dpad = principled("Mat_DPad", base=(0.12, 0.12, 0.14, 1.0), rough=0.35, clearcoat=0.6)
mat_black = principled("Mat_Black", base=(0.03, 0.03, 0.04, 1.0), rough=0.45)
mat_red = principled("Mat_Red", base=(0.92, 0.14, 0.13, 1.0), rough=0.22, clearcoat=1.0)
mat_pcb = principled("Mat_PCB", base=(0.05, 0.28, 0.16, 1.0), rough=0.6)
mat_cpu = principled("Mat_CPU", base=(0.12, 0.12, 0.14, 1.0), rough=0.3, metallic=0.7)

# ---------------------------------------------------------------- helpers
def rounded_box(name, loc, size, bevel_w=0.22, bevel_seg=4, subdiv=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b = o.modifiers.new("Bevel", "BEVEL")
    b.width = bevel_w
    b.segments = bevel_seg
    b.profile = 0.7
    b.limit_method = "ANGLE"
    s = o.modifiers.new("Subdiv", "SUBSURF")
    s.levels = subdiv
    s.render_levels = 3  # high for master blend reuse
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def set_mat(o, mat):
    if o.data.materials:
        o.data.materials[0] = mat
    else:
        o.data.materials.append(mat)

FRONT_Y = -0.35  # Blender front is -Y: controls face the viewer, no mirror
THICK = 0.75

# ---- back plates (larger, behind) : warm outer + dark inner
back_outer_main = rounded_box("BackOuter_Main", (0, 0.42, 0.05), (4.55, THICK, 3.3), bevel_w=0.28)
back_outer_wing = rounded_box("BackOuter_Wing", (1.75, 0.42, -0.45), (1.75, THICK, 1.95), bevel_w=0.28)
back_dark_main = rounded_box("BackDark_Main", (0, 0.20, 0.03), (4.38, THICK, 3.15), bevel_w=0.25)
back_dark_wing = rounded_box("BackDark_Wing", (1.68, 0.20, -0.44), (1.68, THICK, 1.88), bevel_w=0.25)
for o in (back_outer_main, back_outer_wing):
    set_mat(o, mat_back_warm); link(o, col_ext)
for o in (back_dark_main, back_dark_wing):
    set_mat(o, mat_back_dark); link(o, col_ext)

# ---- front cream shell : main + right wing overlap (no boolean, clean + editable)
front_main = rounded_box("Body_Main", (0, 0, 0), (4.2, THICK, 3.0), bevel_w=0.24)
front_wing = rounded_box("Body_Wing", (1.62, 0, -0.42), (1.62, THICK, 1.85), bevel_w=0.24)
for o in (front_main, front_wing):
    set_mat(o, mat_cream); link(o, col_ext)

# ---- screen assembly. Front is -Y, so a SMALLER y is further out.
# Physical logic: glass sits in a recess, and a dark bezel frame overlaps its
# edge and stands slightly proud of the shell. The cover must never end up
# behind the glass, and the glass must never poke out past the shell.
SHELL_FRONT = -THICK / 2.0          # outer shell front plane
BEZEL_FRONT = SHELL_FRONT - 0.045    # bezel lip stands 0.045 proud of the shell
GLASS_FRONT = SHELL_FRONT - 0.012    # glass recessed behind the bezel lip

SX, SZ = -0.45, 0.55                # screen centre
GLASS_W, GLASS_H = 1.94, 1.28
BEZ_T = 0.18                        # bezel border width
BEZ_D = 0.30                        # bezel depth along Y

def block(name, x, y, z, sx, sy, sz, mat, bevel, seg=4, col=None, sub=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name
    o.dimensions = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        b = o.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = seg
        b.profile = 0.7
    if sub:
        s = o.modifiers.new("Subdiv", "SUBSURF")
        s.levels = 2
        s.render_levels = 3
    for p in o.data.polygons:
        p.use_smooth = True
    set_mat(o, mat)
    link(o, col or col_scr)
    return o

# The cream shell itself is the cover: the glass sits in a recess and the
# shell surface wraps around its edge. No separate bezel frame.
block("Screen_Glass", SX, GLASS_FRONT + 0.09, SZ,
      GLASS_W, 0.18, GLASS_H, mat_screen, 0.09)

# screen glare: thin diagonal white plane, low alpha for that glossy logo streak
bpy.ops.mesh.primitive_plane_add(size=1, location=(SX + 0.5, GLASS_FRONT - 0.03, SZ + 0.3))
glare = bpy.context.active_object
glare.name = "Screen_Glare"
glare.scale = (0.22, 1.0, 0.7)
glare.rotation_euler = (math.radians(90), 0, math.radians(28))
mat_glare = bpy.data.materials.get("Mat_Glare")
if mat_glare is None:
    mat_glare = bpy.data.materials.new("Mat_Glare")
    mat_glare.use_nodes = True
    mat_glare.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1, 1, 1, 1)
    try:
        mat_glare.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.05
    except Exception:
        pass
    mat_glare.blend_method = "BLEND"
mat_glare.blend_method = "BLEND"
if glare.data.materials:
    glare.data.materials[0] = mat_glare
else:
    glare.data.materials.append(mat_glare)
link(glare, col_scr)

# ---- pixel smile (lime) : sits ON the recessed glass, not in front of it
PIX_Y = GLASS_FRONT - 0.04
def pixel(name, x, z, sx=0.16, sz=0.16):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, PIX_Y, z))
    o = bpy.context.active_object
    o.name = name
    o.dimensions = (sx, 0.06, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bv = o.modifiers.new("Bevel", "BEVEL"); bv.width = 0.02; bv.segments = 2
    set_mat(o, mat_pixel); link(o, col_scr)
    return o

pixel("PX_Eye_L", -1.06, 0.84, sx=0.13, sz=0.36)
pixel("PX_Eye_R", 0.16, 0.84, sx=0.13, sz=0.36)
pixel("PX_Cheek_L", -0.78, 0.42, sx=0.15, sz=0.15)
pixel("PX_Cheek_R", -0.12, 0.42, sx=0.15, sz=0.15)
pixel("PX_Mouth", -0.45, 0.28, sx=0.44, sz=0.15)

# ---- controls. They may stand slightly proud of SHELL_FRONT but must stay
# ---- inside the shell outline and clear of the screen.
CTL_FRONT = SHELL_FRONT - 0.05   # control face plane
CTL_D = 0.24                    # control depth along Y

def ctl_bar(name, x, z, sx, sz):
    return block(name, x, CTL_FRONT + CTL_D / 2.0, z, sx, CTL_D, sz,
                 mat_dpad, 0.06, seg=3, col=col_ctl)

# D-pad: left column, below the screen
ctl_bar("DPad_H", -1.52, -0.62, 0.86, 0.28)
ctl_bar("DPad_V", -1.52, -0.62, 0.28, 0.86)

# 2 pill buttons: centre bottom
def pill(name, x, z):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=CTL_D,
                                        location=(x, CTL_FRONT + CTL_D / 2.0, z),
                                        rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    o.scale = (1.0, 1.0, 0.55)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bv = o.modifiers.new("Bevel", "BEVEL"); bv.width = 0.045; bv.segments = 3
    for p in o.data.polygons:
        p.use_smooth = True
    set_mat(o, mat_dpad); link(o, col_ctl)
    return o

pill("Btn_Pill_L", -0.62, -0.72)
pill("Btn_Pill_R", 0.02, -0.72)

# 2 red dome buttons: right, diagonal. Kept inside the shell (x < 1.9)
def red_btn(name, x, z):
    o = block(name, x, CTL_FRONT + 0.09, z, 0.56, 0.18, 0.56,
              mat_red, 0.06, seg=3, col=col_ctl)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, segments=32, ring_count=16,
                                         location=(x, CTL_FRONT + 0.10, z))
    cap = bpy.context.active_object
    cap.name = name + "_Dome"
    cap.scale = (1.0, 0.42, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in cap.data.polygons:
        p.use_smooth = True
    set_mat(cap, mat_red); link(cap, col_ctl)
    return o

red_btn("Btn_Red_A", 1.42, -0.34)   # lower
red_btn("Btn_Red_B", 1.76, 0.22)    # upper

# ---- speaker slits: recessed into the shell, never proud of it
def slit(name, z):
    return block(name, 1.02, SHELL_FRONT + 0.05, z, 0.42, 0.10, 0.11,
                 mat_black, 0.04, seg=3, col=col_ctl, sub=0)

slit("Speaker_1", 0.62)
slit("Speaker_2", 0.32)

# ---------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new("Cam_Logo")
cam_data.type = "PERSP"
cam_data.lens = 85
cam_data.clip_start = 0.1
cam_data.clip_end = 100
cam = bpy.data.objects.new("Cam_Logo", cam_data)
scene.collection.objects.link(cam)
cam.location = (-1.1, -12.5, -0.9)
# track to origin
bpy.ops.object.select_all(action="DESELECT")
cam.select_set(True)
scene.camera = cam
# aim via track-to constraint to empty at origin
empty = bpy.data.objects.new("Aim_Origin", None)
scene.collection.objects.link(empty)
empty.location = (0, 0, 0.05)
trk = cam.constraints.new("TRACK_TO")
trk.target = empty
trk.track_axis = "TRACK_NEGATIVE_Z"
trk.up_axis = "UP_Y"

# ---------------------------------------------------------------- lights (blue left / orange right like logo)
def area(name, loc, color, power, size=3.0):
    d = bpy.data.lights.new(name, "AREA")
    d.energy = power
    d.color = color
    d.size = size
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    return o

for o in list(bpy.data.objects):
    if o.type == "LIGHT":
        bpy.data.objects.remove(o, do_unlink=True)

area("Key_Front", (0.5, -5.0, 5.5), (1.0, 0.96, 0.9), 500, size=5.0)
area("Rim_Blue_L", (-5.5, -0.8, 1.2), (0.25, 0.45, 1.0), 1500, size=3.0)
area("Rim_Orange_R", (5.5, -0.8, 2.0), (1.0, 0.5, 0.15), 1500, size=3.0)
area("Top_Warm", (0.0, -0.5, 6.0), (1.0, 0.75, 0.45), 250, size=4.0)
area("Fill_Front", (-0.5, -6.0, -1.0), (0.9, 0.9, 1.0), 120, size=4.0)

# ---------------------------------------------------------------- render : Cycles, transparent, big + small
scene.render.engine = "CYCLES"
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
# punchy icon look like the reference (AgX washes out the reds)
try:
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = -0.3
except Exception as e:
    print("view_settings tweak skipped:", e)
# pixel glow as geometry halos (version-proof: background Blender 5.2 exposes
# no compositor output node, so Fog Glow is unavailable headless)
def halo_mat(name, transparency):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes = m.node_tree.nodes
    links = m.node_tree.links
    for _n in list(nodes):
        nodes.remove(_n)
    out = nodes.new("ShaderNodeOutputMaterial")
    transp = nodes.new("ShaderNodeBsdfTransparent")
    emis = nodes.new("ShaderNodeEmission")
    emis.inputs["Color"].default_value = (0.62, 1.0, 0.05, 1.0)
    emis.inputs["Strength"].default_value = 1.8
    mix = nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = transparency
    links.new(transp.outputs["BSDF"], mix.inputs[1])
    links.new(emis.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m

mat_halo_in = halo_mat("Mat_HaloIn", 0.80)
mat_halo_out = halo_mat("Mat_HaloOut", 0.93)
for _px in [o for o in list(col_scr.objects) if o.name.startswith("PX_")]:
    for _i, (_s, _m) in enumerate(((1.25, mat_halo_in), (1.5, mat_halo_out))):
        _h = _px.copy()
        _h.data = _px.data.copy()
        _h.name = _px.name + "_Halo%d" % _i
        _h.scale = (_s, 1.0, _s)
        _h.location = (_px.location[0], _px.location[1] + 0.012 * (_i + 1), _px.location[2])
        try:
            _h.visible_shadow = False
        except Exception:
            pass
        if _h.data.materials:
            _h.data.materials[0] = _m
        else:
            _h.data.materials.append(_m)
        col_scr.objects.link(_h)
scene.cycles.samples = 64
scene.cycles.use_denoising = True
try:
    scene.cycles.device = "GPU"
except Exception:
    pass
# save master blend BEFORE slow renders so pocket.blend survives any render issue
bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print("SAVED-BEFORE-RENDER:", BLEND_OUT, flush=True)
scene.render.resolution_percentage = 100
scene.render.resolution_x = 2048
scene.render.resolution_y = 2048
scene.render.filepath = RENDER_BIG
bpy.ops.render.render(write_still=True)
# small web version (same scene, no blend change)
# small web version (same scene, fewer samples for speed)
scene.cycles.samples = 32
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.filepath = RENDER_SMALL
bpy.ops.render.render(write_still=True)
# restore big size tag in file (metadata only)
scene.render.resolution_x = 2048
scene.render.resolution_y = 2048
scene.render.filepath = RENDER_BIG

bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print("SAVED:", BLEND_OUT)
print("RENDER_BIG:", RENDER_BIG)
print("RENDER_SMALL:", RENDER_SMALL)
