# UE5 校园可玩样板实现计划

**目标：** 在 Unreal Engine 5.8.0 安装完成后，建立可重复打开的第一人称校园工程，导入主楼模型，在低画质下完成可行走、可交互、可独立启动的 Windows 样板。

**架构：** 使用 UE5 First Person 模板的 None 变体提供 Enhanced Input、角色、控制器和基础 GameMode；Blender 继续作为几何源文件，FBX 只传递静态网格、材质槽和碰撞。UE 工程以 `/Game/Campus` 为业务根目录，先用一个合并网格验证比例、碰撞、材质和玩法链路，再拆成可复用建筑模块。

**技术栈：** Blender 5.2.1 LTS、Unreal Engine 5.8.0、Blueprint、Enhanced Input、UMG、FBX、Unreal Python、PowerShell、Git LFS。

---

## 完成定义

本计划完成时必须同时满足以下条件：

1. `E:\UE\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe` 可以启动 [YunxiCampus.uproject](../../../unreal/YunxiCampus/YunxiCampus.uproject)。
2. UE 日志确认本地 DDC 位于 `E:\UE-DDC`，C 盘不再承载项目生成的大型缓存。
3. `/Game/Campus/Maps/L_CampusTest` 中存在主楼、地面、PlayerStart、简单日光和一个回忆点。
4. 点击 Play 后可以用 WASD 和鼠标移动，能从广场走到主楼入口，不穿地面、不被错误碰撞封死。
5. 靠近回忆点按 E 能打开照片卡片；关闭卡片后视角和移动输入恢复。
6. Lumen、Nanite、Virtual Shadow Maps、Motion Blur 和 Bloom 在该验证工程中保持关闭。
7. Standalone Game 可以从编辑器启动；Windows Development 包可以从 `deliverables/windows/YunxiCampus/` 启动。
8. `tools/ue/validate_project.py` 在 `UnrealEditor-Cmd.exe` 中退出码为 0。

## 范围边界

本计划交付一个主楼入口样板和一个回忆点。七个回忆点、全校园建筑、完整室内、存档、暂停菜单、夜景和最终写实光照仍按总计划的阶段 D–F 实施。本次不启用 Lumen、Nanite、Virtual Shadow Maps、光线追踪和 Starter Content。

## 文件结构与职责

| 路径 | 操作 | 职责 |
|---|---|---|
| `tools/ue/verify_prereqs.ps1` | 创建 | 检查 UE、Blender、FBX、磁盘、DDC 和工程文件 |
| `tools/ue/validate_project.py` | 创建 | 在 UnrealEditor-Cmd 中验证资产、地图 Actor 和低画质 CVar |
| `art/blender/scripts/export_scale_test_fbx.py` | 创建 | 从体块源文件单独导出 1 米立方体和真实门洞测试件 |
| `art/export/fbx/scale-test.fbx` | 生成 | 在 UE 中验证厘米尺度、轴向和门洞碰撞 |
| `unreal/YunxiCampus/YunxiCampus.uproject` | 创建 | UE5.8 Blueprint 工程入口，并启用 Enhanced Input 与 Python 验证插件 |
| `unreal/YunxiCampus/Config/DefaultEngine.ini` | 修改 | 合并模板配置、低画质渲染设置和默认地图 |
| `unreal/YunxiCampus/Config/DefaultGame.ini` | 修改 | 项目名称、描述和单机设置 |
| `unreal/YunxiCampus/Content/Campus/Maps/L_CampusTest.umap` | 创建 | 主楼入口可玩验证地图 |
| `unreal/YunxiCampus/Content/Campus/Buildings/MainBuilding/SM_MainBuilding.uasset` | 创建 | 主楼首次合并导入的静态网格 |
| `unreal/YunxiCampus/Content/Campus/Buildings/ScaleTest/SM_Test_1mCube.uasset` | 创建 | 1 米比例检查资产 |
| `unreal/YunxiCampus/Content/Campus/Buildings/ScaleTest/SM_Test_DoorFrame.uasset` | 创建 | 玩家胶囊穿门检查资产 |
| `unreal/YunxiCampus/Content/Campus/Materials/M_Campus_Master.uasset` | 创建 | 不透明校园材质母材质 |
| `unreal/YunxiCampus/Content/Campus/Materials/M_Campus_Glass.uasset` | 创建 | 低成本幕墙材质 |
| `unreal/YunxiCampus/Content/Campus/Materials/MI_Main_*.uasset` | 创建 | 主楼材质实例 |
| `unreal/YunxiCampus/Content/Campus/Blueprints/BPI_Interactable.uasset` | 创建 | 交互接口 |
| `unreal/YunxiCampus/Content/Campus/Blueprints/BP_MemoryPoint.uasset` | 创建 | 距离和视线受限的回忆点 |
| `unreal/YunxiCampus/Content/Campus/UI/WBP_MemoryViewer.uasset` | 创建 | 老照片、标题、时间和正文卡片 |
| `unreal/YunxiCampus/Content/Campus/Textures/Memories/T_Memory_01.uasset` | 创建 | 第一个回忆点照片 |
| `docs/qa/ue-import-validation.md` | 创建 | 比例、轴向、材质、法线、碰撞结果 |
| `docs/qa/ue-smoke-test.md` | 创建 | 编辑器、独立窗口和打包版本测试记录 |
| `docs/pipeline/environment.md` | 修改 | 记录 UE5.8、驱动、内存、分辨率和安装目录 |
| `deliverables/windows/YunxiCampus/` | 生成且忽略 | Windows Development 测试包 |

