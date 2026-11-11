/* Motor de sonido: música y efectos sintetizados con Web Audio (sin archivos) */
window.Sound = (function () {
  let ctx, master, musicBus, sfxBus, wet;
  let enabled = true;
  try { enabled = localStorage.getItem('ohana-sound') !== 'off'; } catch (e) {}
  let timer = null, mood = null, step = 0, nextTime = 0, cycle = 0;

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = enabled ? 0.9 : 0;
    master.connect(comp); comp.connect(ctx.destination);

    // reverberación generada
    const conv = ctx.createConvolver();
    const len = ctx.sampleRate * 3.2, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    conv.buffer = ir;
    wet = ctx.createGain(); wet.gain.value = 0.32;
    conv.connect(wet); wet.connect(master);

    musicBus = ctx.createGain(); musicBus.gain.value = 0.55;
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9;
    musicBus.connect(master); musicBus.connect(conv);
    sfxBus.connect(master); sfxBus.connect(conv);
  }

  function noiseBuf() {
    if (noiseBuf.b) return noiseBuf.b;
    const b = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuf.b = b);
  }
  function env(g, t, a, peak, dec, sus = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + dec);
  }

  /* ---------- Instrumentos ---------- */
  function pad(notes, t, dur, lvl = 0.035, bus = musicBus) {
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(lvl, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(lvl * 0.8, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.6);
    f.connect(g); g.connect(bus);
    notes.forEach(m => [-7, 7].forEach(cents => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = cents;
      o.connect(f); o.start(t); o.stop(t + dur + 0.7);
    }));
  }
  function pluck(m, t, lvl = 0.09, bus = musicBus) {
    const g = ctx.createGain(); env(g, t, 0.005, lvl, 0.55);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3500, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.4);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = mtof(m + 12);
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(bus);
    o.start(t); o2.start(t); o.stop(t + 0.7); o2.stop(t + 0.7);
  }
  function bass(m, t, dur, lvl = 0.16) {
    const g = ctx.createGain(); env(g, t, 0.02, lvl, dur, 0.02);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m);
    const s = ctx.createOscillator(); s.type = 'sine'; s.frequency.value = mtof(m - 12);
    o.connect(g); s.connect(g); g.connect(musicBus);
    o.start(t); s.start(t); o.stop(t + dur + 0.1); s.stop(t + dur + 0.1);
  }
  function drum(t, big = true, bus = musicBus, lvl = 1) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(big ? 120 : 160, t); o.frequency.exponentialRampToValueAtTime(big ? 42 : 70, t + 0.3);
    const g = ctx.createGain(); env(g, t, 0.004, (big ? 0.55 : 0.25) * lvl, big ? 0.7 : 0.3);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.9);
    const n = ctx.createBufferSource(); n.buffer = noiseBuf();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = big ? 180 : 400; f.Q.value = 0.8;
    const gn = ctx.createGain(); env(gn, t, 0.002, (big ? 0.25 : 0.12) * lvl, 0.18);
    n.connect(f); f.connect(gn); gn.connect(bus); n.start(t); n.stop(t + 0.3);
  }
  function shaker(t, lvl = 0.025) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf();
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
    const g = ctx.createGain(); env(g, t, 0.003, lvl, 0.06);
    n.connect(f); f.connect(g); g.connect(musicBus); n.start(t, Math.random()); n.stop(t + 0.1);
  }
  function bell(m, t, lvl = 0.08, bus = sfxBus, dec = 2.4) {
    [[1, 1], [2.76, 0.4], [5.4, 0.18], [8.93, 0.08]].forEach(([r, a]) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m) * r;
      const g = ctx.createGain(); env(g, t, 0.003, lvl * a, dec / r ** 0.4);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + dec + 0.2);
    });
  }
  function lead(m, t, dur, lvl = 0.06, type = 'sine', bus = musicBus) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = mtof(m);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;
    const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.012, t + dur * 0.6);
    lfo.connect(lg); lg.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = type === 'sawtooth' ? 2200 : 5000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(lvl, t + 0.06);
    g.gain.setValueAtTime(lvl, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    o.connect(f); f.connect(g); g.connect(bus);
    o.start(t); lfo.start(t); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3);
  }
  function noiseSweep(t, dur, from, to, lvl = 0.2, bus = sfxBus, type = 'bandpass') {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf(); n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(lvl, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(bus); n.start(t); n.stop(t + dur + 0.05);
  }

  /* ---------- Música ---------- */
  const SONGS = {
    aventura: {
      bpm: 86,
      chords: [[50, 53, 57], [50, 53, 58], [48, 52, 55], [49, 52, 57]],
      bass: [38, 34, 36, 33],
      mel: [
        [62, 0, 0, 65, 69, 0, 67, 65], [70, 0, 69, 0, 65, 0, 0, 0],
        [67, 0, 64, 67, 72, 0, 70, 69], [69, 0, 0, 0, 0, 0, 0, 0]
      ],
      leadType: 'sine'
    },
    fiesta: {
      bpm: 112,
      chords: [[50, 54, 57], [49, 52, 57], [50, 54, 59], [50, 55, 59]],
      bass: [38, 33, 35, 31],
      mel: [
        [69, 0, 74, 0, 78, 0, 76, 74], [76, 0, 0, 73, 69, 0, 0, 0],
        [71, 0, 74, 0, 78, 0, 79, 78], [76, 0, 74, 0, 71, 0, 74, 0]
      ],
      leadType: 'sawtooth'
    }
  };

  function scheduleStep(s, t, e) {
    const bar = Math.floor(s / 8) % 4, beat = s % 8;
    const chord = s_.chords[bar];
    if (beat === 0) {
      pad(chord, t, e * 8, s_ === SONGS.fiesta ? 0.03 : 0.035);
      bass(s_.bass[bar], t, e * 3);
      drum(t, true);
      if (bar === 0) cycle++;
    }
    if (beat === 4) bass(s_.bass[bar], t, e * 2, 0.11);
    if (beat === 5) drum(t, false);
    if (beat === 6 && s_ === SONGS.fiesta) drum(t, false);
    if (beat === 7 && bar === 3) drum(t, false);
    const arpIdx = [0, 1, 2, 1, 0, 2, 1, 2][beat];
    pluck(chord[arpIdx] + 12 + (beat === 6 ? 12 : 0), t, 0.06);
    shaker(t, beat % 2 ? 0.015 : 0.025);
    const phrase = cycle % 4;
    if (phrase === 2 || phrase === 3 || s_ === SONGS.fiesta) {
      const n = s_.mel[bar][beat];
      if (n) {
        let len = 1; while (beat + len < 8 && !s_.mel[bar][beat + len]) len++;
        lead(n, t, e * len * 0.95, s_ === SONGS.fiesta ? 0.045 : 0.055, s_.leadType);
      }
    }
    if (s_ === SONGS.fiesta && beat % 2 === 0 && Math.random() < 0.5) bell(chord[Math.floor(Math.random() * 3)] + 24, t, 0.02, musicBus, 1.2);
  }
  let s_ = SONGS.aventura;

  function tick() {
    const e = 60 / s_.bpm / 2;
    while (nextTime < ctx.currentTime + 0.35) {
      scheduleStep(step, nextTime, e);
      nextTime += e; step++;
    }
  }
  function music(name) {
    init(); if (!ctx) return;
    if (mood === name) return;
    mood = name; s_ = SONGS[name];
    if (timer) clearInterval(timer);
    step = 0; cycle = 0; nextTime = ctx.currentTime + 0.15;
    timer = setInterval(tick, 90);
  }
  function stopMusic() { if (timer) clearInterval(timer); timer = null; mood = null; }

  /* ---------- Efectos ---------- */
  const fx = {
    click() { const t = ctx.currentTime; pluck(81, t, 0.08, sfxBus); },
    key() { const t = ctx.currentTime; pluck(88 + Math.floor(Math.random() * 5), t, 0.03, sfxBus); },
    wrong() {
      const t = ctx.currentTime;
      [0, 0.18].forEach((d, i) => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(i ? 41 : 44);
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        const g = ctx.createGain(); env(g, t + d, 0.01, 0.18, 0.35);
        o.connect(f); f.connect(g); g.connect(sfxBus); o.start(t + d); o.stop(t + d + 0.5);
      });
      drum(t, true, sfxBus, 0.8);
    },
    correct() {
      const t = ctx.currentTime;
      [74, 78, 81, 86, 90].forEach((m, i) => bell(m, t + i * 0.09, 0.09));
      noiseSweep(t, 1.6, 2000, 12000, 0.06, sfxBus, 'highpass');
      drum(t, true, sfxBus, 0.9);
    },
    reveal() {
      const t = ctx.currentTime;
      noiseSweep(t, 1.4, 300, 6000, 0.12);
      [62, 69, 74, 78, 81].forEach((m, i) => bell(m, t + 1.3 + i * 0.05, 0.07, sfxBus, 3));
      pad([62, 66, 69, 74], t + 1.3, 2.4, 0.05, sfxBus);
    },
    turn() { const t = ctx.currentTime; [76, 81, 88].forEach((m, i) => bell(m, t + i * 0.1, 0.08, sfxBus, 1.2)); },
    hint() { const t = ctx.currentTime; for (let i = 0; i < 7; i++) bell(84 + Math.floor(Math.random() * 12), t + i * 0.06, 0.035); },
    pick() { const t = ctx.currentTime; noiseSweep(t, 0.22, 600, 2500, 0.06); },
    snap() {
      const t = ctx.currentTime;
      drum(t, false, sfxBus, 0.8);
      bell(81, t + 0.02, 0.08); bell(88, t + 0.08, 0.05);
    },
    mapDone() {
      const t = ctx.currentTime;
      [62, 66, 69, 74, 78, 81, 86].forEach((m, i) => bell(m, t + i * 0.11, 0.07, sfxBus, 3));
      pad([50, 57, 62, 66], t, 3, 0.06, sfxBus);
    },
    knock(n, total) {
      const t = ctx.currentTime, p = n / total;
      const nn = ctx.createBufferSource(); nn.buffer = noiseBuf();
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 260 + p * 500; f.Q.value = 5;
      const g = ctx.createGain(); env(g, t, 0.002, 0.5, 0.12);
      nn.connect(f); f.connect(g); g.connect(sfxBus); nn.start(t, Math.random()); nn.stop(t + 0.2);
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(140 + p * 160, t); o.frequency.exponentialRampToValueAtTime(70 + p * 80, t + 0.12);
      const go = ctx.createGain(); env(go, t, 0.002, 0.35, 0.15);
      o.connect(go); go.connect(sfxBus); o.start(t); o.stop(t + 0.2);
      if (p > 0.5) bell(60 + Math.round(p * 30), t, 0.015 * p, sfxBus, 0.6);
    },
    chain() {
      const t = ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const tt = t + i * 0.07 + Math.random() * 0.03;
        [1, 2.37, 3.91, 5.6].forEach(r => {
          const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = (900 + Math.random() * 500) * r / 2;
          const g = ctx.createGain(); env(g, tt, 0.001, 0.025, 0.25);
          o.connect(g); g.connect(sfxBus); o.start(tt); o.stop(tt + 0.3);
        });
      }
      drum(t, true, sfxBus, 1);
      noiseSweep(t, 0.4, 3000, 800, 0.15);
    },
    unlock() {
      const t = ctx.currentTime;
      noiseSweep(t, 2.2, 200, 9000, 0.25);
      for (let i = 0; i < 16; i++) drum(t + i * (0.13 - i * 0.004), i % 4 === 0, sfxBus, 0.5 + i * 0.03);
      const T = t + 2.1;
      drum(T, true, sfxBus, 1.6);
      [50, 57, 62, 66, 69, 74].forEach(m => lead(m, T, 2.8, 0.05, 'sawtooth', sfxBus));
      [86, 90, 93, 98].forEach((m, i) => bell(m, T + i * 0.08, 0.08, sfxBus, 4));
    },
    boom() {
      const t = ctx.currentTime;
      drum(t, true, sfxBus, 0.5 + Math.random() * 0.4);
      const n = ctx.createBufferSource(); n.buffer = noiseBuf();
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500;
      const g = ctx.createGain(); env(g, t, 0.003, 0.12, 0.6);
      n.connect(f); f.connect(g); g.connect(sfxBus); n.start(t, Math.random()); n.stop(t + 0.8);
      for (let i = 0; i < 10; i++) { // chisporroteo
        const tt = t + 0.35 + Math.random() * 0.9;
        const c = ctx.createBufferSource(); c.buffer = noiseBuf();
        const hf = ctx.createBiquadFilter(); hf.type = 'highpass'; hf.frequency.value = 4000;
        const cg = ctx.createGain(); env(cg, tt, 0.001, 0.04, 0.03);
        c.connect(hf); hf.connect(cg); cg.connect(sfxBus); c.start(tt, Math.random()); c.stop(tt + 0.05);
      }
    },
    fanfare() {
      const t = ctx.currentTime, e = 0.16;
      [[62, 0, 1], [62, 1, 1], [62, 2, 1], [69, 3, 5], [67, 8, 1], [69, 9, 1], [74, 10, 8]].forEach(([m, s, l]) => {
        lead(m, t + s * e, l * e, 0.07, 'sawtooth', sfxBus);
        lead(m - 12, t + s * e, l * e, 0.04, 'sawtooth', sfxBus);
      });
      drum(t + 10 * e, true, sfxBus, 1.4);
      [74, 78, 81, 86].forEach((m, i) => bell(m, t + 10 * e + i * 0.06, 0.06, sfxBus, 4));
    }
  };

  return {
    init,
    music,
    stopMusic,
    play(name, ...a) { try { init(); if (ctx && enabled) fx[name](...a); } catch (e) { console.warn(e); } },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('ohana-sound', enabled ? 'on' : 'off'); } catch (e) {}
      if (master) master.gain.setTargetAtTime(enabled ? 0.9 : 0, ctx.currentTime, 0.1);
      return enabled;
    },
    get enabled() { return enabled; }
  };
})();
