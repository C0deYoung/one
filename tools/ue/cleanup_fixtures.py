"""Remove transient door-walk fixtures from Lvl_FirstPerson. Console: py <script>"""

import unreal

actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
removed = 0
for actor in list(actor_sub.get_all_level_actors()):
    if actor.get_class().get_name() != "StaticMeshActor":
        continue
    component = getattr(actor, "static_mesh_component", None)
    if component is None:
        continue
    mesh = component.get_editor_property("static_mesh")
    if mesh is not None and mesh.get_name().startswith("SM_Test_"):
        actor.destroy_actor()
        removed += 1
unreal.log(f"FIXTURE_CLEANUP_OK removed={removed}")
