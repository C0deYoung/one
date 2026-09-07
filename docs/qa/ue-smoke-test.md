# UE 冒烟测试记录

工程：`unreal/YunxiCampus/YunxiCampus.uproject`，UE 5.8.2（安装路径 `E:\UE\UE_5.8`）。
本文档按任务推进持续追加。

## 1. 低画质渲染验证（2026-09-07）

### 渲染 CVar 实测值

编辑器启动日志（`Saved/Logs/YunxiCampus.log`，`LogConfig: Set CVar` 记录）与 Output Log 控制台查询结果：

| CVar | 实测值 | 预期 |
|---|---|---|
| r.DynamicGlobalIlluminationMethod | 0 | 0（Lumen 关闭） |
| r.ReflectionMethod | 0 | 0（反射方法 None） |
| r.Nanite.ProjectEnabled | 0 | 0（Nanite 关闭） |
| r.Shadow.Virtual.Enable | 0 | 0（Virtual Shadow Maps 关闭） |
| r.DefaultFeature.MotionBlur | 0 | 0（Motion Blur 关闭） |

同时生效的低画质键：`r.GenerateMeshDistanceFields=0`、`r.DefaultFeature.Bloom=False`、`r.Shadow.MaxResolution=1024`、`r.ReflectionCaptureResolution=128`；并显式覆盖模板 Maximum 预设写入的高画质项：`r.RayTracing=False`、`r.Substrate=False`、`r.SkinCache.CompileShaders=False`。

### Project Settings 交叉检查

启动日志的 `LogConfig: Set CVar` 记录即 Project Settings 最终生效值，与 `Config/DefaultEngine.ini` 一致，等效于 Rendering 设置页的目视核对。

### DDC 路径验证

- 用户级环境变量 `UE-LocalDataCachePath=E:\UE-DDC` 已设置。
- 启动日志确认：`LogZenServiceInstance: Found environment variable UE-LocalDataCachePath=E:\UE-DDC`、`Found local data cache path=E:\UE-DDC`，Zen 数据写入 `E:\UE-DDC\Zen`，C 盘不再承载项目缓存。

### First Person 模板移动验证（任务 3 步骤 2）

- Project Browser 创建工程（Games / First Person / 变体=无 / 蓝图 / Desktop），编辑器正常打开 `Lvl_FirstPerson`（63 Actor）。
- PIE 启动后执行 WASD、鼠标观察、Space 跳跃；PIE 完整运行并正常退出，日志无崩溃。
- Blueprint Runtime Error 计数：0。

### 已知偏差与备注

- Project Browser 的"质量预设"下拉框无法通过自动化展开，工程以 Maximum 预设创建；已通过合并脚手架低画质 RendererSettings 并显式关闭 RayTracing/Substrate/SkinCache 补偿，最终生效值见上表，等效达成 Scalable 目标。
- 编辑器每次启动提示 VC++ 可再发行组件 14.44.35211.0 过旧（非阻断警告）；后续打包如遇问题优先更新 VC++ 运行库。
- 验证机为真实桌面环境，编辑器运行于独立虚拟桌面以避免焦点竞争。

## 2. L_CampusTest 启动验证（任务 7，2026-09-07）

使用 `tools/ue/setup_campus_test_map.py` 保存目标地图后，运行：

```powershell
& 'E:\UE\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe' `
  'unreal\YunxiCampus\YunxiCampus.uproject' -game -NullRHI -Unattended -NoP4 `
  -stdout -FullStdOutLogOutput '-ExecCmds=Quit'
```

结果：退出码 0；日志确认 `LoadMap(/Game/Campus/Maps/L_CampusTest)`、
`SM_MainBuilding` 就绪、世界进入 Play 并正常退出。地图包含
`MainBuilding`、`CampusGround`、`CampusPlayerStart`、`CampusSun` 和
`CampusSkyLight` 五个 Actor。GUI PIE/Standalone 的人工行走路线尚未记录，安排在任务 11。

## 3. 主楼低成本材质验证（任务 8，2026-09-07）

使用 `tools/ue/rebuild_main_materials.py` 生成并保存：

- `M_Campus_Master`：Opaque、Default Lit，参数为 BaseColor、Roughness、Metallic、NormalStrength。
- `M_Campus_Glass`：Translucent、Default Lit、单面，绿色 BaseColor、Opacity 0.55、Roughness 0.25。
- 8 个材质实例：`MI_Main_WhiteTile`、`MI_Main_BlueBand`、`MI_Main_GreenGlass`、`MI_Main_Concrete`、`MI_Main_RedStructure`、`MI_Main_Aluminium`、`MI_Main_DarkInterior`、`MI_Main_RedPaving`。

命令行日志确认 `CAMPUS_MAT MATERIALS_OK slots=10`。10 个导入槽已按 Blender 名称分配：蓝带、混凝土、白色 Trim、红结构、绿色玻璃、玻璃阴影、白砖、砖阴影、红铺装和红字。材质图只使用基础颜色、粗糙度、金属度和透明度参数，未启用折射或高成本透明阴影。

## 4. 回忆点资产基线（任务 9，2026-09-07）

使用 `tools/ue/create_memory_interaction.py` 完成：

- 照片 `E:\download\pic\一中\06_广场课间操全景_布局关键图.jpg` 已导入为 `/Game/Campus/Textures/Memories/T_Memory_01`，尺寸 853×640，纹理分组按 UI 兼容属性尝试设置，最大尺寸上限为 2048。
- 创建 `/Game/Campus/Blueprints/BPI_Interactable`、`BP_MemoryPoint` 和 `/Game/Campus/UI/WBP_MemoryViewer`。
- `L_CampusTest` 已放置 `MemoryPoint_01`（位置 0, -2500, 140）和可见的 `MemoryPointMarker` 球体标记，标记使用红色结构材质。

UE5.8 命令行 Python 将 `EdGraphPinType` 暴露为不可写的 opaque struct，无法可靠地自动写入 Blueprint 变量和图节点；因此 `BP_MemoryPoint` 的 typed variables、E 键视线交互和 Widget 布局留到编辑器 Blueprint 操作批次完成。当前提交提供了照片、接口/Actor/Widget 资产和地图落点，未宣称交互已通过。
