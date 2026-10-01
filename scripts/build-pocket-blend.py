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
import bmesh
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

mat_cream = principled("Mat_Cream", base=(1.0, 0.95, 0.86, 1.0), rough=0.36,
                       clearcoat=0.35, subsurface=0.06, sub_color=(1.0, 0.90, 0.78, 1.0))
mat_back_dark = principled("Mat_BackDark", base=(0.16, 0.11, 0.08, 1.0), rough=0.5)
mat_back_warm = principled("Mat_BackWarm", base=(0.45, 0.33, 0.28, 1.0), rough=0.42, clearcoat=0.3)
mat_screen = principled("Mat_Screen", base=(0.07, 0.08, 0.11, 1.0), rough=0.12, clearcoat=1.0)
mat_pixel = principled("Mat_Pixel", base=(0.0, 0.0, 0.0, 1.0), rough=0.5,
                       emission=(0.62, 1.0, 0.05), emission_strength=7.0)
mat_dpad = principled("Mat_DPad", base=(0.12, 0.12, 0.14, 1.0), rough=0.35, clearcoat=0.6)
mat_black = principled("Mat_Black", base=(0.03, 0.03, 0.04, 1.0), rough=0.45)
mat_red = principled("Mat_Red", base=(0.88, 0.09, 0.08, 1.0), rough=0.22, clearcoat=1.0)
mat_pcb = principled("Mat_PCB", base=(0.05, 0.28, 0.16, 1.0), rough=0.6)
mat_cpu = principled("Mat_CPU", base=(0.12, 0.12, 0.14, 1.0), rough=0.3, metallic=0.7)

# ---------------------------------------------------------------- helpers
def rounded_box(name, loc, size, bevel_w=0.22, bevel_seg=6, subdiv=0):
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
    b.harden_normals = False
    if subdiv:
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
# They must extend past the cream shell on EVERY side, including the wing at
# the lower right and the notch under it, or the recess under the step shows
# the dark plate and reads as a hole.
back_outer_main = rounded_box("BackOuter_Main", (0, 0.42, 0.05), (4.62, THICK, 3.3), bevel_w=0.28)
back_dark_main = rounded_box("BackDark_Main", (0, 0.20, 0.03), (4.46, THICK, 3.15), bevel_w=0.25)
back_outer_wing = back_dark_wing = None
for o in (back_outer_main,):
    set_mat(o, mat_back_warm); link(o, col_ext)
for o in (back_dark_main,):
    set_mat(o, mat_back_dark); link(o, col_ext)

# ---- screen metrics. Front is -Y, so a SMALLER y is further out.
# The cream shell is the cover, but it is opaque: without a real opening the
# glass is either buried (invisible) or sitting on top (reads as a slab).
# So the shell gets an actual boolean opening and the glass is seated in it,
# behind the cream lip.
SHELL_FRONT = -THICK / 2.0            # -0.375
SX, SZ = -0.45, 0.55
OPEN_W, OPEN_H = 1.80, 1.14           # opening cut in the shell
# The recess must start outside the shell face (so the cut is clean) and reach
# far enough back to swallow the glass. Front view is -Y, so more negative is
# further out.
RECESS_OUT = 0.10                     # cutter overshoot past the shell face
RECESS_DEPTH = 0.30                   # how deep the recess goes in
GLASS_W, GLASS_H = 1.90, 1.24         # wider than the opening, so the cream
                                     # lip overlaps the glass edge
GLASS_D = 0.14
GLASS_FRONT = SHELL_FRONT + 0.075    # glass face sits behind the cream lip
# The glass is centred at GLASS_FRONT, so its front face is at
# GLASS_FRONT - GLASS_D/2. LEDs must sit at a SMALLER y than that to be in
# front of the glass; anything larger gets hidden inside it.
LED_Y = GLASS_FRONT - GLASS_D / 2.0 - 0.022

# ---- front cream shell
# One box. The reference logo is a single rounded slab whose right edge simply
# reads as a wing; a separate wing block or a hand-built L-shaped outline only
# introduces seams, gaps, and winding bugs. Everything (screen, buttons, pads)
# mounts on this one front plane.
front_main = rounded_box("Body_Shell", (0, 0, 0), (4.30, THICK, 3.0),
                         bevel_w=0.30, bevel_seg=8)
