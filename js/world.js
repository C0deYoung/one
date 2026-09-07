// 校园环境 v3 —— 按《校园建筑分布图_v2》校友手绘结构布局
// 坐标约定：x 向东，z 向南（北为 -z）。校门在南侧 z≈+94。
window.YX = window.YX || {};
YX.world = (function () {

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

  function baseAO(scene, x, z, w, d) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ map: YX.shadowRectTex, transparent: true, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, .021, z);
    m.renderOrder = 1;
    scene.add(m);
  }

  function blobShadow(scene, x, z, r) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(r * 2, r * 2),
      new THREE.MeshBasicMaterial({ map: YX.shadowBlobTex, transparent: true, opacity: .8, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, .022, z);
    m.renderOrder = 1;
    scene.add(m);
  }

  function hill(scene, x, z, r, h, hueShift) {
    const g = new THREE.SphereGeometry(r, 24, 16);
    const col = new THREE.Color().setHSL(.28 + (hueShift || 0), .3, .26 + Math.random() * .06);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col, roughness: 1, flatShading: true }));
    m.scale.set(1, h / r, 1);
    m.position.set(x, -r * .12, z);
    scene.add(m);
    return { x, z, r, hs: h / r, sink: r * .12 };
  }

  function placePines(scene, hillDef, count) {
    const geo = new THREE.ConeGeometry(1.6, 6, 7);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2a4a30, roughness: 1, flatShading: true });
    const inst = new THREE.InstancedMesh(geo, mat, count);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const t = .35 + Math.random() * .4;
      const d = hillDef.r * Math.sin(t * Math.PI / 2);
      const px = hillDef.x + Math.cos(a) * d;
      const pz = hillDef.z + Math.sin(a) * d;
      const py = hillDef.r * hillDef.hs * Math.cos(t * Math.PI / 2) - hillDef.sink;
      const sc = .7 + Math.random() * .8;
      M.compose(new THREE.Vector3(px, py + 2.4 * sc, pz), q, s.set(sc, sc, sc));
      inst.setMatrixAt(i, M);
    }
    scene.add(inst);
  }

  // 落叶乔木：树皮树干 + 交叉面片树叶
  function tree(scene, x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(.24 * s, .42 * s, 5.2 * s, 9),
      new THREE.MeshStandardMaterial({ map: T.bark(), roughness: 1 })
    );
    trunk.position.y = 2.6 * s;
    trunk.castShadow = true;
    g.add(trunk);
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(.1 * s, .16 * s, 2.6 * s, 7),
      trunk.material
    );
    branch.position.set(1.1 * s, 4.6 * s, .3 * s);
    branch.rotation.z = -.7;
    branch.castShadow = true;
    g.add(branch);

    const leafMat = new THREE.MeshStandardMaterial({ map: T.foliage(), alphaTest: .38, side: THREE.DoubleSide, roughness: 1 });
    for (let i = 0; i < 6; i++) {
      const card = new THREE.Mesh(new THREE.PlaneGeometry(4.8 * s, 3.6 * s), leafMat);
      const a = i / 6 * Math.PI * 2;
      card.position.set(Math.cos(a) * 1.15 * s, (6.1 + (i % 2) * .8) * s, Math.sin(a) * 1.15 * s);
      card.rotation.y = -a;
      card.rotation.z = (Math.random() - .5) * .12;
      card.castShadow = true;
      g.add(card);
      YX.foliageCards.push({ mesh: card, phase: Math.random() * 6.28, base: card.rotation.z });
    }
    g.position.set(x, 0, z);
    scene.add(g);
    blobShadow(scene, x, z, 3.4 * s);
    YX.addCollider(x, z, 1.2 * s, 1.2 * s);
  }

  // 棕榈（花园/宿舍门口）
  function palm(scene, x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(.14 * s, .3 * s, 6.5 * s, 8),
      new THREE.MeshStandardMaterial({ map: T.bark(), roughness: 1 })
    );
    trunk.position.y = 3.25 * s;
    trunk.castShadow = true;
    g.add(trunk);
    const leafMat = new THREE.MeshStandardMaterial({ map: T.foliage('palm'), alphaTest: .35, side: THREE.DoubleSide, roughness: 1 });
    for (let i = 0; i < 7; i++) {
      const card = new THREE.Mesh(new THREE.PlaneGeometry(4.6 * s, 2.3 * s), leafMat);
      const a = i / 7 * Math.PI * 2;
      card.position.set(Math.cos(a) * 1.2 * s, (6.6 + (i % 2) * .25) * s, Math.sin(a) * 1.2 * s);
      card.rotation.y = -a;
      card.rotation.z = -.28 - (i % 3) * .12;
      card.castShadow = true;
      g.add(card);
      YX.foliageCards.push({ mesh: card, phase: Math.random() * 6.28, base: card.rotation.z });
    }
    g.position.set(x, 0, z);
    scene.add(g);
    blobShadow(scene, x, z, 2.2 * s);
    YX.addCollider(x, z, 1 * s, 1 * s);
  }

  // 松树
  function pine(scene, x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(.14 * s, .24 * s, 1.6 * s, 7),
      new THREE.MeshStandardMaterial({ color: 0x6e4f35, roughness: 1 })
    );
    trunk.position.y = .8 * s;
    g.add(trunk);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2c5e33, roughness: 1, flatShading: true });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((1.7 - i * .45) * s, 2.4 * s, 8), mat);
      cone.position.y = (2.4 + i * 1.35) * s;
      cone.castShadow = true;
      g.add(cone);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    blobShadow(scene, x, z, 1.6 * s);
    YX.addCollider(x, z, 1.2 * s, 1.2 * s);
  }

  // 修剪灌木
  function bush(scene, x, z, s) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(1 * s, 9, 7),
      new THREE.MeshStandardMaterial({ color: 0x3d6630, roughness: 1, flatShading: true })
    );
    m.scale.y = .75;
    m.position.set(x, .55 * s, z);
    m.castShadow = true;
    scene.add(m);
    blobShadow(scene, x, z, 1.4 * s);
    YX.addCollider(x, z, 1.8 * s, 1.8 * s);
  }

  function lamp(scene, x, z, registry) {
    const g = new THREE.Group();
    g.add(box(.2, 6.4, .2, 0x4d565e, 0, 3.2, 0, { cast: false, rough: .6, metal: .5 }));
    g.add(box(1.3, .12, .12, 0x4d565e, .55, 6.35, 0, { cast: false, metal: .5, rough: .6 }));
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(.42, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xffca6a, emissiveIntensity: .05, roughness: .4 })
    );
    head.position.set(1.1, 6.3, 0);
    g.add(head);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: YX.glowTex, color: 0xffc76a, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    glow.scale.set(3.4, 3.4, 1);
    glow.position.set(1.1, 6.3, 0);
    g.add(glow);
    registry.push({ head, glow });
    g.position.set(x, 0, z);
    g.rotation.y = Math.atan2(-x, -z) + Math.PI;
    scene.add(g);
    blobShadow(scene, x, z, 1.1);
  }

  function build(scene) {
    // ---- 天空穹顶 ----
    const skyDayTex = T.skyDome(false), skyNightTex = T.skyDome(true);
    const domeGeo = new THREE.SphereGeometry(3000, 32, 20);
    const domeDay = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ map: skyDayTex, side: THREE.BackSide, fog: false }));
    const domeNight = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({
      map: skyNightTex, side: THREE.BackSide, fog: false,
      transparent: true, opacity: 0, depthWrite: false
    }));
    domeNight.renderOrder = -1;
    scene.add(domeDay);
    scene.add(domeNight);

    // ---- 地面 ----
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(560, 560),
      new THREE.MeshStandardMaterial({ map: T.grass(), roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    function pave(w, d, x, z, map, rx, rz) {
      const mat = new THREE.MeshStandardMaterial({ map: map || T.pavement(), roughness: .96 });
      if (rx) mat.map = map.clone();
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
      p.rotation.x = -Math.PI / 2;
      p.position.set(x, .03, z);
      p.receiveShadow = true;
      scene.add(p);
    }
    pave(56, 34, 0, 44);                          // 前广场
    pave(88, 10, 0, 13, T.redBrick());            // 教学楼前红砖铺装
    pave(10, 66, 0, 58, T.asphalt());             // 主路（校门→广场）
    pave(8, 106, -78, 12, T.asphalt());           // 西路（宿舍/食堂）
    pave(8, 56, 72, -12, T.asphalt());            // 东路（实验楼）
    pave(8, 36, -62, -56, T.pavement());          // 西北支路（高一教学楼A区）
    pave(8, 36, 62, -56, T.pavement());           // 东北支路（高一教学楼B区）
    pave(20, 12, -30, 62, T.cellBrick());         // 左花园蜂窝砖停车区
    pave(24, 16, 46, 58, T.cellBrick());          // 右花园蜂窝砖步道
    pave(2.2, 16, -20, 50, T.redBrick());         // 花园红砖小径
    pave(44, 58, 0, -58, T.pavement());           // 篮球场群地坪

    // ---- 主路标线：中线虚线 + 校门口斑马线 ----
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xd8d6c8, roughness: 1 });
    for (let z = 30; z < 88; z += 7) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(.28, 2.6), lineMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, .045, z);
      scene.add(dash);
    }
    for (let i = -4; i <= 4; i++) {
      const zebra = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 4.2), lineMat);
      zebra.rotation.x = -Math.PI / 2;
      zebra.position.set(i * 1.35, .045, 88);
      scene.add(zebra);
    }

    // ---- 围墙（校门留口）----
    const fence = 0x9aa5ad;
    function wall(w, d, x, z) { scene.add(box(w, 2.4, d, fence, x, 1.2, z, { cast: false })); YX.addCollider(x, z, w, d); }
    wall(210, .4, 0, -96);
    wall(.4, 196, -102, 0);
    wall(.4, 196, 102, 0);
    wall(94, .4, -55, 96);
    wall(94, .4, 55, 96);

    // ---- 群山 ----
    const hills = [];
    hills.push(hill(scene, -70, -170, 85, 52, 0));
    hills.push(hill(scene, 60, -185, 100, 62, .01));
    hills.push(hill(scene, 170, -140, 80, 44, -.015));
    hills.push(hill(scene, -180, -60, 75, 40, .02));
    hills.push(hill(scene, -175, 90, 90, 48, 0));
    hills.push(hill(scene, 185, 60, 85, 46, .01));
    hills.push(hill(scene, -60, 200, 95, 42, .015));
    hills.push(hill(scene, 110, 205, 85, 50, -.01));
    const ridge = hill(scene, 0, -150, 70, 34, .005);
    placePines(scene, ridge, 90);
    placePines(scene, hills[1], 40);
    function tower(x, z, y) {
      const g = new THREE.Group();
      g.add(box(1, 16, 1, 0x8a939b, 0, 8, 0, { cast: false }));
      g.add(box(5, .5, .5, 0x8a939b, 0, 12, 0, { cast: false }));
      g.add(box(.5, .5, 5, 0x8a939b, 0, 9, 0, { cast: false }));
      const dish = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8dde2 }));
      dish.position.set(0, 15.5, 0); dish.scale.y = .55;
      g.add(dish);
      g.position.set(x, y, z);
      scene.add(g);
    }
    tower(-38, -152, 21);
    tower(52, -155, 24);

    // ---- 树木（沿路/墙内散植；花园大树在左园）----
    tree(scene, -34, 52, 2.2);      // 左花园大树（回忆点4）
    tree(scene, -12, 66, 2.4);
    tree(scene, 14, 72, 1.6);
    tree(scene, 30, 66, 1.7);
    tree(scene, -52, 76, 1.8);
    tree(scene, 44, 78, 1.6);
    tree(scene, -66, 40, 1.8);
    tree(scene, 66, 44, 1.7);
    tree(scene, -94, 62, 1.8);
    tree(scene, 94, 66, 1.7);
    tree(scene, -94, -52, 1.9);
    tree(scene, 94, -48, 1.8);
    tree(scene, -70, -14, 1.6);
    tree(scene, 56, 60, 1.5);

    // ---- 花坛 ----
    function flowerbed(x, z) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.2, .6, 16), new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 1 }));
      ring.position.set(x, .3, z); ring.receiveShadow = true; scene.add(ring);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, .55, 16), new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 1 }));
      soil.position.set(x, .32, z); scene.add(soil);
      const cols = [0xe05a4e, 0xf0b429, 0xe88bb1, 0xffffff];
      for (let i = 0; i < 8; i++) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(.22, 6, 5), new THREE.MeshStandardMaterial({ color: cols[i % 4], roughness: .8 }));
        const a = i / 8 * Math.PI * 2;
        f.position.set(x + Math.cos(a) * 1.7, .75, z + Math.sin(a) * 1.7);
        scene.add(f);
      }
      YX.addCollider(x, z, 5.6, 5.6);
    }
    flowerbed(-22, 36);
    flowerbed(22, 52);

    // ---- 左花园（大树/荷花塘/凉亭由 buildings 建；这里放棕榈灌木）----
    palm(scene, -24, 58, 1);
    bush(scene, -38, 54, 1.2);
    bush(scene, -24, 68, 1.1);
    // ---- 右花园（石榴花灌丛）----
    bush(scene, 40, 52, 1.3);
    bush(scene, 54, 50, 1.1);
    bush(scene, 58, 66, 1.2);

    // ---- 路灯 ----
    lamp(scene, -7, 78, YX.lampHeads);
    lamp(scene, 7, 78, YX.lampHeads);
    lamp(scene, -7, 46, YX.lampHeads);
    lamp(scene, 7, 46, YX.lampHeads);
    lamp(scene, -7, 24, YX.lampHeads);
    lamp(scene, 7, 24, YX.lampHeads);
    lamp(scene, -78, -16, YX.lampHeads);
    lamp(scene, -78, 34, YX.lampHeads);
    lamp(scene, 72, -30, YX.lampHeads);
    lamp(scene, -24, -34, YX.lampHeads);
    lamp(scene, 24, -34, YX.lampHeads);

    // ---- 星空 ----
    const starGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i < 1100; i++) {
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI * .48, r = 2500;
      pts.push(r * Math.cos(e) * Math.cos(a), 60 + r * Math.sin(e), r * Math.cos(e) * Math.sin(a));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xcfe0ff, size: 1.8, transparent: true, opacity: 0, sizeAttenuation: false, fog: false, depthWrite: false }));
    scene.add(stars);

    return { domeDay, domeNight, stars };
  }

  return { build, baseAO, blobShadow, palm, pine };
})();
