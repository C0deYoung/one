# UE5 校园可玩样板 — 执行进度记录

**计划文件**：`docs/superpowers/plans/2026-09-07-ue5-campus-playable-vertical-slice.md`
**执行日期**：2026-09-07（本文档由执行会话写入，供后续会话续接）
**当前状态**：任务 1–8 已完成并提交；任务 9 已完成照片导入、交互/回忆点/Widget 资产基线和地图落点，但 Blueprint 变量、E 键视线交互及 UI 图仍待编辑器补齐；任务 10–12 未开始。

## 已完成任务（含提交号）

| 任务 | 提交 | 说明 |
|---|---|---|
| 1 环境基线 | `40ee003` | verify_prereqs.ps1（先失败后通过均验证）、DDC 定向 E:\UE-DDC、environment.md 补录 |
| 2 比例测试 FBX | `a8de5c5` | export_scale_test_fbx.py + scale-test.fbx + export-settings.md 锁定 |
| 3 UE5 工程 | `cb99163` | Project Browser 创建 First Person/None/蓝图工程，配置合并，脚手架删除 |
| 4 低画质锁定 | `2d27316` | 5 个核心 CVar 实测为 0，DDC 日志确认 E:\UE-DDC，ue-smoke-test.md |
| 5 比例验收 | `1464843` | 测试件导入 UE 并量取 Bounds，轴向修正落地，ue-import-validation.md |

## 关键环境事实（与计划原文的差异）

1. **UE 安装路径是 `E:\UE\UE_5.8`**（版本 5.8.2），不是计划原写的 `E:\Epic Games\UE_5.8`。已按计划预案在本计划文件与所有脚本中统一替换。
2. **桌面分辨率 2560×1440**（非 1920×1080）；内存 31.4GB；GPU 为 AMD Radeon 核显（另有 Oray 虚拟显示适配器）。
3. **UE 编辑器运行在虚拟桌面 2**（用户在桌面 1 工作，避免焦点竞争）。启动编辑器时务必先切到桌面 2 再 Start-Process，窗口才会落在桌面 2。
4. 编辑器启动时有 VC++ 可再发行组件过旧的**非阻断警告**（点 OK 继续）；如打包出错优先升级 VC++。
5. Project Browser 的"质量预设"下拉无法自动化展开，工程以 **Maximum 预设**创建；已在 DefaultEngine.ini 用脚手架低画质 RendererSettings 整体替换并显式关闭 RayTracing/Substrate/SkinCache 补偿（任务 4 实测 CVar 全部为 0）。

## 关键技术结论（后续任务必须遵守）

1. **轴向**：UE 5.8 按恒等映射读取 Blender 5.2 默认参数导出的 FBX，Y-up 内容会躺倒。所有导出脚本必须在导出前把对象矩阵绕世界 X 轴 +90°（`export_scale_test_fbx.py` 的 `bake_z_up_rotation` / `export_main_building_fbx.py` 已改）。主楼 FBX 已用该修正重新导出（322 个对象，2026-09-07 16:24）。
2. **`unreal.Rotator` 位置参数顺序是 (roll, pitch, yaw)** —— 传 yaw 必须用关键字参数，否则会把门框绕 X 轴放倒（已踩坑）。
3. **编辑器世界的 Python 射线检测不产生命中**（line_trace_single 全部落空），几何验证用"spawn 临时 Actor 量 get_actor_bounds + PIE 行走"代替。
4. **PIE 视口在启动后需要点击一次视口才有键鼠焦点**；每次工具调用之间前台可能被宿主/其他应用抢走，输入动作被拒时先 open_application(activate=true) 再重试。
5. **编辑器 Python 经底部控制台执行**：点击控制台框 → `py "E:/.../script.py"` → 回车；结果看 `Saved/Logs/YunxiCampus.log`。控制台输入框可能残留上次文本，提交前必要时 Ctrl+A 清空。
6. **无头导入**：`UnrealEditor-Cmd.exe <uproject> -ExecutePythonScript=<script> -Unattended -NullRHI -NoP4`（约 4 分钟启动），仅当无 GUI 会话占用工程时可用；GUI 会话开着时改用控制台 py（脚本已做条件退出：命令行模式才 quit_editor）。
7. `AssetImportTask()` 不能用关键字参数构造（逐属性赋值）；`list_assets` 用位置参数 `(path, False, True)`；`set_level_viewport_camera_info(loc, rot, unreal.Name("Perspective"))`。

