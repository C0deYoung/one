# UE5 低画质导入验证配置

当前阶段目标是验证 FBX 导入、角色移动、碰撞和互动流程，不追求最终写实画面。UE5 安装后把这些配置放入项目的 `Config/DefaultEngine.ini`，然后在编辑器中确认渲染设置已经生效。

## 预设设置

- Dynamic Global Illumination：关闭
- Reflection Method：关闭或使用屏幕空间反射
- Lumen Hardware Ray Tracing：关闭
- Nanite Project Enabled：关闭
- Virtual Shadow Maps：关闭
- Mesh Distance Fields：关闭
- 阴影最大分辨率：1024 起步
- 关闭 Motion Blur、Bloom 和默认高质量后处理
- 先使用 Directional Light + Sky Light 的静态/简单实时光照

## 验证顺序

1. 导入 `art/export/fbx/main-building.fbx`。
2. 检查模型比例：Blender 中 1 米测试立方体在 UE 中应显示为 100 厘米。
3. 检查材质槽、法线、枢轴和碰撞；Blender 的程序材质不依赖自动转换，UE 中手动建立材质实例。
4. 用 Third Person 或 First Person 模板创建测试地图，放置主楼并验证走廊、台阶和入口。
5. 再加入一个互动点和一张照片，确认玩法链路后才开始扩建校园。

## 配置说明

`DefaultEngine.ini` 中的渲染键可能随 UE5 小版本变化。导入项目后以 Project Settings 的实际状态为准；如果某个键在当前版本被弃用，记录警告并在编辑器中用对应设置替换。
