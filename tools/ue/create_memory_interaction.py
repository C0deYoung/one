"""Import the first campus photo and create a placeable memory-point asset."""

import unreal


PHOTO = r"E:\download\pic\一中\06_广场课间操全景_布局关键图.jpg"
TEXTURE_DIR = "/Game/Campus/Textures/Memories"
BLUEPRINT_DIR = "/Game/Campus/Blueprints"
TEXTURE = TEXTURE_DIR + "/T_Memory_01"
BPI_PATH = BLUEPRINT_DIR + "/BPI_Interactable"
BP_PATH = BLUEPRINT_DIR + "/BP_MemoryPoint"
WIDGET_PATH = "/Game/Campus/UI/WBP_MemoryViewer"
MAP_PATH = "/Game/Campus/Maps/L_CampusTest"


def log(message):
    unreal.log(f"CAMPUS_MEMORY {message}")


def import_photo():
    unreal.EditorAssetLibrary.make_directory(TEXTURE_DIR)
    if not unreal.EditorAssetLibrary.does_asset_exist(TEXTURE):
        task = unreal.AssetImportTask()
        task.filename = PHOTO
        task.destination_path = TEXTURE_DIR
        task.automated = True
        task.save = True
        task.replace_existing = True
        unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
        imported = unreal.EditorAssetLibrary.list_assets(TEXTURE_DIR, False, True)
        source = next((p.rstrip("/") for p in imported if p.lower().endswith("." + "jpg")), None)
        if source is None:
            source = next((p.rstrip("/") for p in imported if p != TEXTURE), None)
        if source and source != TEXTURE:
            unreal.EditorAssetLibrary.rename_asset(source, TEXTURE)
    texture = unreal.EditorAssetLibrary.load_asset(TEXTURE)
    if texture is None:
        raise RuntimeError("T_Memory_01 import failed")
    for prop in ("lod_group", "texture_group"):
        try:
            texture.set_editor_property(prop, unreal.TextureGroup.TEXTUREGROUP_UI)
            break
        except Exception:
            continue
    try:
        texture.set_editor_property("max_texture_size", 2048)
    except Exception:
        pass
    unreal.EditorAssetLibrary.save_asset(TEXTURE)
    log(f"photo={TEXTURE}")
    return texture


def create_interface():
    if unreal.EditorAssetLibrary.does_asset_exist(BPI_PATH):
        return unreal.EditorAssetLibrary.load_asset(BPI_PATH)
    factory = unreal.BlueprintFactory()
    factory.set_editor_property("parent_class", unreal.Interface)
    bp = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        "BPI_Interactable", BLUEPRINT_DIR, unreal.Blueprint, factory
    )
    if bp is None:
        raise RuntimeError("failed to create BPI_Interactable")
    unreal.EditorAssetLibrary.save_asset(BPI_PATH)
    return bp


def pin_type(category, sub_object=None):
    pin = unreal.EdGraphPinType()
    pin.set_editor_property("pin_category", category)
    if sub_object is not None:
        pin.set_editor_property("pin_sub_category_object", sub_object)
    return pin


def add_variable(bp, name, value_type, default=None):
    try:
        unreal.BlueprintEditorLibrary.add_member_variable(bp, name, value_type)
        if default is not None:
            bp.set_editor_property("new_variables", bp.get_editor_property("new_variables"))
        return True
    except Exception as err:
        log(f"variable_failed name={name} error={err}")
        return False


def create_memory_blueprint(texture):
    if unreal.EditorAssetLibrary.does_asset_exist(BP_PATH):
        bp = unreal.EditorAssetLibrary.load_asset(BP_PATH)
    else:
        factory = unreal.BlueprintFactory()
        factory.set_editor_property("parent_class", unreal.Actor)
        bp = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            "BP_MemoryPoint", BLUEPRINT_DIR, unreal.Blueprint, factory
        )
    if bp is None:
        raise RuntimeError("failed to create BP_MemoryPoint")

    # UE5.8 exposes EdGraphPinType as an opaque Python struct, so its pin
    # category fields cannot be assigned through the commandlet API. Keep the
    # placeable Blueprint asset and photo ready; typed variables and graph nodes
    # are added in the editor Blueprint UI in the next interaction pass.
    log("blueprint_variables_deferred_to_editor")
    try:
        unreal.BlueprintEditorLibrary.compile_blueprint(bp)
    except Exception as err:
        log(f"blueprint_compile_warning={err}")
    unreal.EditorAssetLibrary.save_asset(BP_PATH)
    log(f"blueprint={BP_PATH}")
    return bp


