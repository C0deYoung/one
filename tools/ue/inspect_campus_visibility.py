"""Print saved campus scene properties relevant to a dark play viewport."""

import unreal


def describe(actor):
    label = actor.get_actor_label()
    location = actor.get_actor_location()
    rotation = actor.get_actor_rotation()
    unreal.log(
        f"CAMPUS_VIS {label} class={actor.get_class().get_name()} "
        f"location={location} rotation={rotation} hidden={actor.get_editor_property('hidden')}"
    )
    for field in ("is_spatially_loaded", "is_editor_only_actor", "runtime_grid"):
        try:
            unreal.log(f"CAMPUS_VIS {label}.{field}={actor.get_editor_property(field)}")
        except Exception:
            continue
    for property_name in ("light_component", "static_mesh_component"):
        try:
            component = actor.get_editor_property(property_name)
        except Exception:
            continue
        if component is None:
            continue
        for field in ("intensity", "mobility", "visible", "cast_shadows", "static_mesh"):
            try:
                value = component.get_editor_property(field)
                unreal.log(f"CAMPUS_VIS {label}.{field}={value}")
            except Exception:
                continue


try:
    world = unreal.EditorLevelLibrary.load_level("/Game/Campus/Maps/L_CampusTest")
    unreal.log(f"CAMPUS_VIS world={world}")
    actors = unreal.EditorLevelLibrary.get_all_level_actors()
    unreal.log(f"CAMPUS_VIS actor_count={len(actors)}")
    for actor in actors:
        if actor is None:
            continue
        describe(actor)
finally:
    if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
        unreal.SystemLibrary.quit_editor()
