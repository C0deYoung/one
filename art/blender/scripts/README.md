# Blender 体块脚本

安装 Blender 后，在 Blender 的 Scripting 工作区运行 `build_campus_blockout.py`，或从该脚本目录执行：

```text
blender --background --python build_campus_blockout.py
```

脚本会生成：

- `art/blender/campus-blockout.blend`
- 按米建模的校园地面、主要建筑体块和待核实建筑体块
- 主楼入口、三根旗杆、花园水池、校门和北侧红色拱门的占位物
- `SM_Test_1mCube`、`SM_Test_DoorFrame` 与 `UCX_` 碰撞测试件
- F-01、F-02、F-04 对比相机和 7 个回忆点空物体

这是阶段 B 的可重复起点。所有未确认区域都带有 `source_confidence=unconfirmed` 或 `working_blockout` 属性，完成照片核实后再替换为精细资产。
