"""Light the south-facing main elevation and tone down the test plaza."""

import unreal


unreal.EditorLevelLibrary.load_level("/Game/Campus/Maps/L_CampusTest")
actors = {
    actor.get_actor_label(): actor
    for actor in unreal.get_editor_subsystem(unreal.EditorActorSubsystem).get_all_level_actors()
}
sun = actors["CampusSun"]
sun.set_actor_rotation(unreal.Rotator(roll=0, pitch=-45, yaw=145), False)
sun.get_editor_property("light_component").set_editor_property("intensity", 12.0)
sky = actors["CampusSkyLight"]
sky.get_editor_property("light_component").set_editor_property("intensity", 2.0)
ground = actors["CampusGround"]
material = unreal.EditorAssetLibrary.load_asset(
    "/Game/Campus/Materials/MI_Main_WhiteTile"
)
if material is None:
    raise RuntimeError("ground material missing")
ground.get_component_by_class(unreal.StaticMeshComponent).set_material(0, material)
if not unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level():
    raise RuntimeError("failed to save campus lighting")
unreal.log("CAMPUS_FACADE_LIGHTING_OK")
unreal.SystemLibrary.quit_editor()
