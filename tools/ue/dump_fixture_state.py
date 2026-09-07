"""Dump full state of the spawned SM_Test_* actors. Console: py <script>"""

import unreal

actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
for actor in actor_sub.get_all_level_actors():
    cls = actor.get_class().get_name()
    if cls != "StaticMeshActor":
        continue
    label = actor.get_actor_label()
    if "Test" not in label and "Door" not in label and "Cube" not in label:
        continue
    loc = actor.get_actor_location()
    scale = actor.get_actor_scale3d()
    rot = actor.get_actor_rotation()
    hidden = actor.is_hidden_ed()
    component = actor.get_editor_property("static_mesh_component")
    mesh = component.get_editor_property("static_mesh") if component else None
    comp_visible = component.is_editor_property_visible if False else None
    vis = component.get_editor_property("visible") if component else None
    unreal.log(
        f"ACTORDUMP '{label}' cls={cls} loc=({loc.x:.0f},{loc.y:.0f},{loc.z:.0f}) "
        f"scale=({scale.x:.2f},{scale.y:.2f},{scale.z:.2f}) rot=({rot.pitch:.0f},{rot.yaw:.0f},{rot.roll:.0f}) "
        f"hidden={hidden} comp_visible={vis} mesh={mesh.get_name() if mesh else None}"
    )
unreal.log("ACTORDUMP_DONE")
