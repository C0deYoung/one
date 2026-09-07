"""Spawn the door-frame fixture in Lvl_FirstPerson aligned with the PlayerStart.

Run in the editor via the console:  py "tools/ue/setup_doorwalk.py"
Transient placement only (never saved into the template map).
"""

import unreal


def main():
    actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    player_start = None
    for actor in actor_sub.get_all_level_actors():
        if actor.get_class().get_name() == "PlayerStart":
            player_start = actor
            break
    if player_start is None:
        unreal.log_error("DOORWALK_SETUP_FAILED: no PlayerStart")
        return

    loc = player_start.get_actor_location()
    forward = player_start.get_actor_forward_vector()
    right = player_start.get_actor_right_vector()
    yaw = player_start.get_actor_rotation().yaw

    frame = unreal.EditorAssetLibrary.load_asset(
        "/Game/Campus/Buildings/ScaleTest/SM_Test_DoorFrame")
    cube = unreal.EditorAssetLibrary.load_asset(
        "/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube")
    if frame is None or cube is None:
        unreal.log_error("DOORWALK_SETUP_FAILED: fixture assets missing")
        return

    walk_offset = forward * 160.0
    # The opening runs through the frame's local Y; yaw - 90 aligns it with
    # the player's forward direction.
    frame_rot = unreal.Rotator(0.0, yaw - 90.0, 0.0)
    frame_actor = actor_sub.spawn_actor_from_object(
        frame, loc + walk_offset, frame_rot)
    cube_actor = actor_sub.spawn_actor_from_object(
        cube, loc + walk_offset + right * 250.0, unreal.Rotator(0.0, 0.0, 0.0))

    if frame_actor is None or cube_actor is None:
        unreal.log_error("DOORWALK_SETUP_FAILED: spawn failed")
        return
    unreal.log(f"DOORWALK_SETUP_OK frame={frame_actor.get_actor_location()} "
               f"cube={cube_actor.get_actor_location()}")


main()
