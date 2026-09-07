# UE 导入验收记录

工程：`unreal/YunxiCampus`（UE 5.8.2，`E:\UE\UE_5.8`）。导入通过
`tools/ue/import_scale_test.py` 在 `UnrealEditor-Cmd.exe -ExecutePythonScript`
中自动执行，导入设置与计划一致：Static Mesh、Combine Meshes=Off、
Import Materials/Textures=Off、Uniform Scale=1.0、不生成缺失碰撞（UCX 命名
碰撞由 FBX 携带）。

## 比例与门洞测试件（任务 5，2026-09-07）

生成资产：`/Game/Campus/Buildings/ScaleTest/SM_Test_1mCube`、
`SM_Test_DoorFrame`；UCX 网格未作为可见资产出现 ✓。

### Bounds 实测（脚本自动量取，单位 cm）

| 资产 | X | Y | Z | 结论 |
|---|---|---|---|---|
| SM_Test_1mCube | 100.0 | 100.0 | 100.0 | 1 m = 100 cm ✓（非 1 cm / 10000 cm） |
| SM_Test_DoorFrame | 200.0 | 25.0 | 220.0 | 2.2 m 高度落在 UE Z 轴 ✓ 门框直立 |

### 轴向结论与导出修正

- 首次导入实测：Blender 5.2.1 以默认轴向声明（`axis_forward="-Z"`、
  `axis_up="Y"`）导出的 Y-up 几何，在 UE 5.8 中按恒等映射落地，2.2 m 高度
  落在 UE Y 轴（模型躺倒，Z extent 仅 12.5 cm）。
- 修正：`export_scale_test_fbx.py` 在导出前将网格数据绕世界 X 轴 +90° 烘焙为
  Z-up（`bake_z_up_rotation`），再以默认参数导出；重新导入后门框直立
  （Z extent = 110 cm）。该修正同样适用于 `export_main_building_fbx.py`
  （任务 6 执行）。未在关卡内用 90° 旋转掩盖导出问题 ✓。

### 碰撞

- 资产碰撞体（BodySetup/agg_geom 实测）：`SM_Test_DoorFrame` 含 3 个凸包
  （对应 `UCX_SM_Test_DoorFrame_1/2/3`：两门柱 + 顶梁）；`SM_Test_1mCube`
  含 1 个凸包。
- UCX 布局（Blender 回读断言）：门洞净空间（1.6 m 宽 × 2.0 m 高留 10 cm
  余量）与任何 UCX 包围盒无交，即门洞中不存在横跨地面的碰撞盒 ✓。
- PIE 行走（Lvl_FirstPerson 临时放置）：门框开口对准玩家走线时，角色多次从
  净宽 160 cm、净高 200 cm 门洞穿过，无阻碍 ✓。
- 门柱阻挡的行为验证在本轮未取得干净的独立证据（合成键鼠输入在 PIE 中不稳定、
  编辑器世界的 Python 射线检测不产生命中）；结合资产携带 3 个正确布局的 UCX
  凸包与开口通行结论，阻挡行为将在任务 7 主楼墙体/台阶路线测试中随建筑碰撞
  一并复验。

### 截图

- `deliverables/screenshots/ue-doorframe-fixtures.png`：Lvl_FirstPerson 俯视，
  两个直立门框（开口测试 + 门柱阻挡位）与 1 m 立方体。测试件为临时放置，
  已清理，未保存进模板地图。

### 已知问题与备注

- `unreal.Rotator` 位置参数顺序是 `(roll, pitch, yaw)`；脚本必须用关键字参数
  传 yaw，否则会绕 X 轴放倒 Actor（本次已踩坑并修正）。
- 编辑器世界的 `KismetSystemLibrary.line_trace_single` 在本环境不产生命中；
  几何验证改用资产包围盒量取 + PIE 行走完成。
- 编辑器启动时的 VC++ 可再发行组件过旧警告为非阻断（见 ue-smoke-test.md）。
