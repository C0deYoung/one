# Blender → Unreal Engine 5 导出规范

Blender 5.2.1 LTS 与 UE 5.8.2 已安装。以下坐标与导出参数已由比例测试件
`art/export/fbx/scale-test.fbx`（生成脚本 `art/blender/scripts/export_scale_test_fbx.py`）
锁定，主楼等后续资产必须沿用同一套参数。

## 坐标、单位与命名

- Blender 场景单位使用 Metric，长度以米显示；几何按 X 东、Y 上（高度轴）、Z 南构建，导出前烘焙/确认 Rotation 与 Scale 已应用。
- Blender 5.2.1 实际 FBX 导出轴向：`bpy.ops.export_scene.fbx` 使用 `axis_forward="-Z"`、`axis_up="Y"`、`apply_scale_options="FBX_SCALE_ALL"`、`use_selection=True`、`object_types={"MESH"}`，写出 FBX 7400 文件。测试件回读校验（`-- --verify`）确认 1 米立方体三轴误差小于 0.001 m、三个 `UCX_SM_Test_DoorFrame_*` 碰撞盒不封门洞。
- **UE 导入验收值：Blender 中的 1 m 在 UE 中必须显示为 100 cm；测试门洞净宽 160 cm、净高 200 cm，玩家胶囊可穿过且门柱、顶梁能阻挡。** 任何资产导入后尺寸为 1 cm 或 10000 cm 都说明导出参数被改动，必须停下修正。
- 模型原点放在便于对齐的角点或地面中心；建筑模块不要把原点留在随机编辑点。
- 可见网格：`SM_<区域>_<资产>_<变体>`，例如 `SM_Main_MainEntrance_A`。
- 材质：`M_<类别>_<名称>`；材质实例：`MI_<资产>_<材质>`；贴图：`T_<资产>_<用途>`。
- LOD：`SM_Name_LOD1`、`SM_Name_LOD2`；自定义碰撞：`UCX_SM_Name_00`、`UCX_SM_Name_01`。

## FBX 导出检查

- 仅导出选中资产及其碰撞，不把整个校园作为单个最终网格。
- 应用法线/平滑和必要的三角化；导出前检查背面剔除方向。
- 导出 FBX 2020.2 兼容设置；如果 Blender 版本不能提供该选项，记录实际导出版本并在 UE 重新导入测试。
- 导出 Tangent Space，保留 UV0；第二套 UV 仅在需要烘焙/光照或明确验证后加入。
- 纹理不依赖 Blender 复杂节点自动转换；UE 内重建 PBR 材质并手工核对 Base Color、Normal、Roughness、Metallic、AO。
- 玻璃、透明植物和发光标语单独分材质，不与建筑主体合并。

## 碰撞与导入

- 门洞、楼梯和非凸区域制作多个 `UCX_` 凸体；导入后在 Static Mesh Editor 显示碰撞检查。
- 复杂建筑的可见网格与碰撞网格分开命名；碰撞不得封死玩家应通行的门洞。
- 导入 UE 后检查比例、旋转、枢轴、材质槽、法线、LOD 和碰撞，再将资产移动到最终 Content 目录。
- 首次导入必须保留测试记录：Blender 立方体 1m 应在 UE 显示为 100cm，门高与玩家胶囊体比例自然。

## 纹理分辨率起点

- 普通墙体/地面：1K–2K 平铺纹理。
- 主楼入口、校徽、立面细节：根据屏幕占用从 2K 起，只有近景仍不足时使用 4K。
- 不把整张仰拍照片直接铺满建筑；照片只用于校正、局部材质或参考相机。