set_mat(front_main, mat_cream); link(front_main, col_ext)
front_wing = None

# ---- screen opening through the shell front
_cut_len = RECESS_OUT + RECESS_DEPTH
bpy.ops.mesh.primitive_cube_add(
    size=1,
    location=(SX, SHELL_FRONT - RECESS_OUT + _cut_len / 2.0, SZ))
cutter = bpy.context.active_object
cutter.name = "_ScreenCutter"
cutter.dimensions = (OPEN_W, _cut_len, OPEN_H)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
_cb = cutter.modifiers.new("Bevel", "BEVEL")
_cb.width = 0.09
_cb.segments = 3
_cb.profile = 0.7
# the cutter must never render or appear in the file
cutter.hide_render = True
cutter.display_type = "WIRE"

# Only the main shell gets the screen cut. Body_Wing sits to the right and
# never overlaps the opening, so cutting it would punch a hole in the buttons.
for _shell in (front_main,):
    _m = _shell.modifiers.new("ScreenOpening", "BOOLEAN")
    _m.operation = "DIFFERENCE"
    _m.object = cutter
    _m.solver = "EXACT"
    # Order must be Bevel -> Boolean -> CutBevel.
    # Rounding the outer form first and cutting afterwards keeps the opening
    # rectangular. Subsurf is deliberately NOT used here: it drags the new cut
    # vertices toward the surrounding faces and collapses the opening into a
    # teardrop. The cut edges get their own narrow bevel instead.
    _cut_bevel = _shell.modifiers.new("CutBevel", "BEVEL")
    _cut_bevel.width = 0.035
    _cut_bevel.segments = 3
    _cut_bevel.profile = 0.6
    _cut_bevel.limit_method = "ANGLE"
    _cut_bevel.angle_limit = 0.5236      # 30 deg: only the new cut edges
    for _i, _nm in enumerate(("Bevel", "ScreenOpening", "CutBevel")):
        _shell.modifiers.move(_shell.modifiers.find(_nm), _i)

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
# The glass must sit INSIDE the cut, not behind it: its front face has to be
# near the shell front plane or the opening just shows the cream interior.
bpy.ops.mesh.primitive_cube_add(size=1, location=(SX, GLASS_FRONT, SZ))
glass = bpy.context.active_object
glass.name = "Screen_Glass"
glass.dimensions = (GLASS_W, GLASS_D, GLASS_H)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
b = glass.modifiers.new("Bevel", "BEVEL")
b.width = 0.05
b.segments = 3
b.profile = 0.6
for p in glass.data.polygons:
    p.use_smooth = True
set_mat(glass, mat_screen)
link(glass, col_scr)

# screen glare: thin diagonal white plane, low alpha for that glossy logo streak
bpy.ops.mesh.primitive_plane_add(
    size=1, location=(SX + 0.5, GLASS_FRONT - GLASS_D / 2.0 - 0.004, SZ + 0.3))
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

# ---- pixel smile (lime)
# Each LED is its own cube placed on a PITCH grid, and is PITCH - GAP wide, so
# adjacent LEDs keep a visible dark seam. A solid multi-unit bar reads as one
# glowing slab instead of a row of LEDs.
PITCH = 0.17
GAP = 0.026
LED = PITCH - GAP
PIX_Y = LED_Y

def led(name, x, z):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, PIX_Y, z))
    o = bpy.context.active_object
    o.name = name
    o.dimensions = (LED, 0.05, LED)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bv = o.modifiers.new("Bevel", "BEVEL")
    bv.width = 0.012
    bv.segments = 2
    set_mat(o, mat_pixel)
    link(o, col_scr)
    return o

# eyes: 3 units stacked vertically on each side
for _i, _dz in enumerate((0.085, -0.085, -0.255)):
    led("PX_Eye_L%d" % _i, SX - 0.595, SZ + 0.34 + _dz)
    led("PX_Eye_R%d" % _i, SX + 0.595, SZ + 0.34 + _dz)
