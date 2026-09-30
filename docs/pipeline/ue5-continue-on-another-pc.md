# 在另一台电脑继续开发：Blender + Unreal Engine 5

本文是把本仓库复制到另一台 Windows 电脑后，继续开发郧西一中 3D 探索游戏的操作手册。当前可运行基线已经提交到 Git 历史；交互蓝图和完整人工验收仍是下一阶段工作。

## 当前基线

- Unreal Engine：5.8.2，项目文件：`unreal/YunxiCampus/YunxiCampus.uproject`。
- Blender：5.2.1 LTS，主楼源文件和导出参数见 `docs/pipeline/export-settings.md`。
- 默认地图：`/Game/Campus/Maps/L_CampusTest`。
- 主楼：`/Game/Campus/Buildings/MainBuilding/SM_MainBuilding`。
- 低画质路线已启用：Lumen、Nanite、Virtual Shadow Maps、Motion Blur、Bloom 关闭。
- Windows Development 包已在当前机器生成；2026-09-30 可见性修复版位于 `deliverables/windows/visibility-fix/YunxiCampus.exe`。`deliverables/windows/` 被 `.gitignore` 忽略，需要在新电脑重新打包。
- 当前未完成：回忆点 Blueprint 变量与 E 键交互、回忆卡片 UI、完整 WASD/Standalone 路线、性能截图和 10 分钟脱离编辑器游玩验收。

## 推荐运行环境

| 项目 | 最低可行 | 推荐基线 |
|---|---|---|
| 系统 | Windows 10/11 64 位 | Windows 11 64 位 |
| 内存 | 16 GB | 32 GB |
| 显卡 | 支持 DirectX 12 / Shader Model 6 的显卡 | 独立显卡 8 GB 显存；集成显卡仅用于低画质验证 |
| 磁盘 | 至少 100 GB 可用空间 | E 盘或其他非系统盘预留 150 GB 以上 |
| 工具 | Git 2.x、Git LFS 3.x、Blender 5.2.x、UE 5.8.2 | 与当前版本完全一致 |

当前机器的可复现版本是：UE `E:\UE\UE_5.8`、Blender `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`、DDC `E:\UE-DDC`。另一台电脑可以使用不同盘符，但后续命令中的路径必须相应替换。

首次运行 UE 前安装 Microsoft Visual C++ 2015–2022 x64 Redistributable。若使用 `RunUAT.bat ... -build`，还需要安装 Visual Studio 的 C++ 桌面开发组件和 Windows 10 SDK `10.0.19041.0` 或项目允许的更新 SDK；只验证已有 Cook 结果时可以使用本文后面的 `-skipbuild -skipcook` 命令。

## 拉取仓库

在目标电脑的 PowerShell 中执行：

```powershell
git clone <代码托管仓库地址> yunxi-campus-3d
Set-Location .\yunxi-campus-3d
git lfs install
git lfs pull
git status
```

如果仓库已经克隆过，只需执行：

```powershell
git pull --ff-only
git lfs pull
```

确认工作区干净后再打开 Unreal。不要把 `Saved/`、`Intermediate/`、`DerivedDataCache/`、`Binaries/`、`Build/` 或 `deliverables/` 当作源码同步；这些目录已经由 `.gitignore` 排除或应在本机生成。

## 安装和环境变量

1. 安装 UE 5.8.2，并记下 `Engine\Binaries\Win64\UnrealEditor.exe` 和 `Engine\Build\BatchFiles\RunUAT.bat` 的绝对路径。
2. 安装 Blender 5.2.1 LTS；如果安装到非默认路径，更新自己的脚本或命令行路径。
3. 将 UE 派生数据缓存放在空间充足的盘符。例如：

```powershell
New-Item -ItemType Directory -Force E:\UE-DDC | Out-Null
[Environment]::SetEnvironmentVariable('UE-LocalDataCachePath', 'E:\UE-DDC', 'User')
```

重新打开 PowerShell 和 Unreal Editor 后变量才会生效。检查：

```powershell
[Environment]::GetEnvironmentVariable('UE-LocalDataCachePath', 'User')
```

4. 安装 Git LFS，并确认：

```powershell
git --version
git lfs version
```

## 打开项目并做第一次校验

双击或从 UE 5.8.2 打开：

```text
unreal/YunxiCampus/YunxiCampus.uproject
```

打开后检查 Content Browser 中的 `Campus/Maps/L_CampusTest`，确认主楼、地面、PlayerStart、太阳光、天空光和 `MemoryPoint_01` 存在。项目默认启动地图已经写入 `DefaultEngine.ini`。

推荐先执行无渲染项目校验。PowerShell 示例：

```powershell
$ue = 'E:\UE\UE_5.8\Engine\Binaries\Win64\UnrealEditor-Cmd.exe'
$project = (Resolve-Path '.\unreal\YunxiCampus\YunxiCampus.uproject').Path
& $ue $project -run=pythonscript -script="$(Resolve-Path '.\tools\ue\validate_project.py')" -unattended -nop4 -NullRHI -ExecCmds="Quit"
```

成功时日志应包含：

```text
YUNXI_VALIDATION_OK assets=8 actors=7 world=/Game/Campus/Maps/L_CampusTest.L_CampusTest
```

