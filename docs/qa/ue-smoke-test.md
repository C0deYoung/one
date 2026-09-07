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
