"""Add pocket internals (PCB, CPU, RAM, wiring, peripherals) to pocket.blend.

Run headless:
  Blender pocket.blend --background --python scripts/build-pocket-internals.py

Board convention: PCB lies in the XZ plane, thickness along Y.
Front (viewer side) is -Y, so every component sits at negative Y.
Cam_Logo is NOT moved: internals render through the same pocket camera, and
the file is saved with that camera active so opening pocket.blend shows the
console exactly as the logo render does.
"""
import bpy
import math
import os

REPO = "/Users/kwang/Documents/git-repos/rv-pocket"
BLEND = os.path.join(REPO, "pocket.blend")
RENDER_BIG = os.path.join(REPO, "assets", "pocket-internals-3d.png")
RENDER_SMALL = os.path.join(REPO, "assets", "pocket-internals-3d-small.png")

scene = bpy.context.scene
CAM_POCKET = (-1.1, -12.5, -0.9)  # must match build-pocket-blend.py

# ---- idempotent
for _c in ("COL_internals",):
    _col = bpy.data.collections.get(_c)
    if _col is not None:
        for _o in list(_col.objects):
            bpy.data.objects.remove(_o, do_unlink=True)
        bpy.data.collections.remove(_col)

col_int = bpy.data.collections.new("COL_internals")
scene.collection.children.link(col_int)

def link(obj):
    for c in obj.users_collection:
        try:
            c.objects.unlink(obj)
        except Exception:
            pass
    col_int.objects.link(obj)
    return obj

# ---- materials
def set_principled(name, base, rough=0.5, metallic=0.0, emission=None,
                   emission_strength=0.0, clearcoat=0.0):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if bsdf is None:
        return m
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
    return m

mat_pcb = set_principled("Mat_PCB", (0.035, 0.20, 0.11, 1.0), rough=0.62)
mat_cpu = set_principled("Mat_CPU", (0.10, 0.10, 0.12, 1.0), rough=0.28, metallic=0.7)
mat_chip = set_principled("Mat_Chip", (0.07, 0.07, 0.09, 1.0), rough=0.42, metallic=0.25)
mat_gold = set_principled("Mat_Gold", (0.83, 0.68, 0.21, 1.0), rough=0.24, metallic=1.0)
mat_copper = set_principled("Mat_Copper", (0.72, 0.45, 0.20, 1.0), rough=0.3, metallic=1.0)
mat_wire_r = set_principled("Mat_Wire_R", (0.72, 0.09, 0.09, 1.0), rough=0.5)
mat_wire_b = set_principled("Mat_Wire_B", (0.08, 0.08, 0.09, 1.0), rough=0.5)
mat_wire_y = set_principled("Mat_Wire_Y", (0.85, 0.72, 0.10, 1.0), rough=0.5)
mat_wire_g = set_principled("Mat_Wire_G", (0.09, 0.52, 0.18, 1.0), rough=0.5)
mat_cap = set_principled("Mat_Cap", (0.14, 0.14, 0.17, 1.0), rough=0.34, metallic=0.5)
mat_batt = set_principled("Mat_Batt", (0.24, 0.24, 0.27, 1.0), rough=0.4, metallic=0.2)
mat_speaker = set_principled("Mat_Speaker", (0.11, 0.11, 0.13, 1.0), rough=0.5)

BOARD_FACE = -0.03   # PCB front surface
def face(d):
    """Mounting height in front of the board."""
    return BOARD_FACE - d

