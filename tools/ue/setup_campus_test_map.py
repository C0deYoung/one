"""Create the first playable campus test map.

Run headlessly with UE5.8::
  UnrealEditor-Cmd.exe YunxiCampus.uproject -ExecutePythonScript=.../setup_campus_test_map.py -NullRHI -Unattended -NoP4

    The committed target level is opened by DefaultEngine.ini while the project
    keeps its first-person game mode and character assets in Content/FirstPerson.
    The imported main building, a simple ground plane, PlayerStart, and low-cost
    lighting are then placed.
"""

import unreal


TARGET_MAP = "/Game/Campus/Maps/L_CampusTest"
BUILDING = "/Game/Campus/Buildings/MainBuilding/SM_MainBuilding"
CUBE = "/Engine/BasicShapes/Cube.Cube"


def log(message):
    unreal.log(f"CAMPUS_MAP {message}")


def spawn_class(actor_sub, class_name, location, rotation, label):
    actor_class = unreal.load_class(None, f"/Script/Engine.{class_name}")
    if actor_class is None:
        raise RuntimeError(f"unable to load /Script/Engine.{class_name}")
    actor = actor_sub.spawn_actor_from_class(actor_class, location, rotation)
    if actor is None:
        raise RuntimeError(f"unable to spawn {class_name}")
    actor.set_actor_label(label)
    return actor


def remove_previous_setup(actor_sub):
    labels = {
        "MainBuilding",
        "CampusGround",
        "CampusPlayerStart",
        "CampusSun",
        "CampusSkyLight",
    }
    removed = 0
    for actor in list(actor_sub.get_all_level_actors()):
        if actor.get_actor_label() in labels and actor_sub.destroy_actor(actor):
            removed += 1
    log(f"removed_previous_setup={removed}")


def main():
    try:
        editor_world = unreal.EditorLevelLibrary.get_editor_world()
        if editor_world is None:
            raise RuntimeError("editor world unavailable")
        level_sub = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
        log(f"current_world={editor_world.get_path_name()}")
        actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
        if editor_world.get_path_name().split(".")[0] != TARGET_MAP:
            raise RuntimeError(
                f"expected current world {TARGET_MAP}, got {editor_world.get_path_name()}"
            )
        remove_previous_setup(actor_sub)

        building = unreal.EditorAssetLibrary.load_asset(BUILDING)
        cube = unreal.EditorAssetLibrary.load_asset(CUBE)
        if building is None or cube is None:
            raise RuntimeError("building or cube asset missing")

        building_actor = actor_sub.spawn_actor_from_object(
            building,
            unreal.Vector(0.0, 0.0, 0.0),
            unreal.Rotator(roll=0.0, pitch=0.0, yaw=0.0),
        )
        if building_actor is None:
            raise RuntimeError("failed to spawn main building")
        building_actor.set_actor_label("MainBuilding")

        ground = actor_sub.spawn_actor_from_object(
            cube,
            unreal.Vector(0.0, 0.0, -5.0),
            unreal.Rotator(roll=0.0, pitch=0.0, yaw=0.0),
        )
        if ground is None:
            raise RuntimeError("failed to spawn ground")
        ground.set_actor_label("CampusGround")
        ground.set_actor_scale3d(unreal.Vector(120.0, 110.0, 0.1))

        player_start = spawn_class(
            actor_sub,
            "PlayerStart",
            unreal.Vector(0.0, -4500.0, 110.0),
            unreal.Rotator(roll=0.0, pitch=0.0, yaw=90.0),
            "CampusPlayerStart",
        )
        player_start.set_actor_rotation(
            unreal.Rotator(roll=0.0, pitch=0.0, yaw=90.0), False
        )

        directional = spawn_class(
            actor_sub,
            "DirectionalLight",
            unreal.Vector(0.0, 0.0, 2000.0),
            unreal.Rotator(roll=0.0, pitch=-45.0, yaw=-35.0),
            "CampusSun",
        )
        directional.get_editor_property("light_component").set_editor_property(
            "intensity", 5.0
        )

        sky = spawn_class(
            actor_sub,
            "SkyLight",
            unreal.Vector(0.0, 0.0, 1500.0),
            unreal.Rotator(roll=0.0, pitch=0.0, yaw=0.0),
            "CampusSkyLight",
        )
        sky.get_editor_property("light_component").set_editor_property(
            "intensity", 0.5
        )

        origin, extent = building_actor.get_actor_bounds(False)
        log(
            f"building_bounds_origin=({origin.x:.0f},{origin.y:.0f},{origin.z:.0f}) "
            f"extents=({extent.x:.0f},{extent.y:.0f},{extent.z:.0f})"
        )
        log(
            f"actors={len(actor_sub.get_all_level_actors())} "
            f"player_start={player_start.get_actor_location()}"
        )
        if not level_sub.save_current_level():
            raise RuntimeError(f"failed to save {TARGET_MAP}")
        log("SETUP_OK")
    except Exception as err:
        unreal.log_error(f"CAMPUS_MAP_SETUP_FAILED: {err}")
    finally:
        if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
            unreal.SystemLibrary.quit_editor()


main()
