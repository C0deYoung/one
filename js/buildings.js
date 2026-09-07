// 建筑群 v3 —— 按《校园建筑分布图_v2》（校友手绘结构 + 照片匹配）布局
// 北：红色拱门、篮球场群（8半场）、高一教学楼×2、教师办公楼、科技实验楼
// 中：五层教学楼（绿玻璃塔+南外廊）
// 南：左花园（大树/荷花塘/凉亭）、右花园（孔子雕像/蘑菇亭/白顶棚）、折叠电动大门
window.YX = window.YX || {};
YX.buildings = (function () {

  const T = YX.textures;

  function box(w, h, d, color, x, y, z, opts) {
    const o = opts || {};
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ color, roughness: o.rough !== undefined ? o.rough : .9, metalness: o.metal || 0 })
    );
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry;
    m.castShadow = o.cast !== false;
    m.receiveShadow = true;
    return m;
  }

  function litBox(w, h, d, x, y, z, facadeOpts) {
    const f = T.facade(facadeOpts || { floors: 5, bays: 12, braces: false });
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({
        map: f.map, emissive: 0xffffff, emissiveMap: f.emissive,
        emissiveIntensity: 0, roughness: .92
      })
    );
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    YX.windowMats.push(m.material);
    return m;
  }

  // 外廊式教学楼：每层开放走廊 + 白栏杆 + 立柱 + 瓷砖墙 + 蓝饰带 + 红竖幅
  // opts.gap = { x0, x1 }：中央留出入口洞口（由门厅几何填充）
  function corridorBuilding(scene, x, z, len, floors, bannerTexts, opts) {
    const gap = opts && opts.gap;
    const FH = 3.4, depth = 10, corDepth = 2.4;
    const bodyH = floors * FH;
    const g = new THREE.Group();
    function bodySeg(cx, w) {
      if (w < 2) return;
      const b = Math.max(2, Math.round(w / 4));
      const f2 = T.classroomWall({ floors, bays: b });
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, bodyH, depth),
        new THREE.MeshStandardMaterial({
          map: f2.map, emissive: 0xffffff, emissiveMap: f2.emissive,
          emissiveIntensity: 0, roughness: .9
        })
      );
      m.position.set(cx, bodyH / 2, 0);
      m.castShadow = true; m.receiveShadow = true;
      YX.windowMats.push(m.material);
      g.add(m);
    }
    if (gap) {
      const x0 = Math.max(-len / 2, gap.x0), x1 = Math.min(len / 2, gap.x1);
      bodySeg((-len / 2 + x0) / 2, x0 + len / 2);
      bodySeg((x1 + len / 2) / 2, len / 2 - x1);
    } else {
      bodySeg(0, len);
    }
    const railMat = new THREE.MeshBasicMaterial({ map: T.railing(), transparent: true, alphaTest: .3, side: THREE.DoubleSide });
    const nCol = Math.max(4, Math.round(len / 4.2));
    for (let f = 0; f <= floors; f++) {
      const y = f * FH + .12;
      if (!(gap && f === 0)) {
        g.add(box(len, .24, corDepth, 0xe8e5dc, 0, y, depth / 2 + corDepth / 2 - .1, { cast: false }));
      } else {
        // 首层洞口处楼板断开
        const x0 = gap.x0, x1 = gap.x1;
        g.add(box(x0 + len / 2, .24, corDepth, 0xe8e5dc, (-len / 2 + x0) / 2, y, depth / 2 + corDepth / 2 - .1, { cast: false }));
        g.add(box(len / 2 - x1, .24, corDepth, 0xe8e5dc, (x1 + len / 2) / 2, y, depth / 2 + corDepth / 2 - .1, { cast: false }));
      }
      for (let c2 = 0; c2 <= nCol; c2++) {
        const cx = -len / 2 + c2 * (len / nCol);
        if (gap && cx > gap.x0 - .4 && cx < gap.x1 + .4) continue;
        g.add(box(.28, FH - .24, .28, 0xe6e3da, cx, y + (FH - .24) / 2, depth / 2 + corDepth - .2, { cast: false }));
      }
      if (f < floors) {
        const rz = depth / 2 + corDepth - .16, ry = y + FH / 2 - .1;
        if (gap && f === 0) {
          const r1 = new THREE.Mesh(new THREE.PlaneGeometry(gap.x0 + len / 2, .95), railMat);
          r1.position.set((-len / 2 + gap.x0) / 2, ry, rz);
          g.add(r1);
          const r2 = new THREE.Mesh(new THREE.PlaneGeometry(len / 2 - gap.x1, .95), railMat);
          r2.position.set((gap.x1 + len / 2) / 2, ry, rz);
          g.add(r2);
        } else {
          const rail = new THREE.Mesh(new THREE.PlaneGeometry(len, .95), railMat);
          rail.position.set(0, ry, rz);
          g.add(rail);
        }
      }
    }
    g.add(box(len, .7, .4, 0x4a7fb5, 0, bodyH + .3, depth / 2 + corDepth - .1, { cast: false }));
    g.add(box(len, .5, .4, 0xd8d4c8, 0, bodyH + .25, -depth / 2, { cast: false }));
    if (bannerTexts && bannerTexts.length) {
      bannerTexts.forEach((t, i) => {
        const bn = new THREE.Mesh(
          new THREE.PlaneGeometry(.9, FH * (floors - 1) * .7),
          new THREE.MeshStandardMaterial({ map: T.redBanner(t), roughness: .8, side: THREE.DoubleSide })
        );
        bn.position.set(-len / 2 + len * (i + 1) / (bannerTexts.length + 1), bodyH * .47, depth / 2 + corDepth + .06);
        g.add(bn);
      });
    }
    g.position.set(x, 0, z);
    scene.add(g);
    YX.addCollider(x, z, len, depth);   // 只碰撞教室主体；外廊可通行
    YX.mapRects.push({ x, z, w: len + 2, d: depth + corDepth + 1 });
    YX.world.baseAO(scene, x, z, len + 6, depth + corDepth + 5);
    return g;
  }

  // 红色竖幅挂旗
  function hangBanner(scene, text, x, y, z, ry) {
    const bn = new THREE.Mesh(
      new THREE.PlaneGeometry(.9, 7),
      new THREE.MeshStandardMaterial({ map: T.redBanner(text), roughness: .8, side: THREE.DoubleSide })
    );
    bn.position.set(x, y, z);
    if (ry) bn.rotation.y = ry;
    scene.add(bn);
  }

  function build(scene) {
    /* ============ 五层教学楼（中央，对应照片 01/05/07/10/12/13/26/27/31） ============ */
    corridorBuilding(scene, 0, 12, 110, 5, ['我坚信我能行', '我努力我准行', '会做的题目不丢分', '拼搏进取'], { gap: { x0: -11, x1: 11 } });

    // 中央塔楼：上部实体（照片贴图）+ 首层可进入门厅
    const hub = litBox(24, 16.6, 12, 0, 13.2, 13.4, { floors: 5, bays: 6, base: '#efe4c8' });
    scene.add(hub);
    YX.mapRects.push({ x: 0, z: 13.4, w: 24, d: 12 });
    YX.world.baseAO(scene, 0, 15, 28, 15);
    scene.add(box(24.6, .8, .5, 0xc0392b, 0, 21.9, 19.4, { cast: false }));

    const hubDeco = new THREE.Group();
    scene.add(hubDeco);
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(19, 14),
      new THREE.MeshStandardMaterial({ color: 0x2e8b62, roughness: .14, metalness: .8, emissive: 0x0d3b27, emissiveIntensity: .25, envMapIntensity: 1.6 })
    );
    glass.position.set(0, 12.6, 19.47);
    hubDeco.add(glass);
    for (let i = 0; i <= 6; i++) hubDeco.add(box(.35, 14, .18, 0xf2f1ec, -9.5 + i * 3.17, 12.6, 19.52, { cast: false }));
    for (let j = 0; j <= 5; j++) hubDeco.add(box(19, .3, .18, 0xf2f1ec, 0, 5.8 + j * 3.4, 19.52, { cast: false }));
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 13.2),
      new THREE.MeshBasicMaterial({ map: T.verticalSign('郧西一中'), transparent: true })
    );
    sign.position.set(0, 12.8, 19.6);
    hubDeco.add(sign);
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, .4, 24), new THREE.MeshStandardMaterial({ color: 0x2e8b62, roughness: .5 }));
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(0, 20.4, 19.5);
    hubDeco.add(emblem);
    const emblemRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, .16, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf2f1ec }));
    emblemRing.position.copy(emblem.position);
    hubDeco.add(emblemRing);

    // 真实照片立面（http(s) 或单文件内嵌模式），只贴雨棚以上的塔楼部分
    if (YX.PHOTO_OK || YX.EMBEDDED_IMAGES) {
      const photoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .88, emissive: 0x3a2f24, emissiveIntensity: .12 });
      const photoFace = new THREE.Mesh(new THREE.PlaneGeometry(21.8, 16.6), photoMat);
      photoFace.position.set(0, 13.2, 19.45);
      scene.add(photoFace);
      const im = new Image();
      im.onload = () => {
        photoMat.map = T.photoFacade(im);
        photoMat.emissiveMap = photoMat.map;
        photoMat.needsUpdate = true;
        hubDeco.visible = false;
      };
      im.onerror = () => scene.remove(photoFace);
      im.src = (YX.EMBEDDED_IMAGES && YX.EMBEDDED_IMAGES.facade) || 'assets/reference/gate-tower.webp';
    }

    // ---- 首层门厅（可走进去）：侧墙 + 后墙 + 地面 + 吊顶灯管 + 玻璃门 ----
    const lobbyCol = 0xefe9dc;
    scene.add(box(9.5, 4.9, 7, lobbyCol, -6.25, 2.45, 15.5));
    scene.add(box(9.5, 4.9, 7, lobbyCol, 6.25, 2.45, 15.5));
    scene.add(box(1, 4.9, 7, lobbyCol, -11.5, 2.45, 15.5, { cast: false }));
    scene.add(box(1, 4.9, 7, lobbyCol, 11.5, 2.45, 15.5, { cast: false }));
    scene.add(box(22, 4.9, 1.2, lobbyCol, 0, 2.45, 8));
    const lobbyFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(21, 11),
      new THREE.MeshStandardMaterial({ map: T.redBrick(), roughness: .9 })
    );
    lobbyFloor.rotation.x = -Math.PI / 2;
    lobbyFloor.position.set(0, .06, 14);
    lobbyFloor.receiveShadow = true;
    scene.add(lobbyFloor);
    scene.add(box(21, .2, 10, 0xf5f4ef, 0, 4.7, 14, { cast: false }));
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: .35 });
    for (const tx of [-5, 5]) {
      const tube = box(6, .08, .3, 0xffffff, tx, 4.45, 14, { cast: false });
      tube.material = tubeMat;
      scene.add(tube);
    }
    YX.windowMats.push(tubeMat);
    const lobbyLight = new THREE.PointLight(0xffe8c8, .7, 22, 1.5);
    lobbyLight.position.set(0, 3.6, 14);
    scene.add(lobbyLight);
    // 后墙布置：高考倒计时 + 展板 + 楼梯间门
    const cd = new THREE.Mesh(
      new THREE.PlaneGeometry(7, .95),
      new THREE.MeshBasicMaterial({ map: T.ledBanner('距离高考还有 128 天') })
    );
    cd.position.set(0, 3.1, 8.66);
    scene.add(cd);
    for (const bx of [-7.5, 7.5]) {
      const bp = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 2),
        new THREE.MeshBasicMaterial({ map: T.boardPoster(bx < 0 ? 0 : 2) })
      );
      bp.position.set(bx, 1.9, 8.66);
      scene.add(bp);
    }
    for (const sx of [-10, 10]) {
      const sd = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 3),
        new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: .8 })
      );
      sd.position.set(sx, 1.5, 8.67);
      scene.add(sd);
    }
    // 玻璃门（两扇半开）+ 侧固定玻璃 + 门框
    const glassMat = new THREE.MeshStandardMaterial({ color: 0xbfd8dd, roughness: .08, metalness: .5, transparent: true, opacity: .32, side: THREE.DoubleSide });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x9aa2a8, roughness: .4, metalness: .6 });
    const doorL = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.3), glassMat);
    doorL.position.set(-1.9, 1.75, 18.2);
    doorL.rotation.y = .8;
    scene.add(doorL);
    const doorR = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.3), glassMat);
    doorR.position.set(1.9, 1.75, 18.2);
    doorR.rotation.y = -.8;
    scene.add(doorR);
    for (const fx of [-4.4, 4.4]) {
      const fp = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), glassMat);
      fp.position.set(fx, 1.8, 17.6);
      scene.add(fp);
    }
    scene.add(box(10.5, .15, .15, 0x9aa2a8, 0, 3.62, 17.6, { cast: false }));
    for (const jx of [-5.2, 5.2]) scene.add(box(.15, 3.6, .15, 0x9aa2a8, jx, 1.8, 17.6, { cast: false }));
    // 门厅碰撞：两侧墙 / 后墙 / 门扇（中间留通道）
    YX.addCollider(-6.25, 15.5, 9.5, 7);
    YX.addCollider(6.25, 15.5, 9.5, 7);
    YX.addCollider(0, 8, 22, 1.2);
    YX.addCollider(-2.1, 18.2, 1.5, .4);
    YX.addCollider(2.1, 18.2, 1.5, .4);

    // 入口雨棚 + LED + 红灯笼
    scene.add(box(20, .7, 4.4, 0xd9d4c8, 0, 4.9, 21.2));
    const led = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 1.15),
      new THREE.MeshBasicMaterial({ map: T.ledBanner('热烈欢迎校友回家 · 重温上学时光') })
    );
    led.position.set(0, 4.35, 23.45);
    scene.add(led);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xd0342c, roughness: .5, emissive: 0xa02018, emissiveIntensity: .35 });
    for (const lx of [-7, -2.4, 2.4, 7]) {
      const l = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), lanternMat);
      l.position.set(lx, 3.9, 23.2);
      l.scale.y = 1.25;
      scene.add(l);
    }

    // 宣传栏（南面广场边，照片12/26）
    for (const bx of [-28, -20, 20, 28]) {
      scene.add(box(.7, 3.1, 6.2, 0x3e2723, bx, 1.55, 22));
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(5.2, 2.5),
        new THREE.MeshBasicMaterial({ map: T.boardPoster(((bx + 30) / 8) | 0) })
      );
      poster.position.set(bx, 1.85, 25.15);
      scene.add(poster);
      scene.add(box(.7, .4, 6.2, 0x3e2723, bx, 3.2, 22, { cast: false }));
      YX.addCollider(bx, 22, 1.2, 6.4);
    }

    /* ============ 旗台 · 三根旗杆（照片12/14） ============ */
    scene.add(box(12, .5, 7, 0xcfc9bb, 0, .25, 34, { cast: false }));
    scene.add(box(9, .5, 5, 0xd8d3c6, 0, .75, 34, { cast: false }));
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xdadfe4, metalness: .75, roughness: .3 });
    for (const fp of [{ px: -4, ph: 14 }, { px: 0, ph: 17 }, { px: 4, ph: 14 }]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .13, fp.ph, 8), poleMat);
      pole.position.set(fp.px, 1 + fp.ph / 2, 34);
      pole.castShadow = true;
      scene.add(pole);
      YX.addCollider(fp.px, 34, .6, .6);
    }
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 2.1),
      new THREE.MeshBasicMaterial({ map: T.flag(), side: THREE.DoubleSide })
    );
    flag.position.set(1.65, 1 + 17 - 1.7, 34);
    scene.add(flag);
    for (const bf of [{ px: -4, fx: -1.5 }, { px: 4, fx: 1.5 }]) {
      const blueFlag = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.4),
        new THREE.MeshBasicMaterial({ color: 0x7ab8e8, side: THREE.DoubleSide })
      );
      blueFlag.position.set(bf.px + bf.fx, 1 + 14 - 1.3, 34);
      scene.add(blueFlag);
    }
    YX.world.blobShadow(scene, 0, 34, 4.5);

    /* ============ 教师办公楼（照片28：绿圆筒塔+金字+红构架两翼） ============ */
    const offZ = -34;
    const offW = litBox(20, 14, 12, -51, 7, offZ, { floors: 4, bays: 6, braces: true });
    scene.add(offW);
    const offE = litBox(20, 14, 12, -17, 7, offZ, { floors: 4, bays: 6, braces: true });
    scene.add(offE);
    YX.addCollider(-51, offZ, 20, 12);
    YX.addCollider(-17, offZ, 20, 12);
    YX.mapRects.push({ x: -34, z: offZ, w: 74, d: 12 });
    YX.world.baseAO(scene, -34, offZ, 78, 17);
    scene.add(box(20.6, .7, .5, 0xc0392b, -51, 14.4, offZ + 6.1, { cast: false }));
    scene.add(box(20.6, .7, .5, 0xc0392b, -17, 14.4, offZ + 6.1, { cast: false }));
    // 绿圆筒塔 + 金字
    const offTube = new THREE.Mesh(
      new THREE.CylinderGeometry(4.2, 4.2, 17, 20),
      new THREE.MeshStandardMaterial({ color: 0x1c6b45, roughness: .16, metalness: .72, envMapIntensity: 1.5, emissive: 0x0d3b27, emissiveIntensity: .18 })
    );
    offTube.position.set(-34, 8.5, offZ + 6);
    offTube.castShadow = true;
    scene.add(offTube);
    scene.add(box(9.4, .7, .7, 0xc0392b, -34, 17.4, offZ + 6, { cast: false }));
    const offSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 6.4),
      new THREE.MeshBasicMaterial({ map: T.verticalSign('办 公 楼', '#e8c56a'), transparent: true })
    );
    offSign.position.set(-34, 10.5, offZ + 10.35);
    scene.add(offSign);
    hangBanner(scene, '求真务实', -44, 6.5, offZ + 6.15, 0);
    hangBanner(scene, '团结进取', -24, 6.5, offZ + 6.15, 0);
    YX.addCollider(-34, offZ + 6, 9, 9);

    /* ============ 29/30 走廊（教学楼↔办公楼）+ 红钟楼门架 + 圆形外挂楼梯 ============ */
    const link = litBox(6, 12, 28, -34, 6, -12, { floors: 4, bays: 2 });
    scene.add(link);
    YX.addCollider(-34, -12, 6, 28);
    YX.mapRects.push({ x: -34, z: -12, w: 6, d: 28 });
    YX.world.baseAO(scene, -34, -12, 10, 32);
    // 红钟楼门架（金字塔顶，照片29）
    const red = 0xc0392b;
    for (const dx of [-3, 3]) for (const dz of [-3, 3]) {
      scene.add(box(.5, 6, .5, red, -34 + dx, 3, -12 + dz, { cast: false }));
    }
    scene.add(box(7, .5, 7, red, -34, 6.2, -12, { cast: false }));
    const pyramid = new THREE.Mesh(new THREE.ConeGeometry(4.4, 2.6, 4), new THREE.MeshStandardMaterial({ color: red, roughness: .8, flatShading: true }));
    pyramid.rotation.y = Math.PI / 4;
    pyramid.position.set(-34, 7.8, -12);
    pyramid.castShadow = true;
    scene.add(pyramid);
    YX.addCollider(-34, -12, 7.4, 7.4);
    // 圆形外挂楼梯（照片30）
    const stair = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 12, 14, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xe8e6df, roughness: .85, side: THREE.DoubleSide })
    );
    stair.position.set(-27.5, 6, -14);
    scene.add(stair);
    for (let r2 = 0; r2 < 3; r2++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, .06, 6, 20), new THREE.MeshStandardMaterial({ color: 0xcfd3d8 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(-27.5, 3 + r2 * 3.4, -14);
      scene.add(ring);
    }
    YX.addCollider(-27.5, -14, 4.6, 4.6);

    /* ============ 科技实验楼（照片22：绿玻璃塔+金字+SCIENCE BUILDING） ============ */
    const labZ = -34;
    const lab = litBox(28, 16, 14, 50, 8, labZ, { floors: 5, bays: 8, base: '#eef0f2', glass: '#9fc0a8' });
    scene.add(lab);
    YX.addCollider(50, labZ, 28, 14);
    YX.mapRects.push({ x: 50, z: labZ, w: 28, d: 14 });
    YX.world.baseAO(scene, 50, labZ, 33, 19);
    const labTower = new THREE.Mesh(
      new THREE.BoxGeometry(8, 19, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x1f7a4d, roughness: .2, metalness: .7, envMapIntensity: 1.4, emissive: 0x0d3b27, emissiveIntensity: .2 })
    );
    labTower.position.set(50, 9.5, labZ + 7.8);
    labTower.castShadow = true;
    scene.add(labTower);
    const labSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 9),
      new THREE.MeshBasicMaterial({ map: T.verticalSign('科技实验楼', '#e8c56a'), transparent: true })
    );
    labSign.position.set(50, 10.5, labZ + 9.15);
    scene.add(labSign);
    const enSign = new THREE.Mesh(
      new THREE.PlaneGeometry(7, .9),
      new THREE.MeshBasicMaterial({ map: T.ledBanner('SCIENCE BUILDING') })
    );
    enSign.position.set(50, 4.6, labZ + 7.75);
    scene.add(enSign);
    hangBanner(scene, '求实创新', 40, 6.5, labZ + 7.15, 0);
    hangBanner(scene, '勤学善思', 60, 6.5, labZ + 7.15, 0);
    // 走廊联通教学楼与科技实验楼（分布图右侧）
    const eLink = litBox(6, 12, 26, 62, 6, -14, { floors: 4, bays: 2 });
    scene.add(eLink);
    YX.addCollider(62, -14, 6, 26);
    YX.mapRects.push({ x: 62, z: -14, w: 6, d: 26 });
    YX.world.baseAO(scene, 62, -14, 10, 30);

    /* ============ 篮球场群（8个半场，蓝色球架 —— 手绘分布图红框/照片17/21） ============ */
    const courtMatBase = T.court();
    const hoopCols = [0x2a6fb5, 0x2a6fb5];
    function court(cx, cz) {
      const mat = new THREE.MeshStandardMaterial({ map: courtMatBase.clone(), roughness: .95 });
      mat.map.rotation = Math.PI / 2;
      mat.map.center.set(.5, .5);
      mat.map.needsUpdate = true;
      const c = new THREE.Mesh(new THREE.PlaneGeometry(16, 26), mat);
      c.rotation.x = -Math.PI / 2;
      c.position.set(cx, .04, cz);
      c.receiveShadow = true;
      scene.add(c);
      for (const hx of [cx - 6.5, cx + 6.5]) for (const hz of [cz - 10.5, cz + 10.5]) {
        // 蓝色球架（每半场一个）
        scene.add(box(.22, 3.6, .22, 0x2a6fb5, hx, 1.8, hz, { cast: false }));
        const bb = new THREE.Mesh(
          new THREE.PlaneGeometry(1.7, 1.1),
          new THREE.MeshStandardMaterial({ color: 0xf0f0ea, roughness: .7, side: THREE.DoubleSide })
        );
        bb.position.set(hx, 3.35, hz + (hz > cz ? .3 : -.3));
        scene.add(bb);
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(.42, .04, 6, 14),
          new THREE.MeshStandardMaterial({ color: 0xe8632c, roughness: .5 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(hx, 3, hz + (hz > cz ? .9 : -.9));
        scene.add(ring);
      }
    }
    court(-11, -44);
    court(11, -44);
    court(-11, -72);
    court(11, -72);
    YX.mapRects.push({ x: 0, z: -58, w: 44, d: 58 });

    // 主席台红墙（照片21背景，球场北端东侧）
    scene.add(box(12, 1, 5, 0xcfc9bb, 16, .5, -85, { cast: false }));
    scene.add(box(12, 4, .5, 0xa83226, 16, 3, -88, { cast: false }));
    YX.addCollider(16, -88, 12, 1);

    /* ============ 红色桁架拱门（照片11，北端正中） ============ */
    const archX = 0, archZ = -90, archH = 11, archSpan = 13;
    for (const px of [archX - archSpan / 2, archX + archSpan / 2]) {
      scene.add(box(.9, archH, .9, red, px, archH / 2, archZ));
      for (let lv = 1; lv <= 5; lv++) scene.add(box(1.15, .5, 1.15, red, px, archH * lv / 6, archZ, { cast: false }));
      YX.world.blobShadow(scene, px, archZ, 1.7);
      YX.addCollider(px, archZ, 1.3, 1.3);
    }
    scene.add(box(archSpan + 1, .8, 1, red, archX, archH + .4, archZ));
    scene.add(box(archSpan + 1, .6, 1, red, archX, archH - 1.7, archZ, { cast: false }));
    for (let i = 0; i <= 6; i++) {
      const x = archX - archSpan / 2 + i * (archSpan / 6);
      const dg = box(.4, 2.2, .4, red, x, archH - .65, archZ, { cast: false });
      dg.rotation.z = i % 2 ? .55 : -.55;
      scene.add(dg);
    }
    YX.world.pine(scene, -10, -92, 1.3);
    YX.world.pine(scene, 10, -92, 1.2);

    /* ============ 高一教学楼 ×2（2层6间教室，手绘分布图北侧） ============ */
    corridorBuilding(scene, -62, -76, 28, 2, ['勤学善思']);
    corridorBuilding(scene, 62, -76, 28, 2, ['立志成才']);

    /* ============ 自行车棚 + 羽毛球场 + 操场（西侧/东侧各一组） ============ */
    function shed(x, z) {
      scene.add(box(14, .3, 6, 0x3a6ea5, x, 2.7, z, { cast: false }));
      for (const px of [x - 6, x, x + 6]) scene.add(box(.22, 2.7, .22, 0x777f88, px, 1.35, z, { cast: false }));
      YX.addCollider(x, z, 14, 4);
    }
    function badminton(x, z) {
      const c = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), new THREE.MeshStandardMaterial({ color: 0x3c8a52, roughness: 1 }));
      c.rotation.x = -Math.PI / 2;
      c.position.set(x, .04, z);
      c.receiveShadow = true;
      scene.add(c);
      scene.add(box(.1, 1.6, .1, 0x777f88, x, .8, z - 4, { cast: false }));
      scene.add(box(.1, 1.6, .1, 0x777f88, x, .8, z + 4, { cast: false }));
      const net = new THREE.Mesh(
        new THREE.PlaneGeometry(6.5, .8),
        new THREE.MeshBasicMaterial({ color: 0xf0f0ea, transparent: true, opacity: .75, side: THREE.DoubleSide })
      );
      net.position.set(x, 1.2, z);
      scene.add(net);
    }
    shed(-62, -62);
    badminton(-62, -50);
    shed(62, -62);
    badminton(62, -50);
    // 操场（照片16位置：左羽毛球场附近）——水泥乒乓台
    const pg = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshStandardMaterial({ color: 0xb8b2a6, roughness: 1 }));
    pg.rotation.x = -Math.PI / 2;
    pg.position.set(-62, .04, -38);
    pg.receiveShadow = true;
    scene.add(pg);
    for (const px of [-66, -58]) {
      scene.add(box(3, .12, 1.6, 0x8a9a8a, px, .76, -38, { cast: false }));
      scene.add(box(3, .1, .1, 0x6a7a6a, px, .82, -38, { cast: false }));
      scene.add(box(.2, .7, 1.4, 0x8a9a8a, px - 1.2, .35, -38, { cast: false }));
      scene.add(box(.2, .7, 1.4, 0x8a9a8a, px + 1.2, .35, -38, { cast: false }));
    }

    /* ============ 宿舍与食堂（西侧） ============ */
    // 女生宿舍（西北角，无照片，按男生宿舍风格）
    const dormG = litBox(10, 16, 24, -80, 8, -80, { floors: 5, bays: 5, base: '#ecdccb', glass: '#9fc4a8' });
    scene.add(dormG);
    YX.addCollider(-80, -80, 10, 24);
    YX.mapRects.push({ x: -80, z: -80, w: 10, d: 24 });
    YX.world.baseAO(scene, -80, -80, 15, 29);
    // 高二高三男生宿舍（照片15/18）
    const dorm = litBox(12, 17, 40, -92, 8.5, -10, { floors: 5, bays: 9, base: '#ecdccb', glass: '#9fc4a8' });
    scene.add(dorm);
    YX.addCollider(-92, -10, 12, 40);
    YX.mapRects.push({ x: -92, z: -10, w: 12, d: 40 });
    YX.world.baseAO(scene, -92, -10, 17, 45);
    for (let gi = -1; gi <= 1; gi++) {
      const gate = new THREE.Mesh(
        new THREE.PlaneGeometry(3.4, 2.6),
        new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: .35, metalness: .7, side: THREE.DoubleSide })
      );
      gate.rotation.y = Math.PI / 2;
      gate.position.set(-85.94, 1.3, -10 + gi * 6);
      scene.add(gate);
    }
    const thCols = [0xe05a4e, 0xf0b429, 0x4a90d9, 0x57ab6f, 0xe88bb1];
    for (let ti = 0; ti < 6; ti++) {
      const th = new THREE.Mesh(
        new THREE.CylinderGeometry(.11, .11, .5, 8),
        new THREE.MeshStandardMaterial({ color: thCols[ti % 5], roughness: .45 })
      );
      th.position.set(-85.5, .25, -12.5 + ti * .5);
      scene.add(th);
    }
    const dormSign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 8),
      new THREE.MeshBasicMaterial({ map: T.verticalSign('学生公寓'), transparent: true })
    );
    dormSign.rotation.y = Math.PI / 2;
    dormSign.position.set(-85.9, 8, -4);
    scene.add(dormSign);
    YX.world.palm(scene, -83, 6, .75);
    // 食堂（西侧，样子待确认）
    const canteen = litBox(12, 8, 24, -92, 4, 38, { floors: 2, bays: 6, base: '#f2ede2' });
    scene.add(canteen);
    YX.addCollider(-92, 38, 12, 24);
    YX.mapRects.push({ x: -92, z: 38, w: 12, d: 24 });
    YX.world.baseAO(scene, -92, 38, 17, 29);
    const cSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.4), new THREE.MeshBasicMaterial({ map: T.nameSign('食 堂') }));
    cSign.rotation.y = Math.PI / 2;
    cSign.position.set(-85.9, 6.4, 38);
    scene.add(cSign);

    /* ============ 高一男生宿舍（南角，无照片） ============ */
    const dorm1 = litBox(30, 10, 10, -40, 5, 84, { floors: 3, bays: 7, base: '#ecdccb', glass: '#9fc4a8' });
    scene.add(dorm1);
    YX.addCollider(-40, 84, 30, 10);
    YX.mapRects.push({ x: -40, z: 84, w: 30, d: 10 });
    YX.world.baseAO(scene, -40, 84, 35, 15);

    /* ============ 南门：保安亭 + 折叠式电动大门（手绘分布图） ============ */
    for (const px of [-8, 8]) {
      scene.add(box(1.4, 3.4, 1.4, 0xcabfa8, px, 1.7, 95));
      YX.addCollider(px, 95, 1.4, 1.4);
    }
    const slide = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 2),
      new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: .5, metalness: .6, transparent: true, opacity: .85, side: THREE.DoubleSide })
    );
    slide.position.set(-3.5, 1, 95);
    scene.add(slide);
    scene.add(box(4.5, 3.2, 3.5, 0xe8e4da, 12, 1.6, 91));
    scene.add(box(4.9, .4, 3.9, 0x4a6b8a, 12, 3.4, 91, { cast: false }));
    YX.addCollider(12, 91, 4.5, 3.5);

    /* ============ 校训石（主路东侧） ============ */
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.2, 0),
      new THREE.MeshStandardMaterial({ color: 0x8d8f8a, roughness: .95, flatShading: true })
    );
    stone.position.set(16, 1, 70);
    stone.scale.y = .85;
    stone.castShadow = true;
    scene.add(stone);
    const motto = new THREE.Mesh(
      new THREE.PlaneGeometry(4.4, 2.2),
      new THREE.MeshBasicMaterial({ map: T.stoneText(), transparent: true })
    );
    motto.position.set(16, 1.7, 72.05);
    scene.add(motto);
    YX.world.blobShadow(scene, 16, 70, 3.2);
    YX.addCollider(16, 70, 4, 4);

    /* ============ 左花园（大树=world；荷花塘23；凉亭19/24） ============ */
    // 荷花塘（不做水面：干池+卵石缘）
    const pondRim = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, .5, 18), new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 1 }));
    pondRim.position.set(-26, .25, 60);
    scene.add(pondRim);
    const pondBed = new THREE.Mesh(new THREE.CircleGeometry(2.7, 18), new THREE.MeshStandardMaterial({ color: 0x8a7f6a, roughness: 1 }));
    pondBed.rotation.x = -Math.PI / 2;
    pondBed.position.set(-26, .45, 60);
    scene.add(pondBed);
    for (let i = 0; i < 8; i++) {
      const st = new THREE.Mesh(new THREE.SphereGeometry(.22, 6, 5), new THREE.MeshStandardMaterial({ color: 0x8d8f8a, roughness: 1, flatShading: true }));
      const a = i / 8 * Math.PI * 2;
      st.position.set(-26 + Math.cos(a) * 2.9, .5, 60 + Math.sin(a) * 2.9);
      scene.add(st);
    }
    YX.addCollider(-26, 60, 5.6, 5.6);
    // 凉亭（六角亭，红顶）
    const pav = new THREE.Group();
    pav.add(new THREE.Mesh(new THREE.CylinderGeometry(3, 3.3, .5, 6), new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 1 })));
    const pavBase = pav.children[0];
    pavBase.position.y = .25; pavBase.receiveShadow = true;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + Math.PI / 6;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, 3, 8), new THREE.MeshStandardMaterial({ color: 0x6b3a22, roughness: .8 }));
      col.position.set(Math.cos(a) * 2.3, 2, Math.sin(a) * 2.3);
      col.castShadow = true;
      pav.add(col);
    }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.8, 1.9, 6), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .7, flatShading: true }));
    roof.position.y = 4.4;
    roof.castShadow = true;
    pav.add(roof);
    const finial = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe8c56a, roughness: .4, metalness: .5 }));
    finial.position.y = 5.5;
    pav.add(finial);
    pav.position.set(-36, 0, 64);
    scene.add(pav);
    YX.addCollider(-36, 64, 5.6, 5.6);
    YX.world.blobShadow(scene, -36, 64, 4);

    /* ============ 右花园（孔子雕像；蘑菇亭/白顶棚=照片20背景元素） ============ */
    const pedestal = box(1.8, 1.2, 1.8, 0x8d8f8a, 46, .6, 56);
    scene.add(pedestal);
    const robe = new THREE.Mesh(new THREE.ConeGeometry(.85, 2.6, 10), new THREE.MeshStandardMaterial({ color: 0x6f747a, roughness: .95, flatShading: true }));
    robe.position.set(46, 2.4, 56);
    robe.castShadow = true;
    scene.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.34, 10, 8), new THREE.MeshStandardMaterial({ color: 0x7d8288, roughness: .95 }));
    head.position.set(46, 3.9, 56);
    head.castShadow = true;
    scene.add(head);
    const beard = new THREE.Mesh(new THREE.ConeGeometry(.2, .7, 8), new THREE.MeshStandardMaterial({ color: 0xd8d5cc, roughness: 1 }));
    beard.position.set(46, 3.55, 56.18);
    beard.rotation.x = .25;
    scene.add(beard);
    const hands = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .9, 8), new THREE.MeshStandardMaterial({ color: 0x6f747a, roughness: .95 }));
    hands.rotation.z = Math.PI / 2.4;
    hands.position.set(46.28, 2.9, 56.22);
    scene.add(hands);
    YX.world.blobShadow(scene, 46, 56, 2.4);
    YX.addCollider(46, 56, 2, 2);
    // 蘑菇亭
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.5, .65, 2.4, 10), new THREE.MeshStandardMaterial({ color: 0xe8e4da, roughness: .85 }));
    stem.position.set(54, 1.2, 62);
    stem.castShadow = true;
    scene.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(2.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: .8 }));
    cap.position.set(54, 2.3, 62);
    cap.castShadow = true;
    scene.add(cap);
    YX.addCollider(54, 62, 1.6, 1.6);
    // 白顶棚（白色圆顶棚架，照片20）
    for (const dx of [-1.4, 1.4]) for (const dz of [-1.4, 1.4]) {
      scene.add(box(.16, 2.6, .16, 0xf2efe6, 42 + dx, 1.3, 66 + dz, { cast: false }));
    }
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.3, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xf7f5ee, roughness: .7, side: THREE.DoubleSide }));
    dome.position.set(42, 2.6, 66);
    dome.castShadow = true;
    scene.add(dome);
    YX.addCollider(42, 66, 3.4, 3.4);
  }

  return { build };
})();