如果 UE 安装在其他盘符，只替换 `$ue`；项目路径使用 `Resolve-Path`，不需要改脚本。

## Blender 到 UE5 的资产流程

主楼源资产、导出设置和导入脚本分别位于：

- `assets/source/`：Blender 源文件及参考素材。
- `docs/pipeline/export-settings.md`：单位、坐标、FBX 和材质槽约定。
- `tools/ue/import_main_building.py`：可重复导入主楼。
- `tools/ue/rebuild_main_materials.py`：重建低画质母材质和实例。

修改 Blender 模型后，先按导出文档生成 FBX，再使用 UE 命令行脚本导入；导入后重新执行 `validate_project.py`，并在编辑器中保存地图。当前 UE Python 约定中，静态网格碰撞使用 `CTF_USE_COMPLEX_AS_SIMPLE`，材质槽要通过 `set_material` 写回资产，不能只修改内存中的槽数组。

## PIE、Standalone 和打包验证

在编辑器中先按 `Play` 做 PIE；点击视口后使用 `WASD`，按 `F8` 退出。当前阶段至少检查：主楼入口、主楼侧面、地面碰撞、PlayerStart 和红色回忆点标记。

无代码蓝图基线可以使用以下命令重新打包：

```powershell
$uat = 'E:\UE\UE_5.8\Engine\Build\BatchFiles\RunUAT.bat'
$project = (Resolve-Path '.\unreal\YunxiCampus\YunxiCampus.uproject').Path
$archive = (New-Item -ItemType Directory -Force '.\deliverables\windows').FullName
& $uat BuildCookRun `
  -project=$project `
  -platform=Win64 -clientconfig=Development `
  -skipbuild -skipcook -stage -pak -archive `
  -archivedirectory=$archive
```

输出应为：

```text
deliverables/windows/YunxiCampus.exe
```

首次在新电脑完整构建或 Cook 时去掉 `-skipbuild -skipcook`；如果提示缺少 Windows SDK，先安装对应 SDK 和 Visual Studio C++ 组件。打包后可以用 `-nullrhi -unattended` 做最小启动检查：

如果着色器编译提示无法写入用户目录，可在 `BuildCookRun` 命令末尾加入 `-AdditionalCookerOptions="-ShaderWorkingDir=<项目 Saved 目录下的可写路径>"`。2026-09-30 的修复包采用了这一参数；同一 UAT 流程完成 Cook、Stage 和 Pak，避免混用不同 Zen Store 的 Cook 结果。

```powershell
Start-Process '.\deliverables\windows\YunxiCampus\YunxiCampus.exe' -ArgumentList '-nullrhi','-unattended'
```

有窗口的人工验收仍要在编辑器 PIE/Standalone 或直接双击包完成。

## 下一台电脑的建议工作顺序

1. 按本文安装 UE、Blender、Git LFS、VC++ 运行库和 Windows SDK。
2. 克隆仓库并执行 `git lfs pull`。
3. 设置 DDC，打开 `.uproject`，运行 `validate_project.py`。
4. 在低画质设置下完成三条路线的 PIE/Standalone 观察，并记录 `stat fps`、`stat unit` 和截图。
5. 打开 `BPI_Interactable`、`BP_MemoryPoint`、`WBP_MemoryViewer`，补齐 `Interact`、照片显示/关闭逻辑和玩家的 E 键视线检测。
6. 重新运行项目校验和人工交互验收，再生成 Windows Development 包。
7. 只提交源资产、配置、脚本、文档和 QA 记录；不要提交本机缓存和构建输出。

## 常见问题

- **提示缺少 VC++ 运行库**：安装 UE 自带 `Engine\Extras\Redist\en-us\vc_redist.x64.exe` 或 Microsoft Visual C++ 2015–2022 x64 Redistributable。
- **完整 Build 提示 Windows SDK 10.0.19041.0 不存在**：安装该 SDK，或在只验证已有 Cook 结果时使用 `-skipbuild -skipcook`。
- **首次打开很慢或材质显示异常**：确认 `UE-LocalDataCachePath` 指向可写目录，等待 DDC 完成，再重新打开地图。
- **命令行脚本报文件占用**：关闭桌面 Unreal Editor 后再运行命令行脚本；编辑器打开同一资产时不要同时执行保存脚本。
- **校验提示资产缺失**：先确认 Git LFS 拉取完成，再检查 Content Browser 的 `/Game/Campus/...` 路径和大小写。

## 关键文件索引

| 用途 | 文件 |
|---|---|
| UE 项目 | `unreal/YunxiCampus/YunxiCampus.uproject` |
| UE 低画质配置 | `unreal/YunxiCampus/Config/DefaultEngine.ini` |
| Blender/UE 环境事实 | `docs/pipeline/environment.md` |
| 导出参数 | `docs/pipeline/export-settings.md` |
| 低画质验收 | `docs/pipeline/ue-low-quality.md` |
| 项目校验 | `tools/ue/validate_project.py` |
| 主楼导入 | `tools/ue/import_main_building.py` |
| 材质重建 | `tools/ue/rebuild_main_materials.py` |
| 交互资产基线 | `tools/ue/create_memory_interaction.py` |
| 进度与阻塞记录 | `docs/superpowers/plans/2026-09-07-ue5-campus-playable-vertical-slice-progress.md` |

