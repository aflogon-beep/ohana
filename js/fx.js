/* Partículas: polvo ambiental, chispas, confeti y fuegos artificiales */
window.FX = (function () {
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- Polvo dorado ambiental ---------- */
  const dc = document.getElementById('dust'), dg = dc.getContext('2d');
  let motes = [];
  function sizeDust() {
    dc.width = innerWidth * DPR; dc.height = innerHeight * DPR;
    const n = Math.round(innerWidth * innerHeight / 14000);
    motes = Array.from({ length: n }, () => ({
      x: Math.random() * dc.width, y: Math.random() * dc.height,
      r: (Math.random() * 1.8 + 0.4) * DPR, vx: (Math.random() - 0.5) * 0.15 * DPR, vy: -(Math.random() * 0.25 + 0.05) * DPR,
      p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.005
    }));
  }
  sizeDust();
  addEventListener('resize', () => { sizeDust(); sizeFx(); });
  function drawDust() {
    dg.clearRect(0, 0, dc.width, dc.height);
    for (const m of motes) {
      m.p += m.s; m.x += m.vx + Math.sin(m.p) * 0.2; m.y += m.vy;
      if (m.y < -10) { m.y = dc.height + 10; m.x = Math.random() * dc.width; }
      const a = 0.25 + Math.sin(m.p * 1.7) * 0.25 + 0.25;
      const gr = dg.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 4);
      gr.addColorStop(0, `rgba(255,225,150,${a})`); gr.addColorStop(1, 'rgba(255,200,100,0)');
      dg.fillStyle = gr; dg.beginPath(); dg.arc(m.x, m.y, m.r * 4, 0, 6.283); dg.fill();
    }
  }

  /* ---------- Capa de efectos ---------- */
  const c = document.getElementById('fx'), g = c.getContext('2d');
  function sizeFx() { c.width = innerWidth * DPR; c.height = innerHeight * DPR; }
  sizeFx();
  let parts = [], rockets = [], fireworksOn = false, fwTimer = 0;

  function sparks(x, y, n = 18, opt = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (opt.speed || 6) * (0.4 + Math.random());
      parts.push({
        x: x * DPR, y: y * DPR, vx: Math.cos(a) * v * DPR, vy: Math.sin(a) * v * DPR - (opt.up || 2) * DPR,
        life: 1, decay: 0.012 + Math.random() * 0.02, size: (opt.size || 2.5) * (0.5 + Math.random()) * DPR,
        color: opt.colors ? opt.colors[i % opt.colors.length] : `hsl(${40 + Math.random() * 15},100%,${60 + Math.random() * 30}%)`,
        g: (opt.gravity ?? 0.18) * DPR, type: 'spark', drag: 0.97
      });
    }
  }
  function confetti(n = 160) {
    const cols = ['#f2c24b', '#fff3c0', '#e8414a', '#3fa7d6', '#ffffff', '#ff8ac6', '#7bd389'];
    for (let i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * c.width, y: -20 * DPR - Math.random() * c.height * 0.5,
        vx: (Math.random() - 0.5) * 3 * DPR, vy: (Math.random() * 2 + 2) * DPR,
        life: 1, decay: 0.0018, size: (6 + Math.random() * 6) * DPR, color: cols[i % cols.length],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, g: 0.02 * DPR, type: 'confetti', drag: 0.995, wob: Math.random() * 6
      });
    }
  }
  function burst(x, y, shape) {
    const hue = Math.random() * 360;
    const pal = [`hsl(${hue},100%,65%)`, `hsl(${(hue + 40) % 360},100%,75%)`, '#fff6d8'];
    const push = (vx, vy, col) => parts.push({ x, y, vx, vy, life: 1, decay: 0.009 + Math.random() * 0.008, size: 2.6 * DPR, color: col, g: 0.04 * DPR, type: 'spark', drag: 0.975, trail: true });
    if (shape === 'ears') {
      // tres círculos: cabeza y dos orejas
      [[0, 0, 1], [-0.95, -0.95, 0.62], [0.95, -0.95, 0.62]].forEach(([ox, oy, k], j) => {
        const n = Math.round(48 * k);
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2, v = 4.2 * DPR;
          push((ox + Math.cos(a) * k) * v, (oy + Math.sin(a) * k) * v, pal[j ? 1 : 0]);
        }
      });
    } else if (shape === 'heart') {
      for (let i = 0; i < 70; i++) {
        const t = i / 70 * Math.PI * 2;
        const hx = 16 * Math.sin(t) ** 3, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        push(hx * 0.32 * DPR, hy * 0.32 * DPR, i % 2 ? '#ff5d8f' : '#ffc2d6');
      }
    } else {
      const n = 90;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = (Math.random() ** 0.5) * 7 * DPR;
        push(Math.cos(a) * v, Math.sin(a) * v, pal[i % 3]);
      }
    }
    // destello
    parts.push({ x, y, vx: 0, vy: 0, life: 1, decay: 0.06, size: 70 * DPR, color: pal[0], g: 0, type: 'flash', drag: 1 });
    if (window.Sound) Sound.play('boom');
  }
  function launch() {
    const x = (0.12 + Math.random() * 0.76) * c.width;
    const r = Math.random();
    rockets.push({ x, y: c.height, vx: (Math.random() - 0.5) * 1.5 * DPR, vy: -(10 + Math.random() * 4) * DPR, ty: (0.12 + Math.random() * 0.3) * c.height, shape: r < 0.28 ? 'ears' : r < 0.42 ? 'heart' : 'round' });
  }
  function startFireworks() { fireworksOn = true; }
  function stopFireworks() { fireworksOn = false; }

  function drawFx() {
    g.clearRect(0, 0, c.width, c.height);
    if (fireworksOn && --fwTimer <= 0) { launch(); fwTimer = 35 + Math.random() * 55; }
    g.globalCompositeOperation = 'lighter';
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += 0.12 * DPR;
      parts.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * DPR, vy: DPR, life: 0.7, decay: 0.04, size: 2 * DPR, color: '#ffd38a', g: 0, type: 'spark', drag: 0.9 });
      if (r.y <= r.ty || r.vy >= 0) { burst(r.x, r.y, r.shape); rockets.splice(i, 1); }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      if (p.life <= 0 || p.y > c.height + 40) { parts.splice(i, 1); continue; }
      if (p.type === 'confetti') {
        g.globalCompositeOperation = 'source-over';
        p.rot += p.vr; p.wob += 0.1;
        g.save(); g.translate(p.x + Math.sin(p.wob) * 8, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.wob * 1.3));
        g.fillStyle = p.color; g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); g.restore();
        g.globalCompositeOperation = 'lighter';
      } else if (p.type === 'flash') {
        const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gr.addColorStop(0, `rgba(255,255,240,${p.life * 0.8})`); gr.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.size, 0, 6.283); g.fill();
      } else {
        g.globalAlpha = Math.max(0, p.life);
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.size * (0.4 + p.life * 0.6), 0, 6.283); g.fill();
        if (p.trail) { g.globalAlpha *= 0.4; g.beginPath(); g.arc(p.x - p.vx * 2, p.y - p.vy * 2, p.size * 0.6, 0, 6.283); g.fill(); }
        g.globalAlpha = 1;
      }
    }
    g.globalCompositeOperation = 'source-over';
  }

  let frame = 0;
  (function loop() {
    frame++;
    if (frame % 2 === 0 || parts.length) drawDust();
    drawFx();
    requestAnimationFrame(loop);
  })();

  return { sparks, confetti, burst, startFireworks, stopFireworks };
})();
