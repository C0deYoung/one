"""Aim the level viewport at the door-walk fixtures. Console: py <script>"""

import unreal

les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
les.set_level_viewport_camera_info(
    unreal.Vector(-380.0, 0.0, 520.0),
    unreal.Rotator(-14.0, 0.0, 0.0),
    unreal.Name("Perspective"),
)
unreal.log("CAMERA_OK")