## 执行约定

- 所有命令从仓库根目录 `E:\data\zcode\.zcode\workspace\default\yunxi-campus-3d` 运行。
- UE 安装目录固定为 `E:\UE\UE_5.8`；如果 Launcher 实际生成 `UE_5.8.0`，先在本计划和验证脚本中统一替换，再创建工程。
- Unreal 内容路径使用 `/Game/Campus/...`，文件夹名和资产名只使用 ASCII。
- Blender 源文件继续以米为单位。当前模型把 Y 作为几何高度，并在 FBX 中声明 `axis_up="Y"`；首次导入必须根据测试件验证转换结果，不能只凭导出参数判断正确。
- `.uasset`、`.umap`、`.fbx` 和 `.blend` 由 Git LFS 跟踪。`Saved`、`Intermediate`、`DerivedDataCache`、`Binaries` 和打包目录不得提交。
- 每次提交前运行 `git status --short`，只暂存本任务列出的文件。

### 任务 1：锁定安装、磁盘和缓存基线

**文件：**
- 创建：`tools/ue/verify_prereqs.ps1`
- 修改：`docs/pipeline/environment.md`
- 修改：`unreal/_scaffold/YunxiCampus/Config/DefaultEngine.ini`

- [ ] **步骤 1：确认 UE5.8 编辑器存在**

运行：

```powershell
Get-Item 'E:\UE\UE_5.8\Engine\Binaries\Win64\UnrealEditor.exe' |
  Select-Object FullName,Length,LastWriteTime
```

预期：输出 `UnrealEditor.exe`，文件长度大于 0；不满足时停止工程创建，回到 Launcher 完成引擎安装。

- [ ] **步骤 2：把本地 DDC 定向到 E 盘**

运行：

```powershell
New-Item -ItemType Directory -Path 'E:\UE-DDC' -Force
[Environment]::SetEnvironmentVariable('UE-LocalDataCachePath', 'E:\UE-DDC', 'User')
[Environment]::GetEnvironmentVariable('UE-LocalDataCachePath', 'User')
```

预期：最后一行严格输出 `E:\UE-DDC`。设置后完全退出 Epic Launcher，再重新启动，使新环境变量传给 UE。UE 5.4 及以上默认使用 Zen，本环境变量会使 Zen 数据写入指定路径下的 `Zen` 子目录。

- [ ] **步骤 3：移除脚手架中的旧 Filesystem DDC 覆盖**

修改 `unreal/_scaffold/YunxiCampus/Config/DefaultEngine.ini`，删除整个 `[DerivedDataBackendGraph]` 区段及其 `Local=(Type=FileSystem,...)` 行。保留 `[/Script/Engine.RendererSettings]` 及全部低画质键。

运行：

```powershell
Select-String -Path 'unreal\_scaffold\YunxiCampus\Config\DefaultEngine.ini' `
  -Pattern 'DerivedDataBackendGraph|Type=FileSystem'
```

预期：无输出。

- [ ] **步骤 4：创建先失败的环境验证脚本**

创建 `tools/ue/verify_prereqs.ps1`，内容如下：

```powershell
$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$EngineRoot = 'E:\UE\UE_5.8'
$Editor = Join-Path $EngineRoot 'Engine\Binaries\Win64\UnrealEditor.exe'
$Blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
$Fbx = Join-Path $RepoRoot 'art\export\fbx\main-building.fbx'
$Project = Join-Path $RepoRoot 'unreal\YunxiCampus\YunxiCampus.uproject'
$Ddc = [Environment]::GetEnvironmentVariable('UE-LocalDataCachePath', 'User')

$checks = [ordered]@{
  UnrealEditor = Test-Path -LiteralPath $Editor
  Blender = Test-Path -LiteralPath $Blender
  MainBuildingFbx = Test-Path -LiteralPath $Fbx
  Project = Test-Path -LiteralPath $Project
  DdcOnE = $Ddc -eq 'E:\UE-DDC'
  EDriveFreeGiB = [math]::Round((Get-PSDrive E).Free / 1GB, 2)
}

$checks.GetEnumerator() | Format-Table -AutoSize
if (-not $checks.UnrealEditor -or -not $checks.Blender -or
    -not $checks.MainBuildingFbx -or -not $checks.DdcOnE) {
  throw 'UE5 prerequisite validation failed.'
}
if ($checks.EDriveFreeGiB -lt 25) {
  throw 'E: needs at least 25 GiB free before project import and packaging.'
}
if (-not $checks.Project) {
  exit 2
}
```

- [ ] **步骤 5：运行脚本并确认工程检查先失败**

运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\ue\verify_prereqs.ps1
```

预期：UE、Blender、FBX、DDC 均为 `True`，`Project` 为 `False`，进程退出码为 2。这证明脚本能发现下一任务尚未创建的 `.uproject`。

- [ ] **步骤 6：补录环境记录**

