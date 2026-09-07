# 开发环境记录

检查日期：2026-09-07，Windows 工作区。

## 当前机器

- CPU：AMD Ryzen 5 5600GT with Radeon Graphics，6 核 / 12 线程。
- GPU：AMD Radeon(TM) Graphics（集成显卡，显存/共享内存数值待安装驱动工具后复核）。
- 内存：系统查询结果未成功返回数值，待补录。
- 测试分辨率：待补录。

## 工具检查

- Blender：未在 PATH 中找到；`C:\Program Files\Blender Foundation` 不存在。
- Unreal Engine：未在 PATH 中找到；常见 Epic Games 安装目录未找到。
- Git：`C:\Program Files\Git\cmd\git.exe`。
- Git LFS：`C:\Program Files\Git\cmd\git-lfs.exe`。

## 安装后要补录

1. Blender 精确版本、UE 精确版本、FBX 导出插件/脚本版本。
2. GPU 驱动版本、显存与共享内存、系统内存、目标屏幕分辨率。
3. 阶段 B 首次导入的比例、法线、材质和碰撞结果。
4. 阶段 F 的平均 FPS、1% low、GPU/CPU/显存峰值和测试画质。

## 建议安装基线

先安装稳定版 Blender 与 UE5，并用同一台实际游玩电脑做导入和性能验证；版本锁定后不要在样板制作中途升级大版本。
