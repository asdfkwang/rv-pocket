"""Add matching CRT monitor to pocket.blend (keeps existing pocket scene).

Run headless (opens pocket.blend in place):
  Blender pocket.blend --background --python scripts/build-pocket-crt.py

Adds:
  COL_crt_exterior / COL_crt_details, Cam_CRT + Aim_CRT
Renders (transparent, reuses scene look):
  assets/crt-3d.png (2048) + assets/crt-3d-small.png (512)
Saves pocket.blend in place (pocket + CRT as a set).
"""
import bpy
import math
import os

REPO = "/Users/kwang/Documents/git-repos/rv-pocket"
BLEND = os.path.join(REPO, "pocket.blend")
RENDER_BIG = os.path.join(REPO, "assets", "crt-3d.png")
RENDER_SMALL = os.path.join(REPO, "assets", "crt-3d-small.png")

scene = bpy.context.scene
CX = 6.0  # CRT sits right of the pocket console

# ---- idempotent: drop previous CRT run (re-runnable)
for _c in ("COL_crt_exterior", "COL_crt_details"):
    _col = bpy.data.collections.get(_c)
    if _col is not None:
        for _o in list(_col.objects):
            bpy.data.objects.remove(_o, do_unlink=True)
        bpy.data.collections.remove(_col)
for _o in ("Cam_CRT", "Aim_CRT", "Cam_Internals", "Aim_Internals"):
    _ob = bpy.data.objects.get(_o)
    if _ob is not None:
        bpy.data.objects.remove(_ob, do_unlink=True)

# ---------------------------------------------------------------- collections
col_cext = bpy.data.collections.new("COL_crt_exterior")
col_cdet = bpy.data.collections.new("COL_crt_details")
for c in (col_cext, col_cdet):
    if c.name not in [x.name for x in scene.collection.children]:
        scene.collection.children.link(c)

def link(obj, col):
    for c in obj.users_collection:
        try:
            c.objects.unlink(obj)
        except Exception:
            pass
    col.objects.link(obj)
    return obj

# ---------------------------------------------------------------- materials (reuse pocket set, add 2)
def principled(name, base=(1, 1, 1, 1), rough=0.4, metallic=0.0,
               emission=None, emission_strength=0.0, clearcoat=0.0):
    mat = bpy.data.materials.get(name)
    if mat is not None:
        return mat  # never touch the shared pocket set by accident
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return mat
    bsdf.inputs["Base Color"].default_value = base
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic
    try:
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = clearcoat
    except Exception:
        pass
    if emission is not None:
        try:
            bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1.0)
            bsdf.inputs["Emission Strength"].default_value = emission_strength
        except Exception:
            pass
    return mat

# ---- repair pocket shared mats (an earlier revision reset them to white)
def _set(name, base, rough, metallic=0.0, emission=None,
         emission_strength=0.0, clearcoat=0.0, subsurface=0.0, sub_color=None):
    m = bpy.data.materials.get(name)
    if m is None:
        return
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return
    bsdf.inputs["Base Color"].default_value = base
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metallic
    try:
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = clearcoat
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

_set("Mat_Cream", (1.0, 0.95, 0.86, 1.0), 0.36, clearcoat=0.35,
     subsurface=0.06, sub_color=(1.0, 0.90, 0.78, 1.0))
_set("Mat_BackDark", (0.16, 0.11, 0.08, 1.0), 0.5)
_set("Mat_BackWarm", (0.45, 0.33, 0.28, 1.0), 0.42, clearcoat=0.3)
_set("Mat_Screen", (0.045, 0.055, 0.075, 1.0), 0.05, clearcoat=1.0)
_set("Mat_Pixel", (0.0, 0.0, 0.0, 1.0), 0.5,
     emission=(0.62, 1.0, 0.05), emission_strength=7.0)
_set("Mat_DPad", (0.12, 0.12, 0.14, 1.0), 0.35, clearcoat=0.6)
_set("Mat_Black", (0.03, 0.03, 0.04, 1.0), 0.45)
_set("Mat_Red", (0.88, 0.09, 0.08, 1.0), 0.22, clearcoat=1.0)

