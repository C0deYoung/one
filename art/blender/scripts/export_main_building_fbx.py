"""Export the hero main-building mesh for Unreal Engine 5."""

from __future__ import annotations

import os

import bpy


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
BLEND = os.path.join(ROOT, "art", "blender", "buildings", "main-building.blend")
OUTPUT = os.path.join(ROOT, "art", "export", "fbx", "main-building.fbx")


def main():
    bpy.ops.wm.open_mainfile(filepath=BLEND)
    bpy.ops.object.select_all(action="DESELECT")
    export_collections = ("MAIN_STRUCTURE", "MAIN_FACADE", "MAIN_PROPS")
    for collection_name in export_collections:
        collection = bpy.data.collections.get(collection_name)
        if not collection:
            continue
        for obj in collection.objects:
            if obj.type in {"MESH", "FONT", "CURVE", "SURFACE", "META"}:
                obj.select_set(True)
    active = bpy.data.objects.get("SM_MainCentralTower")
    if active:
        bpy.context.view_layer.objects.active = active

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=OUTPUT,
        use_selection=True,
        object_types={"MESH", "OTHER"},
        apply_scale_options="FBX_SCALE_ALL",
        axis_forward="-Z",
        axis_up="Y",
        use_mesh_modifiers=True,
        add_leaf_bones=False,
        bake_anim=False,
        path_mode="COPY",
        embed_textures=False,
    )
    print(f"Exported FBX: {OUTPUT}")


if __name__ == "__main__":
    main()
