"""Create the first Yunxi No.1 High School blockout in Blender.

Run from Blender's Scripting workspace or with:
    blender --background --python build_campus_blockout.py

The geometry is intentionally low detail. It establishes a shared metre scale,
the working campus coordinate system, replaceable building masses, and the
Blender -> FBX scale test described in docs/pipeline/export-settings.md.
It does not claim survey accuracy for unresolved buildings.
"""

from __future__ import annotations

import math
import os

import bpy
from mathutils import Vector


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUTPUT = os.path.join(ROOT, "art", "blender", "campus-blockout.blend")


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def configure_scene() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0
    # Blender 5.2 exposes the real-time engine as BLENDER_EEVEE; newer builds
    # may expose BLENDER_EEVEE_NEXT. Keep the generator portable across LTS
    # releases because the blockout does not depend on a specific renderer.
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.world.color = (0.55, 0.65, 0.75)


def material(name: str, color: tuple[float, float, float, float], roughness: float = 0.8):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = color
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
    return mat


MAT = {
    "ground": material("M_Blockout_Ground", (0.42, 0.50, 0.36, 1.0)),
    "pavement": material("M_Blockout_Pavement", (0.46, 0.47, 0.45, 1.0)),
    "building": material("M_Blockout_Building", (0.78, 0.78, 0.71, 1.0)),
    "main": material("M_Blockout_MainBuilding", (0.72, 0.78, 0.76, 1.0)),
    "glass": material("M_Blockout_GreenGlass", (0.20, 0.48, 0.40, 1.0), 0.25),
    "red": material("M_Blockout_RedStructure", (0.60, 0.08, 0.04, 1.0)),
    "garden": material("M_Blockout_Garden", (0.30, 0.53, 0.22, 1.0)),
    "water": material("M_Blockout_Water", (0.18, 0.44, 0.55, 1.0), 0.2),
    "test": material("M_Blockout_Test", (0.95, 0.35, 0.10, 1.0)),
}


def collection(name: str):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col


COL = {
    "site": collection("SITE_Blockout"),
    "buildings": collection("BUILDINGS_Blockout"),
    "props": collection("PROPS_Blockout"),
    "test": collection("TEST_ExportScale"),
    "cameras": collection("CAMERAS_Reference"),
}


def move_to(obj, target_collection):
    for col in list(obj.users_collection):
        col.objects.unlink(obj)
    target_collection.objects.link(obj)
    return obj


def cube(name: str, dims: tuple[float, float, float], location: tuple[float, float, float], mat, target_collection, bevel: float = 0.0):
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dims
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        obj.data.materials.append(mat)
    if bevel:
        bevel_mod = obj.modifiers.new("Bevel_Blockout", "BEVEL")
        bevel_mod.width = bevel
        bevel_mod.segments = 2
    move_to(obj, target_collection)
    return obj


def plane(name: str, dims: tuple[float, float], location: tuple[float, float, float], mat, target_collection):
    return cube(name, (dims[0], 0.08, dims[1]), location, mat, target_collection)


def building(name: str, x: float, z: float, width: float, depth: float, floors: int, mat=None):
    floor_height = 3.4
    body = cube(name, (width, floor_height * floors, depth), (x, floor_height * floors / 2, z), mat or MAT["building"], COL["buildings"])
    body["source_confidence"] = "working_blockout"
    body["floors"] = floors
    body["coordinate_note"] = "Approximate placement from layout hypothesis; verify against photos."
    return body


def main_building():
    # Main five-floor building. The centre entrance is left as a separate tower
    # so the facade can be rebuilt without replacing both wings.
    body = building("SM_MainTeachingBuilding_Blockout", 0, 12, 110, 12, 5, MAT["main"])
    # Z+ is south/front; keep the entrance on the south face of the main body.
    cube("SM_MainEntranceTower_Blockout", (22, 19, 4), (0, 9.5, 19.5), MAT["glass"], COL["buildings"])
    cube("SM_MainEntranceCanopy_Blockout", (28, 2.0, 7), (0, 3.7, 19.5), MAT["building"], COL["buildings"])
    for x in (-8.0, -3.0, 3.0, 8.0):
        cube(f"SM_MainEntranceColumn_{int(x)}", (0.55, 3.5, 0.55), (x, 1.75, 19.5), MAT["building"], COL["buildings"])
    body["reference_photos"] = "01,05,07,09,12,27"


