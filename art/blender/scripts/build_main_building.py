"""Build a more detailed, editable main teaching building asset.

This is a photo-guided hero asset, not a survey-accurate reconstruction. It
uses real dimensions only where the project has a clear scale anchor and keeps
the unresolved parts as adjustable parameters.
"""

from __future__ import annotations

import os

import bpy
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUTPUT = os.path.join(ROOT, "art", "blender", "buildings", "main-building.blend")
FRONT_Z = 18.15


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def setup():
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world.color = (0.55, 0.65, 0.75)


def col(name):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    if c.name not in bpy.context.scene.collection.children:
        bpy.context.scene.collection.children.link(c)
    return c


COL = {name: col(name) for name in ("MAIN_STRUCTURE", "MAIN_FACADE", "MAIN_PROPS", "REFERENCE_CAMERAS")}


def mat(name, color, roughness=0.8, metallic=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    bsdf = n.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return m


M = {
    "tile": mat("M_Main_WhiteTile", (0.76, 0.78, 0.73), 0.72),
    "tile_dark": mat("M_Main_TileShadow", (0.52, 0.58, 0.54), 0.78),
    "blue": mat("M_Main_BlueBand", (0.16, 0.34, 0.49), 0.55),
    "glass": mat("M_Main_GreenGlass", (0.08, 0.34, 0.26), 0.18, 0.35),
    "glass_dark": mat("M_Main_GlassShadow", (0.03, 0.12, 0.10), 0.26, 0.25),
    "metal": mat("M_Main_Aluminium", (0.75, 0.77, 0.74), 0.34, 0.7),
    "concrete": mat("M_Main_Concrete", (0.54, 0.52, 0.47), 0.88),
    "red": mat("M_Main_RedStructure", (0.63, 0.055, 0.025), 0.54),
    "letter": mat("M_Main_RedLetters", (0.82, 0.025, 0.015), 0.45, 0.1),
    "white": mat("M_Main_WhiteTrim", (0.92, 0.91, 0.86), 0.58),
    "dark": mat("M_Main_DarkInterior", (0.045, 0.052, 0.048), 0.92),
    "paving": mat("M_Main_RedPaving", (0.35, 0.13, 0.08), 0.9),
}


def add_surface_variation(material, scale, light_color, dark_color, bump_strength=0.12):
    """Add a lightweight procedural albedo/bump layer for close views.

    The maps remain procedural in the source blend; they can later be baked
    to packed textures for UE5 when the target texel density is known.
    """
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = f"SurfaceNoise_{material.name}"
    noise.inputs["Scale"].default_value = scale
    noise.inputs["Detail"].default_value = 3.0
    ramp = nodes.new("ShaderNodeValToRGB")
    ramp.name = f"SurfaceColor_{material.name}"
    ramp.color_ramp.elements[0].color = (*dark_color, 1)
    ramp.color_ramp.elements[1].color = (*light_color, 1)
    bump = nodes.new("ShaderNodeBump")
    bump.name = f"SurfaceBump_{material.name}"
    bump.inputs["Strength"].default_value = bump_strength
    bump.inputs["Distance"].default_value = 0.05
    links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])


add_surface_variation(M["tile"], 18.0, (0.82, 0.83, 0.78), (0.64, 0.66, 0.61), 0.10)
add_surface_variation(M["concrete"], 5.0, (0.62, 0.60, 0.55), (0.42, 0.40, 0.36), 0.18)
add_surface_variation(M["paving"], 13.0, (0.42, 0.17, 0.11), (0.24, 0.07, 0.04), 0.14)


def move(obj, target):
    for old in list(obj.users_collection):
        old.objects.unlink(obj)
    target.objects.link(obj)
    return obj


