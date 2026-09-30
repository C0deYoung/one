"""Make the campus test map visible with static lighting disabled."""

import unreal


MAP_PATH = "/Game/Campus/Maps/L_CampusTest"


def main():
    unreal.EditorLevelLibrary.load_level(MAP_PATH)
    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = {actor.get_actor_label(): actor for actor in actor_subsystem.get_all_level_actors()}

    sun = actors["CampusSun"].get_editor_property("light_component")
    sun.set_editor_property("mobility", unreal.ComponentMobility.MOVABLE)
    sun.set_editor_property("intensity", 10.0)
    sun.set_editor_property("atmosphere_sun_light", True)

    sky = actors["CampusSkyLight"].get_editor_property("light_component")
    sky.set_editor_property("mobility", unreal.ComponentMobility.MOVABLE)
    sky.set_editor_property("intensity", 1.0)
    sky.set_editor_property("real_time_capture", True)

    if "CampusSkyAtmosphere" not in actors:
        sky_class = unreal.load_class(None, "/Script/Engine.SkyAtmosphere")
        atmosphere = actor_subsystem.spawn_actor_from_class(
            sky_class,
            unreal.Vector(0.0, 0.0, 0.0),
            unreal.Rotator(0.0, 0.0, 0.0),
        )
        if atmosphere is None:
            raise RuntimeError("failed to spawn SkyAtmosphere")
        atmosphere.set_actor_label("CampusSkyAtmosphere")

    # This map was copied from a World Partition template. These prototype
    # actors are embedded in the level rather than external actor packages,
    # so spatial streaming omits them from the packaged runtime.
    for label in ("MainBuilding", "CampusGround", "MemoryPoint_01", "MemoryPointMarker"):
        actors[label].set_editor_property("is_spatially_loaded", False)

    if not unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level():
        raise RuntimeError("failed to save campus test map")
    unreal.log("CAMPUS_LIGHTING FIX_OK movable_sun=10 movable_sky=1 atmosphere=present")


try:
    main()
except Exception as error:
    unreal.log_error(f"CAMPUS_LIGHTING FIX_FAILED {error}")
finally:
    if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
        unreal.SystemLibrary.quit_editor()
