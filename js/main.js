// 主程序：ACES 色调映射、黄金时刻光照、IBL 环境光、昼夜过渡、UI、小地图、渲染循环
(function () {

  // ---- 全局共享状态 ----
  YX.colliders = [];      // {x0,x1,z0,z1}
  YX.mapRects = [];       // 小地图建筑矩形
  YX.windowMats = [];     // 夜晚会发光的窗体材质
  YX.lampHeads = [];      // 路灯 {head, glow}
  YX.foliageCards = [];   // 树叶面片（摇曳）
  YX.PHOTO_OK = location.protocol.indexOf('http') === 0; // file:// 下 WebGL 无法读取本地照片

  YX.addCollider = function (x, z, w, d) {
    YX.colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  };

  // ---- 渲染器：ACES 电影级色调映射 ----
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, .1, 6000);

  // ---- 共享纹理（树影 / 光晕 / 楼底 AO）----
  YX.glowTex = YX.textures.glow();
  YX.shadowBlobTex = YX.textures.shadowBlob();
  YX.shadowRectTex = YX.textures.shadowRect();

  // 单文件版：结局页照片走内嵌数据
  if (YX.EMBEDDED_IMAGES) {
    document.getElementById('endImg').src = YX.EMBEDDED_IMAGES.aerial;
  }

  // ---- 黄金时刻光照 ----
  const hemi = new THREE.HemisphereLight(0xcadcf2, 0x8f8062, .38);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffd3a0, 2.4);
  sun.position.set(70, 42, 50);   // 低角度斜阳
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -150; sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -150;
  sun.shadow.camera.far = 400;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0006;
  scene.add(sun);
  const plazaLight = new THREE.PointLight(0xffc98a, 0, 90, 1.6);
  plazaLight.position.set(0, 12, 20);
  scene.add(plazaLight);
  const gateLight = new THREE.PointLight(0xffc98a, 0, 50, 1.6);
  gateLight.position.set(0, 9, 92);
  scene.add(gateLight);

  // ---- 雾 ----
  scene.fog = new THREE.Fog(0xded4c0, 150, 470);

  // ---- 建造世界 ----
  const built = YX.world.build(scene);
  YX.buildings.build(scene);
  YX.memories.init(scene);

  // ---- IBL：由天空穹顶生成环境贴图（玻璃/金属的真实反射）----
  function envFromDome(domeTex) {
    const envScene = new THREE.Scene();
    envScene.add(new THREE.Mesh(
      new THREE.SphereGeometry(100, 32, 20),
      new THREE.MeshBasicMaterial({ map: domeTex, side: THREE.BackSide })
    ));
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(envScene, .04);
    pm.dispose();
    return rt.texture;
  }
  const envDay = envFromDome(built.domeDay.material.map);
  const envNight = envFromDome(built.domeNight.material.map);
  scene.environment = envDay;

  // ---- 控制 ----
  YX.controls.init(camera, canvas);
  YX.controls.onFootstep = () => YX.audio.footstep();

  // ---- 昼夜状态 ----
  let night = false, nightT = 0;
  const DAY = { fog: new THREE.Color(0xded4c0), hemi: .38, sun: 2.4, exp: .98, sunCol: new THREE.Color(0xffd3a0) };
  const NIGHT = { fog: new THREE.Color(0x18253f), hemi: .14, sun: .25, exp: .58, sunCol: new THREE.Color(0x8fa3d9) };

  function setNight(v) {
    night = v;
    YX.memories.toast(v ? '晚自习开始了（再按 N 回到白天）' : '天亮了');
  }

  // ---- UI ----
  const $ = id => document.getElementById(id);
  let started = false, ended = false;

  $('startBtn').addEventListener('click', () => {
    YX.audio.init();
    started = true;
    $('intro').classList.add('hidden');
    $('hud').classList.remove('hidden');
    YX.controls.enabled = true;
    YX.controls.requestLock();
    YX.memories.toast('欢迎回来。校园里散落着 7 段回忆，走近发光的照片，按 E 拾起。');
    setTimeout(() => YX.audio.bell(), 600);
  });

  $('cardClose').addEventListener('click', () => {
    YX.memories.closeCard();
    if (started && !ended) YX.controls.requestLock();
  });

  $('endClose').addEventListener('click', () => {
    ended = false;
    $('ending').classList.add('hidden');
    YX.controls.requestLock();
  });

  YX.memories.onAllCollected = () => {
    ended = true;
    YX.controls.exitLock();
    $('ending').classList.remove('hidden');
    document.body.classList.add('nostalgia');
    YX.audio.ending();
  };

  YX.onLockChange = locked => {
    if (!locked && started && !ended && !YX.memories.cardOpen) {
      $('pause').classList.remove('hidden');
    } else {
      $('pause').classList.add('hidden');
    }
  };

  $('pause').addEventListener('click', () => {
    if (!ended && !YX.memories.cardOpen) YX.controls.requestLock();
  });

  YX.onAction = code => {
    if (!started) return;
    if (code === 'KeyE') {
      if (YX.memories.cardOpen) {
        YX.memories.closeCard();
        if (!ended) YX.controls.requestLock();
      } else if (!ended) {
        const m = YX.memories.nearest(YX.controls.pos);
        if (m) {
          YX.controls.exitLock();
          YX.memories.openCard(m);
        }
      }
    } else if (code === 'KeyN') {
      setNight(!night);
    } else if (code === 'KeyT') {
      document.body.classList.toggle('nostalgia');
      YX.memories.toast(document.body.classList.contains('nostalgia') ? '怀旧滤镜：开' : '怀旧滤镜：关');
    } else if (code === 'KeyM') {
      const mm = $('minimap');
      mm.style.display = mm.style.display === 'none' ? 'block' : 'none';
    }
  };

  // ---- 小地图 ----
  const mm = $('minimap');
  const mmx = mm.getContext('2d');
  function drawMinimap() {
    const W = 200, H = 150;
    const sx = v => (v + 130) / 260 * W;
    const sz = v => (v + 96) / 196 * H;
    mmx.fillStyle = '#cfe3c0';
    mmx.fillRect(0, 0, W, H);
    mmx.fillStyle = '#b9d2a8';
    mmx.fillRect(sx(-130), sz(-96), W, sz(30) - sz(-96));
    mmx.fillStyle = '#8d9aa5';
    for (const r of YX.mapRects) {
      if (r.oval) {
        mmx.beginPath();
        mmx.ellipse(sx(r.x), sz(r.z), r.w / 2 / 260 * W, r.d / 2 / 196 * H, 0, 0, 7);
        mmx.fill();
      } else {
        mmx.fillRect(sx(r.x - r.w / 2), sz(r.z - r.d / 2), r.w / 260 * W, r.d / 196 * H);
      }
    }
    for (const m of YX.memories.markers) {
      mmx.fillStyle = m.done ? '#4caf50' : '#f0b429';
      mmx.beginPath();
      mmx.arc(sx(m.spot.x), sz(m.spot.z), m.done ? 3 : 4, 0, 7);
      mmx.fill();
    }
    const px = sx(YX.controls.pos.x), pz = sz(YX.controls.pos.z);
    const yaw = -camera.rotation.y;
    mmx.save();
    mmx.translate(px, pz);
    mmx.rotate(Math.atan2(-Math.sin(yaw), -Math.cos(yaw)) * -1 + Math.PI);
    mmx.fillStyle = '#1d6fd1';
    mmx.beginPath();
    mmx.moveTo(0, -6); mmx.lineTo(4.5, 5); mmx.lineTo(-4.5, 5);
    mmx.closePath(); mmx.fill();
    mmx.restore();
    mmx.strokeStyle = 'rgba(255,255,255,.5)';
    mmx.strokeRect(.5, .5, W - 1, H - 1);
  }

  // 调试/截图模式：URL 加 #auto 跳过开场画面，#auto-night 直接进入晚自习，
  // #auto-gate 从校门内侧回望，#auto-door 正对教学楼门厅（验证机位）
  if (location.hash.startsWith('#auto')) {
    started = true;
    $('intro').classList.add('hidden');
    $('hud').classList.remove('hidden');
    YX.controls.enabled = true;
    if (location.hash === '#auto-night') { night = true; nightT = 1; }
    if (location.hash === '#auto-gate') YX.controls.setView(0, 66, Math.PI, -.02);
    if (location.hash === '#auto-door') YX.controls.setView(-14, 40, -0.49, -0.06);
  }

  // ---- 主循环 ----
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;

    YX.controls.update(dt);
    YX.memories.update(t);

    // 树叶摇曳
    for (const f of YX.foliageCards) {
      f.mesh.rotation.z = f.base + Math.sin(t * .9 + f.phase) * .035;
    }

    // 交互提示
    if (started && !ended && !YX.memories.cardOpen) {
      const m = YX.memories.nearest(YX.controls.pos);
      document.getElementById('prompt').classList.toggle('hidden', !m);
    } else {
      document.getElementById('prompt').classList.add('hidden');
    }

    // 昼夜过渡
    nightT += ((night ? 1 : 0) - nightT) * Math.min(dt * 1.6, 1);
    scene.fog.color.copy(DAY.fog.clone().lerp(NIGHT.fog, nightT));
    hemi.intensity = DAY.hemi + (NIGHT.hemi - DAY.hemi) * nightT;
    sun.intensity = DAY.sun + (NIGHT.sun - DAY.sun) * nightT;
    sun.color.copy(DAY.sunCol.clone().lerp(NIGHT.sunCol, nightT));
    renderer.toneMappingExposure = DAY.exp + (NIGHT.exp - DAY.exp) * nightT;
    for (const m of YX.windowMats) m.emissiveIntensity = nightT * 1.25;
    for (const l of YX.lampHeads) {
      l.head.material.emissiveIntensity = .05 + nightT * 1.3;
      l.glow.material.opacity = nightT * .95;
    }
    plazaLight.intensity = nightT * 1.5;
    gateLight.intensity = nightT * .9;
    built.stars.material.opacity = nightT;
    built.domeNight.material.opacity = nightT;
    scene.environment = nightT < .5 ? envDay : envNight;

    drawMinimap();
    renderer.render(scene, camera);
  }
  loop();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