mat_cream = bpy.data.materials.get("Mat_Cream")
mat_back_dark = bpy.data.materials.get("Mat_BackDark")
mat_back_warm = bpy.data.materials.get("Mat_BackWarm")
mat_screen = bpy.data.materials.get("Mat_Screen")
mat_dpad = bpy.data.materials.get("Mat_DPad")
mat_red = bpy.data.materials.get("Mat_Red")
# CRT-only mats (create once; never overwrite)
mat_led = principled("Mat_LED", base=(0.1, 0.0, 0.0, 1.0), rough=0.4,
                     emission=(1.0, 0.08, 0.05), emission_strength=5.0)
# CRT housing: same cream family as the pocket console so the set reads as
# one system. Only slightly cooler/duller so the two objects stay distinct.
mat_crt = principled("Mat_CRT", base=(0.93, 0.87, 0.76, 1.0), rough=0.5, clearcoat=0.2)

def rounded_box(name, loc, size, bevel_w=0.2, subdiv=2, rlvl=2):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    b = o.modifiers.new("Bevel", "BEVEL")
    b.width = bevel_w
    b.segments = 4
    b.profile = 0.7
    b.limit_method = "ANGLE"
    s = o.modifiers.new("Subdiv", "SUBSURF")
    s.levels = subdiv
    s.render_levels = rlvl
    for p in o.data.polygons:
        p.use_smooth = True
    return o

def set_mat(o, mat):
    if o.data.materials:
        o.data.materials[0] = mat
    else:
        o.data.materials.append(mat)

FY = -0.35  # front plane (Blender front = -Y, same as pocket)

# ---- back housing: deep + stepped (thick old-PC back)
housing = rounded_box("CRT_Housing", (CX, 0.75, 0.2), (3.0, 1.9, 2.5), bevel_w=0.24)
set_mat(housing, mat_crt); link(housing, col_cext)
housing2 = rounded_box("CRT_HousingRear", (CX, 1.95, 0.2), (2.3, 1.0, 1.9), bevel_w=0.22)
set_mat(housing2, mat_crt); link(housing2, col_cext)
mid = rounded_box("CRT_MidDark", (CX, -0.05, 0.15), (3.3, 0.5, 2.75), bevel_w=0.2)
set_mat(mid, mat_back_dark); link(mid, col_cext)

# ---- front cream bezel
bezel = rounded_box("CRT_Bezel", (CX, 0, 0.2), (3.4, 0.7, 2.9), bevel_w=0.22)
set_mat(bezel, mat_cream); link(bezel, col_cext)

# ---- screen: empty dark glass recessed into the housing, with a dark bezel
# ---- frame overlapping its edge and standing slightly proud. Front is -Y,
# ---- so a SMALLER y is further out. The cover must never sit behind the glass.
CRT_SHELL_FRONT = -0.35                      # cream bezel front plane
CRT_BEZEL_FRONT = CRT_SHELL_FRONT - 0.05     # bezel lip stands proud
CRT_GLASS_FRONT = CRT_SHELL_FRONT - 0.012    # glass recessed behind the lip
GX, GZ = CX - 0.1, 0.45
GW, GH = 2.45, 1.95
GB_T = 0.20                                   # bezel border width
GB_D = 0.34

def cblk(name, x, y, z, sx, sy, sz, mat, bevel, seg=4, sub=2):
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
        s.render_levels = 2
    for p in o.data.polygons:
        p.use_smooth = True
    set_mat(o, mat)
    return link(o, col_cdet)

# The cream bezel is the cover: the glass sits in a recess and the cream
# surface wraps around its edge. No separate bezel frame.
cblk("CRT_Glass", GX, CRT_GLASS_FRONT + 0.09, GZ, GW, 0.18, GH, mat_screen, 0.11)

# No fake shine plane here either: the reflection comes from Mat_Screen's
# low roughness and full clearcoat.

# ---- chin strip + power button + red LED
chin = rounded_box("CRT_Chin", (CX, FY + 0.02, -1.02), (3.0, 0.12, 0.3), bevel_w=0.05)
set_mat(chin, mat_dpad); link(chin, col_cdet)

