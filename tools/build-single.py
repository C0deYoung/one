# 打包单文件版：把 CSS / Three.js / 全部游戏代码 / 参照照片（base64）嵌进一个 HTML
# 用法：python tools/build-single.py
import base64
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent

html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css' / 'style.css').read_text(encoding='utf-8')

scripts = [
    'lib/three.min.js',
    'js/textures.js',
    'js/world.js',
    'js/buildings.js',
    'js/memories.js',
    'js/controls.js',
    'js/audio.js',
    'js/main.js',
]

def b64(rel):
    return base64.b64encode((root / rel).read_bytes()).decode()

# 内联脚本不允许出现 </script>，转义为 <\/script>（JS 字符串中两者等价）
js = '\n;\n'.join((root / s).read_text(encoding='utf-8') for s in scripts)
js = js.replace('</script>', '<\\/script>')

embedded = (
    'window.YX = window.YX || {};\n'
    'YX.EMBEDDED_IMAGES = {\n'
    '  facade: "data:image/jpeg;base64,' + b64('assets/reference/teaching-building-facade.jpg') + '",\n'
    '  aerial: "data:image/jpeg;base64,' + b64('assets/reference/campus-aerial.jpg') + '"\n'
    '};'
)

# 内联样式
html = html.replace(
    '<link rel="stylesheet" href="css/style.css">',
    '<style>\n' + css + '\n</style>'
)

# 移除外部脚本标签，统一内联
for s in scripts:
    html = html.replace('<script src="%s"></script>' % s, '')

assert '<script src=' not in html, '还有未内联的脚本标签'

# 注入内嵌资源与全部代码
inline = '<script>\n' + embedded + '\n</script>\n<script>\n' + js + '\n</script>\n</body>'
html = html.replace('</body>', inline)

out_dir = root / 'dist'
out_dir.mkdir(exist_ok=True)
out = out_dir / '郧西一中-重温上学时光.html'
out.write_text(html, encoding='utf-8')
print('OK ->', out)
print('size: %.1f MB' % (out.stat().st_size / 1048576))
