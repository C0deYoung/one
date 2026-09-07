"""Import the scale-test FBX into the YunxiCampus project and measure bounds.

Run inside UE5.8:
  UnrealEditor-Cmd.exe YunxiCampus.uproject \
      -ExecutePythonScript=tools/ue/import_scale_test.py -NullRHI -Unattended -NoP4

Prints SCALE_IMPORT_OK on success, SCALE_IMPORT_FAILED on any failure.
"""

import unreal

FBX = r"E:\data\zcode\.zcode\workspace\default\yunxi-campus-3d\art\export\fbx\scale-test.fbx"
DEST = "/Game/Campus/Buildings/ScaleTest"
CUBE = "/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube"
FRAME = "/Game/Campus/Buildings/ScaleTest/SM_Test_DoorFrame"

EXPECTED = {
    CUBE: (50.0, 50.0, 50.0),      # 1 m cube -> 100 cm per axis, extent 50 cm
    FRAME: None,                    # reported, upright gate checked in code
}


def import_scale_test():
    if unreal.EditorAssetLibrary.does_directory_exist(DEST):
        unreal.EditorAssetLibrary.delete_directory(DEST)

    options = unreal.FbxImportUI()
    options.mesh_type_to_import = unreal.FBXImportType.FBXIT_STATIC_MESH
    options.import_as_skeletal = False
    options.import_materials = False
    options.import_textures = False
    options.import_animations = False
    options.static_mesh_import_data.combine_meshes = False
    options.static_mesh_import_data.import_uniform_scale = 1.0

    task = unreal.AssetImportTask()
    task.filename = FBX
    task.destination_path = DEST
    task.automated = True
    task.save = True
    task.options = options
    unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
    unreal.log("Import tasks finished")


def measure(asset_path):
    asset = unreal.EditorAssetLibrary.load_asset(asset_path)
    if asset is None:
        return None
    actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actor = actor_sub.spawn_actor_from_object(asset, unreal.Vector(0.0, 0.0, 5000.0))
    if actor is None:
        return None
    origin, extent = actor.get_actor_bounds(False)
    actor.destroy_actor()
    return (round(extent.x, 2), round(extent.y, 2), round(extent.z, 2))


def main():
    try:
        import_scale_test()
        results = {}
        for path in (CUBE, FRAME):
            results[path] = measure(path)
            unreal.log(f"BOUNDS {path}: {results[path]}")

        cube = results[CUBE]
        frame = results[FRAME]
        if cube is None or frame is None:
            raise RuntimeError(f"missing imported assets: {results}")

        for axis, size in enumerate(cube):
            if abs(size - 50.0) > 0.1:
                raise RuntimeError(f"cube axis {axis} extent {size} cm, expected 50 +/- 0.1")

        # Upright check: the 2.2 m frame height must be on UE Z.
        if abs(frame[2] - 110.0) > 0.1:
            raise RuntimeError(
                f"frame Z extent {frame[2]} cm, expected 110 (height must be on UE Z)"
            )
        unreal.log("SCALE_IMPORT_OK")
    except Exception as err:
        unreal.log_error(f"SCALE_IMPORT_FAILED: {err}")
    finally:
        unreal.SystemLibrary.quit_editor()


main()
