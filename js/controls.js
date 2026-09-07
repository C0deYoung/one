// 第一人称控制：指针锁定 + WASD + 简易碰撞
window.YX = window.YX || {};
YX.controls = (function () {

  let yaw = 0, pitch = -0.05;
  let locked = false;
  let enabled = false;
  const pos = new THREE.Vector3(0, 0, 80); // 从校门内出发
  const keys = {};
  let bobT = 0, stepT = 0;
  let camera = null;
  let onFootstep = null;

  const PLAYER_R = 0.6;
  const EYE = 1.7;

  function init(cam, domElement) {
    camera = cam;
    camera.rotation.order = 'YXZ';

    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'KeyE' || e.code === 'KeyN' || e.code === 'KeyT' || e.code === 'KeyM') {
        YX.onAction && YX.onAction(e.code);
      }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    document.addEventListener('pointerlockchange', () => {
      locked = document.pointerLockElement === domElement;
      YX.onLockChange && YX.onLockChange(locked);
    });

    document.addEventListener('mousemove', e => {
      if (!locked || !enabled) return;
      yaw -= e.movementX * 0.0022;
      pitch -= e.movementY * 0.0022;
      pitch = Math.max(-1.45, Math.min(1.45, pitch));
    });
  }

  function requestLock() {
    const cv = document.getElementById('game');
    if (cv.requestPointerLock) cv.requestPointerLock();
  }
  function exitLock() { document.exitPointerLock && document.exitPointerLock(); }

  function collide(p) {
    for (const c of YX.colliders) {
      const nx = Math.max(c.x0, Math.min(p.x, c.x1));
      const nz = Math.max(c.z0, Math.min(p.z, c.z1));
      const dx = p.x - nx, dz = p.z - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < PLAYER_R * PLAYER_R) {
        if (d2 < 1e-8) {
          const pl = p.x - c.x0, pr = c.x1 - p.x, pt = p.z - c.z0, pb = c.z1 - p.z;
          const m = Math.min(pl, pr, pt, pb);
          if (m === pl) p.x = c.x0 - PLAYER_R;
          else if (m === pr) p.x = c.x1 + PLAYER_R;
          else if (m === pt) p.z = c.z0 - PLAYER_R;
          else p.z = c.z1 + PLAYER_R;
        } else {
          const d = Math.sqrt(d2);
          p.x = nx + dx / d * PLAYER_R;
          p.z = nz + dz / d * PLAYER_R;
        }
      }
    }
    p.x = Math.max(-127, Math.min(127, p.x));
    p.z = Math.max(-93, Math.min(97, p.z));
  }

  function update(dt) {
    const run = keys['ShiftLeft'] || keys['ShiftRight'];
    const speed = (run ? 10.5 : 5.5) * dt;
    let mx = 0, mz = 0;
    if (enabled && locked) {
      if (keys['KeyW'] || keys['ArrowUp']) mz -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) mz += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    }
    const moving = mx !== 0 || mz !== 0;
    if (moving) {
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      // yaw=0 时朝 -z；前向 / 右向按 yaw 旋转
      const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      pos.x += (fx * -mz + rx * mx) * speed;
      pos.z += (fz * -mz + rz * mx) * speed;
      collide(pos);
      bobT += dt * (run ? 11 : 7.5);
      stepT += dt;
      if (stepT > (run ? .32 : .46)) { stepT = 0; onFootstep && onFootstep(); }
    } else {
      bobT += dt * 1.2;
      stepT = .3;
    }
    camera.position.set(pos.x, EYE + Math.sin(bobT) * (moving ? .055 : .012), pos.z);
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
  }

  return {
    init, update, requestLock, exitLock,
    set enabled(v) { enabled = v; }, get enabled() { return enabled; },
    set onFootstep(fn) { onFootstep = fn; },
    get pos() { return pos; },
    get locked() { return locked; },
    setView(x, z, y, p) { pos.x = x; pos.z = z; yaw = y; pitch = p; }
  };
})();