def campus_masses():
    main_building()
    building("SM_TeacherOffice_Blockout", -34, -12, 74, 12, 4)
    cube("SM_TeacherOffice_GreenCylinder_Blockout", (8, 16, 8), (-34, 8, -6), MAT["glass"], COL["buildings"])
    building("SM_ScienceBuilding_Blockout", 50, -12, 28, 14, 4, MAT["main"])
    building("SM_SeniorClassroom_West_Blockout", -62, -76, 28, 10, 2)
    building("SM_SeniorClassroom_East_Blockout", 62, -76, 28, 10, 2)
    building("SM_Dormitory_West_Blockout", -92, -10, 12, 40, 5)
    building("SM_Dormitory_North_Blockout", -80, -80, 10, 24, 5)
    building("SM_Canteen_Unconfirmed_Blockout", -40, 84, 30, 10, 3)
    # Unresolved northern masses visible in the aerial/snow references.
    for index, x in enumerate((-18, 18), start=1):
        item = building(f"SM_UnconfirmedNorth_{index:02d}", x, -72, 26, 10, 2)
        item["source_confidence"] = "unconfirmed"


def site_layout():
    plane("SM_SiteGround", (240, 220), (0, -0.05, 4), MAT["ground"], COL["site"])
    plane("SM_MainPlaza", (56, 34), (0, 0.02, 44), MAT["pavement"], COL["site"])
    plane("SM_MainRoad", (10, 66), (0, 0.03, 58), MAT["pavement"], COL["site"])
    plane("SM_SportsGround_Blockout", (44, 58), (0, 0.03, -58), MAT["pavement"], COL["site"])
    plane("SM_LeftGarden", (30, 28), (-30, 0.04, 62), MAT["garden"], COL["site"])
    plane("SM_RightGarden", (34, 30), (46, 0.04, 58), MAT["garden"], COL["site"])
    plane("SM_LeftGardenPond_Blockout", (8, 5), (-33, 0.08, 57), MAT["water"], COL["site"])
    cube("SM_RedNorthGate_Blockout", (16, 7, 1.5), (0, 4.5, -101), MAT["red"], COL["props"])
    cube("SM_SchoolGate_Blockout", (28, 5, 1), (0, 2.5, 97), MAT["red"], COL["props"])


def props_and_markers():
    for index, x in enumerate((-2.5, 0.0, 2.5), start=1):
        cube(f"SM_FlagPole_{index:02d}", (0.16, 9 if index == 2 else 7, 0.16), (x, 4.5 if index == 2 else 3.5, 29), MAT["test"], COL["props"])
    for index, (x, z) in enumerate(((0, 84), (4, 29), (24, 28), (-34, 56), (0, -82), (0, -50), (16, 18)), start=1):
        bpy.ops.object.empty_add(type="PLAIN_AXES", location=(x, 0.1, z))
        marker = bpy.context.object
        marker.name = f"MEMORY_{index:02d}"
        marker["interaction_id"] = f"{index:02d}"
        marker["source"] = "js/memories.js; verify after UE map calibration"
        move_to(marker, COL["props"])


def export_scale_test():
    cube("SM_Test_1mCube", (1, 1, 1), (150, 0.5, 0), MAT["test"], COL["test"])
    cube("SM_Test_DoorFrame", (2.0, 2.2, 0.25), (154, 1.1, 0), MAT["test"], COL["test"])
    # UE recognizes this convex box as custom collision for SM_Test_DoorFrame.
    cube("UCX_SM_Test_DoorFrame_00", (2.0, 2.2, 0.25), (154, 1.1, 0.0), None, COL["test"])


def cameras():
    def add_camera(name, location, target):
        data = bpy.data.cameras.new(name)
        cam = bpy.data.objects.new(name, data)
        COL["cameras"].objects.link(cam)
        cam.location = location
        direction = Vector(target) - cam.location
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        data.lens = 50
        data["reference_group"] = name.replace("CAM_", "")
        return cam

    add_camera("CAM_F01_MainSouth", (0, 12, 74), (0, 9, 12))
    add_camera("CAM_F02_MainOblique", (70, 10, 48), (0, 8, 12))
    add_camera("CAM_F04_Aerial", (0, 125, 15), (0, 0, 0))


def save():
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUTPUT)
    print(f"Saved blockout: {OUTPUT}")


def main():
    clear_scene()
    configure_scene()
    campus_masses()
    site_layout()
    props_and_markers()
    export_scale_test()
    cameras()
    save()


if __name__ == "__main__":
    main()
