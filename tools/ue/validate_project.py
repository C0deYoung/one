"""Validate the committed UE campus vertical-slice assets and map."""

import unreal


REQUIRED_ASSETS = [
    "/Game/Campus/Maps/L_CampusTest",
    "/Game/Campus/Buildings/MainBuilding/SM_MainBuilding",
    "/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube",
    "/Game/Campus/Buildings/ScaleTest/SM_Test_DoorFrame",
    "/Game/Campus/Blueprints/BPI_Interactable",
    "/Game/Campus/Blueprints/BP_MemoryPoint",
    "/Game/Campus/UI/WBP_MemoryViewer",
    "/Game/Campus/Textures/Memories/T_Memory_01",
]


def validate():
    missing = [
        path for path in REQUIRED_ASSETS
        if not unreal.EditorAssetLibrary.does_asset_exist(path)
    ]
    if missing:
        raise RuntimeError("Missing required assets: " + ", ".join(missing))

    world = unreal.EditorLevelLibrary.get_editor_world()
    if world is None or not world.get_path_name().startswith(
        "/Game/Campus/Maps/L_CampusTest."
    ):
        raise RuntimeError(
            f"Expected L_CampusTest to be loaded, got {world.get_path_name() if world else None}"
        )

    actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    labels = {actor.get_actor_label() for actor in actor_subsystem.get_all_level_actors()}
    for required_label in {"MainBuilding", "CampusGround", "MemoryPoint_01"}:
        if required_label not in labels:
            raise RuntimeError(f"Missing level actor: {required_label}")

    for cvar in (
        "r.DynamicGlobalIlluminationMethod",
        "r.ReflectionMethod",
        "r.Nanite.ProjectEnabled",
        "r.Shadow.Virtual.Enable",
    ):
        value = unreal.SystemLibrary.get_console_variable_int_value(cvar)
        if value != 0:
            raise RuntimeError(f"{cvar} expected 0, got {value}")

    unreal.log(
        f"YUNXI_VALIDATION_OK assets={len(REQUIRED_ASSETS)} actors={len(labels)} "
        f"world={world.get_path_name()}"
    )


try:
    validate()
except Exception as err:
    unreal.log_error(f"YUNXI_VALIDATION_FAILED: {err}")
    raise
finally:
    if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
        unreal.SystemLibrary.quit_editor()