bpy.ops.mesh.primitive_cylinder_add(radius=0.13, depth=0.12, location=(CX + 0.9, FY - 0.02, -1.02))
power = bpy.context.active_object
power.name = "CRT_Power"
power.rotation_euler = (math.radians(90), 0, 0)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
set_mat(power, mat_dpad); link(power, col_cdet)

bpy.ops.mesh.primitive_cube_add(size=1, location=(CX + 1.2, FY - 0.03, -1.02))
led = bpy.context.active_object
led.name = "CRT_LED"
led.dimensions = (0.1, 0.06, 0.07)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
set_mat(led, mat_led); link(led, col_cdet)

# ---- side vents (same slit language as pocket speaker)
for side, vx in (("L", CX - 1.45), ("R", CX + 1.45)):
    for i, vz in enumerate((0.9, 0.62, 0.34)):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(vx, FY + 0.03, vz))
        v = bpy.context.active_object
        v.name = "CRT_Vent_%s%d" % (side, i)
        v.dimensions = (0.3, 0.1, 0.09)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bv = v.modifiers.new("Bevel", "BEVEL"); bv.width = 0.035; bv.segments = 2
        set_mat(v, mat_dpad); link(v, col_cdet)

# ---- stand: short neck + oval foot
neck = rounded_box("CRT_Neck", (CX, 0.15, -1.55), (0.8, 0.5, 0.55), bevel_w=0.12)
set_mat(neck, mat_dpad); link(neck, col_cext)
bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=0.22, location=(CX, 0.1, -1.95))
foot = bpy.context.active_object
foot.name = "CRT_Foot"
foot.scale = (1.35, 0.95, 1.0)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
bv = foot.modifiers.new("Bevel", "BEVEL"); bv.width = 0.08; bv.segments = 3
for p in foot.data.polygons:
    p.use_smooth = True
set_mat(foot, mat_cream); link(foot, col_cext)

# ---------------------------------------------------------------- camera
cam_data = bpy.data.cameras.new("Cam_CRT")
cam_data.type = "PERSP"
cam_data.lens = 85
cam_data.clip_start = 0.1
cam_data.clip_end = 100
cam = bpy.data.objects.new("Cam_CRT", cam_data)
scene.collection.objects.link(cam)
cam.location = (CX - 1.1, -12.5, -0.5)
aim = bpy.data.objects.new("Aim_CRT", None)
scene.collection.objects.link(aim)
aim.location = (CX, 0, 0.0)
trk = cam.constraints.new("TRACK_TO")
trk.target = aim
trk.track_axis = "TRACK_NEGATIVE_Z"
trk.up_axis = "UP_Y"

# CRT sits ~2 units from the orange rim light: dim the shared rig for this
# render only, then restore so the pocket look is untouched.
_dim = {}
for _lname, _e in (("Key_Front", 330), ("Rim_Blue_L", 240), ("Rim_Orange_R", 240),
                   ("Top_Warm", 140), ("Fill_Front", 70)):
    _o = bpy.data.objects.get(_lname)
    if _o is not None:
        _dim[_lname] = _o.data.energy
        _o.data.energy = _e

# ---------------------------------------------------------------- render (reuse scene look)
prev_cam = scene.camera
scene.camera = cam
scene.cycles.samples = 64
scene.render.resolution_x = 2048
scene.render.resolution_y = 2048
scene.render.resolution_percentage = 100
scene.render.filepath = RENDER_BIG
bpy.ops.render.render(write_still=True)
scene.cycles.samples = 32
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.filepath = RENDER_SMALL
bpy.ops.render.render(write_still=True)

scene.camera = prev_cam
for _lname, _e in _dim.items():
    _o = bpy.data.objects.get(_lname)
    if _o is not None:
        _o.data.energy = _e
scene.render.resolution_x = 2048
scene.render.resolution_y = 2048
scene.render.filepath = os.path.join(REPO, "assets", "logo-3d.png")
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("CRT-DONE:", BLEND)