def cube(name, dims, loc, material, target="MAIN_STRUCTURE", bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(material)
    if bevel:
        mod = o.modifiers.new("EdgeSoftness", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    return move(o, COL[target])


def cylinder(name, radius, depth, loc, material, target="MAIN_PROPS", vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=(1.5708, 0, 0))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(material)
    return move(o, COL[target])


def text(name, body, loc, size, material, target="MAIN_PROPS"):
    bpy.ops.object.text_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.data.body = body
    o.data.align_x = "CENTER"
    o.data.align_y = "CENTER"
    o.data.size = size
    o.data.extrude = 0.055
    o.data.bevel_depth = 0.018
    # Blender text's default front faces -Z; the facade faces south (+Z).
    # Rotate the sign so the camera sees the readable front rather than a
    # mirrored back face.
    o.rotation_euler[1] = 3.141592653589793
    font = "C:/Windows/Fonts/simhei.ttf"
    if os.path.exists(font):
        o.data.font = bpy.data.fonts.load(font)
    o.data.materials.append(material)
    return move(o, COL[target])


def window(name, x, y, z=FRONT_Z + 0.08, width=1.7, height=1.35):
    glass = cube(name, (width, height, 0.08), (x, y, z), M["glass"], "MAIN_FACADE", 0.03)
    # A small lower sill makes the facade read as tiled construction rather
    # than a single flat texture.
    cube(f"{name}_Sill", (width + 0.15, 0.10, 0.16), (x, y - height / 2 - 0.08, z + 0.01), M["blue"], "MAIN_FACADE")
    return glass


def wings():
    floor_h = 3.4
    total_h = floor_h * 5
    for side, x0 in (("West", -33.5), ("East", 33.5)):
        cube(f"SM_MainWing_{side}", (43, total_h, 12), (x0, total_h / 2, 12), M["tile"], "MAIN_STRUCTURE", 0.08)
        for floor in range(5):
            y = floor * floor_h + 1.85
            # Eight photo-sized bays on each wing; the bay count is exposed
            # as geometry so it can be adjusted after camera comparison.
            for bay in range(8):
                x = x0 - 16.8 + bay * 4.8
                window(f"SM_{side}_Window_F{floor + 1}_B{bay + 1}", x, y)
            # Exterior corridor slabs and blue horizontal tile bands.
            cube(f"SM_{side}_CorridorSlab_F{floor + 1}", (43, 0.20, 2.35), (x0, floor * floor_h + 0.16, 19.25), M["concrete"], "MAIN_FACADE")
            cube(f"SM_{side}_BlueBand_F{floor + 1}", (43, 0.18, 0.30), (x0, floor * floor_h + 3.05, FRONT_Z + 0.05), M["blue"], "MAIN_FACADE")
            for post in range(9):
                px = x0 - 21.0 + post * 5.25
                cube(f"SM_{side}_RailPost_F{floor + 1}_{post + 1}", (0.18, 2.55, 0.18), (px, floor * floor_h + 1.4, 20.1), M["white"], "MAIN_FACADE")
            cube(f"SM_{side}_RailTop_F{floor + 1}", (43, 0.14, 0.14), (x0, floor * floor_h + 2.65, 20.1), M["white"], "MAIN_FACADE")
        for banner_x in (x0 - 15.5, x0 + 15.5):
            cube(f"SM_{side}_RedVerticalBanner_{banner_x}", (0.24, 9.8, 0.08), (banner_x, 10.0, 18.26), M["red"], "MAIN_FACADE")


def central_tower():
    # The tower is set forward from the wings, matching the strong green-glass
    # vertical element in photos 01/05/07/09.
    cube("SM_MainCentralTower", (24, 16.6, 12), (0, 13.2, 13.4), M["tile"], "MAIN_STRUCTURE", 0.06)
    cube("SM_MainCentralGlassFacade", (19, 14, 0.22), (0, 12.6, 19.58), M["glass_dark"], "MAIN_FACADE")
    for x in (-9.5, -6.33, -3.17, 0, 3.17, 6.33, 9.5):
        cube(f"SM_MainGlassVerticalMullion_{x}", (0.22, 14.0, 0.30), (x, 12.6, 19.74), M["white"], "MAIN_FACADE")
    for row in range(6):
        cube(f"SM_MainGlassHorizontalMullion_{row + 1}", (19, 0.22, 0.30), (0, 5.8 + row * 3.4, 19.74), M["white"], "MAIN_FACADE")
    cube("SM_MainTowerLeftTrim", (1.1, 16.8, 0.45), (-11.0, 13.2, 19.78), M["white"], "MAIN_FACADE")
    cube("SM_MainTowerRightTrim", (1.1, 16.8, 0.45), (11.0, 13.2, 19.78), M["white"], "MAIN_FACADE")
    cube("SM_MainTowerTopTrim", (24.6, 0.75, 0.55), (0, 21.9, 19.4), M["red"], "MAIN_FACADE")
    text("TXT_MainSchoolName", "郧西一中", (0, 12.8, 19.92), 2.1, M["letter"])
    cylinder("SM_MainSchoolEmblem", 1.7, 0.34, (0, 20.45, 19.92), M["glass"], "MAIN_PROPS")
    bpy.ops.mesh.primitive_torus_add(major_radius=1.75, minor_radius=0.14, major_segments=32, minor_segments=8, location=(0, 20.45, 20.12), rotation=(1.5708, 0, 0))
    ring = bpy.context.object
    ring.name = "SM_MainSchoolEmblemRing"
    ring.data.materials.append(M["white"])
    move(ring, COL["MAIN_PROPS"])


def entrance():
    # The lower entrance remains open so an eventual UE character can enter.
    cube("SM_MainLobbyFloor", (22, 0.20, 11), (0, 0.1, 14.0), M["paving"], "MAIN_FACADE")
    cube("SM_MainLobbyLeftWall", (1.0, 4.9, 7), (-11.5, 2.45, 15.5), M["tile"], "MAIN_STRUCTURE")
    cube("SM_MainLobbyRightWall", (1.0, 4.9, 7), (11.5, 2.45, 15.5), M["tile"], "MAIN_STRUCTURE")
    cube("SM_MainLobbyBackWall", (22, 4.9, 1.2), (0, 2.45, 8.0), M["tile_dark"], "MAIN_STRUCTURE")
    cube("SM_MainEntranceCanopy", (24.6, 0.8, 7), (0, 4.75, 19.4), M["concrete"], "MAIN_STRUCTURE", 0.08)
    for x in (-8.0, -3.0, 3.0, 8.0):
        cylinder(f"SM_MainEntranceColumn_{x}", 0.38, 3.5, (x, 2.45, 19.4), M["white"], "MAIN_PROPS", 20)
    for x in (-7.5, -2.5, 2.5, 7.5):
        cylinder(f"SM_MainEntranceLantern_{x}", 0.48, 0.72, (x, 4.25, 19.45), M["red"], "MAIN_PROPS", 24)
    cube("SM_MainEntranceDoorLeft", (1.4, 3.3, 0.10), (-3.0, 1.75, 19.55), M["glass"], "MAIN_FACADE")
    cube("SM_MainEntranceDoorRight", (1.4, 3.3, 0.10), (3.0, 1.75, 19.55), M["glass"], "MAIN_FACADE")


def reference_cameras():
    def camera(name, location, target):
        data = bpy.data.cameras.new(name)
        obj = bpy.data.objects.new(name, data)
        COL["REFERENCE_CAMERAS"].objects.link(obj)
        obj.location = location
        obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()
        data.lens = 50
        return obj

    camera("CAM_F01_MainSouth", (0, 12, 74), (0, 9, 12))
    camera("CAM_F02_MainOblique", (70, 10, 48), (0, 8, 12))
    camera("CAM_F03_Corridor", (22, 7, 34), (22, 7, 13))


def lighting():
    sun_data = bpy.data.lights.new("LGT_MainSun", type="SUN")
    sun_data.energy = 2.5
    sun = bpy.data.objects.new("LGT_MainSun", sun_data)
    COL["REFERENCE_CAMERAS"].objects.link(sun)
    sun.rotation_euler = (0.55, -0.35, -0.5)

    area_data = bpy.data.lights.new("LGT_MainFill", type="AREA")
    area_data.energy = 1300
    area_data.shape = "DISK"
    area_data.size = 55
    area = bpy.data.objects.new("LGT_MainFill", area_data)
    COL["REFERENCE_CAMERAS"].objects.link(area)
    area.location = (0, 35, 60)
    area.rotation_euler = (0.25, 0, 3.14159)

    scene = bpy.context.scene
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 576
    scene.render.resolution_percentage = 100
    scene.camera = bpy.data.objects.get("CAM_F01_MainSouth")


def save():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
    print(f"Saved main-building asset: {OUTPUT}")


def main():
    clear_scene()
    setup()
    wings()
    central_tower()
    entrance()
    reference_cameras()
    lighting()
    save()


if __name__ == "__main__":
    main()
