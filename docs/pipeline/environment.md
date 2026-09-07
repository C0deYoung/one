# 开发环境记录

检查日期：2026-09-07，Windows 工作区。

## 当前机器

- CPU：AMD Ryzen 5 5600GT with Radeon Graphics，6 核 / 12 线程。
- GPU：AMD Radeon(TM) Graphics（集成显卡），驱动版本 31.0.12002.92；另存在一个 OrayIddDriver 虚拟显示适配器（远程桌面组件），验收以 AMD Radeon Graphics 为准。
- 内存：31.4 GB。
- 桌面分辨率：2560×1440；验证分辨率按计划使用 1920×1080（编辑器/PIE）与 1280×720（Standalone 窗口）。
- 渲染路线：低画质验证路线（Lumen、Nanite、Virtual Shadow Maps、Motion Blur、Bloom 关闭）。

## 工具检查

- Blender：已安装 5.2.1 LTS，路径为 `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`。
- Unreal Engine：5.8.2（分支 `++UE5+Release-5.8`，Changelist 56702186），安装目录 `E:\UE\UE_5.8`。Launcher 实际生成目录与计划原定的 `E:\Epic Games\UE_5.8` 不同，已按计划预案在本计划与验证脚本中统一替换为 `E:\UE\UE_5.8`。
- 派生数据缓存（DDC）：用户级环境变量 `UE-LocalDataCachePath=E:\UE-DDC`，缓存目录 `E:\UE-DDC`（UE 5.8 的 Zen 数据写入其下 `Zen` 子目录）。
- Git：`C:\Program Files\Git\cmd\git.exe`。
- Git LFS：3.7.0，`C:\Program Files\Git\cmd\git-lfs.exe`。
- Visual C++ 运行库：UE 自带 `Engine\\Extras\\Redist\\en-us\\vc_redist.x64.exe` 已安装；当前打包启动验证使用 14.50.35719。
- Windows SDK：完整 `RunUAT ... -build` 需要安装项目配置的 Windows SDK（当前机器曾因缺少 `10.0.19041.0` 被阻断）；只复用已 Cook 结果时可用 `-skipbuild -skipcook`。

## 另一台电脑的可复制入口

完整的克隆、Git LFS、DDC、UE 命令行校验、PIE/Standalone、Windows Development 打包和故障排查步骤见 [`ue5-continue-on-another-pc.md`](ue5-continue-on-another-pc.md)。该文档中的 UE 路径以当前机器的 `E:\UE\UE_5.8` 为例；换盘符时只需替换命令中的路径。

## 安装后要补录

1. UE 精确版本：已补录为 5.8.2；FBX 导出参数见 `docs/pipeline/export-settings.md`。
2. GPU 驱动、内存、分辨率：已补录（驱动 31.0.12002.92，内存 31.4 GB，桌面 2560×1440）。
3. 阶段 B 首次导入的比例、法线、材质和碰撞结果：见 `docs/qa/ue-import-validation.md`。
4. 阶段 F 的平均 FPS、1% low、GPU/CPU/显存峰值和测试画质。

## 建议安装基线

先安装稳定版 Blender 与 UE5，并用同一台实际游玩电脑做导入和性能验证；版本锁定后不要在样板制作中途升级大版本。