在 `docs/pipeline/environment.md` 写入：UE `5.8.0`、安装路径 `E:\UE\UE_5.8`、DDC `E:\UE-DDC`、CPU `Ryzen 5 5600GT`、内存 `31.4 GB`、GPU `AMD Radeon Graphics`、验证分辨率 `1920×1080`、低画质路线。

- [ ] **步骤 7：提交安装基线**

```powershell
git add tools/ue/verify_prereqs.ps1 docs/pipeline/environment.md `
  unreal/_scaffold/YunxiCampus/Config/DefaultEngine.ini
git commit -m "chore: lock UE5.8 campus environment"
```

### 任务 2：制作可靠的比例与门洞测试 FBX

**文件：**
- 创建：`art/blender/scripts/export_scale_test_fbx.py`
- 生成：`art/export/fbx/scale-test.fbx`
- 修改：`docs/pipeline/export-settings.md`

- [ ] **步骤 1：写出可独立验证的测试场景脚本**

创建 `art/blender/scripts/export_scale_test_fbx.py`。脚本清空临时场景后创建：

- `SM_Test_1mCube`：`1m × 1m × 1m`，中心高度 `0.5m`。
- `SM_Test_DoorFrame`：左右两根 `0.2m × 2.2m × 0.25m` 门柱和一根 `2.0m × 0.2m × 0.25m` 顶梁，净门洞 `1.6m × 2.0m`。
- 三个对应的 `UCX_` 盒体，只覆盖两侧门柱和顶梁，不能横跨门洞。
- 两个资产相距 3 米，应用 Rotation 与 Scale，导出 `art/export/fbx/scale-test.fbx`。

导出调用必须使用：

```python
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
```

- [ ] **步骤 2：生成 FBX**

运行：

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' `
  --background --python art\blender\scripts\export_scale_test_fbx.py
```

预期：输出包含 `Exported scale test FBX`，并生成非空的 `art/export/fbx/scale-test.fbx`。

- [ ] **步骤 3：回读 FBX 验证对象和边界**

使用同一脚本的 `--verify` 模式把 FBX 导入空场景，断言存在 `SM_Test_1mCube`、`SM_Test_DoorFrame` 和三个 `UCX_SM_Test_DoorFrame_*` 对象；断言立方体边长误差小于 `0.001m`，门洞没有被 UCX 横梁从地面封住。

运行：

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' `
  --background --python art\blender\scripts\export_scale_test_fbx.py -- --verify
```

预期：进程退出码 0，输出 `Scale test verification passed`。

- [ ] **步骤 4：更新导出规范**

在 `docs/pipeline/export-settings.md` 记录 Blender 5.2.1 的实际 FBX 导出轴向，以及“UE 导入后 1 米为 100cm、门洞净宽 160cm、净高 200cm”的验收值。

- [ ] **步骤 5：提交测试资产**

```powershell
git add art/blender/scripts/export_scale_test_fbx.py `
  art/export/fbx/scale-test.fbx docs/pipeline/export-settings.md
git commit -m "test: add Blender to UE scale fixture"
```

### 任务 3：创建 UE5 First Person Blueprint 工程

**文件：**
- 创建：`unreal/YunxiCampus/YunxiCampus.uproject`
- 创建：`unreal/YunxiCampus/Content/FirstPerson/**`
- 创建：`unreal/YunxiCampus/Content/Characters/**`
- 修改：`unreal/YunxiCampus/Config/DefaultEngine.ini`
- 修改：`unreal/YunxiCampus/Config/DefaultGame.ini`
- 删除：`unreal/_scaffold/YunxiCampus/`

- [ ] **步骤 1：在 Project Browser 创建工程**

从 UE5.8 Project Browser 选择：

```text
Category: Games
Template: First Person
Variant: None
Blueprint / C++: Blueprint
Target Platform: Desktop
Quality Preset: Scalable
Ray Tracing: Disabled
Starter Content: Disabled
Project Location: E:\data\zcode\.zcode\workspace\default\yunxi-campus-3d\unreal
Project Name: YunxiCampus
```

预期：生成 `unreal/YunxiCampus/YunxiCampus.uproject` 并打开 `Lvl_FirstPerson`。

- [ ] **步骤 2：验证模板移动**

点击 Play，执行 WASD、鼠标观察和一次跳跃，然后按 Esc 停止。

预期：角色出生在模板地图，WASD、鼠标和 Space 正常；Output Log 没有 Blueprint Runtime Error。

- [ ] **步骤 3：合并脚手架目录**

关闭编辑器。将 `unreal/_scaffold/YunxiCampus/Content/Campus` 移入新项目的 `Content/Campus`。把脚手架 `DefaultEngine.ini` 中 `[/Script/Engine.RendererSettings]` 的键追加到模板生成文件；把脚手架 `DefaultGame.ini` 的 `ProjectName`、`Description`、`MaxPlayers` 合入模板文件。保留模板生成的输入、地图和 GameMode 配置。

- [ ] **步骤 4：启用自动验证插件**

在 `YunxiCampus.uproject` 的 `Plugins` 数组中确保存在：

```json
{
  "Name": "EnhancedInput",
  "Enabled": true
},
{
  "Name": "PythonScriptPlugin",
  "Enabled": true
},
{
  "Name": "EditorScriptingUtilities",
  "Enabled": true
}
```

