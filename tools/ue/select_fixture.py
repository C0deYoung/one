"""Select the door fixture so pressing F in the viewport focuses it."""

import unreal

actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
target = None
for actor in actor_sub.get_all_level_actors():
    if actor.get_class().get_name() != "StaticMeshActor":
        continue
    component = getattr(actor, "static_mesh_component", None)
    if component is None:
        continue
    mesh = component.get_editor_property("static_mesh")
    if mesh is None:
        continue
    if mesh.get_name() == "SM_Test_DoorFrame":
        target = actor
        break

if target is None:
    unreal.log("SELECT_FIXTURE_FAILED: frame actor not found")
else:
    selected = False
    for setter_name in ("set_selected_editor_actor", "set_selection"):
        setter = getattr(actor_sub, setter_name, None)
        if setter is None:
            continue
        try:
            setter(target)
            selected = True
            unreal.log(f"SELECT_FIXTURE_OK via {setter_name}")
            break
        except Exception as err:
            unreal.log(f"SELECT_FIXTURE {setter_name} error: {err}")
    if not selected:
        try:
            unreal.EditorLevelLibrary.select_actor(target)
            selected = True
            unreal.log("SELECT_FIXTURE_OK via EditorLevelLibrary.select_actor")
        except Exception as err:
            unreal.log(f"SELECT_FIXTURE_FAILED: {err}")
