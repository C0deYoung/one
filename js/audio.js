// WebAudio 合成音效：上下课铃、拾取音、脚步声（无音频文件依赖）
window.YX = window.YX || {};
YX.audio = (function () {

  let ctx = null, master = null;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = .4;
      master.connect(ctx.destination);
    } catch (e) { /* 无音频环境时静默降级 */ }
  }

  function tone(freq, t0, dur, type, vol) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || .2, t0 + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + .05);
  }

  // 电子上下课铃：叮-咚 交替三遍
  function bell() {
    if (!ctx) return;
    const t = ctx.currentTime + .05;
    for (let i = 0; i < 6; i++) {
      tone(i % 2 ? 988 : 784, t + i * .28, .24, 'square', .07);
      tone(i % 2 ? 988 : 784, t + i * .28, .3, 'sine', .09);
    }
  }

  function collect() {
    if (!ctx) return;
    const t = ctx.currentTime + .02;
    tone(660, t, .18, 'sine', .18);
    tone(990, t + .1, .35, 'sine', .16);
  }

  function ending() {
    if (!ctx) return;
    bell();
    const t = ctx.currentTime + 2.1;
    [523, 659, 784, 1047].forEach(f => tone(f, t, 2.6, 'sine', .08));
  }

  function footstep() {
    if (!ctx) return;
    const dur = .07;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 300 + Math.random() * 120;
    const g = ctx.createGain(); g.gain.value = .1;
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
  }

  return { init, bell, collect, ending, footstep };
})();
