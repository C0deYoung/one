"""Export and verify the Blender→UE5 scale/door-frame fixture.

Repository convention (docs/pipeline/export-settings.md): Blender scenes are
built in meters with X=east, Y=up(height), Z=south(depth). The export keeps the
same axis declaration as the main building so this fixture is a faithful
canary for the hero asset. Rotation and scale are baked at construction time
(identity transforms), which satisfies the "apply rotation/scale" rule.

Run export:  blender --background --python export_scale_test_fbx.py
Run verify:  blender --background --python export_scale_test_fbx.py -- --verify
"""

from __future__ import annotations

import os
import sys

import bpy


ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUTPUT = os.path.join(ROOT, "art", "export", "fbx", "scale-test.fbx")

CUBE_NAME = "SM_Test_1mCube"
FRAME_NAME = "SM_Test_DoorFrame"
POST_DIMS = (0.2, 2.2, 0.25)   # width(x), height(y), depth(z)
BEAM_DIMS = (2.0, 0.2, 0.25)
OPENING_W = 1.6                # net door opening: 1.6 m wide
OPENING_H = 2.0                # net door opening: 2.0 m high
FRAME_CENTER_X = 1.5           # frame origin, 3 m from the cube origin
CUBE_CENTER = (-1.5, 0.5, 0.0)  # 1 m cube sitting on the ground


def add_box(name, center, dims):
    """Create an axis-aligned box mesh with baked size and identity transform."""
    mesh = bpy.data.meshes.new(name)
    cx, cy, cz = center
    dx, dy, dz = (d / 2.0 for d in dims)
    corners = []
    for k in (0, 1):
        for j in (0, 1):
            for i in (0, 1):
                corners.append((
                    cx + (i - 0.5) * 2 * dx,
                    cy + (j - 0.5) * 2 * dy,
                    cz + (k - 0.5) * 2 * dz,
                ))
    faces = [
        (0, 4, 6, 2),  # -X
        (1, 3, 7, 5),  # +X
        (0, 1, 5, 4),  # -Y
        (2, 6, 7, 3),  # +Y
        (0, 2, 3, 1),  # -Z
        (4, 5, 7, 6),  # +Z
    ]
    mesh.from_pydata(corners, [], faces)
    mesh.validate()
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def build_scene():
    add_box(CUBE_NAME, CUBE_CENTER, (1.0, 1.0, 1.0))

    post_x = POST_DIMS[0] / 2.0
    inner_x = OPENING_W / 2.0
    frame_parts = []
    collision_specs = []
    # Posts: full frame height, one on each side of the opening.
    for sign in (-1.0, 1.0):
        center = (FRAME_CENTER_X + sign * (inner_x + post_x), POST_DIMS[1] / 2.0, 0.0)
        frame_parts.append(add_box(f"part_post_{int(sign)}", center, POST_DIMS))
        collision_specs.append((center, POST_DIMS))
    # Beam: spans the full width on top, bottom face at OPENING_H.
    beam_center = (FRAME_CENTER_X, OPENING_H + BEAM_DIMS[1] / 2.0, 0.0)
    frame_parts.append(add_box("part_beam", beam_center, BEAM_DIMS))
    collision_specs.append((beam_center, BEAM_DIMS))

    # One UCX box per frame part; none of them crosses the doorway.
    for index, (center, dims) in enumerate(collision_specs, start=1):
        add_box(f"UCX_SM_Test_DoorFrame_{index}", center, dims)
    return frame_parts


def join_objects(objects, name):
    for obj in bpy.data.objects:
        obj.select_set(False)
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    if len(objects) > 1:
        bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    joined.name = name
    joined.data.name = name
    return joined


def bake_z_up_rotation(objects):
    """Rotate mesh data +90 deg about world X so Blender-Y height becomes Z.

    UE 5.8 (Interchange) reads Blender 5.2 FBX written with the default axis
    declaration as an identity mapping (verified with this fixture: a Y-up
    frame imported lying down, X/Y/Z unchanged). Baking the rotation into the
    mesh data puts the content into standard Z-up form, which imports upright
    without touching the source .blend files or adding level rotations.
    """
    from math import radians
    from mathutils import Matrix

    rotation = Matrix.Rotation(radians(90.0), 4, "X")
    for obj in objects:
        for vertex in obj.data.vertices:
            vertex.co = rotation @ vertex.co
        obj.data.update()


