"""Re-seat door-walk fixtures on the disc floor (top z~210) and probe collision.

Console: py "tools/ue/setup_doorwalk_fix.py"
"""

import unreal


def destroy_old_fixtures(actor_sub, frame_asset, cube_asset):
    for actor in list(actor_sub.get_all_level_actors()):
        if actor.get_class().get_name() != "StaticMeshActor":
            continue
        component = getattr(actor, "static_mesh_component", None)
        if component is None:
            continue
        if component.get_editor_property("static_mesh") in (frame_asset, cube_asset):
            actor.destroy_actor()


def probe_collision(path):
    sm = unreal.EditorAssetLibrary.load_asset(path)
    body_setup = sm.get_editor_property("body_setup")
    trace_flag = None
    try:
        trace_flag = body_setup.get_editor_property("collision_trace_flag")
    except Exception:
        pass
    for prop in ("agg_geom", "aggregated_geom", "geometry"):
        try:
            geom = body_setup.get_editor_property(prop)
            counts = {
                name: len(geom.get_editor_property(name))
                for name in ("box_elems", "convex_elems", "sphyl_elems", "sphere_elems")
            }
            unreal.log(f"COLPROBE {path}: {prop}={counts} trace_flag={trace_flag}")
            return
        except Exception:
            continue
    unreal.log(f"COLPROBE {path}: no geom property matched; trace_flag={trace_flag}")


def main():
    actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    frame_asset = unreal.EditorAssetLibrary.load_asset(
        "/Game/Campus/Buildings/ScaleTest/SM_Test_DoorFrame")
    cube_asset = unreal.EditorAssetLibrary.load_asset(
        "/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube")

    destroy_old_fixtures(actor_sub, frame_asset, cube_asset)

    probe_collision("/Game/Campus/Buildings/ScaleTest/SM_Test_DoorFrame")
    probe_collision("/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube")

    player_start = None
    for actor in actor_sub.get_all_level_actors():
        if actor.get_class().get_name() == "PlayerStart":
            player_start = actor
            break
    loc = player_start.get_actor_location()
    forward = player_start.get_actor_forward_vector()
    right = player_start.get_actor_right_vector()
    yaw = player_start.get_actor_rotation().yaw

    walk = loc + forward * 160.0
    ground_z = 210.0  # SM_Cylinder disc top under the spawn area

    # unreal.Rotator positional order is (roll, pitch, yaw) — always pass yaw
    # as a keyword. Frame A sits centered on the walk line (opening passage);
    # frame B is offset +Y by 90 cm so its left post covers the walk line
    # (blocking); both stay within the 3.5 m radius disc.
    frame_a_loc = loc + forward * 100.0
    frame_b_loc = loc + forward * 300.0 + right * 90.0
    frame_a = actor_sub.spawn_actor_from_object(
        frame_asset,
        unreal.Vector(frame_a_loc.x, frame_a_loc.y, ground_z),
        unreal.Rotator(roll=0.0, pitch=0.0, yaw=yaw - 90.0),
    )
    frame_b = actor_sub.spawn_actor_from_object(
        frame_asset,
        unreal.Vector(frame_b_loc.x, frame_b_loc.y, ground_z),
        unreal.Rotator(roll=0.0, pitch=0.0, yaw=yaw - 90.0),
    )
    cube_actor = actor_sub.spawn_actor_from_object(
        cube_asset,
        unreal.Vector(walk.x, walk.y, ground_z) + right * 250.0,
        unreal.Rotator(roll=0.0, pitch=0.0, yaw=0.0),
    )
    unreal.log(
        f"DOORWALK_FIX_OK frame_a={frame_a.get_actor_location() if frame_a else None} "
        f"frame_b={frame_b.get_actor_location() if frame_b else None} "
        f"cube={cube_actor.get_actor_location() if cube_actor else None}"
    )


main()
