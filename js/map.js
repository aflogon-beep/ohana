/* Mapa del tesoro dibujado en SVG + geometría de las piezas del puzzle */
window.MapArt = (function () {
  const W = 1200, H = 800, COLS = 3, ROWS = 2, CW = W / COLS, CH = H / ROWS;
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#3a2312', RED = '#9b1c12';

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const f1 = n => Math.round(n * 10) / 10;

  function smoothClosed(p) {
    let d = `M${f1(p[0][0])},${f1(p[0][1])}`;
    for (let i = 0; i < p.length; i++) {
      const p0 = p[(i - 1 + p.length) % p.length], p1 = p[i], p2 = p[(i + 1) % p.length], p3 = p[(i + 2) % p.length];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
    }
    return d + 'Z';
  }
  function smoothOpen(p) {
    let d = `M${p[0][0]},${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[Math.max(i - 1, 0)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(i + 2, p.length - 1)];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${p2[0]},${p2[1]}`;
    }
    return d;
  }
  function blob(cx, cy, rx, ry, n, amp, seed) {
    const R = rng(seed), ph = [0, 0, 0, 0, 0, 0].map(() => R() * 6.283);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      let k = 1;
      for (let h = 2; h <= 7; h++) k += amp / (h * 0.7) * Math.sin(h * a + ph[h - 2]);
      k += (R() - 0.5) * amp * 0.35;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return smoothClosed(pts);
  }

  /* ---------- Rosa de los vientos ---------- */
  function compassRose(cx, cy, r, opt = {}) {
    const dark = opt.dark || INK, light = opt.light || '#f3e2b5', accent = opt.accent || RED, gold = opt.gold;
    let s = `<g transform="translate(${cx},${cy})">`;
    s += `<circle r="${r * 0.98}" fill="none" stroke="${dark}" stroke-width="${r * 0.025}"/>`;
    s += `<circle r="${r * 0.9}" fill="none" stroke="${dark}" stroke-width="${r * 0.012}"/>`;
    for (let i = 0; i < 64; i++) {
      const a = i / 64 * Math.PI * 2, l = i % 8 === 0 ? 0.12 : i % 2 ? 0.04 : 0.07;
      s += `<line x1="${f1(Math.cos(a) * r * 0.9)}" y1="${f1(Math.sin(a) * r * 0.9)}" x2="${f1(Math.cos(a) * r * (0.9 - l))}" y2="${f1(Math.sin(a) * r * (0.9 - l))}" stroke="${dark}" stroke-width="${r * 0.012}"/>`;
    }
    s += `<circle r="${r * 0.62}" fill="none" stroke="${dark}" stroke-width="${r * 0.01}" stroke-dasharray="${r * 0.03} ${r * 0.03}"/>`;
    const star = (n, len, wid, rot, fillA, fillB) => {
      let o = '';
      for (let i = 0; i < n; i++) {
        const a = rot + i / n * 360;
        o += `<g transform="rotate(${a})"><path d="M0,${-len} L${wid},0 L0,0Z" fill="${fillA}" stroke="${dark}" stroke-width="${r * 0.008}"/><path d="M0,${-len} L${-wid},0 L0,0Z" fill="${fillB}" stroke="${dark}" stroke-width="${r * 0.008}"/></g>`;
      }
      return o;
    };
    s += star(8, r * 0.55, r * 0.06, 22.5, light, dark);
    s += star(4, r * 0.72, r * 0.1, 45, light, dark);
    s += star(4, r * 0.95, r * 0.13, 0, gold || light, dark);
    s += `<circle r="${r * 0.07}" fill="${accent}" stroke="${dark}" stroke-width="${r * 0.01}"/>`;
    if (!opt.noLabel) s += `<text y="${-r * 1.06}" text-anchor="middle" font-family="Cinzel Decorative, serif" font-weight="900" font-size="${r * 0.26}" fill="${accent}">N</text>`;
    return s + '</g>';
  }

  /* ---------- Elementos del mapa ---------- */
  function mountain(x, y, s, R) {
    const peak = [x + (R() - 0.5) * s * 0.3, y - s * 1.25];
    let o = `<path d="M${x - s},${y} L${f1(peak[0])},${f1(peak[1])} L${x + s},${y}" fill="#d9bf87" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    // sombreado
    for (let i = 1; i < 7; i++) {
      const t = i / 7;
      const ax = peak[0] + (x + s - peak[0]) * t, ay = peak[1] + (y - peak[1]) * t;
      o += `<line x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(ax - s * 0.25 * (1 - t) - 4)}" y2="${f1(ay + s * 0.25)}" stroke="${INK}" stroke-width="1.2" opacity=".7"/>`;
    }
    // nieve
    const sx = s * 0.36;
    o += `<path d="M${f1(peak[0] - sx * 0.8)},${f1(peak[1] + s * 0.42)} L${f1(peak[0])},${f1(peak[1])} L${f1(peak[0] + sx * 0.8)},${f1(peak[1] + s * 0.42)} l-8,-6 l-7,9 l-8,-8 l-7,7z" fill="#fbf6ea" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
    return o;
  }
  function tree(x, y, s) {
    return `<path d="M${x},${y} v${-s * 0.5}" stroke="${INK}" stroke-width="1.6"/><path d="M${x - s * 0.5},${y - s * 0.4} Q${x},${y - s * 2} ${x + s * 0.5},${y - s * 0.4} Z" fill="#8e9a5b" stroke="${INK}" stroke-width="1.5"/>`;
  }
  function palm(x, y, s, flip) {
    const k = flip ? -1 : 1;
    let o = `<path d="M${x},${y} q${k * s * 0.3},${-s} ${k * s * 0.15},${-s * 1.8}" fill="none" stroke="${INK}" stroke-width="2.2"/>`;
    const tx = x + k * s * 0.15, ty = y - s * 1.8;
    [-150, -110, -60, -20, 20].forEach(a => {
      const r = a * Math.PI / 180;
      o += `<path d="M${tx},${ty} q${f1(Math.cos(r - 0.4) * s * 0.6)},${f1(Math.sin(r - 0.4) * s * 0.6 - s * 0.2)} ${f1(Math.cos(r) * s)},${f1(Math.sin(r) * s + s * 0.35)}" fill="none" stroke="#4d6b2a" stroke-width="3" stroke-linecap="round"/>`;
    });
    return o;
  }
  function waves(R, avoid) {
    let o = '';
    for (let i = 0; i < 70; i++) {
      const x = 50 + R() * (W - 100), y = 50 + R() * (H - 100);
      if (avoid(x, y)) continue;
      const s = 9 + R() * 7;
      o += `<path d="M${f1(x)},${f1(y)} q${f1(s / 2)},${f1(-s / 2)} ${f1(s)},0 q${f1(s / 2)},${f1(-s / 2)} ${f1(s)},0" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`;
    }
    return o;
  }
  function label(x, y, txt, size = 22, rot = 0) {
    return `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" text-anchor="middle" font-family="IM Fell English, serif" font-style="italic" font-size="${size}" fill="${INK}" stroke="#efdcab" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${txt}</text>`;
  }

  const SPOTS = [
    { x: 300, y: 300, name: 'Cueva del Invierno' },
    { x: 520, y: 232, name: 'Trono de los Bostezos' },
    { x: 815, y: 262, name: 'Lago Blanco' },
    { x: 975, y: 470, name: 'Remolino del Cíclope' },
    { x: 745, y: 600, name: 'Reino de Bolsillo' },
    { x: 395, y: 575, name: 'Guardián de los Sueños' }
  ];
  const X = { x: 600, y: 425 };

  function trailD() {
    const p = [[SPOTS[0].x + 30, SPOTS[0].y + 30], [430, 300], [SPOTS[1].x + 10, SPOTS[1].y + 40], [680, 230], [SPOTS[2].x - 40, SPOTS[2].y + 50],
      [900, 360], [SPOTS[3].x - 50, SPOTS[3].y + 10], [880, 560], [SPOTS[4].x + 10, SPOTS[4].y - 50], [560, 610], [SPOTS[5].x + 50, SPOTS[5].y - 40],
      [470, 470], [X.x - 30, X.y + 10]];
    return smoothOpen(p);
  }

  function buildArt() {
    const R = rng(2026);
    const cx = 600, cy = 420, rx = 455, ry = 292;
    const island = blob(cx, cy, rx, ry, 40, 0.13, 19);
    let s = '';
    // papel
    s += `<rect width="${W}" height="${H}" fill="url(#mParch)"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#mNoise)" style="mix-blend-mode:multiply" opacity=".55"/>`;
    // retícula de navegación
    for (let i = 1; i < 6; i++) s += `<line x1="${i * 200}" y1="20" x2="${i * 200}" y2="${H - 20}" stroke="${INK}" stroke-width=".8" opacity=".12"/>`;
    for (let i = 1; i < 4; i++) s += `<line x1="20" y1="${i * 200}" x2="${W - 20}" y2="${i * 200}" stroke="${INK}" stroke-width=".8" opacity=".12"/>`;
    // líneas de rumbo desde la rosa
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      s += `<line x1="1075" y1="675" x2="${f1(1075 + Math.cos(a) * 1500)}" y2="${f1(675 + Math.sin(a) * 1500)}" stroke="${i % 2 ? RED : INK}" stroke-width=".9" opacity=".14"/>`;
    }
    // olas
    s += waves(R, (x, y) => (((x - cx) / (rx * 1.22)) ** 2 + ((y - cy) / (ry * 1.25)) ** 2 < 1) || (x < 420 && y < 150) || (x > 960 && y > 560));
    // costa con líneas de agua
    [1.13, 1.09, 1.055, 1.025].forEach((k, i) => {
      s += `<path d="${island}" transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})" fill="none" stroke="#5d7f7b" stroke-width="${1.2 + i * 0.3}" opacity="${0.18 + i * 0.1}" vector-effect="non-scaling-stroke"/>`;
    });
    s += `<path d="${island}" fill="url(#mLand)" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    s += `<path d="${island}" fill="url(#mNoise)" style="mix-blend-mode:multiply" opacity=".25"/>`;
    // islotes
    [[160, 170, 38, 26, 5], [1090, 300, 30, 20, 8], [230, 680, 26, 16, 11], [1010, 720, 22, 14, 3]].forEach(([x, y, a, b, sd]) => {
      const d = blob(x, y, a, b, 14, 0.2, sd);
      s += `<path d="${d}" transform="translate(${x} ${y}) scale(1.25) translate(${-x} ${-y})" fill="none" stroke="#5d7f7b" stroke-width="1.2" opacity=".35" vector-effect="non-scaling-stroke"/>`;
      s += `<path d="${d}" fill="url(#mLand)" stroke="${INK}" stroke-width="2.4"/>`;
    });

    // montañas (cueva del invierno)
    [[225, 320, 42], [262, 290, 50], [340, 300, 56], [395, 330, 36], [290, 345, 34], [195, 370, 30]].forEach(([x, y, z]) => s += mountain(x, y, z, R));
    s += `<path d="M282,340 q18,-36 36,0 z" fill="#2a170a" stroke="${INK}" stroke-width="2"/>`;
    s += `<g fill="#fbfbff" opacity=".9">${[0, 1, 2, 3, 4].map(i => `<circle cx="${270 + i * 14}" cy="${246 + (i % 2) * 10}" r="2.2"/>`).join('')}</g>`;
    // bosques
    const forest = (x0, y0, n, spread) => { let o = ''; for (let i = 0; i < n; i++) o += tree(f1(x0 + (R() - 0.5) * spread), f1(y0 + (R() - 0.5) * spread * 0.6), 14 + R() * 6); return o; };
    s += forest(640, 320, 9, 110) + forest(500, 470, 8, 90) + forest(860, 380, 6, 80) + forest(560, 680, 5, 80) + forest(290, 470, 7, 100);
    // palmeras en la costa
    s += palm(200, 520, 26) + palm(232, 548, 22, true) + palm(1000, 290, 24, true) + palm(870, 690, 26) + palm(660, 150, 22);

    // 1 · Cueva (montañas ya dibujadas) — 2 · Trono
    s += `<g transform="translate(520 232)">
      <path d="M-26,18 v-48 q26,-30 52,0 v48" fill="#b0773a" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-18,-26 q18,-18 36,0" fill="none" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="0" cy="-34" r="4" fill="${RED}" stroke="${INK}" stroke-width="1.2"/>
      <rect x="-34" y="8" width="68" height="14" rx="4" fill="#8e1b12" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-34,10 v-14 h-8 v26 M34,10 v-14 h8 v26" fill="none" stroke="${INK}" stroke-width="2.5"/>
      <path d="M-28,22 v18 M28,22 v18" stroke="${INK}" stroke-width="3"/></g>`;
    // 3 · Lago
    s += `<g transform="translate(815 262)">
      <ellipse rx="78" ry="42" fill="#a9c3bd" stroke="${INK}" stroke-width="2.5"/>
      <ellipse rx="78" ry="42" fill="url(#mNoise)" style="mix-blend-mode:multiply" opacity=".3"/>
      ${[0.75, 0.5, 0.26].map(k => `<ellipse rx="${78 * k}" ry="${42 * k}" fill="none" stroke="#fdfbf3" stroke-width="1.4" opacity=".75"/>`).join('')}
      <path d="M-10,-4 l10,-14 l10,14 z" fill="#f3e2b5" stroke="${INK}" stroke-width="1.5"/><path d="M-14,-4 h28 l-5,7 h-18z" fill="#7a4a1f" stroke="${INK}" stroke-width="1.5"/></g>`;
    // 4 · Remolino
    let sp = 'M975,470';
    for (let th = 0.3; th < Math.PI * 6.2; th += 0.25) sp += ` L${f1(975 + Math.cos(th) * th * 3.1)},${f1(470 + Math.sin(th) * th * 2.4)}`;
    s += `<ellipse cx="975" cy="470" rx="70" ry="54" fill="#a9c3bd" stroke="${INK}" stroke-width="2.2"/>`;
    s += `<path d="${sp}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<circle cx="975" cy="470" r="9" fill="#21140a"/><circle cx="975" cy="470" r="4" fill="#fdfbf3"/>`;
    // 5 · Reino de bolsillo (torre)
    s += `<g transform="translate(745 600)">
      <path d="M-24,30 v-62 h-6 v-14 h10 v8 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v-8 h10 v14 h-6 v62 z" fill="#cdb38a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M-8,30 v-16 q8,-12 16,0 v16" fill="#2a170a"/>
      <rect x="-5" y="-26" width="10" height="14" rx="5" fill="#2a170a"/>
      <path d="M0,-46 v-30" stroke="${INK}" stroke-width="2.2"/><path d="M0,-76 l30,8 l-30,8 z" fill="${RED}" stroke="${INK}" stroke-width="1.6"/>
      ${[-16, -2, 12].map(x => `<path d="M${x},${-8} h6 M${x},${4} h6" stroke="${INK}" stroke-width="1" opacity=".6"/>`).join('')}</g>`;
    // 6 · Guardián de los sueños (luna)
    s += `<g transform="translate(395 575)">
      <path d="M8,-44 A44,44 0 1 0 8,44 A34,44 0 1 1 8,-44 Z" fill="#f6e3a1" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="-14" cy="-6" r="3" fill="${INK}" opacity=".5"/><circle cx="-20" cy="16" r="5" fill="${INK}" opacity=".18"/>
      ${[[40, -34, 9], [56, 4, 6], [34, 30, 7]].map(([x, y, r]) => `<path d="M${x},${y - r} L${x + r * 0.3},${y - r * 0.3} L${x + r},${y} L${x + r * 0.3},${y + r * 0.3} L${x},${y + r} L${x - r * 0.3},${y + r * 0.3} L${x - r},${y} L${x - r * 0.3},${y - r * 0.3}Z" fill="#f6e3a1" stroke="${INK}" stroke-width="1.4"/>`).join('')}
      <text x="-62" y="-30" font-family="IM Fell English" font-style="italic" font-size="20" fill="${INK}">z</text><text x="-76" y="-46" font-family="IM Fell English" font-style="italic" font-size="26" fill="${INK}">z</text></g>`;

    // sendero y X
    s += `<path id="mTrail" d="${trailD()}" fill="none" stroke="${RED}" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round" opacity=".9"/>`;
    s += `<g class="map-x"><path d="M${X.x - 26},${X.y - 26} L${X.x + 26},${X.y + 26} M${X.x + 26},${X.y - 26} L${X.x - 26},${X.y + 26}" stroke="#2a0c06" stroke-width="18" stroke-linecap="round"/>
           <path d="M${X.x - 26},${X.y - 26} L${X.x + 26},${X.y + 26} M${X.x + 26},${X.y - 26} L${X.x - 26},${X.y + 26}" stroke="${RED}" stroke-width="11" stroke-linecap="round"/></g>`;

    // etiquetas
    s += label(300, 395, 'Cueva del Invierno Eterno');
    s += label(520, 300, 'Trono de los Mil Bostezos');
    s += label(815, 335, 'Lago Blanco');
    s += label(975, 555, 'Remolino del Cíclope');
    s += label(745, 660, 'Reino de Bolsillo');
    s += label(395, 650, 'Guardián de los Sueños');
    s += label(600, 485, 'Aquí yace el Tesoro', 26);
    s += label(150, 470, 'Mar de las Medias Perdidas', 20, -72);
    s += label(1110, 420, 'Océano Ohana', 24, 78);

    // barco
    s += `<g transform="translate(1040 120)">
      <path d="M-62,40 Q0,70 62,40 L52,58 Q0,78 -52,58 Z" fill="#7a4a1f" stroke="${INK}" stroke-width="2.4"/>
      <path d="M-20,40 V-40 M18,40 V-56" stroke="${INK}" stroke-width="2.6"/>
      <path d="M-46,-32 Q-20,-20 6,-32 L4,30 Q-20,20 -44,30 Z" fill="#f6ebcf" stroke="${INK}" stroke-width="2"/>
      <path d="M-6,-48 Q18,-36 44,-48 L42,24 Q18,14 -4,24 Z" fill="#f6ebcf" stroke="${INK}" stroke-width="2"/>
      <path d="M18,-56 l22,6 l-22,6z" fill="${RED}"/>
      <path d="M-80,66 q10,-8 20,0 q10,-8 20,0 M50,70 q10,-8 20,0 q10,-8 20,0" fill="none" stroke="${INK}" stroke-width="1.6"/></g>`;
    // serpiente marina
    s += `<g transform="translate(110 690)" fill="#6f8f6a" stroke="${INK}" stroke-width="2.4">
      <path d="M0,0 q16,-40 32,0 z"/><path d="M44,0 q16,-48 34,0 z"/><path d="M92,0 q10,-30 22,0 z"/>
      <path d="M-24,4 q-6,-56 18,-58 q20,0 14,18 q-6,10 -16,4 l-4,40 z"/><circle cx="-2" cy="-48" r="3" fill="${INK}"/>
      <path d="M-40,8 q10,-6 20,0 q10,-6 20,0 q10,-6 20,0 q10,-6 20,0 q10,-6 20,0 q10,-6 20,0 q10,-6 20,0 q10,-6 20,0" fill="none" stroke-width="1.6"/></g>`;

    // cartela de título
    s += `<g transform="translate(225 85)">
      <path d="M-180,-42 h360 q-20,42 0,84 h-360 q20,-42 0,-84z" fill="#f3e2b5" stroke="${INK}" stroke-width="2.6"/>
      <path d="M-170,-34 h340 q-16,34 0,68 h-340 q16,-34 0,-68z" fill="none" stroke="${INK}" stroke-width="1"/>
      <text y="-8" text-anchor="middle" font-family="Cinzel, serif" font-weight="700" font-size="15" letter-spacing="4" fill="${INK}">MAPA DE LA EXPEDICIÓN</text>
      <text y="26" text-anchor="middle" font-family="Cinzel Decorative, serif" font-weight="900" font-size="34" fill="${RED}">Isla Ohana</text></g>`;
    // rosa de los vientos
    s += compassRose(1075, 675, 88);

    // marco
    s += `<rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${INK}" stroke-width="3"/>`;
    s += `<rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${INK}" stroke-width="1"/>`;
    for (let i = 0; i < 60; i++) { const x = 24 + i * (W - 48) / 60; s += `<rect x="${f1(x)}" y="14" width="${f1((W - 48) / 120)}" height="10" fill="${INK}" opacity=".85"/><rect x="${f1(x)}" y="${H - 24}" width="${f1((W - 48) / 120)}" height="10" fill="${INK}" opacity=".85"/>`; }
    // pliegues
    [400, 800].forEach(x => s += `<rect x="${x - 10}" y="0" width="20" height="${H}" fill="url(#mFoldV)"/>`);
    s += `<rect x="0" y="${H / 2 - 10}" width="${W}" height="20" fill="url(#mFoldH)"/>`;
    // bordes quemados
    s += `<rect width="${W}" height="${H}" fill="url(#mBurn)"/>`;
    return s;
  }

  /* ---------- Piezas ---------- */
  const HS = [[1, -1, 1]];          // aristas horizontales internas (fila 0 → 1)
  const VS = [[-1, 1], [1, -1]];    // aristas verticales internas por fila
  const TAB = [[0.36, 0], [0.42, 0], [0.43, 0.05], [0.4, 0.09], [0.35, 0.16], [0.39, 0.24], [0.5, 0.24], [0.61, 0.24], [0.65, 0.16], [0.6, 0.09], [0.57, 0.05], [0.58, 0], [0.64, 0]];
  function edge(x1, y1, x2, y2, s) {
    if (!s) return `L${x2},${y2}`;
    const dx = x2 - x1, dy = y2 - y1, nx = dy, ny = -dx;
    const P = ([t, h]) => `${f1(x1 + dx * t + nx * h * s)},${f1(y1 + dy * t + ny * h * s)}`;
    let d = `L${P(TAB[0])}`;
    for (let i = 1; i < 13; i += 3) d += `C${P(TAB[i])} ${P(TAB[i + 1])} ${P(TAB[i + 2])}`;
    return d + `L${x2},${y2}`;
  }
  const pieces = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const x0 = c * CW, y0 = r * CH, x1 = x0 + CW, y1 = y0 + CH;
    const top = r === 0 ? 0 : -HS[r - 1][c];
    const bottom = r === ROWS - 1 ? 0 : HS[r][c];
    const left = c === 0 ? 0 : -VS[r][c - 1];
    const right = c === COLS - 1 ? 0 : VS[r][c];
    const d = `M${x0},${y0}` + edge(x0, y0, x1, y0, top) + edge(x1, y0, x1, y1, right) + edge(x1, y1, x0, y1, bottom) + edge(x0, y1, x0, y0, left) + 'Z';
    pieces.push({ d, x0, y0, r, c });
  }

  function build() {
    const defs = document.querySelector('#globalDefs defs');
    const html = `
      <radialGradient id="mParch" cx="50%" cy="45%" r="75%">
        <stop offset="0" stop-color="#f7e9c4"/><stop offset=".55" stop-color="#ecd5a0"/><stop offset=".85" stop-color="#d4af6e"/><stop offset="1" stop-color="#a87a3c"/></radialGradient>
      <radialGradient id="mLand" cx="50%" cy="45%" r="60%">
        <stop offset="0" stop-color="#e8d7a6"/><stop offset=".8" stop-color="#d7bd82"/><stop offset="1" stop-color="#c3a265"/></radialGradient>
      <radialGradient id="mBurn" cx="50%" cy="50%" r="72%">
        <stop offset=".72" stop-color="#5a2e0a" stop-opacity="0"/><stop offset=".93" stop-color="#5a2e0a" stop-opacity=".35"/><stop offset="1" stop-color="#2c1404" stop-opacity=".8"/></radialGradient>
      <linearGradient id="mFoldV"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".48" stop-color="#5a3510" stop-opacity=".12"/><stop offset=".52" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="mFoldH" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".48" stop-color="#5a3510" stop-opacity=".12"/><stop offset=".52" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <pattern id="mNoise" width="512" height="512" patternUnits="userSpaceOnUse"><image href="${window.PAPER_URL}" width="512" height="512"/></pattern>
      <g id="mapArt">${buildArt()}</g>
      ${pieces.map((p, i) => `<clipPath id="pc${i}"><path d="${p.d}"/></clipPath>`).join('')}
      <radialGradient id="cGold" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff3c0"/><stop offset=".5" stop-color="#f2c24b"/><stop offset="1" stop-color="#8a5510"/></radialGradient>
      <symbol id="compassIcon" viewBox="-50 -50 100 100">${compassRose(0, 0, 44, { dark: '#f2c24b', light: '#3a2312', accent: '#ff6a3d', noLabel: true })}</symbol>`;
    defs.insertAdjacentHTML('beforeend', html);
  }

  // SVG de una pieza aislada (para la revelación)
  function pieceSVG(i, glow = true) {
    const p = pieces[i], m = 110;
    return `<svg viewBox="${p.x0 - m} ${p.y0 - m} ${CW + m * 2} ${CH + m * 2}" xmlns="${NS}">
      <g clip-path="url(#pc${i})"><use href="#mapArt"/></g>
      <path d="${p.d}" fill="none" stroke="${glow ? '#ffe9a6' : INK}" stroke-width="5"/>
      <path d="${p.d}" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".6"/></svg>`;
  }

  return { W, H, CW, CH, pieces, build, pieceSVG, trailD, X, compassRose };
})();
