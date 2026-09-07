"""Print the PIE player pawn location. Console (grave) in PIE: py <script>"""

import unreal

world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_game_world()
if world is None:
    unreal.log("PAWNPROBE no game world (not in PIE?)")
else:
    pawn = unreal.GameplayStatics.get_player_pawn(world, 0)
    if pawn is None:
        unreal.log("PAWNPROBE no pawn")
    else:
        loc = pawn.get_actor_location()
        unreal.log(f"PAWNPROBE pawn=({loc.x:.0f},{loc.y:.0f},{loc.z:.0f})")
