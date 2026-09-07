// 程序化贴图：全部用 Canvas 生成（写实化版本：天空穹顶、草叶、面片树叶、接触阴影、照片立面）
window.YX = window.YX || {};
YX.textures = (function () {

  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function tex(c, rx, ry) {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx || 1, ry || 1);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  function noise(ctx, w, h, alpha, n) {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * alpha).toFixed(3) + ')';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * alpha).toFixed(3) + ')';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  }

  // ================= 天空穹顶（equirect 贴到反向球） =================
  // 画布 x=0.40 处对应方位角约 atan2(50,70)（主光照方向），y 向上为天顶
  function skyDome(night) {
    const W = 1024, H = 512, c = cv(W, H), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    if (!night) {
      g.addColorStop(0, '#2b5da6');
      g.addColorStop(.42, '#6d9ccb');
      g.addColorStop(.72, '#b9cfe0');
      g.addColorStop(.90, '#e8dcc4');
      g.addColorStop(1, '#f0dfbe');
    } else {
      g.addColorStop(0, '#030813');
      g.addColorStop(.5, '#0a1428');
      g.addColorStop(.84, '#182844');
      g.addColorStop(1, '#22334e');
    }
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);

    if (!night) {
      // 低角度太阳 + 光晕（黄金时刻）
      const sx = W * .40, sy = H * .60;
      const glow = x.createRadialGradient(sx, sy, 4, sx, sy, 260);
      glow.addColorStop(0, 'rgba(255,248,224,1)');
      glow.addColorStop(.05, 'rgba(255,238,190,.95)');
      glow.addColorStop(.22, 'rgba(255,198,128,.38)');
      glow.addColorStop(1, 'rgba(255,180,100,0)');
      x.fillStyle = glow;
      x.fillRect(sx - 280, sy - 280, 560, 560);
      // 薄云（地平线附近拉长的柔性条带）
      for (let i = 0; i < 30; i++) {
        const cy = H * (.45 + Math.random() * .4), cw = 90 + Math.random() * 260, ch = 5 + Math.random() * 13;
        const cx = Math.random() * W;
        x.fillStyle = 'rgba(255,250,240,' + (.05 + Math.random() * .12).toFixed(2) + ')';
        x.beginPath();
        x.ellipse(cx, cy, cw, ch, 0, 0, 7);
        x.fill();
        x.fillStyle = 'rgba(120,140,175,' + (.04 + Math.random() * .07).toFixed(2) + ')';
        x.beginPath();
        x.ellipse(cx + cw * .2, cy + ch * .8, cw * .8, ch * .5, 0, 0, 7);
        x.fill();
      }
    } else {
      // 月亮
      const mx = W * .72, my = H * .30;
      const halo = x.createRadialGradient(mx, my, 2, mx, my, 90);
      halo.addColorStop(0, 'rgba(220,230,255,.9)');
      halo.addColorStop(.12, 'rgba(200,215,250,.35)');
      halo.addColorStop(1, 'rgba(180,200,255,0)');
      x.fillStyle = halo;
      x.fillRect(mx - 100, my - 100, 200, 200);
      x.fillStyle = '#e8edf7';
      x.beginPath(); x.arc(mx, my, 13, 0, 7); x.fill();
      x.fillStyle = 'rgba(160,175,200,.5)';
      x.beginPath(); x.arc(mx - 4, my - 3, 3, 0, 7); x.fill();
      x.beginPath(); x.arc(mx + 5, my + 4, 2, 0, 7); x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // ================= 面片树叶 =================
  function foliage(kind) {
    if (kind === 'palm') {
      // 棕榈叶：水平叶轴 + 两侧细叶片（透空）
      const c = cv(256, 128), x = c.getContext('2d');
      x.strokeStyle = '#5a7a2e'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(6, 64); x.lineTo(250, 64); x.stroke();
      const greens = ['#4a6d2a', '#5d8434', '#6f9a3e'];
      for (let i = 0; i < 42; i++) {
        const t = i / 42;
        const px = 10 + t * 232;
        const len = 50 * (1 - Math.abs(t - .45) * 1.1) + 8;
        x.strokeStyle = greens[(Math.random() * 3) | 0];
        x.lineWidth = 3;
        x.beginPath(); x.moveTo(px, 64); x.lineTo(px + 15, 64 - len); x.stroke();
        x.beginPath(); x.moveTo(px, 64); x.lineTo(px + 15, 64 + len); x.stroke();
      }
      const tp = new THREE.CanvasTexture(c);
      tp.encoding = THREE.sRGBEncoding;
      return tp;
    }
    const c = cv(256, 256), x = c.getContext('2d');
    const palette = kind === 'pine'
      ? ['#1e3a28', '#274a30', '#31593a', '#3d6a44', '#4a7a4e']
      : ['#3a5526', '#48682c', '#577a33', '#6b8f3c', '#82a448'];
    for (let i = 0; i < 240; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), .55) * 116;
      const px = 128 + Math.cos(a) * r;
      const py = 128 + Math.sin(a) * r * .92;
      const pi = Math.min(palette.length - 1, (Math.random() * palette.length + r / 130) | 0);
      x.fillStyle = palette[pi];
      x.globalAlpha = .92;
      x.beginPath();
      x.ellipse(px, py, 7 + Math.random() * 13, 5 + Math.random() * 9, Math.random() * 3, 0, 7);
      x.fill();
    }
    x.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function bark() {
    const c = cv(128, 256), x = c.getContext('2d');
    x.fillStyle = '#6b4f37'; x.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 90; i++) {
      x.fillStyle = Math.random() < .5 ? 'rgba(48,34,22,.5)' : 'rgba(126,100,70,.5)';
      const sx = Math.random() * 128;
      x.fillRect(sx, Math.random() * 256, 2 + Math.random() * 4, 30 + Math.random() * 90);
    }
    noise(x, 128, 256, .1, 400);
    return tex(c, 2, 2);
  }

  // ================= 地面 =================
  function grass() {
    const c = cv(512, 512), x = c.getContext('2d');
    x.fillStyle = '#6d9a4e'; x.fillRect(0, 0, 512, 512);
    // 干斑
    for (let i = 0; i < 14; i++) {
      x.fillStyle = 'rgba(160,155,90,.13)';
      x.beginPath(); x.ellipse(Math.random() * 512, Math.random() * 512, 20 + Math.random() * 60, 14 + Math.random() * 40, Math.random() * 3, 0, 7); x.fill();
    }
    // 草叶
    for (let i = 0; i < 2600; i++) {
      const px = Math.random() * 512, py = Math.random() * 512;
      const lean = (Math.random() - .5) * 6;
      const shade = palette(['#557f3b', '#5f8a42', '#6d9a4e', '#7ba457', '#8fae54']);
      x.strokeStyle = shade; x.lineWidth = 1;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + lean, py - 4 - Math.random() * 8); x.stroke();
    }
    function palette(a) { return a[(Math.random() * a.length) | 0]; }
    noise(x, 512, 512, .05, 900);
    return tex(c, 46, 46);
  }

  function pavement() {
    const c = cv(512, 512), x = c.getContext('2d');
    const n = 6, s = 512 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const l = 58 + Math.random() * 9;
      x.fillStyle = 'hsl(36,14%,' + l + '%)';
      x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      x.fillStyle = 'rgba(0,0,0,.05)';
      x.fillRect(i * s + 2, j * s + s - 10, s - 4, 8);
    }
    // 裂缝
    for (let k = 0; k < 7; k++) {
      x.strokeStyle = 'rgba(60,52,40,.28)'; x.lineWidth = 1.2;
      x.beginPath();
      let px = Math.random() * 512, py = Math.random() * 512;
      x.moveTo(px, py);
      for (let m = 0; m < 5; m++) { px += (Math.random() - .5) * 60; py += (Math.random() - .5) * 60; x.lineTo(px, py); }
      x.stroke();
    }
    noise(x, 512, 512, .07, 1400);
    return tex(c, 10, 7);
  }

  function asphalt() {
    const c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = '#5f6468'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) {
      x.fillStyle = 'rgba(130,135,140,.18)';
      x.beginPath(); x.ellipse(Math.random() * 256, Math.random() * 256, 4 + Math.random() * 18, 3 + Math.random() * 10, Math.random() * 3, 0, 7); x.fill();
    }
    noise(x, 256, 256, .14, 2400);
    return tex(c, 2, 12);
  }

  function court() {
    const c = cv(512, 288), x = c.getContext('2d');
    x.fillStyle = '#a5382f'; x.fillRect(0, 0, 512, 288);
    x.fillStyle = '#2e7d4f'; x.fillRect(36, 30, 440, 228);
    x.strokeStyle = '#f4f2ea'; x.lineWidth = 4;
    x.strokeRect(52, 44, 408, 200);
    x.beginPath(); x.moveTo(256, 44); x.lineTo(256, 244); x.stroke();
    x.beginPath(); x.arc(256, 144, 40, 0, 7); x.stroke();
    x.strokeRect(52, 96, 56, 96); x.strokeRect(404, 96, 56, 96);
    // 磨损
    for (let i = 0; i < 60; i++) {
      x.fillStyle = 'rgba(0,0,0,' + (Math.random() * .1).toFixed(2) + ')';
      x.beginPath(); x.ellipse(Math.random() * 512, Math.random() * 288, 3 + Math.random() * 12, 2 + Math.random() * 6, Math.random() * 3, 0, 7); x.fill();
    }
    noise(x, 512, 288, .05, 700);
    return tex(c, 1, 1);
  }

  // ================= 楼体立面（白天 map + 夜晚 emissiveMap） =================
  function facade(opts) {
    const o = Object.assign({ floors: 5, bays: 12, base: '#f2f1ec', glass: '#b9d3dc', braces: false, ground: true }, opts);
    const W = 1024, H = 512;
    const day = cv(W, H), d = day.getContext('2d');
    const nite = cv(W, H), n = nite.getContext('2d');
    d.fillStyle = o.base; d.fillRect(0, 0, W, H);
    n.fillStyle = '#000'; n.fillRect(0, 0, W, H);

    // 底部雨水/污渍痕
    for (let i = 0; i < 26; i++) {
      d.fillStyle = 'rgba(90,84,66,' + (.04 + Math.random() * .06).toFixed(2) + ')';
      d.fillRect(Math.random() * W, H * .5, 2 + Math.random() * 4, H * .5 * Math.random());
    }

    const top = 30, floors = o.floors, fh = (H - top - 20) / floors;
    const bayW = W / o.bays, winW = bayW * .58, winH = fh * .52;
    const tints = ['#b9d3dc', '#a9c4d2', '#c4dae2', '#9fb8c6', '#aec9d6'];

    for (let f = 0; f < floors; f++) {
      const y0 = top + f * fh;
      d.fillStyle = 'rgba(0,0,0,.10)'; d.fillRect(0, y0 + fh - 5, W, 4);       // 楼板线
      d.fillStyle = 'rgba(0,0,0,.05)'; d.fillRect(0, y0 + fh - 12, W, 8);      // 楼板下 AO
      for (let b = 0; b < o.bays; b++) {
        const x0 = b * bayW + (bayW - winW) / 2, y1 = y0 + fh * .24;
        d.fillStyle = '#fdfdfa'; d.fillRect(x0 - 4, y1 - 4, winW + 8, winH + 8); // 窗套
        d.fillStyle = tints[(Math.random() * tints.length) | 0];
        d.fillRect(x0, y1, winW, winH);
        if (Math.random() < .22) {                                              // 白窗帘
          d.fillStyle = 'rgba(245,248,248,.85)';
          d.fillRect(x0, y1, winW, winH * (.3 + Math.random() * .4));
        }
        d.fillStyle = 'rgba(255,255,255,.32)'; d.fillRect(x0, y1, winW, winH * .22);
        d.fillStyle = 'rgba(20,30,40,.3)'; d.fillRect(x0 + winW / 2 - 2, y1, 3, winH);
        if (Math.random() < .58) {
          n.fillStyle = ['#ffd27a', '#ffc266', '#ffdd9e'][(Math.random() * 3) | 0];
        } else { n.fillStyle = '#10141c'; }
        n.fillRect(x0, y1, winW, winH);
        if (o.braces && b % 2 === 0) {
          d.strokeStyle = '#b7382b'; d.lineWidth = 7;
          d.beginPath();
          d.moveTo(b * bayW + 6, y0 + fh - 8); d.lineTo((b + 1) * bayW - 6, y0 + 8);
          d.moveTo((b + 1) * bayW - 6, y0 + fh - 8); d.lineTo(b * bayW + 6, y0 + 8);
          d.stroke();
        }
      }
    }
    if (o.ground) {
      d.fillStyle = '#e6e3d9'; d.fillRect(0, H - 84, W, 84);
      d.fillStyle = 'rgba(0,0,0,.08)'; d.fillRect(0, H - 84, W, 5);
      n.fillStyle = '#000'; n.fillRect(0, H - 84, W, 84);
      for (let b = 0; b < o.bays; b++) {
        if (b % 3 === 1) continue;
        const x0 = b * bayW + bayW * .2;
        d.fillStyle = o.glass; d.fillRect(x0, H - 66, bayW * .6, 50);
        n.fillStyle = Math.random() < .5 ? '#ffd27a' : '#10141c';
        n.fillRect(x0, H - 66, bayW * .6, 50);
      }
    }
    noise(d, W, H, .04, 500);
    return { map: tex(day), emissive: tex(nite) };
  }

  // ================= 真实照片立面（仅 http(s) 下可用，file:// 有跨画布限制） =================
  function photoFacade(img) {
    // 塔楼上部（雨棚以上）：竖幅照片 cover 裁切，锚点偏上（校徽+玻璃幕墙+红字+LED）
    const c = cv(512, 360), x = c.getContext('2d');
    x.fillStyle = '#e8e0cd'; x.fillRect(0, 0, 512, 360);
    const s = Math.max(512 / img.width, 360 / img.height);
    const dw = img.width * s, dh = img.height * s;
    x.filter = 'saturate(1.05) contrast(1.04) brightness(.97)';
    x.drawImage(img, (512 - dw) / 2, Math.min(0, (360 - dh) * .15), dw, dh);
    x.filter = 'none';
    // 两侧与楼体颜色融合
    const edge = x.createLinearGradient(0, 0, 512, 0);
    edge.addColorStop(0, 'rgba(232,224,205,1)');
    edge.addColorStop(.08, 'rgba(232,224,205,0)');
    edge.addColorStop(.92, 'rgba(232,224,205,0)');
    edge.addColorStop(1, 'rgba(232,224,205,1)');
    x.fillStyle = edge; x.fillRect(0, 0, 512, 452);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
    return t;
  }

  function photoPoster(img) {
    // 校园航拍贴宣传栏（裁成 2.08:1）
    const c = cv(512, 246), x = c.getContext('2d');
    x.filter = 'saturate(1.08) contrast(1.05)';
    x.drawImage(img, 0, 120, 800, 385, 0, 0, 512, 246);
    x.filter = 'none';
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // ================= 光斑 / 阴影 =================
  function glow() {
    const c = cv(128, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(.25, 'rgba(255,255,255,.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function shadowBlob() {
    const c = cv(128, 128), x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(10,14,8,.5)');
    g.addColorStop(.6, 'rgba(10,14,8,.22)');
    g.addColorStop(1, 'rgba(10,14,8,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function shadowRect() {
    const c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = 'rgba(10,14,8,.4)';
    const m = 36; // 圆角矩形，模拟楼底 AO 外扩
    x.beginPath();
    if (x.roundRect) { x.roundRect(m, m, 256 - m * 2, 256 - m * 2, 26); x.fill(); }
    else x.fillRect(m, m, 256 - m * 2, 256 - m * 2);
    x.filter = 'blur(18px)';
    x.drawImage(c, 0, 0);
    x.filter = 'none';
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  // 外廊式教学楼：教室墙体（白天 + 夜晚发光窗）——瓷砖底、绿玻璃窗带、蓝色饰带
  function classroomWall(opts) {
    const o = Object.assign({ floors: 4, bays: 10 }, opts);
    const W = 1024, H = 512;
    const day = cv(W, H), d = day.getContext('2d');
    const nite = cv(W, H), n = nite.getContext('2d');
    // 白色小瓷砖底
    d.fillStyle = '#f0ede3'; d.fillRect(0, 0, W, H);
    for (let ty = 0; ty < H; ty += 10) {
      d.strokeStyle = 'rgba(140,135,120,.13)'; d.lineWidth = 1;
      d.beginPath(); d.moveTo(0, ty); d.lineTo(W, ty); d.stroke();
      for (let tx = (ty / 10 % 2) * 5; tx < W; tx += 10) {
        d.beginPath(); d.moveTo(tx, ty); d.lineTo(tx, ty + 10); d.stroke();
      }
    }
    n.fillStyle = '#000'; n.fillRect(0, 0, W, H);

    const fh = H / o.floors;
    for (let f = 0; f < o.floors; f++) {
      const y0 = f * fh;
      // 教室窗带（外廊后面，绿玻璃）
      const wy = y0 + fh * .18, wh = fh * .46;
      d.fillStyle = '#fdfdfa'; d.fillRect(0, wy - 3, W, wh + 6);
      const bayW = W / o.bays;
      for (let b = 0; b < o.bays; b++) {
        const x0 = b * bayW + bayW * .12;
        d.fillStyle = ['#9fc0a8', '#8db598', '#a9cbb2'][(Math.random() * 3) | 0];
        d.fillRect(x0, wy, bayW * .76, wh);
        d.fillStyle = 'rgba(255,255,255,.28)';
        d.fillRect(x0, wy, bayW * .76, wh * .22);
        d.strokeStyle = 'rgba(60,80,60,.5)'; d.lineWidth = 2;
        d.strokeRect(x0, wy, bayW * .76, wh);
        d.beginPath(); d.moveTo(x0 + bayW * .38, wy); d.lineTo(x0 + bayW * .38, wy + wh); d.stroke();
        n.fillStyle = Math.random() < .5 ? ['#ffd27a', '#ffc266', '#ffdd9e'][(Math.random() * 3) | 0] : '#10141c';
        n.fillRect(x0, wy, bayW * .76, wh);
      }
      // 蓝色饰带 + 楼板线
      d.fillStyle = 'rgba(90,140,190,.75)'; d.fillRect(0, y0 + fh * .78, W, fh * .07);
      d.fillStyle = 'rgba(0,0,0,.12)'; d.fillRect(0, y0 + fh - 4, W, 4);
    }
    noise(d, W, H, .03, 400);
    return { map: tex(day), emissive: tex(nite) };
  }

  // 红色竖幅标语（励志标语，挂在外立面上）
  function redBanner(text) {
    const c = cv(96, 512), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#c22a1e'); g.addColorStop(.5, '#e03526'); g.addColorStop(1, '#b02418');
    x.fillStyle = g; x.fillRect(0, 0, 96, 512);
    x.fillStyle = '#ffe28a';
    x.font = 'bold 44px "KaiTi","STKaiti",serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = text.length;
    for (let i = 0; i < n; i++) x.fillText(text[i], 48, 40 + (432 / (n - 1)) * i);
    x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3;
    x.strokeRect(4, 4, 88, 504);
    return tex(c);
  }

  // 走廊栏杆（透空贴图）
  function railing() {
    const c = cv(256, 64), x = c.getContext('2d');
    x.clearRect(0, 0, 256, 64);
    x.fillStyle = '#e8e8e2';
    x.fillRect(0, 2, 256, 5);       // 顶扶手
    x.fillRect(0, 30, 256, 3);      // 中横杆
    for (let i = 0; i < 24; i++) x.fillRect(i * 11 + 3, 2, 3, 58);
    x.fillRect(0, 56, 256, 5);      // 踢脚
    const t = new THREE.CanvasTexture(c);
    return t;
  }

  // 蜂窝砖（植草砖）：灰砖块 + 菱形孔洞露出草色 —— 小花园停车区（04号老照片）
  function cellBrick() {
    const c = cv(256, 256), x = c.getContext('2d');
    x.fillStyle = '#6f8a4c'; x.fillRect(0, 0, 256, 256);
    const n = 4, s = 256 / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const l = 62 + Math.random() * 8;
      x.fillStyle = 'hsl(40,7%,' + l + '%)';
      x.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      x.fillStyle = '#5d7a45';
      x.save();
      x.translate(i * s + s / 2, j * s + s / 2);
      x.rotate(Math.PI / 4);
      x.fillRect(-s * .22, -s * .22, s * .44, s * .44);
      x.restore();
    }
    noise(x, 256, 256, .06, 500);
    return tex(c, 5, 3);
  }

  // 红砖小径
  function redBrick() {
    const c = cv(128, 128), x = c.getContext('2d');
    x.fillStyle = '#b3a89a'; x.fillRect(0, 0, 128, 128);
    const bh = 16, bw = 32;
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? bw / 2 : 0;
      for (let b = -1; b < 5; b++) {
        const l = 34 + Math.random() * 8;
        x.fillStyle = 'hsl(12,38%,' + l + '%)';
        x.fillRect(b * bw + off + 1.5, r * bh + 1.5, bw - 3, bh - 3);
      }
    }
    noise(x, 128, 128, .08, 300);
    return tex(c, 2, 10);
  }

  // ================= 标牌文字 =================
  function nameSign(text) {
    const c = cv(1024, 160), x = c.getContext('2d');
    x.fillStyle = '#f5f2ea'; x.fillRect(0, 0, 1024, 160);
    x.strokeStyle = '#9c2b23'; x.lineWidth = 8; x.strokeRect(10, 10, 1004, 140);
    x.fillStyle = '#9c2b23';
    x.font = 'bold 92px "KaiTi","STKaiti",serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 512, 88);
    return tex(c);
  }

  function verticalSign(text, color) {
    const c = cv(160, 640), x = c.getContext('2d');
    x.clearRect(0, 0, 160, 640);
    x.fillStyle = color || '#c8281e';
    x.font = 'bold 118px "KaiTi","STKaiti",serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = text.length;
    for (let i = 0; i < n; i++) x.fillText(text[i], 80, 640 / n * (i + .5));
    return tex(c);
  }

  function ledBanner(text) {
    const c = cv(1024, 96), x = c.getContext('2d');
    x.fillStyle = '#120b06'; x.fillRect(0, 0, 1024, 96);
    x.fillStyle = '#ffd166';
    x.font = 'bold 52px "Microsoft YaHei", sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 512, 52);
    return tex(c);
  }

  function boardPoster(i) {
    const titles = ['光荣榜', '校务公开', '学习园地'];
    const c = cv(512, 384), x = c.getContext('2d');
    x.fillStyle = '#f7f2e6'; x.fillRect(0, 0, 512, 384);
    x.fillStyle = '#9c2b23';
    x.font = 'bold 58px "KaiTi","STKaiti",serif';
    x.textAlign = 'center';
    x.fillText(titles[i % 3], 256, 78);
    x.strokeStyle = '#b8ad93'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(60, 102); x.lineTo(452, 102); x.stroke();
    x.fillStyle = '#8a8577';
    x.font = '24px "Microsoft YaHei", sans-serif';
    x.textAlign = 'left';
    for (let r = 0; r < 8; r++) {
      x.fillText(r % 2 ? '＿＿＿＿＿＿　第' + ((r * 7 + 13) % 40 + 1) + '名' : '高三（' + (r + 1) + '）班　＿＿＿＿＿', 70, 150 + r * 28);
    }
    noise(x, 512, 384, .03, 300);
    return tex(c);
  }

  function stoneText() {
    const c = cv(512, 256), x = c.getContext('2d');
    x.clearRect(0, 0, 512, 256);
    x.fillStyle = '#8e2a21';
    x.font = 'bold 92px "KaiTi","STKaiti",serif';
    x.textAlign = 'center';
    x.fillText('养正观成', 256, 108);
    x.font = 'bold 60px "KaiTi","STKaiti",serif';
    x.fillText('立德树人', 256, 210);
    return tex(c);
  }

  function flag() {
    const c = cv(240, 160), x = c.getContext('2d');
    x.fillStyle = '#de2910'; x.fillRect(0, 0, 240, 160);
    x.fillStyle = '#ffde00';
    star(x, 40, 44, 26);
    star(x, 92, 18, 9); star(x, 112, 40, 9); star(x, 112, 68, 9); star(x, 92, 90, 9);
    return tex(c);
  }

  function star(x, cx, cy, r) {
    x.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 4 * Math.PI / 5;
      const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a);
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath(); x.fill();
  }

  function markerSprite(done) {
    const c = cv(128, 128), x = c.getContext('2d');
    x.fillStyle = 'rgba(253,252,247,.95)';
    x.fillRect(16, 8, 96, 112);
    x.fillStyle = done ? '#57ab6f' : '#f0b429';
    x.fillRect(24, 16, 80, 72);
    x.fillStyle = '#fff';
    x.font = 'bold 52px sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(done ? '✓' : '?', 64, 52);
    x.fillStyle = '#8a8577';
    x.beginPath(); x.arc(40, 104, 7, 0, 7); x.fill();
    x.fillRect(56, 100, 44, 8);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  function campusPoster() {
    const c = cv(512, 384), x = c.getContext('2d');
    x.fillStyle = '#aac9e6'; x.fillRect(0, 0, 512, 384);
    x.fillStyle = '#7ba05b'; x.fillRect(0, 280, 512, 104);
    x.fillStyle = '#5d8a46';
    x.beginPath(); x.moveTo(0, 280);
    for (let i = 0; i <= 512; i += 64) x.lineTo(i, 240 - Math.sin(i * .02) * 30 + Math.random() * 12);
    x.lineTo(512, 280); x.fill();
    x.fillStyle = '#e8e6df'; x.fillRect(90, 130, 330, 120);
    x.fillStyle = '#1f7a4d'; x.fillRect(238, 96, 34, 130);
    x.fillStyle = '#c8281e'; x.fillRect(150, 96, 14, 84);
    x.fillRect(150, 96, 60, 12);
    x.fillStyle = '#b9d3dc';
    for (let f = 0; f < 4; f++) for (let b = 0; b < 10; b++)
      x.fillRect(100 + b * 32, 142 + f * 26, 22, 14);
    x.fillStyle = '#2f6e3d';
    for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(60 + Math.random() * 400, 268 + Math.random() * 8, 9 + Math.random() * 6, 0, 7); x.fill(); }
    x.fillStyle = '#9c2b23';
    x.font = 'bold 34px "KaiTi","STKaiti",serif';
    x.textAlign = 'center';
    x.fillText('郧西一中 · 校园全景', 256, 356);
    return tex(c);
  }

  return { pavement, asphalt, grass, court, facade, classroomWall, redBanner, railing, photoFacade, photoPoster, nameSign, verticalSign, ledBanner, boardPoster, stoneText, flag, markerSprite, campusPoster, skyDome, foliage, bark, glow, shadowBlob, shadowRect, cellBrick, redBrick };
})();
