/* Textura de papel/fibras generada una sola vez (barata de pintar después) */
(function () {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');

  // ruido de valor fractal, tileable
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const r = rng(1911);
  function grid(n) { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a; }
  const octs = [4, 8, 16, 32, 64, 128].map(n => ({ n, a: grid(n) }));
  const sm = t => t * t * (3 - 2 * t);
  function sample(o, x, y) {
    const n = o.n, fx = x * n, fy = y * n;
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0);
    const i = (xx, yy) => o.a[((yy % n + n) % n) * n + ((xx % n + n) % n)];
    const a = i(x0, y0), b = i(x0 + 1, y0), cc = i(x0, y0 + 1), d = i(x0 + 1, y0 + 1);
    return a + (b - a) * tx + (cc - a) * ty + (a - b - cc + d) * tx * ty;
  }
  const img = g.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let v = 0, amp = 1, tot = 0;
      for (const o of octs) { v += sample(o, x / S, y / S) * amp; tot += amp; amp *= 0.55; }
      v /= tot;
      const grain = r() * 0.12;
      const val = Math.max(0, Math.min(1, 0.5 + (v - 0.5) * 1.8 + grain - 0.06));
      const k = (i) => (img.data[(y * S + x) * 4 + i]);
      const L = 150 + val * 105;
      img.data[(y * S + x) * 4] = L;
      img.data[(y * S + x) * 4 + 1] = L * 0.93;
      img.data[(y * S + x) * 4 + 2] = L * 0.82;
      img.data[(y * S + x) * 4 + 3] = 255;
      void k;
    }
  }
  g.putImageData(img, 0, 0);
  // fibras
  g.globalAlpha = 0.07;
  for (let i = 0; i < 900; i++) {
    g.strokeStyle = r() < 0.5 ? '#5a3a18' : '#fff3d0';
    g.lineWidth = r() * 1.2 + 0.2;
    g.beginPath();
    const x = r() * S, y = r() * S, a = r() * Math.PI * 2, l = 6 + r() * 22;
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a + .4) * l * .5, y + Math.sin(a + .4) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  const url = c.toDataURL('image/png');
  window.PAPER_URL = url;
  document.documentElement.style.setProperty('--paper', `url(${url})`);
})();