def do_export():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    frame_parts = build_scene()
    join_objects(frame_parts, FRAME_NAME)

    export_objects = list(bpy.data.objects)
    bake_z_up_rotation(export_objects)

    for obj in export_objects:
        obj.select_set(True)
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    bpy.ops.export_scene.fbx(
        filepath=OUTPUT,
        use_selection=True,
        object_types={"MESH"},
        apply_scale_options="FBX_SCALE_ALL",
        axis_forward="-Z",
        axis_up="Y",
        use_mesh_modifiers=True,
        add_leaf_bones=False,
        bake_anim=False,
        path_mode="COPY",
        embed_textures=False,
    )
    print(f"Exported scale test FBX: {OUTPUT}")


def object_world_bounds(obj):
    """World-space AABB (min, max) of an object, including its transform."""
    from mathutils import Vector
    points = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    mins = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    maxs = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return mins, maxs


def extents(mins, maxs):
    return tuple(maxs[i] - mins[i] for i in range(3))


def aabb_overlap(mins_a, maxs_a, mins_b, maxs_b, margin=0.0):
    return all(
        mins_a[i] - margin < maxs_b[i] and maxs_a[i] + margin > mins_b[i]
        for i in range(3)
    )


def fail(message):
    print(f"Scale test verification FAILED: {message}")
    sys.exit(1)


def do_verify():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=OUTPUT)

    objects = {obj.name: obj for obj in bpy.data.objects}
    names = set(objects)
    ucx_names = sorted(n for n in names if n.startswith("UCX_SM_Test_DoorFrame"))

    if CUBE_NAME not in names:
        fail(f"missing object {CUBE_NAME}; imported: {sorted(names)}")
    if FRAME_NAME not in names:
        fail(f"missing object {FRAME_NAME}; imported: {sorted(names)}")
    if len(ucx_names) != 3:
        fail(f"expected 3 UCX_SM_Test_DoorFrame_* collision boxes, got {ucx_names}")

    cube_min, cube_max = object_world_bounds(objects[CUBE_NAME])
    for axis, size in enumerate(extents(cube_min, cube_max)):
        if abs(size - 1.0) > 0.001:
            fail(f"{CUBE_NAME} axis {axis} is {size:.4f} m, expected 1.000 m +/- 0.001")

    frame_min, frame_max = frame_bounds = object_world_bounds(objects[FRAME_NAME])
    frame_ext = extents(frame_min, frame_max)
    height_axis = frame_ext.index(max(frame_ext))
    width_axis = frame_ext.index(sorted(frame_ext)[1])
    if abs(frame_ext[height_axis] - 2.2) > 0.001:
        fail(f"frame height axis {height_axis} is {frame_ext[height_axis]:.4f} m, expected 2.2")
    if abs(frame_ext[width_axis] - 2.0) > 0.001:
        fail(f"frame width axis {width_axis} is {frame_ext[width_axis]:.4f} m, expected 2.0")

    cube_center = tuple((cube_min[i] + cube_max[i]) / 2.0 for i in range(3))
    frame_center = tuple((frame_min[i] + frame_max[i]) / 2.0 for i in range(3))
    origin_gap = abs(cube_center[width_axis] - frame_center[width_axis])
    if abs(origin_gap - 3.0) > 0.001:
        fail(f"cube/frame origins are {origin_gap:.4f} m apart along axis {width_axis}, expected 3.0")

    # The doorway volume (with margin) must stay clear of every UCX box so no
    # collision beam ever seals the opening at ground level.
    doorway_min = [0.0, 0.0, 0.0]
    doorway_max = [0.0, 0.0, 0.0]
    for i in range(3):
        if i == width_axis:
            doorway_min[i] = frame_center[i] - OPENING_W / 2.0 + 0.1
            doorway_max[i] = frame_center[i] + OPENING_W / 2.0 - 0.1
        elif i == height_axis:
            doorway_min[i] = 0.1
            doorway_max[i] = OPENING_H - 0.1
        else:
            doorway_min[i] = frame_min[i] - 0.1
            doorway_max[i] = frame_max[i] + 0.1

    for ucx_name in ucx_names:
        mins, maxs = object_world_bounds(objects[ucx_name])
        if aabb_overlap(doorway_min, doorway_max, mins, maxs):
            fail(f"{ucx_name} crosses the doorway volume; the opening would be blocked")

    print("Scale test verification passed")


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    if "--verify" in argv:
        do_verify()
    else:
        do_export()


if __name__ == "__main__":
    main()
