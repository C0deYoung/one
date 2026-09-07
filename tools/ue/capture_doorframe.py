"""Top-down view of the disc area. Console: py <script>"""

import unreal

les = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
cam_loc = unreal.Vector(160.0, 90.0, 2200.0)
rot = unreal.MathLibrary.find_look_at_rotation(cam_loc, unreal.Vector(160.0, 90.0, 0.0))
les.set_level_viewport_camera_info(cam_loc, rot, unreal.Name("Perspective"))
unreal.log("TOPDOWN_OK")
