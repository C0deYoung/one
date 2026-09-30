"""Build a lightweight, photo-guided front elevation in the playable map.

The original FBX's facade is not visible from the current playable approach.
These separate cubes are an editable prototype until the FBX axis/winding
pipeline is corrected. Dimensions are centimetres in Unreal coordinates.
"""

import unreal


MAP = "/Game/Campus/Maps/L_CampusTest"
PREFIX = "Facade_"
MATERIALS = {
    key: unreal.EditorAssetLibrary.load_asset(f"/Game/Campus/Materials/{name}")
    for key, name in {
        "wall": "MI_Main_WhiteTile",
        "glass": "MI_Main_GreenGlass",
        "dark": "MI_Main_DarkInterior",
        "blue": "MI_Main_BlueBand",
        "red": "MI_Main_RedStructure",
        "concrete": "MI_Main_Concrete",
        "trim": "MI_Main_Aluminium",
    }.items()
}


def main():
    unreal.EditorLevelLibrary.load_level(MAP)
    actors = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    for actor in list(actors.get_all_level_actors()):
        if actor.get_actor_label().startswith(PREFIX):
            actors.destroy_actor(actor)
    cube = unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/Cube.Cube")
    if cube is None or any(value is None for value in MATERIALS.values()):
        raise RuntimeError("facade mesh or material missing")
    count = 0

    def block(name, x, y, z, width, depth, height, material):
        nonlocal count
        actor = actors.spawn_actor_from_object(cube, unreal.Vector(x, y, z))
        if actor is None:
            raise RuntimeError(f"failed to spawn {name}")
        actor.set_actor_label(PREFIX + name)
        actor.set_editor_property("is_spatially_loaded", False)
        actor.set_actor_scale3d(unreal.Vector(width / 100, depth / 100, height / 100))
        actor.get_component_by_class(unreal.StaticMeshComponent).set_material(
            0, MATERIALS[material]
        )
        count += 1

    # Pale tiled wings, five repeated rows of green windows and blue sills.
    for side, center in (("West", -3350), ("East", 3350)):
        block(f"{side}_Wall", center, 530, 850, 4300, 35, 1700, "wall")
        for floor in range(5):
            z = 190 + floor * 340
            for bay in range(8):
                x = center - 1680 + bay * 480
                block(f"{side}_Window_{floor}_{bay}", x, 490, z, 175, 22, 135, "glass")
                block(f"{side}_Sill_{floor}_{bay}", x, 475, z - 79, 190, 18, 12, "blue")
            block(f"{side}_Band_{floor}", center, 470, floor * 340 + 322, 4300, 20, 22, "blue")

    # Central glazed tower, white mullions, a raised entrance and red canopy.
    block("Tower_Wall", 0, 520, 1150, 2400, 48, 2300, "wall")
    block("Tower_Glass", 0, 470, 1460, 1860, 28, 1400, "glass")
    for column in range(1, 6):
        block(f"Tower_Mullion_{column}", -930 + column * 310, 445, 1460, 18, 22, 1400, "trim")
    for row in range(1, 5):
        block(f"Tower_Crossbar_{row}", 0, 440, 760 + row * 280, 1860, 22, 19, "trim")
    block("Tower_Top", 0, 425, 2270, 2450, 55, 65, "red")
    block("Entrance_Dark", 0, 455, 235, 1900, 34, 470, "dark")
    block("Entrance_Canopy", 0, 300, 485, 2450, 430, 72, "concrete")
    block("Entrance_RedSign", 0, 74, 468, 1650, 25, 63, "red")
    for column, x in enumerate((-820, -270, 270, 820)):
        block(f"Entrance_Column_{column}", x, 75, 235, 65, 65, 470, "wall")
    for door, x in enumerate((-270, 270)):
        block(f"Entrance_Door_{door}", x, 415, 175, 300, 24, 330, "glass")

    if not unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).save_current_level():
        raise RuntimeError("failed to save facade")
    unreal.log(f"CAMPUS_FACADE_OVERLAY_OK actors={count}")


try:
    main()
finally:
    if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
        unreal.SystemLibrary.quit_editor()