def box(name, x, y, z, sx, sy, sz, mat, bevel=0.02):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name
    o.dimensions = (sx, sy, sz)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        b = o.modifiers.new("Bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
    if o.data.materials:
        o.data.materials[0] = mat
    else:
        o.data.materials.append(mat)
    return link(o)

def cyl(name, x, y, z, radius, depth, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth,
                                        location=(x, y, z), rotation=rot)
    o = bpy.context.active_object
    o.name = name
    for p in o.data.polygons:
        p.use_smooth = True
    if o.data.materials:
        o.data.materials[0] = mat
    else:
        o.data.materials.append(mat)
    return link(o)

def _route(x0, z0, x1, z1, dogleg):
    """Manhattan route between two board points: horizontal, optional
    dogleg, horizontal. Reads like a PCB trace instead of a loose cable."""
    mid = (x0 + x1) / 2.0
    if abs(x1 - x0) < 1e-4:                     # pure vertical
        return [(x0, z0), (x0, z1)]
    return [(x0, z0), (mid, z0), (mid, z1), (x1, z1)]

def wire(name, pts_xz, mat, depth=0.014):
    """Flat PCB trace. Poly spline with square corners at exactly 90 degrees,
    lying on the board surface."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = depth
    cu.bevel_resolution = 1
    cu.resolution_u = 1
    y = face(0.014)
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts_xz) - 1)
    for pt, (px, pz) in zip(sp.points, pts_xz):
        pt.co = (px, y, pz, 1.0)
    o = bpy.data.objects.new(name, cu)
    col_int.objects.link(o)
    if o.data.materials:
        o.data.materials[0] = mat
    else:
        o.data.materials.append(mat)
    return o

def trace(name, src, dst, mat, depth=0.014):
    """Route a trace between two (x, z) pads using right angles."""
    return wire(name, _route(src[0], src[1], dst[0], dst[1], None), mat, depth)

# ---------------------------------------------------------------- PCB
box("PCB_Main", 0, 0, 0, 3.6, 0.06, 2.4, mat_pcb, bevel=0.03)

# ---------------------------------------------------------------- CPU (center)
CX, CZ = -0.3, 0.3
box("CPU_Base", CX, face(0.06), CZ, 0.72, 0.12, 0.72, mat_cpu, bevel=0.02)
box("CPU_Die", CX, face(0.13), CZ, 0.40, 0.03, 0.40, mat_gold, bevel=0.008)
# heat-spreader ridges
for i in range(5):
    box("CPU_Ridge_%d" % i, CX - 0.16 + i * 0.08, face(0.15), CZ,
        0.03, 0.02, 0.36, mat_cpu, bevel=0.004)
# BGA pin grid, two visible rows
for i in range(12):
    for j in range(2):
        px = CX - 0.30 + i * 0.055
        pz = CZ - 0.05 + j * 0.10
        box("CPU_Pin_%d_%d" % (i, j), px, face(0.012), pz,
            0.028, 0.024, 0.028, mat_gold, bevel=0.004)

# ---------------------------------------------------------------- RAM (right)
for i in range(2):
    rz = 0.55 - i * 0.55
    box("RAM_%d" % i, 1.15, face(0.05), rz, 0.55, 0.09, 0.38, mat_chip, bevel=0.015)
    box("RAM_Label_%d" % i, 1.15, face(0.098), rz, 0.40, 0.01, 0.22, mat_gold, bevel=0.004)
    for j in range(7):
        box("RAM%d_Pin_%d" % (i, j), 1.15 - 0.21 + j * 0.07, face(0.018), rz - 0.22,
            0.022, 0.02, 0.14, mat_gold, bevel=0.003)

# ---------------------------------------------------------------- capacitors
for i, (cx, cz) in enumerate([(-1.25, 0.55), (-1.05, 0.85), (0.75, -0.70),
                             (0.98, -0.90), (-0.85, -0.75), (0.45, 0.92)]):
    cyl("Cap_%d" % i, cx, face(0.07), cz, 0.055, 0.13, mat_cap, rot=(math.radians(90), 0, 0))
    cyl("Cap_Top_%d" % i, cx, face(0.145), cz, 0.048, 0.012, mat_gold, rot=(math.radians(90), 0, 0))

# ---------------------------------------------------------------- crystal / oscillator
cyl("Crystal", 0.28, face(0.05), -0.52, 0.075, 0.09, mat_gold, rot=(math.radians(90), 0, 0))

# ---------------------------------------------------------------- battery (bottom-left)
box("Battery", -1.25, face(0.10), -0.72, 0.62, 0.18, 0.44, mat_batt, bevel=0.035)
box("Battery_Label", -1.25, face(0.195), -0.72, 0.48, 0.01, 0.28, mat_wire_y, bevel=0.005)
box("Battery_Term_A", -1.02, face(0.20), -0.72, 0.06, 0.03, 0.12, mat_copper, bevel=0.005)
box("Battery_Term_B", -1.48, face(0.20), -0.72, 0.06, 0.03, 0.12, mat_copper, bevel=0.005)

# ---------------------------------------------------------------- speaker
# Kept well inside the board edge (PCB half-width is 1.8).
SPK_X, SPK_Z = 0.95, 0.45
cyl("Speaker_Cone", SPK_X, face(0.09), SPK_Z, 0.24, 0.16, mat_speaker, rot=(math.radians(90), 0, 0))
cyl("Speaker_Magnet", SPK_X, face(0.03), SPK_Z, 0.12, 0.07, mat_cpu, rot=(math.radians(90), 0, 0))

# ---------------------------------------------------------------- D-pad switch + button housings
box("Switch_DPad", -1.52, face(0.06), -0.62, 0.42, 0.10, 0.42, mat_chip, bevel=0.015)
# Button/switch housings mirror the front controls, but stay inside the board.
for i, (bx, bz) in enumerate([(-0.62, -0.72), (0.02, -0.72), (1.32, -0.34), (1.58, 0.22)]):
    box("Switch_Btn_%d" % i, bx, face(0.07), bz, 0.34, 0.12, 0.34, mat_chip, bevel=0.02)

# ---------------------------------------------------------------- small ICs + resistors
for i, (ix, iz) in enumerate([(0.62, 0.28), (-0.85, 0.18), (0.20, -0.85), (-0.52, -0.48)]):
    box("IC_%d" % i, ix, face(0.045), iz, 0.26, 0.07, 0.19, mat_chip, bevel=0.008)
    for j in range(4):
        box("IC%d_Pin_%d" % (i, j), ix - 0.09 + j * 0.06, face(0.012), iz - 0.12,
            0.02, 0.018, 0.09, mat_gold, bevel=0.003)
for i, (rx, rz) in enumerate([(0.40, 0.62), (0.52, 0.72), (-0.62, 0.52),
                             (-0.72, 0.62), (0.88, -0.34), (1.00, -0.44)]):
    box("Resistor_%d" % i, rx, face(0.03), rz, 0.09, 0.04, 0.045, mat_copper, bevel=0.004)

# ---------------------------------------------------------------- wiring
# Right-angle PCB traces between pads, hugging the board surface.
trace("Trace_CPU_RAM_1", (CX + 0.38, CZ + 0.30), (0.88, 0.72), mat_wire_r)
trace("Trace_CPU_RAM_2", (CX + 0.38, CZ - 0.30), (0.88, 0.38), mat_wire_b)
trace("Trace_CPU_Screen", (CX - 0.30, CZ + 0.38), (-1.20, 1.10), mat_wire_g)
trace("Trace_CPU_Screen_2", (CX + 0.10, CZ + 0.38), (0.30, 1.10), mat_wire_r)
trace("Trace_Batt_PCB", (-1.10, -0.72), (-0.10, 0.00), mat_wire_r)
trace("Trace_Batt_PCB_2", (-1.42, -0.72), (-0.20, -0.10), mat_wire_b)
trace("Trace_PCB_Speaker", (0.62, 0.28), (SPK_X, SPK_Z), mat_wire_y)
trace("Trace_PCB_DPad", (-1.52, -0.62), (-0.62, 0.10), mat_wire_g)
trace("Trace_PCB_Btn1", (-0.62, -0.72), (1.32, -0.34), mat_wire_r)
trace("Trace_PCB_Btn2", (-0.62, -0.72), (1.58, 0.22), mat_wire_b)

# short branch stubs, also right-angled, for bus-like density
wire("Trace_Bus_1", [(0.30, -0.85), (0.30, -1.05), (1.00, -1.05)], mat_wire_g, depth=0.011)
wire("Trace_Bus_2", [(0.45, 0.92), (0.45, 1.05), (1.10, 1.05)], mat_wire_b, depth=0.011)
wire("Trace_Bus_3", [(-0.85, 0.18), (-1.05, 0.18), (-1.05, -0.30)], mat_wire_y, depth=0.011)

# ---------------------------------------------------------------- render
# hide the shell so internals are visible, render, then restore
def set_hidden(col_name, hidden):
    c = bpy.data.collections.get(col_name)
    if c:
        for o in c.objects:
            o.hide_render = hidden

for _c in ("COL_pocket_exterior", "COL_controls", "COL_screen"):
    set_hidden(_c, True)
for o in col_int.objects:
    o.hide_render = False

# bounds check: nothing may stick out past the PCB outline
PCB_HW, PCB_HH = 1.8, 1.2
_oob = []
for o in col_int.objects:
    if o.type != "MESH":
        continue
    for v in o.data.vertices:
        wx = o.matrix_world @ v.co
        if abs(wx.x) > PCB_HW + 1e-3 or abs(wx.z) > PCB_HH + 1e-3:
            _oob.append(o.name)
            break
print("OUT-OF-BOUNDS:", sorted(set(_oob)) if _oob else "none", flush=True)

_restore = {}
for _ln, _e in (("Key_Front", 400), ("Rim_Blue_L", 260), ("Rim_Orange_R", 260),
                ("Top_Warm", 300), ("Fill_Front", 140)):
    _lo = bpy.data.objects.get(_ln)
    if _lo is not None:
        _restore[_ln] = _lo.data.energy
        _lo.data.energy = _e

cam = bpy.data.objects.get("Cam_Logo")
aim = bpy.data.objects.get("Aim_Origin")
if cam:
    cam.location = CAM_POCKET
if aim:
    aim.location = (0, 0, 0.05)
scene.camera = cam

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

# ---------------------------------------------------------------- restore
for _ln, _e in _restore.items():
    _lo = bpy.data.objects.get(_ln)
    if _lo is not None:
        _lo.data.energy = _e
for _c in ("COL_pocket_exterior", "COL_controls", "COL_screen"):
    set_hidden(_c, False)
for o in col_int.objects:
    o.hide_render = True

scene.render.resolution_x = 2048
scene.render.resolution_y = 2048
scene.render.filepath = os.path.join(REPO, "assets", "logo-3d.png")
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("INTERNALS-DONE:", BLEND)