# cheeks: single units
led("PX_Cheek_L", SX - 0.255, SZ - 0.085)
led("PX_Cheek_R", SX + 0.255, SZ - 0.085)
# mouth: 3 units in a row
for _i, _dx in enumerate((-0.17, 0.0, 0.17)):
    led("PX_Mouth%d" % _i, SX + _dx, SZ - 0.255)

# ---- controls. They may stand slightly proud of SHELL_FRONT but must stay
# ---- inside the shell outline and clear of the screen.
WING_FRONT = SHELL_FRONT
CTL_FRONT = SHELL_FRONT - 0.05   # control face plane (wing is at the same depth)
CTL_FRONT_MAIN = CTL_FRONT      # D-pad / pills
CTL_FRONT_WING = CTL_FRONT      # red buttons
CTL_D = 0.24                    # control depth along Y

def ctl_bar(name, x, z, sx, sz, front=CTL_FRONT_MAIN):
    return block(name, x, front + CTL_D / 2.0, z, sx, CTL_D, sz,
                 mat_dpad, 0.06, seg=3, col=col_ctl)

# D-pad: left column, below the screen
ctl_bar("DPad_H", -1.52, -0.62, 0.86, 0.28)
ctl_bar("DPad_V", -1.52, -0.62, 0.28, 0.86)

# 2 pill buttons: centre bottom
def pill(name, x, z):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=CTL_D,
                                        location=(x, CTL_FRONT_MAIN + CTL_D / 2.0, z),
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
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.16,
                                        location=(x, CTL_FRONT_WING + 0.06, z),
                                        rotation=(math.radians(90), 0, 0))
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bv = o.modifiers.new("Bevel", "BEVEL")
    bv.width = 0.055; bv.segments = 3; bv.profile = 0.7
    for p in o.data.polygons:
        p.use_smooth = True
    set_mat(o, mat_red); link(o, col_ctl)

    # dome cap: front half of a squashed sphere, sitting on the cylinder rim
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.255, segments=48, ring_count=24,
                                         location=(x, CTL_FRONT_WING + 0.075, z))
    cap = bpy.context.active_object
    cap.name = name + "_Dome"
    cap.scale = (1.0, 0.55, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in cap.data.polygons:
        p.use_smooth = True
    set_mat(cap, mat_red); link(cap, col_ctl)
    return o

red_btn("Btn_Red_A", 1.28, -0.55)   # lower
red_btn("Btn_Red_B", 1.62, 0.05)    # upper

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
    emis.inputs["Strength"].default_value = 1.4
    mix = nodes.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = transparency
    links.new(transp.outputs["BSDF"], mix.inputs[1])
    links.new(emis.outputs["Emission"], mix.inputs[2])
    links.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m

mat_halo_in = halo_mat("Mat_HaloIn", 0.80)
mat_halo_out = halo_mat("Mat_HaloOut", 0.93)
for _px in [o for o in list(col_scr.objects) if o.name.startswith("PX_")]:
    # halo must stay small: a wide halo fills the gaps and merges the LEDs
    for _i, (_s, _m) in enumerate(((1.08, mat_halo_in), (1.18, mat_halo_out))):
        _h = _px.copy()
        _h.data = _px.data.copy()
        _h.name = _px.name + "_Halo%d" % _i
        _h.scale = (_s, 1.0, _s)
        # push halos BEHIND the LED so the dark seam between units stays open
        _h.location = (_px.location[0], _px.location[1] + 0.010 * (_i + 1), _px.location[2])
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
def render_to(path, res, samples):
    """Render and write. A failed write must not abort the rest of the build."""
    scene.render.resolution_percentage = 100
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.cycles.samples = samples
    scene.render.filepath = path
    try:
        bpy.ops.render.render(write_still=True)
        print("RENDER OK:", path, flush=True)
    except Exception as e:
        print("RENDER FAILED:", path, repr(e), flush=True)

render_to(RENDER_BIG, 2048, 64)
render_to(RENDER_SMALL, 512, 32)
# restore big size tag in file (metadata only)
scene.render.resolution_x = 2048
scene.render.resolution_y = 2048
scene.render.filepath = RENDER_BIG

bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print("SAVED:", BLEND_OUT)
print("RENDER_BIG:", RENDER_BIG)
print("RENDER_SMALL:", RENDER_SMALL)
