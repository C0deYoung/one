"""Ray-cast the placed door fixture: posts and beam must block, opening must not.

Console: py "tools/ue/verify_door_collision.py"
"""

import unreal


def trace(world, start, end):
    result = unreal.SystemLibrary.line_trace_single(
        world,
        start,
        end,
        unreal.TraceTypeQuery.TRACE_TYPE_QUERY1,
        False,
        [],
        unreal.DrawDebugTrace.NONE,
        True,
    )
    if isinstance(result, tuple):
        blocking = result[0]
        hit = result[1] if len(result) > 1 else None
    else:
        hit = result
        blocking = getattr(hit, "blocking_hit", False) if hit else False
    actor_name = None
    if blocking and hit is not None:
        actor = hit.to_actor() if hasattr(hit, "to_actor") else hit.actor
        if actor is not None:
            actor_name = actor.get_actor_label()
    return blocking, actor_name


def main():
    world = unreal.get_editor_subsystem(unreal.UnrealEditorSubsystem).get_editor_world()
    if world is None:
        unreal.log("RAYPROBE_FAILED: no editor world")
        return

    checks = [
        ("left_post", unreal.Vector(360.0, -90.0, 300.0), unreal.Vector(-40.0, -90.0, 300.0), True),
        ("opening", unreal.Vector(360.0, 0.0, 300.0), unreal.Vector(-40.0, 0.0, 300.0), False),
        ("beam", unreal.Vector(360.0, 0.0, 420.0), unreal.Vector(-40.0, 0.0, 420.0), True),
        ("cube", unreal.Vector(410.0, 250.0, 260.0), unreal.Vector(310.0, 250.0, 260.0), True),
    ]

    ok = True
    for name, start, end, expected in checks:
        blocking, actor_name = trace(world, start, end)
        status = "OK" if blocking == expected else "MISMATCH"
        if blocking != expected:
            ok = False
        unreal.log(f"RAYPROBE {name}: blocking={blocking} expected={expected} "
                   f"hit={actor_name} [{status}]")

    unreal.log("RAYPROBE_PASSED" if ok else "RAYPROBE_FAILED")


main()
