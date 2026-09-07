# 主楼 Blender 资产

`main-building.blend` 是按 01/05/07/09/10/12/13/27/31 号照片整理的第一版主楼入口资产。它把教学楼两翼、外廊、中央绿玻璃塔、入口雨棚、灯笼、校徽、立体校名、窗格和蓝色饰带拆成可调整对象，并保留 F-01/F-02/F-03 参考相机。

生成命令：

```text
blender --background --python art/blender/scripts/build_main_building.py
```

正面比例、窗格数量和外廊深度仍需根据照片对比复核；未知部分保持参数化，不视为测绘结果。