- [ ] **步骤 5：验证工程后清理暂存目录**

运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\ue\verify_prereqs.ps1
Select-String -Path unreal\YunxiCampus\Config\DefaultEngine.ini `
  -Pattern 'r.DynamicGlobalIlluminationMethod=0','r.Nanite.ProjectEnabled=0'
```

预期：脚本退出码 0，两项低画质配置均命中。确认 `Content/Campus` 已存在后，删除 `unreal/_scaffold/YunxiCampus`；该目录只是本仓库在正式工程创建前保存的可恢复副本。

- [ ] **步骤 6：提交正式工程骨架**

```powershell
git add unreal/YunxiCampus .gitignore .gitattributes
git add -u unreal/_scaffold/YunxiCampus
git commit -m "feat: create UE5 first-person campus project"
```

### 任务 4：验证低画质渲染配置确实生效

**文件：**
- 修改：`unreal/YunxiCampus/Config/DefaultEngine.ini`
- 创建：`docs/qa/ue-smoke-test.md`

- [ ] **步骤 1：锁定 RendererSettings**

确保 `DefaultEngine.ini` 的 `[/Script/Engine.RendererSettings]` 至少包含：

```ini
r.DynamicGlobalIlluminationMethod=0
r.ReflectionMethod=0
r.Lumen.HardwareRayTracing=0
r.Nanite.ProjectEnabled=0
r.Shadow.Virtual.Enable=0
r.GenerateMeshDistanceFields=0
r.DefaultFeature.Bloom=False
r.DefaultFeature.MotionBlur=False
r.Shadow.MaxResolution=1024
r.ReflectionCaptureResolution=128
```

- [ ] **步骤 2：在 Project Settings 交叉检查**

重新打开工程，在 Rendering 中确认 Dynamic Global Illumination 为 None、Reflection Method 为 None、Generate Mesh Distance Fields 关闭、Virtual Shadow Maps 未使用、Nanite 未启用。修改任何不一致项并重启编辑器。

- [ ] **步骤 3：记录控制台值**

在 Output Log 依次执行：

```text
r.DynamicGlobalIlluminationMethod
r.ReflectionMethod
r.Nanite.ProjectEnabled
r.Shadow.Virtual.Enable
r.DefaultFeature.MotionBlur
```

预期：前四项均为 0，Motion Blur 为关闭状态。将输出值写入 `docs/qa/ue-smoke-test.md`。

- [ ] **步骤 4：验证 DDC 路径**

关闭编辑器后运行：

```powershell
Select-String -Path unreal\YunxiCampus\Saved\Logs\YunxiCampus.log `
  -Pattern 'UE-LocalDataCachePath','E:\\UE-DDC','Zen'