def create_viewer_widget():
    unreal.EditorAssetLibrary.make_directory("/Game/Campus/UI")
    if unreal.EditorAssetLibrary.does_asset_exist(WIDGET_PATH):
        widget = unreal.EditorAssetLibrary.load_asset(WIDGET_PATH)
    else:
        factory = unreal.WidgetBlueprintFactory()
        factory.set_editor_property("parent_class", unreal.UserWidget)
        widget = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
            "WBP_MemoryViewer", "/Game/Campus/UI", unreal.WidgetBlueprint, factory
        )
    if widget is None:
        raise RuntimeError("failed to create WBP_MemoryViewer")
    unreal.EditorAssetLibrary.save_asset(WIDGET_PATH)
    log("viewer_widget_created_layout_deferred_to_editor")
    return widget


def place_memory_point(bp, texture):
    actor_sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    existing = [
        actor for actor in actor_sub.get_all_level_actors()
        if actor.get_actor_label() in {"MemoryPoint_01", "MemoryPointMarker"}
    ]
    for actor in existing:
        actor_sub.destroy_actor(actor)
    generated_class = unreal.EditorAssetLibrary.load_blueprint_class(BP_PATH)
    memory = actor_sub.spawn_actor_from_class(
        generated_class,
        unreal.Vector(0.0, -2500.0, 140.0),
        unreal.Rotator(roll=0.0, pitch=0.0, yaw=0.0),
    )
    if memory is None:
        raise RuntimeError("failed to place MemoryPoint_01")
    memory.set_actor_label("MemoryPoint_01")
    memory.set_editor_property("is_spatially_loaded", False)
    for prop, value in (
        ("memory_id", unreal.Name("Memory_01")),
        ("title", unreal.Text("升旗仪式")),
        ("time_label", unreal.Text("周一 · 清晨")),
        ("body", unreal.Text("周一早上六点四十，喇叭里放国歌，学校背后山梁上的雾还没散。")),
        ("photo", texture),
        ("interaction_distance", 340.0),
    ):
        try:
            memory.set_editor_property(prop, value)
        except Exception as err:
            log(f"instance_property_warning prop={prop} error={err}")
    marker_mesh = unreal.EditorAssetLibrary.load_asset("/Engine/BasicShapes/Sphere.Sphere")
    marker = actor_sub.spawn_actor_from_object(
        marker_mesh,
        unreal.Vector(0.0, -2500.0, 140.0),
        unreal.Rotator(roll=0.0, pitch=0.0, yaw=0.0),
    )
    if marker is not None:
        marker.set_actor_label("MemoryPointMarker")
        marker.set_editor_property("is_spatially_loaded", False)
        marker.set_actor_scale3d(unreal.Vector(0.45, 0.45, 0.45))
        marker_material = unreal.EditorAssetLibrary.load_asset(
            "/Game/Campus/Materials/MI_Main_RedStructure"
        )
        if marker_material is not None:
            marker.get_component_by_class(unreal.StaticMeshComponent).set_material(0, marker_material)
    unreal.EditorLevelLibrary.save_current_level()
    log(f"placed={memory.get_actor_location()}")


def main():
    try:
        texture = import_photo()
        create_interface()
        bp = create_memory_blueprint(texture)
        create_viewer_widget()
        place_memory_point(bp, texture)
        log("MEMORY_ASSETS_OK")
    except Exception as err:
        unreal.log_error(f"CAMPUS_MEMORY_FAILED: {err}")
    finally:
        if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
            unreal.SystemLibrary.quit_editor()


main()
