// 回忆点玩法：校园里 7 段回忆，走近按 E 拾起，看老照片卡片
window.YX = window.YX || {};
YX.memories = (function () {

  const T = YX.textures;

  const SPOTS = [
    {
      id: '01', icon: '🎒', x: 0, z: 84,
      title: '开学报到', time: '九月 · 校门口',
      text: '开学那天，爸爸扛着被褥，妈妈在后头拎着网兜，搪瓷缸子磕在铁架床上当啷一响。你在校门口回头，他们还在朝里张望。从这一天起，"郧西"两个字，就成了每周五下午五点半的那趟班车。'
    },
    {
      id: '02', icon: '🚩', x: 4, z: 29,
      title: '升旗仪式', time: '周一 · 清晨',
      text: '周一早上六点四十，喇叭里放国歌，学校背后山梁上的雾还没散。校长讲话的声音从大喇叭里传出来，惊起一片麻雀。值周生举着本子沿队伍走过，谁弯了背、谁小声说话，都记在那本薄薄的册子上。'
    },
    {
      id: '03', icon: '📋', x: 24, z: 28,
      title: '光荣榜', time: '月考后 · 午间',
      text: '月考成绩贴出来的那个中午，宣传栏前围了一层又一层人。你踮着脚从后往前找自己的名字，找到了，心里那块石头才落了地。前面有人小声念着名次，你竖着耳朵听，眼睛假装看别处。'
    },
    {
      id: '04', icon: '🌳', x: -34, z: 56,
      title: '课间十分钟', time: '上午 · 花园大树下',
      text: '下课铃一响，楼梯间全是脚步声。这棵树下打过水仗、背过文言文、分过一包干脆面。上课铃再响时总有人喊"最后回去的带一壶水"，于是人人都磨磨蹭蹭，想当那个被派去小卖部的。'
    },
    {
      id: '05', icon: '🏃', x: 0, z: -82,
      title: '通往球场的路', time: '体育课 · 上午',
      text: '穿过这道红色的门就是篮球场。课间操的音乐一响，队伍排得歪歪扭扭。体育课最怕听到"你们体育老师有事，这节课上数学"——数学老师夹着卷子走进来的时候，全班的叹气声能掀翻屋顶。'
    },
    {
      id: '06', icon: '🏀', x: 0, z: -50,
      title: '放学后的球场', time: '傍晚 · 球场',
      text: '傍晚的球场被夕阳切成两半，球鞋摩擦水泥地的声音特别响。球场磕破过膝盖，也接住过整个少年时代的欢呼。场边总坐着几个写作业的身影——那个等你一起回家的人，你现在还记得吗？'
    },
    {
      id: '07', icon: '📖', x: 16, z: 18,
      title: '教室与晚自习', time: '夜里 · 教学楼',
      text: '早读的声音从一楼漫到五楼，英语单词和文言文混在一起。黑板上角的高考倒计时，从三位数被擦成两位数，再变成孤零零的"1"。晚自习的灯一盏一盏亮起来，笔尖沙沙的，谁都不敢先抬头。按 N 看看晚自习的样子。'
    }
  ];

  let markers = [];      // {spot, sprite, ring, done}
  let collected = 0;
  let cardOpen = false;
  let onAllCollected = null;

  function init(scene) {
    const texQ = T.markerSprite(false);
    const texDone = T.markerSprite(true);
    SPOTS.forEach(spot => {
      const g = new THREE.Group();
      // 发光地面圆环
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.1, 1.5, 32),
        new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: .75, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = .06;
      g.add(ring);
      // 悬浮照片
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texQ, transparent: true }));
      sprite.scale.set(1.6, 1.6, 1);
      sprite.position.y = 2.4;
      g.add(sprite);
      g.position.set(spot.x, 0, spot.z);
      scene.add(g);
      markers.push({ spot, group: g, sprite, ring, done: false, texQ, texDone });
    });
  }

  // 找到玩家附近的回忆点；found 未收集的优先
  function nearest(pos) {
    let best = null, bestD = 3.4;
    for (const m of markers) {
      const dx = pos.x - m.spot.x, dz = pos.z - m.spot.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < bestD) { bestD = d; best = m; }
    }
    return best;
  }

  function openCard(m, imgFallbackIcon) {
    cardOpen = true;
    document.getElementById('cardTitle').textContent = m.spot.title;
    document.getElementById('cardTime').textContent = m.spot.time;
    document.getElementById('cardText').textContent = m.spot.text;
    document.getElementById('cardFallback').textContent = imgFallbackIcon || m.spot.icon;
    const img = document.getElementById('cardImg');
    // 若用户在 assets/memories/ 放了同名老照片（01.jpg ... 07.jpg），自动展示
    img.style.display = 'none';
    img.onload = () => {
      img.style.display = 'block';
      document.getElementById('cardFallback').style.display = 'none';
    };
    img.onerror = () => {
      img.style.display = 'none';
      document.getElementById('cardFallback').style.display = 'block';
    };
    img.src = 'assets/memories/' + m.spot.id + '.jpg?t=' + Date.now();
    document.getElementById('card').classList.remove('hidden');
    if (!m.done) {
      m.done = true;
      collected++;
      document.getElementById('count').textContent = collected;
      m.sprite.material.map = m.texDone;
      m.ring.material.color.set(0x8fd19e);
      YX.audio.collect();
      toast('已拾起回忆 ' + collected + ' / 7');
      if (collected === SPOTS.length && onAllCollected) {
        setTimeout(onAllCollected, 1200);
      }
    }
  }

  function closeCard() {
    cardOpen = false;
    document.getElementById('card').classList.add('hidden');
  }

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.classList.add('hidden'), 600); }, 2400);
  }

  function update(t) {
    for (const m of markers) {
      m.sprite.position.y = 2.4 + Math.sin(t * 1.8 + m.spot.x) * .25;
      m.group.rotation.y = t * .6;
      const s = m.done ? 1.3 : 1.6 + Math.sin(t * 3) * .08;
      m.sprite.scale.set(s, s, 1);
    }
  }

  return { SPOTS, init, nearest, openCard, closeCard, toast, update,
    get markers() { return markers; },
    get cardOpen() { return cardOpen; },
    set onAllCollected(fn) { onAllCollected = fn; } };
})();
