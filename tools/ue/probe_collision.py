"""Probe level geometry heights and imported collision shapes. Console: py <script>"""

import unreal


def main():
    actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)

    unreal.log("COLPROBE level actors with world bbox:")
    for actor in actor_sub.get_all_level_actors():
        cls = actor.get_class().get_name()
        if cls not in ("StaticMeshActor", "PlayerStart"):
            continue
        origin, extent = actor.get_actor_bounds(False)
        unreal.log(
            f"GEOPROBE {cls} '{actor.get_actor_label()}' "
            f"loc=({origin.x:.0f},{origin.y:.0f},{origin.z:.0f}) "
            f"ext=({extent.x:.0f},{extent.y:.0f},{extent.z:.0f})"
        )

    for path in ("/Game/Campus/Buildings/ScaleTest/SM_Test_DoorFrame",
                 "/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube"):
        sm = unreal.EditorAssetLibrary.load_asset(path)
        if sm is None:
            unreal.log(f"COLPROBE {path}: MISSING")
            continue
        body_setup = sm.get_editor_property("body_setup")
        geom = body_setup.get_editor_property("aggregated_geom")
        counts = {}
        for name in ("box_elems", "convex_elems", "sphyl_elems", "sphere_elems"):
            counts[name] = len(geom.get_editor_property(name))
        unreal.log(f"COLPROBE {path}: {counts}")
    unreal.log("COLPROBE_DONE")


main()