## 任务 6 当前状态（已完成）

已完成：
- `export_main_building_fbx.py` 已加 Z-up 烘焙并重新导出 `main-building.fbx`（1.4MB）。
- `tools/ue/import_main_building.py` 已写好并修完两个 API 错误（list_assets、条件退出）。
- 首次导入实际已通过 Interchange 生成 `/Game/Campus/Buildings/MainBuilding/main-building.uasset`（合并网格，仅平滑组警告，无错误）。

**任务 6 验收结果**：
1. 使用 `UnrealEditor-Cmd.exe` 执行 `tools/ue/import_main_building.py`，合并网格导入并重命名为 `SM_MainBuilding`。
2. `BodySetup.collision_trace_flag` 设置为 `CTF_USE_COMPLEX_AS_SIMPLE`；UE5.8 没有旧脚本使用的 `unreal.CollisionComplexity` 枚举。
3. Blender 源 Bounds 为 X=110m、Y=22.91m、Z=16.9m；烘焙 +90° X 旋转后 UE Bounds 为 X=11000cm、Y=1690cm、Z=2291cm，三轴断言通过。
4. 材质槽数量为 10；平滑组缺失仅产生导入警告，没有阻断资产生成。
5. 结果已补录到 `docs/qa/ue-import-validation.md`，并提交 `feat: import main building into UE5`。

## 任务 7 当前状态（已完成）

已完成：
- 使用 `tools/ue/setup_campus_test_map.py` 在 UE5.8 命令行编辑器中生成并保存 `/Game/Campus/Maps/L_CampusTest`。
- 关卡中已放置 `MainBuilding`、`CampusGround`（120m × 110m × 0.1m）、`CampusPlayerStart`、`CampusSun` 和 `CampusSkyLight`，脚本输出 5 个关卡 Actor。
- `DefaultEngine.ini` 的 `EditorStartupMap` 与 `GameDefaultMap` 均已指向 `L_CampusTest`；项目级低画质配置继续生效。
- 已使用 `UnrealEditor-Cmd.exe -game -NullRHI -ExecCmds=Quit` 启动验证，日志确认 `LoadMap(/Game/Campus/Maps/L_CampusTest)`、主楼静态网格就绪、世界进入 Play 并正常退出。
- 过程中验证了 World Partition 模板地图不适合在同一命令行进程中重复 `load_level`；最终采用已复制的目标地图作为启动地图，再执行布置脚本，避免修改 `Lvl_FirstPerson` 外部 Actor。

当前限制：任务 7 只验证了无渲染启动和地图加载，尚未完成 GUI PIE/Standalone 的 WASD 路线与入口碰撞人工验收；这些留到任务 11 的桌面测试批次统一完成。

**下一步从任务 8 继续**：创建主楼不透明/玻璃材质母材质和实例，并把 10 个导入材质槽替换为低画质可读材质。

## 任务 8 当前状态（已完成）

已完成：
- `tools/ue/rebuild_main_materials.py` 在 UE5.8 命令行编辑器中创建 `M_Campus_Master` 和 `M_Campus_Glass`。
- 创建 `MI_Main_WhiteTile`、`MI_Main_BlueBand`、`MI_Main_GreenGlass`、`MI_Main_Concrete`、`MI_Main_RedStructure`、`MI_Main_Aluminium`、`MI_Main_DarkInterior`、`MI_Main_RedPaving` 八个实例。
- 根据 Blender 导入槽名完成 10 个材质槽分配，日志输出 `CAMPUS_MAT MATERIALS_OK slots=10`。
- 玻璃仅使用绿色 BaseColor、Opacity 0.55 和 Roughness 0.25，未启用折射；母材质保持基础颜色/粗糙度/金属度参数，符合低画质路线。
- QA 结果已追加到 `docs/qa/ue-smoke-test.md`。