```

预期：日志包含环境变量或 `E:\UE-DDC\Zen`，且路径可写。如果仍指向 `C:\ProgramData\Epic\Zen\Data`，完全退出 Epic Launcher 和 ZenServer 后重开，再重复检查。

- [ ] **步骤 5：提交渲染基线**

```powershell
git add unreal/YunxiCampus/Config/DefaultEngine.ini docs/qa/ue-smoke-test.md
git commit -m "chore: enforce low-quality UE validation preset"
```

### 任务 5：导入并验收比例测试件

**文件：**
- 创建：`unreal/YunxiCampus/Content/Campus/Buildings/ScaleTest/*.uasset`
- 修改：`docs/qa/ue-import-validation.md`

- [ ] **步骤 1：导入测试 FBX**

在 Content Browser 创建 `Campus/Buildings/ScaleTest`，导入 `art/export/fbx/scale-test.fbx`，设置：

```text
Mesh Type: Static Mesh
Import Static Meshes: Enabled
Combine Static Meshes: Disabled
Import Materials: Disabled
Import Textures: Disabled
Generate Missing Collision: Disabled
Build Nanite: Disabled
Import Uniform Scale: 1.0
```

预期：生成独立的 `SM_Test_1mCube` 和 `SM_Test_DoorFrame`，UCX 对象不作为可见资产出现。

- [ ] **步骤 2：量取 1 米立方体**

打开 `SM_Test_1mCube`，在 Static Mesh Editor 查看 Bounds。

预期：X、Y、Z 尺寸均为 `100 ± 0.1 cm`，立方体垂直方向是 UE 的 Z 轴。如果尺寸为 1cm 或 10000cm，停止主楼导入并修正 Blender 导出脚本。

- [ ] **步骤 3：验证门洞碰撞**

把 `SM_Test_DoorFrame` 放入模板地图，在 Show > Collision 中显示碰撞；用 First Person 角色穿过门洞。

预期：角色从 160cm 净宽、200cm 净高门洞通过；门柱和顶梁能阻挡角色；门洞中不存在横跨地面的碰撞盒。

- [ ] **步骤 4：记录导入结果**

创建 `docs/qa/ue-import-validation.md`，记录 UE 版本、导入日期、Bounds、轴向、门洞通行、法线和碰撞结论，并插入 Static Mesh Editor 截图的相对路径。

- [ ] **步骤 5：提交比例验收**

```powershell
git add unreal/YunxiCampus/Content/Campus/Buildings/ScaleTest `
  docs/qa/ue-import-validation.md deliverables/screenshots
git commit -m "test: validate Blender FBX scale in UE5"
```

### 任务 6：导入主楼并建立可行走碰撞

**文件：**
- 创建：`unreal/YunxiCampus/Content/Campus/Buildings/MainBuilding/SM_MainBuilding.uasset`
- 修改：`docs/qa/ue-import-validation.md`

- [ ] **步骤 1：导入主楼原型**

导入 `art/export/fbx/main-building.fbx` 到 `Campus/Buildings/MainBuilding`：

```text
Mesh Type: Static Mesh
Import Static Meshes: Enabled
Combine Static Meshes: Enabled
Import Materials: Disabled
Import Textures: Disabled
Generate Missing Collision: Disabled
Build Nanite: Disabled
Import Uniform Scale: 1.0
```

把生成资产重命名为 `SM_MainBuilding`。

- [ ] **步骤 2：检查方向和边界**

在 Static Mesh Editor 中检查约 `110m × 16.9m × 22.91m` 的整体范围。Blender 源文件的范围是 X=110m、Y=22.91m、Z=16.9m；导出脚本绕世界 X 轴 +90° 烘焙后，UE 的高度应为 Z=22.91m，深度为 Y=16.9m。确认正立面文字没有镜像、表面法线朝外。

预期：建筑立起、入口朝向统一、五层高度自然；若模型躺倒，只修改 `export_main_building_fbx.py` 的轴向并重新导出，不在关卡里用 90° 旋转掩盖导出错误。

- [ ] **步骤 3：设置原型碰撞**

将 `SM_MainBuilding` 的 Collision Complexity 设置为 `Use Complex Collision As Simple`，保存资产。该方式只用于静态原型，不允许打开 Simulate Physics。

预期：入口、走廊和构件间的真实空洞仍可通行；墙、地板和台阶能阻挡玩家。

- [ ] **步骤 4：记录主楼导入结果**

在 `docs/qa/ue-import-validation.md` 增加主楼 Bounds、可见材质槽数量、碰撞模式、已知的无贴图状态和导入耗时。

- [ ] **步骤 5：提交主楼 UE 资产**

```powershell
git add unreal/YunxiCampus/Content/Campus/Buildings/MainBuilding `
  docs/qa/ue-import-validation.md
git commit -m "feat: import main building into UE5"
```

### 任务 7：建立主楼入口可玩地图

**文件：**
- 创建：`unreal/YunxiCampus/Content/Campus/Maps/L_CampusTest.umap`
- 创建：`tools/ue/setup_campus_test_map.py`
- 修改：`unreal/YunxiCampus/Config/DefaultEngine.ini`

- [ ] **步骤 1：复制模板地图**

复制 `/Game/FirstPerson/Lvl_FirstPerson` 到 `/Game/Campus/Maps/L_CampusTest`。删除模板示例坡道和无关几何，保留 First Person GameMode 所需配置。

- [ ] **步骤 2：布置基础场景**

在 `L_CampusTest` 放置：

```text
MainBuilding: SM_MainBuilding，Location (0, 0, 0)
CampusGround: 240m × 220m × 0.2m，顶部 Z=0
PlayerStart: 主楼正立面前 15m，胶囊底部高于地面 5cm
DirectionalLight: Movable，低阴影质量
SkyLight: Movable，Real Time Capture 关闭
SkyAtmosphere: Enabled
ExponentialHeightFog: Disabled
PostProcessVolume: Unbound，Bloom 0，Motion Blur 0
```

- [ ] **步骤 3：设置默认地图**

在 Project Settings > Maps & Modes 设置：

```text
Editor Startup Map: /Game/Campus/Maps/L_CampusTest
Game Default Map: /Game/Campus/Maps/L_CampusTest
Default GameMode: 模板的 First Person GameMode
```

保存后确认 `DefaultEngine.ini` 写入对应 `GameDefaultMap` 和 `EditorStartupMap`。

- [ ] **步骤 4：执行第一人称路线测试**

从 PlayerStart 开始，连续执行：向前 15m、左右沿主楼立面各走 20m、走上入口台阶、穿过门洞、进入入口空间、返回广场。

预期：全程不掉出地面、不穿墙、不被透明或隐藏表面卡住；台阶不能通过时先增加简单坡道碰撞，不改变可见台阶比例。

- [ ] **步骤 5：执行 Standalone Game 测试**

选择 Play > Standalone Game，以 `1280×720` 窗口运行 5 分钟。

预期：无需在视口内额外点击即可获得键鼠输入，Esc 能正常退出，日志无崩溃和 Blueprint Runtime Error。

- [ ] **步骤 6：提交测试地图**

```powershell
git add unreal/YunxiCampus/Content/Campus/Maps/L_CampusTest.umap `
  unreal/YunxiCampus/Config/DefaultEngine.ini
git commit -m "feat: add playable main-building test map"
```

### 任务 8：重建主楼基础材质

**文件：**
- 创建：`unreal/YunxiCampus/Content/Campus/Materials/M_Campus_Master.uasset`
- 创建：`unreal/YunxiCampus/Content/Campus/Materials/M_Campus_Glass.uasset`
- 创建：`unreal/YunxiCampus/Content/Campus/Materials/MI_Main_*.uasset`

- [ ] **步骤 1：创建不透明母材质**

`M_Campus_Master` 使用以下参数：

```text
BaseColor: VectorParameter，默认 (0.5, 0.5, 0.5)
Roughness: ScalarParameter，默认 0.7
Metallic: ScalarParameter，默认 0.0
NormalStrength: ScalarParameter，默认 0.0
Material Domain: Surface
Blend Mode: Opaque
Shading Model: Default Lit
```

- [ ] **步骤 2：创建低成本玻璃材质**

`M_Campus_Glass` 设置 `Blend Mode=Translucent`、`Shading Model=Default Lit`、`Two Sided=false`，参数为绿色 BaseColor、Opacity `0.55`、Roughness `0.25`、Metallic `0.0`。关闭折射和高成本透明阴影。

- [ ] **步骤 3：创建并分配材质实例**

创建 `MI_Main_WhiteTile`、`MI_Main_BlueBand`、`MI_Main_GreenGlass`、`MI_Main_Concrete`、`MI_Main_RedStructure`、`MI_Main_Aluminium`、`MI_Main_DarkInterior`、`MI_Main_RedPaving`，根据 Blender 材质槽名称逐一分配到 `SM_MainBuilding`。

- [ ] **步骤 4：检查材质性能和辨识度**

在 PlayerStart、入口近景和立面斜侧三个视角检查：白砖不纯白、玻璃能辨识为绿色且不遮死入口、红色构件不过曝、金属与混凝土粗糙度有差异。

预期：Shader Complexity 视图没有大面积白色透明过绘；编辑器视口保持可交互。

- [ ] **步骤 5：提交材质样板**

```powershell
git add unreal/YunxiCampus/Content/Campus/Materials `
  unreal/YunxiCampus/Content/Campus/Buildings/MainBuilding/SM_MainBuilding.uasset
git commit -m "feat: rebuild main-building materials in UE5"
```

### 任务 9：实现一个可关闭的回忆点

**文件：**
- 创建：`unreal/YunxiCampus/Content/Campus/Blueprints/BPI_Interactable.uasset`
- 创建：`unreal/YunxiCampus/Content/Campus/Blueprints/BP_MemoryPoint.uasset`
- 创建：`unreal/YunxiCampus/Content/Campus/UI/WBP_MemoryViewer.uasset`
- 创建：`unreal/YunxiCampus/Content/Campus/Textures/Memories/T_Memory_01.uasset`
- 修改：模板 First Person Character Blueprint
- 修改：`unreal/YunxiCampus/Content/Campus/Maps/L_CampusTest.umap`

- [ ] **步骤 1：导入第一张照片**

从 `E:\download\pic\一中\06_广场课间操全景_布局关键图.jpg` 导入 `T_Memory_01`。设置 `Texture Group=UI`、Mip Gen Settings 保持默认、最大尺寸 `2048`。

- [ ] **步骤 2：创建交互接口**

`BPI_Interactable` 定义函数 `Interact`，输入 `Interactor` 类型为 Actor，无返回值。

- [ ] **步骤 3：创建回忆点 Blueprint**

`BP_MemoryPoint` 包含 `SphereCollision`、`Billboard` 和以下可编辑变量：

```text
MemoryId: Name = Memory_01
Title: Text = 升旗仪式
TimeLabel: Text = 周一 · 清晨
Body: Text = 周一早上六点四十，喇叭里放国歌，学校背后山梁上的雾还没散。
Photo: Texture2D = T_Memory_01
InteractionDistance: Float = 340.0
```

实现 `BPI_Interactable.Interact`：检查 `GetDistanceTo(Interactor) <= InteractionDistance` 后，把变量传给 `WBP_MemoryViewer` 并显示。

- [ ] **步骤 4：创建照片卡片 Widget**

`WBP_MemoryViewer` 包含照片、标题、时间、正文和关闭按钮。创建 `OpenMemory(Title, TimeLabel, Body, Photo)` 函数；打开时：

```text
Add to Viewport
Set Input Mode Game And UI
Show Mouse Cursor = true
Character Movement Disable Movement
```

关闭按钮和 Esc 都调用 `CloseMemory`：

```text
Remove from Parent
Set Input Mode Game Only
Show Mouse Cursor = false
Character Movement Set Movement Mode Walking
```

- [ ] **步骤 5：在第一人称角色中加入视线交互**

添加 `IA_Interact`，键盘映射为 E。触发时从相机位置向前做 `Line Trace By Channel`，长度 `340cm`，命中 Actor 实现 `BPI_Interactable` 时调用 `Interact(Self)`。

- [ ] **步骤 6：布置并测试回忆点**

在广场到主楼入口的路线上放置 `MemoryPoint_01`。测试：远处按 E 无反应；靠近并看向回忆点按 E 打开；卡片显示正确照片和文字；打开时角色不移动；关闭后无需额外点击即可恢复视角和 WASD。

- [ ] **步骤 7：提交交互样板**

```powershell
git add unreal/YunxiCampus/Content/Campus/Blueprints `
  unreal/YunxiCampus/Content/Campus/UI `
  unreal/YunxiCampus/Content/Campus/Textures/Memories `
  unreal/YunxiCampus/Content/Campus/Maps/L_CampusTest.umap `
  unreal/YunxiCampus/Content/FirstPerson
git commit -m "feat: add first campus memory interaction"
```

### 任务 10：加入可重复的 Unreal 命令行验证

**文件：**
- 创建：`tools/ue/validate_project.py`

- [ ] **步骤 1：先写会因缺少验证资产而失败的脚本**

创建 `tools/ue/validate_project.py`：

```python
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

missing = [path for path in REQUIRED_ASSETS if not unreal.EditorAssetLibrary.does_asset_exist(path)]
if missing:
    raise RuntimeError("Missing required assets: " + ", ".join(missing))

level_editor = unreal.get_editor_subsystem(unreal.LevelEditorSubsystem)
if not level_editor.load_level("/Game/Campus/Maps/L_CampusTest"):
    raise RuntimeError("Unable to load L_CampusTest")

actor_subsystem = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
labels = {actor.get_actor_label() for actor in actor_subsystem.get_all_level_actors()}
for required_label in {"MainBuilding", "CampusGround", "MemoryPoint_01"}:
    if required_label not in labels:
        raise RuntimeError(f"Missing level actor: {required_label}")

expected_zero = [
    "r.DynamicGlobalIlluminationMethod",
    "r.ReflectionMethod",
    "r.Nanite.ProjectEnabled",
    "r.Shadow.Virtual.Enable",
]
for cvar in expected_zero:
    value = unreal.SystemLibrary.get_console_variable_int_value(cvar)
    if value != 0:
        raise RuntimeError(f"{cvar} expected 0, got {value}")

unreal.log("Yunxi Campus validation passed")
```

- [ ] **步骤 2：证明验证器能发现缺失 Actor**

临时把地图中的 `MemoryPoint_01` Actor Label 改为 `MemoryPoint_Invalid`，保存地图并运行：

```powershell
& 'E:\UE\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe' `
  'unreal\YunxiCampus\YunxiCampus.uproject' `
  -ExecutePythonScript='tools\ue\validate_project.py' -Unattended -NullRHI -NoP4
```

预期：退出码非 0，日志包含 `Missing level actor: MemoryPoint_01`。

- [ ] **步骤 3：恢复 Actor Label 并通过验证**

把 Actor Label 恢复为 `MemoryPoint_01`，保存并再次运行相同命令。

预期：退出码 0，日志包含 `Yunxi Campus validation passed`。

- [ ] **步骤 4：提交验证脚本**

```powershell
git add tools/ue/validate_project.py `
  unreal/YunxiCampus/Content/Campus/Maps/L_CampusTest.umap
git commit -m "test: add UE campus project validator"
```

### 任务 11：完成编辑器和独立窗口冒烟测试

**文件：**
- 修改：`docs/qa/ue-smoke-test.md`
- 创建：`deliverables/screenshots/ue-campus-front.png`
- 创建：`deliverables/screenshots/ue-campus-memory.png`

- [ ] **步骤 1：运行 10 分钟编辑器测试**

以 `1920×1080`、Scalability Low 运行 PIE，执行完整路线并触发回忆点 3 次。

预期：无崩溃、无输入锁死、无明显地面穿透、关闭卡片后始终恢复移动。

- [ ] **步骤 2：运行 10 分钟独立窗口测试**

使用 Standalone Game，窗口 `1280×720`。执行相同路线，退出后检查最新日志。

运行：

```powershell
Select-String -Path unreal\YunxiCampus\Saved\Logs\YunxiCampus.log `
  -Pattern 'Fatal error','Blueprint Runtime Error','Ensure condition failed'
```

预期：无输出。

- [ ] **步骤 3：记录性能起点**

开发控制台执行：

```text
stat fps
stat unit
csvprofile frames=600
```

在 `docs/qa/ue-smoke-test.md` 记录 PlayerStart、入口近景和主楼斜侧三个位置的平均 FPS、Game、Draw、GPU 帧时间。当前集成显卡以“稳定运行并识别瓶颈”为门槛，不把 60 FPS 写成已达成结论。

- [ ] **步骤 4：保存验收截图**

保存 `ue-campus-front.png` 和 `ue-campus-memory.png`，分别展示玩家视角的主楼正面和打开后的照片卡片。

- [ ] **步骤 5：提交冒烟测试证据**

```powershell
git add docs/qa/ue-smoke-test.md `
  deliverables/screenshots/ue-campus-front.png `
  deliverables/screenshots/ue-campus-memory.png
git commit -m "test: record UE campus smoke-test results"
```

### 任务 12：生成并验证 Windows Development 包

**文件：**
- 修改：`unreal/YunxiCampus/Config/DefaultGame.ini`
- 生成且忽略：`deliverables/windows/YunxiCampus/**`
- 修改：`docs/qa/ue-smoke-test.md`

- [ ] **步骤 1：设置打包地图和项目元数据**

在 Project Settings > Packaging 中只包含 `/Game/Campus/Maps/L_CampusTest`，Build Configuration 选择 Development，Full Rebuild 关闭。确认 Project Name 为 `Yunxi Campus`。

- [ ] **步骤 2：执行命令行打包**

运行：

```powershell
& 'E:\UE\UE_5.8\Engine\Build\BatchFiles\RunUAT.bat' BuildCookRun `
  -project='E:\data\zcode\.zcode\workspace\default\yunxi-campus-3d\unreal\YunxiCampus\YunxiCampus.uproject' `
  -noP4 -platform=Win64 -clientconfig=Development -build -cook -stage -pak `
  -archive -archivedirectory='E:\data\zcode\.zcode\workspace\default\yunxi-campus-3d\deliverables\windows\YunxiCampus'
```

预期：退出码 0，输出包含 `BUILD SUCCESSFUL`，生成 `YunxiCampus.exe`。

- [ ] **步骤 3：在脱离编辑器的情况下启动**

完全关闭 Unreal Editor，从 `deliverables/windows/YunxiCampus` 启动 `YunxiCampus.exe`。连续游玩 10 分钟，完成主楼路线和回忆点开关测试，再正常退出。

预期：运行时不要求 Epic Launcher 或 Unreal Editor保持打开；WASD、鼠标、E 和 Esc 行为与 Standalone Game 一致。

- [ ] **步骤 4：记录包体与最终结果**

在 `docs/qa/ue-smoke-test.md` 记录可执行文件路径、包体大小、启动时间、测试时长、分辨率、退出方式和日志结论。

- [ ] **步骤 5：确认生成物未进入 Git**

运行：

```powershell
git status --short
git check-ignore -v deliverables/windows/YunxiCampus
```

预期：打包目录由 `.gitignore` 命中，状态中没有 `Saved`、`Intermediate`、`DerivedDataCache`、`Binaries` 或 Windows 包文件。

- [ ] **步骤 6：提交交付记录**

```powershell
git add unreal/YunxiCampus/Config/DefaultGame.ini docs/qa/ue-smoke-test.md
git commit -m "docs: record playable Windows campus build"
```

## 最终验证命令

按顺序运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools\ue\verify_prereqs.ps1

& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' `
  --background --python art\blender\scripts\export_scale_test_fbx.py -- --verify

& 'E:\UE\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe' `
  'unreal\YunxiCampus\YunxiCampus.uproject' `
  -ExecutePythonScript='tools\ue\validate_project.py' -Unattended -NullRHI -NoP4

git status --short
```

预期：前三条命令退出码均为 0；Git 状态只包含执行者明确保留、尚未提交的文件。

## 最终人工验收矩阵

| 场景 | 操作 | 通过条件 |
|---|---|---|
| First Person 模板 | WASD、鼠标、Space、Esc | 输入全部有效，无 Runtime Error |
| 1 米测试件 | Static Mesh Bounds | 三轴均为 `100 ± 0.1cm` |
| 门洞测试件 | 玩家穿门，碰撞显示 | 能通过洞口，门柱和顶梁阻挡正确 |
| 主楼广场 | 从 PlayerStart 走向入口 | 地面连续，建筑竖直，入口朝向正确 |
| 主楼入口 | 台阶、门洞、入口内部 | 可走通，无隐藏碰撞封堵 |
| 回忆点 | 远处 E、近处看向后 E | 只在距离和视线同时满足时打开 |
| 回忆卡片 | WASD、Esc、关闭按钮 | 打开时不移动，关闭后输入恢复 |
| 低画质 | 查询四个核心 CVar | Lumen、反射、Nanite、VSM 均为 0 |
| Standalone | 运行 10 分钟 | 无崩溃、无错误、可正常退出 |
| Windows 包 | 编辑器关闭后运行 | 可启动、可游玩、可触发回忆点 |

## 自审结果

- 规格覆盖：工程创建、低画质、DDC、比例、轴向、碰撞、主楼导入、材质、第一人称、回忆点、Standalone、Windows 包和性能记录均有独立任务与验收。
- 当前风险已前置：Y 轴高度转换通过测试 FBX 决定；实心门框改为三段门洞与三段 UCX；UE5.8 Zen DDC 通过用户环境变量和日志双重验证。
- 类型一致：地图统一为 `L_CampusTest`，主楼资产统一为 `SM_MainBuilding`，回忆点统一为 `BP_MemoryPoint` / `MemoryPoint_01`，验证脚本引用相同路径和名称。
- 范围控制：本计划只实现一个照片回忆点；其余六个回忆点和 SaveGame 在后续玩法计划中完成。

## 版本依据

- UE5.8 First Person 模板的 None 变体自带可移动角色、GameMode、PlayerController 和基础关卡：<https://dev.epicgames.com/documentation/en-us/unreal-engine/first-person-template-in-unreal-engine>
- UE5.4 及以上默认使用 Zen DDC；`UE-LocalDataCachePath` 可把本地缓存移到其他磁盘：<https://dev.epicgames.com/documentation/en-us/unreal-engine/using-derived-data-cache-in-unreal-engine>
- FBX 静态网格、材质槽和 UCX 碰撞规则：<https://dev.epicgames.com/documentation/en-us/unreal-engine/fbx-static-mesh-pipeline-in-unreal-engine>
- UE5.8 Interchange 导入支持 `Combine Static Meshes`：<https://dev.epicgames.com/documentation/unreal-engine/interchange-import-reference-in-unreal-engine>
- Windows 打包流程：<https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project>
