"""Create low-cost campus materials and assign them to the main building."""

import unreal


DEST = "/Game/Campus/Materials"
MESH_PATH = "/Game/Campus/Buildings/MainBuilding/SM_MainBuilding"


def log(message):
    unreal.log(f"CAMPUS_MAT {message}")


def create_asset(name, asset_class, factory_class):
    path = f"{DEST}/{name}"
    if unreal.EditorAssetLibrary.does_asset_exist(path):
        return unreal.EditorAssetLibrary.load_asset(path)
    unreal.EditorAssetLibrary.make_directory(DEST)
    factory = factory_class()
    asset = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        name, DEST, asset_class, factory
    )
    if asset is None:
        raise RuntimeError(f"failed to create {path}")
    return asset


def vector_parameter(material, name, value, x, y):
    expression = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionVectorParameter, x, y
    )
    expression.set_editor_property("parameter_name", name)
    expression.set_editor_property("default_value", unreal.LinearColor(*value))
    unreal.MaterialEditingLibrary.connect_material_property(
        expression, "", unreal.MaterialProperty.MP_BASE_COLOR
    )
    return expression


def scalar_parameter(material, name, value, x, y, property_name=None):
    expression = unreal.MaterialEditingLibrary.create_material_expression(
        material, unreal.MaterialExpressionScalarParameter, x, y
    )
    expression.set_editor_property("parameter_name", name)
    expression.set_editor_property("default_value", value)
    if property_name is not None:
        unreal.MaterialEditingLibrary.connect_material_property(
            expression, "", property_name
        )
    return expression


def build_master():
    material = create_asset("M_Campus_Master", unreal.Material, unreal.MaterialFactoryNew)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_OPAQUE)
    material.set_editor_property(
        "shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT
    )
    vector_parameter(material, "BaseColor", (0.5, 0.5, 0.5, 1.0), -500, -120)
    scalar_parameter(
        material, "Roughness", 0.7, -500, 80, unreal.MaterialProperty.MP_ROUGHNESS
    )
    scalar_parameter(
        material, "Metallic", 0.0, -500, 240, unreal.MaterialProperty.MP_METALLIC
    )
    scalar_parameter(material, "NormalStrength", 0.0, -500, 400)
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_asset(f"{DEST}/M_Campus_Master")
    return material


def build_glass():
    material = create_asset("M_Campus_Glass", unreal.Material, unreal.MaterialFactoryNew)
    material.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
    material.set_editor_property(
        "shading_model", unreal.MaterialShadingModel.MSM_DEFAULT_LIT
    )
    material.set_editor_property("two_sided", False)
    vector_parameter(material, "BaseColor", (0.04, 0.32, 0.20, 1.0), -500, -160)
    scalar_parameter(
        material, "Opacity", 0.55, -500, 0, unreal.MaterialProperty.MP_OPACITY
    )
    scalar_parameter(
        material, "Roughness", 0.25, -500, 160, unreal.MaterialProperty.MP_ROUGHNESS
    )
    scalar_parameter(
        material, "Metallic", 0.0, -500, 320, unreal.MaterialProperty.MP_METALLIC
    )
    unreal.MaterialEditingLibrary.recompile_material(material)
    unreal.EditorAssetLibrary.save_asset(f"{DEST}/M_Campus_Glass")
    return material


def set_instance_parameters(instance, color, roughness, metallic):
    unreal.MaterialEditingLibrary.set_material_instance_vector_parameter_value(
        instance, "BaseColor", unreal.LinearColor(*color)
    )
    unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(
        instance, "Roughness", roughness
    )
    unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(
        instance, "Metallic", metallic
    )


def build_instances(master, glass):
    definitions = {
        "MI_Main_WhiteTile": (master, (0.68, 0.70, 0.71, 1.0), 0.78, 0.0),
        "MI_Main_BlueBand": (master, (0.03, 0.12, 0.32, 1.0), 0.52, 0.0),
        "MI_Main_GreenGlass": (glass, (0.04, 0.32, 0.20, 1.0), 0.25, 0.0),
        "MI_Main_Concrete": (master, (0.34, 0.36, 0.38, 1.0), 0.92, 0.0),
        "MI_Main_RedStructure": (master, (0.42, 0.025, 0.018, 1.0), 0.55, 0.0),
        "MI_Main_Aluminium": (master, (0.58, 0.61, 0.65, 1.0), 0.32, 0.65),
        "MI_Main_DarkInterior": (master, (0.055, 0.065, 0.075, 1.0), 0.95, 0.0),
        "MI_Main_RedPaving": (master, (0.27, 0.018, 0.012, 1.0), 0.86, 0.0),
    }
    instances = {}
    for name, (parent, color, roughness, metallic) in definitions.items():
        instance = create_asset(
            name, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew
        )
        instance.set_editor_property("parent", parent)
        if parent == master:
            set_instance_parameters(instance, color, roughness, metallic)
        else:
            unreal.MaterialEditingLibrary.set_material_instance_vector_parameter_value(
                instance, "BaseColor", unreal.LinearColor(*color)
            )
            unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(
                instance, "Opacity", 0.55
            )
            unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(
                instance, "Roughness", roughness
            )
            unreal.MaterialEditingLibrary.set_material_instance_scalar_parameter_value(
                instance, "Metallic", metallic
            )
        unreal.EditorAssetLibrary.save_asset(f"{DEST}/{name}")
        instances[name] = instance
    return instances


def choose_instance(slot_name, instances):
    name = slot_name.lower()
    if "glass" in name:
        return instances["MI_Main_GreenGlass"]
    if "blue" in name:
        return instances["MI_Main_BlueBand"]
    if "redpaving" in name or "red_paving" in name or "paving" in name:
        return instances["MI_Main_RedPaving"]
    if "redstructure" in name or "red_structure" in name:
        return instances["MI_Main_RedStructure"]
    if "concrete" in name:
        return instances["MI_Main_Concrete"]
    if "aluminium" in name or "aluminum" in name or "trim" in name:
        return instances["MI_Main_Aluminium"]
    if "white" in name or "tile" in name:
        return instances["MI_Main_WhiteTile"]
    return instances["MI_Main_DarkInterior"]


def assign_materials(instances):
    mesh = unreal.EditorAssetLibrary.load_asset(MESH_PATH)
    if mesh is None:
        raise RuntimeError(f"missing mesh {MESH_PATH}")
    slots = mesh.get_editor_property("static_materials")
    assignments = []
    for index, slot in enumerate(slots):
        slot_name = str(slot.get_editor_property("material_slot_name"))
        instance = choose_instance(slot_name, instances)
        slot.set_editor_property("material_interface", instance)
        mesh.set_material(index, instance)
        assignments.append(f"{index}:{slot_name}->{instance.get_name()}")
    mesh.set_editor_property("static_materials", slots)
    unreal.EditorAssetLibrary.save_asset(MESH_PATH)
    log("assignments=" + "; ".join(assignments))
    log(f"MATERIALS_OK slots={len(slots)}")


def main():
    try:
        master = build_master()
        glass = build_glass()
        instances = build_instances(master, glass)
        assign_materials(instances)
    except Exception as err:
        unreal.log_error(f"CAMPUS_MATERIALS_FAILED: {err}")
    finally:
        if "UnrealEditor-Cmd" in unreal.SystemLibrary.get_command_line():
            unreal.SystemLibrary.quit_editor()


main()