当前限制：尚未在 GUI 视口的三个路线视角人工检查 Shader Complexity 和材质辨识度，安排在任务 11 的桌面冒烟批次。

**下一步从任务 9 继续**：导入第一张校园照片并建立一个可关闭的回忆点交互。

## 任务 9 当前状态（资产基线完成，交互图待编辑器补齐）

已完成：
- `E:\download\pic\一中\06_广场课间操全景_布局关键图.jpg` 已导入 `/Game/Campus/Textures/Memories/T_Memory_01`。
- 创建 `BPI_Interactable`、`BP_MemoryPoint` 和 `WBP_MemoryViewer` 三个资产。
- `L_CampusTest` 已放置 `MemoryPoint_01` 和红色球体 `MemoryPointMarker`，用于后续视线交互的落点定位。
- `tools/ue/create_memory_interaction.py` 可重复导入照片、保存资产并重建地图落点；命令行日志输出 `CAMPUS_MEMORY MEMORY_ASSETS_OK`。

阻塞点：UE5.8 Python 将 `EdGraphPinType` 暴露为不可写 opaque struct，`BlueprintEditorLibrary.add_member_variable` 无法通过命令行写入 Name/Text/Texture/Float 类型，因此尚未自动生成 Blueprint 变量、`Interact` 图、E 键 Line Trace 和 UMG 控件。下一次桌面编辑器批次需要打开这三个资产，按原计划补图并完成一次人工 PIE 交互验收。

**下一步从任务 10 继续**：先生成可重复的项目验证脚本，验证当前地图、主楼、材质、照片和回忆点资产路径；随后在任务 11 用桌面编辑器补交互图并做路线测试。

**编辑器注意**：桌面 2 上有一个打开的编辑器（PID 会话），Lvl_FirstPerson 处于脏标记（临时 Actor 已清理但关卡仍标记未保存）。关闭编辑器时选**不保存**；或继续在该会话控制台里执行后续 py 脚本（任务 7/8 也可这样跑）。

## 剩余任务概要（7–12）

- 任务 7 建 L_CampusTest 地图：建议用编辑器 Python（LevelEditorSubsystem.new_level / spawn_actor_from_object 放主楼、地面、PlayerStart、灯光）+ DefaultEngine.ini 改默认地图，PIE 走线测试用桌面 2 的键鼠流程（先点视口再按键）。
- 任务 8 材质：unreal.MaterialEditingLibrary 创建母材质/实例，按 Blender 材质槽分配到 SM_MainBuilding（槽名在导入日志/Static Mesh Editor 里查）。
- 任务 9 回忆点：BPI/BP_MemoryPoint/WBP_MemoryViewer 的 Blueprint 图难以纯 Python 生成，预留 GUI 制作或改用最小 Blueprint 图策略（导入照片 T_Memory_01 从 E:\download\pic\一中\06_广场课间操全景_布局关键图.jpg）。
- 任务 10 验证脚本 validate_project.py（计划已给全文，直接落盘跑 UnrealEditor-Cmd）。
- 任务 11 冒烟测试 + 截图；任务 12 RunUAT 打包（RunUAT.bat BuildCookRun，命令在计划中，包输出 deliverables/windows/YunxiCampus，已在 .gitignore）。

## 提交记录（本会话）

```
1464843 test: validate Blender FBX scale in UE5
2d27316 chore: enforce low-quality UE validation preset
cb99163 feat: create UE5 first-person campus project
a8de5c5 test: add Blender to UE scale fixture
40ee003 chore: lock UE5.8 campus environment
```
