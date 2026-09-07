"""Import the main-building FBX, rename to SM_MainBuilding, verify and set collision.

Run inside UE5.8:
  UnrealEditor-Cmd.exe YunxiCampus.uproject \
      -ExecutePythonScript=tools/ue/import_main_building.py -NullRHI -Unattended -NoP4
"""

import unreal

FBX = r"E:\data\zcode\.zcode\workspace\default\yunxi-campus-3d\art\export\fbx\main-building.fbx"
DEST = "/Game/Campus/Buildings/MainBuilding"
TARGET = DEST + "/SM_MainBuilding"


def existing_assets():
    return set(unreal.EditorAssetLibrary.list_assets(DEST, False, True))


def main():
    try:
        if unreal.EditorAssetLibrary.does_directory_exist(DEST):
            unreal.EditorAssetLibrary.delete_directory(DEST)
        unreal.EditorAssetLibrary.make_directory(DEST)

        options = unreal.FbxImportUI()
        options.mesh_type_to_import = unreal.FBXImportType.FBXIT_STATIC_MESH
        options.import_as_skeletal = False
        options.import_materials = False
        options.import_textures = False
        options.import_animations = False
        options.static_mesh_import_data.combine_meshes = True
        options.static_mesh_import_data.import_uniform_scale = 1.0

        task = unreal.AssetImportTask()
        task.filename = FBX
        task.destination_path = DEST
        task.automated = True
        task.save = True
        task.options = options
        unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
        unreal.log("Main building import tasks finished")

        before = set()
        new_assets = existing_assets() - before
        unreal.log(f"MAINBUILD imported assets: {sorted(new_assets)}")
        if len(new_assets) == 0:
            raise RuntimeError("no assets imported")
        source_asset = sorted(new_assets)[0].rstrip("/")

        if source_asset != TARGET:
            unreal.EditorAssetLibrary.rename_asset(source_asset, TARGET)
        if not unreal.EditorAssetLibrary.does_asset_exist(TARGET):
            raise RuntimeError(f"renamed asset missing: {TARGET}")

        mesh = unreal.EditorAssetLibrary.load_asset(TARGET)
        body_setup = mesh.get_editor_property("body_setup")
        body_setup.set_editor_property(
            "collision_trace_flag",
            unreal.CollisionTraceFlag.CTF_USE_COMPLEX_AS_SIMPLE,
        )
        unreal.EditorAssetLibrary.save_asset(TARGET)
        unreal.log("MAINBUILD collision_trace_flag set to CTF_USE_COMPLEX_AS_SIMPLE")

        actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
        actor = actor_sub.spawn_actor_from_object(mesh, unreal.Vector(0.0, 0.0, 20000.0))
        origin, extent = actor.get_actor_bounds(False)
        actor.destroy_actor()
        unreal.log(
            f"MAINBUILD bounds origin=({origin.x:.0f},{origin.y:.0f},{origin.z:.0f}) "
            f"extents=({extent.x:.0f},{extent.y:.0f},{extent.z:.0f})"
        )

        slots = mesh.get_editor_property("static_materials")
        unreal.log(f"MAINBUILD material_slots={len(slots)}")

        # Blender source bounds are X=110m, Y=22.91m, Z=16.9m. The export
        # bakes a +90 degree X rotation, so UE receives X=110m, Y=16.9m,
        # Z=22.91m. Validate all three axes so a future axis regression fails
        # before the asset reaches a gameplay map.
        expected_extents = (5500.0, 845.0, 1145.5)
        actual_extents = (extent.x, extent.y, extent.z)
        for axis, (actual, expected) in enumerate(zip(actual_extents, expected_extents)):
            if abs(actual - expected) > 60.0:
                raise RuntimeError(
                    f"building extent axis {axis}={actual:.0f} cm, expected ~{expected:.0f} cm"
                )
        unreal.log("MAINBUILD_IMPORT_OK")
    except Exception as err:
        unreal.log_error(f"MAINBUILD_IMPORT_FAILED: {err}")
    finally:
        # Only the headless commandlet closes the editor; the interactive GUI
        # session stays open for subsequent tasks.
        if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
            unreal.SystemLibrary.quit_editor()


main()
