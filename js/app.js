/* Flujo principal del juego */
(function () {
  const C = window.OHANA, N = C.pistas.length;
  const $ = s => document.querySelector(s);
  const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');

  MapArt.build();

  /* ---------- Estado ---------- */
  const KEY = 'ohana-progreso-v1';
  const fresh = () => ({ stage: 'story', clue: 0, hints: Array(N).fill(0) });
  let S = fresh(), hasSave = false;
  try { const raw = localStorage.getItem(KEY); if (raw) { S = Object.assign(fresh(), JSON.parse(raw)); hasSave = S.stage !== 'story' || S.clue > 0; } } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  /* ---------- Utilidades de pantalla ---------- */
  let wakeLock = null;
  async function keepAwake() { try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wakeLock) keepAwake(); });
  function fullscreen() { try { const el = document.documentElement; (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch?.(() => {}); } catch (e) {} }
  const wait = ms => new Promise(r => setTimeout(r, ms));

  let current = null;
  function go(stage) {
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    const sc = $('#s-' + stage);
    void sc.offsetWidth; // reinicia las animaciones de entrada aunque se repita escena
    sc.classList.add('active');
    $('#hud').classList.toggle('hidden', ['intro', 'reveal'].includes(stage));
    document.body.dataset.stage = stage; // la atmósfera (día, atardecer, noche) depende de la escena
    current = stage;
    if (stage !== 'clue' && stage !== 'puzzle') setTurn(stage === 'chest' ? 'all' : null);
    if (stage !== 'intro') { S.stage = stage; save(); }
    ({ story: enterStory, clue: enterClue, puzzle: enterPuzzle, chest: enterChest, reveal: enterReveal }[stage] || (() => {}))();
    renderMedals();
  }

  /* ---------- HUD ---------- */
  function renderMedals(pop = -1) {
    const done = S.stage === 'clue' ? S.clue : S.stage === 'story' ? 0 : N;
    $('#medals').innerHTML = C.pistas.map((_, i) =>
      `<div class="medal ${i < done ? 'done' : ''} ${i === done && S.stage === 'clue' ? 'current' : ''} ${i === pop ? 'pop' : ''}">${i < done ? '✦' : i + 1}</div>`).join('');
  }
  const soundIcon = () => { $('#soundBtn').textContent = Sound.enabled ? '♪' : '✕'; };
  soundIcon();
  $('#soundBtn').addEventListener('click', () => { Sound.toggle(); soundIcon(); });

  /* ---------- Turnos ----------
     Enigmas: el turno sale del número de pista, así que sobrevive a recargas y saltos.
     Puzzle: cambia cada vez que encaja una pieza y continúa la alternancia de los enigmas. */
  const J = C.jugadores, T = C.turnos || {};
  const turnsOn = T.activo !== false && J.length > 1;
  const first = Math.max(0, J.indexOf(T.empieza));
  const PALETTE = ['#FF6B5E', '#12B5BA', '#7B5CFF', '#2FBF71'];
  const colorOf = name => (C.colores && C.colores[name]) || PALETTE[Math.max(0, J.indexOf(name)) % PALETTE.length];
  const playerAt = k => J[(first + k) % J.length];
  const face = name => {
    const src = C.avatares && C.avatares[name];
    return src ? `<img src="${src}" alt="" onerror="this.replaceWith('${name[0]}')">` : name[0];
  };
  function setTurn(who) {
    const chip = $('#turnChip');
    const name = who === 'all' ? null : who;
    chip.classList.toggle('hidden', !turnsOn || !who);
    document.body.style.setProperty('--p', name && turnsOn ? colorOf(name) : 'var(--sun)');
    if (!turnsOn || !who) return;
    chip.innerHTML = name
      ? `<span class="tc-av">${face(name)}</span><span class="tc-txt"><small>Turno de</small><b>${name}</b></span>`
      : `<span class="tc-av">★</span><span class="tc-txt"><small>Turno de</small><b>¡Todos a la vez!</b></span>`;
    chip.classList.remove('swap'); void chip.offsetWidth; chip.classList.add('swap');
  }
  // Cartel de cambio de turno: mientras se ve, la pantalla no responde (da tiempo a pasar la tablet)
  let bannerT = 0;
  async function announceTurn(name, sub = '', ms = 1700) {
    if (!turnsOn) return;
    const b = $('#turnBanner'), id = ++bannerT;
    b.style.setProperty('--p', colorOf(name));
    $('#tbAv').innerHTML = face(name);
    $('#tbKicker').textContent = '¡Turno de';
    $('#tbName').textContent = name + '!';
    $('#tbSub').textContent = sub;
    b.classList.remove('hidden', 'out');
    Sound.play('turn');
    await wait(ms);
    if (id !== bannerT) return;
    b.classList.add('out');
    await wait(280);
    if (id === bannerT) b.classList.add('hidden');
  }

  /* ---------- Mascotas ---------- */
  const M = C.mascotas || [];
  const mascot = (m, cls) => m ? `<img class="mascot ${cls}" src="${m.src}" alt="${m.nombre}" onerror="this.remove()">` : '';
  $('#introMascots').innerHTML = mascot(M[0], 'm-left') + mascot(M[1], 'm-right');
  $('#revealMascots').innerHTML = mascot(M[0], 'm-a') + mascot(M[1], 'm-b');

  /* ---------- Intro ---------- */
  $('#introNames').textContent = C.jugadores.join(' y ');
  if (hasSave) { $('#btnStart').textContent = 'Continuar la aventura'; $('#btnRestart').classList.remove('hidden'); }
  $('#btnStart').addEventListener('click', () => {
    Sound.init(); Sound.music(S.stage === 'reveal' ? 'fiesta' : 'aventura'); Sound.play('reveal');
    fullscreen(); keepAwake();
    go(S.stage || 'story');
  });
  $('#btnRestart').addEventListener('click', () => {
    if (!confirm('¿Seguro que queréis empezar la expedición desde el principio?')) return;
    S = fresh(); save(); location.reload();
  });

  /* ---------- Carta ---------- */
  function avatarHTML(name) {
    const src = C.avatares && C.avatares[name];
    return `<div class="avatar"><div class="medallion" style="--pc:${colorOf(name)}">${src ? `<img src="${src}" alt="${name}" onerror="this.outerHTML='<div class=&quot;mono&quot;>${name[0]}</div>'">` : `<div class="mono">${name[0]}</div>`}</div>${name}</div>`;
  }
  let storyDone = false;
  async function enterStory() {
    $('#avatars').innerHTML = C.jugadores.map(avatarHTML).join('');
    if (storyDone) return;
    storyDone = true;
    const [a, b] = C.jugadores;
    const paras = [
      `Queridos ${a} y ${b}:`,
      'Soy el último Cartógrafo de la Isla Ohana, y os escribo porque necesito a los dos exploradores más valientes de esta casa.',
      'Hace mucho tiempo escondí aquí el mayor tesoro de nuestra familia. Para protegerlo, rompí su mapa en seis fragmentos y los oculté en los rincones más insospechados de este hogar.',
      'Cada fragmento está custodiado por un enigma. Resolvedlo, encontrad el escondite y escribid en la tablet el código secreto que encontraréis allí.',
      'Trabajad juntos: lo que uno no ve, lo ve el otro. Porque en esta expedición, nadie se queda atrás.'
    ];
    const box = $('#letterText');
    box.innerHTML = paras.map(p => `<p>${p.split(' ').map(w => `<span class="w">${w} </span>`).join('')}</p>`).join('') + '<p class="sig"><span class="w">— El Cartógrafo de Ohana</span></p>';
    await wait(1200);
    const words = [...box.querySelectorAll('.w')];
    for (const w of words) { if (current !== 'story') break; w.classList.add('on'); await wait(70); }
    words.forEach(w => w.classList.add('on'));
    $('#btnAccept').classList.remove('hidden');
    $('#btnAccept').classList.add('pulse');
  }
  $('#btnAccept').addEventListener('click', () => { Sound.play('correct'); S.clue = 0; go('clue'); });

  /* ---------- Pistas ---------- */
  async function enterClue() {
    if (S.clue >= N) return go('puzzle');
    const P = C.pistas[S.clue], idx = S.clue;
    document.body.dataset.clue = idx % 6;
    const cap = playerAt(idx), helper = playerAt(idx + 1);
    $('#roles').classList.toggle('hidden', !turnsOn);
    if (turnsOn) {
      setTurn(cap);
      $('#roles').innerHTML =
        `<div class="role" style="--pc:${colorOf(cap)}"><span class="role-av">${face(cap)}</span><span><b>${cap}</b> lleva el timón:<br>lee el enigma y escribe el código</span></div>` +
        `<div class="role" style="--pc:${colorOf(helper)}"><span class="role-av">${face(helper)}</span><span><b>${helper}</b> es su mano derecha:<br>decide si pedimos una ayuda</span></div>`;
      $('#codeLabel').textContent = `Código secreto · escribe ${cap}`;
    }
    $('#clueNum').textContent = `Fragmento ${S.clue + 1} de ${N}`;
    $('#clueTitle').textContent = P.titulo;
    $('#riddle').innerHTML = P.enigma.map(l => `<p>${l}</p>`).join('');
    renderHints();
    $('#clueMascot').innerHTML = mascot(M[S.clue % Math.max(1, M.length)], 'm-clue');
    $('#codeInput').value = ''; $('#codeMsg').textContent = ''; $('#codeMsg').className = 'code-msg';
    const lines = [...document.querySelectorAll('#riddle p')];
    if (turnsOn) await announceTurn(cap, `Lee el enigma en voz alta y escribe el código. ${helper} decide las ayudas.`, 2400);
    for (let i = 0; i < lines.length; i++) { await wait(i ? 650 : 500); if (S.clue !== idx || current !== 'clue') return; lines[i].classList.add('on'); }
  }
  function renderHints() {
    const P = C.pistas[S.clue], n = S.hints[S.clue] || 0;
    $('#hints').innerHTML = P.ayudas.slice(0, n).map((h, i) => `<div class="hint"><b>Ayuda ${i + 1}:</b> ${h}</div>`).join('');
    $('#btnHint').classList.toggle('hidden', n >= P.ayudas.length);
    const who = turnsOn ? playerAt(S.clue + 1) + ': ' : '';
    $('#btnHint').textContent = `✧ ${who}${n === 0 ? (who ? 'pedir una ayuda' : 'Necesitamos una ayuda') : (who ? 'pedir otra ayuda' : 'Necesitamos otra ayuda')}`;
  }
  $('#btnHint').addEventListener('click', () => {
    S.hints[S.clue] = (S.hints[S.clue] || 0) + 1; save();
    Sound.play('hint'); renderHints();
  });
  $('#codeInput').addEventListener('input', () => Sound.play('key'));
  const BAD = ['Ese código no abre nada… seguid buscando.', 'Casi… revisad bien las letras.', 'El mapa no reconoce ese código. ¿Seguro que es aquí?'];
  let badN = 0;
  $('#codeForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const v = norm($('#codeInput').value);
    if (!v) return;
    const P = C.pistas[S.clue], msg = $('#codeMsg');
    if (v === norm(P.codigo)) {
      $('#codeInput').blur();
      msg.className = 'code-msg good'; msg.textContent = '¡Código correcto!';
      Sound.play('correct');
      const r = $('#codeInput').getBoundingClientRect();
      FX.sparks(r.left + r.width / 2, r.top + r.height / 2, 50, { speed: 8 });
      setTimeout(() => showPiece(S.clue), 700);
      return;
    }
    const other = C.pistas.findIndex(p => norm(p.codigo) === v);
    msg.className = 'code-msg bad';
    msg.textContent = other > S.clue ? '¡Ese código es de otro fragmento! Primero resolved este enigma.'
      : other >= 0 ? 'Ese fragmento ya lo tenéis. ¡Buscad el nuevo!' : BAD[badN++ % BAD.length];
    Sound.play('wrong');
    try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch (e) {}
    const box = $('#codeForm'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  });

  function showPiece(i) {
    const last = i === N - 1;
    $('#ovKicker').textContent = `Fragmento ${i + 1} de ${N} conseguido`;
    $('#ovPiece').innerHTML = MapArt.pieceSVG(i);
    $('#ovWord').textContent = C.palabras[i] || '';
    const words = C.palabras.slice(0, i + 1);
    $('#ovPhrase').innerHTML = 'Palabras del mapa: ' + words.map((w, k) => k === i ? `<em>${w}</em>` : w).join(' · ') + (last ? '…' : '');
    $('#btnNext').textContent = last ? '¡Reconstruir el mapa!' : 'Siguiente enigma';
    const ov = $('#pieceOverlay');
    ov.classList.remove('hidden');
    ov.querySelectorAll('*').forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
    Sound.play('reveal');
    setTimeout(() => FX.sparks(innerWidth / 2, innerHeight * 0.4, 80, { speed: 10, up: 3 }), 1300);
    S.clue = i + 1; save();
    renderMedals(i);
  }
  $('#btnNext').addEventListener('click', () => {
    $('#pieceOverlay').classList.add('hidden');
    Sound.play('click');
    if (S.clue >= N) go('puzzle'); else { go('clue'); window.scrollTo(0, 0); }
  });

  /* ---------- Puzzle ---------- */
  let puzzle = null;
  function enterPuzzle() {
    $('#btnToChest').classList.add('hidden');
    const total = MapArt.pieces.length;
    const puzzleTurn = placed => {
      const who = playerAt(N + placed);
      setTurn(who);
      $('#puzzleSub').textContent = turnsOn ? `${who}, arrastra un fragmento a su sitio` : 'Arrastrad cada fragmento a su sitio';
      return who;
    };
    const starter = puzzleTurn(0);
    announceTurn(starter, 'Coloca una pieza del mapa. Cuando encaje, cambia el turno.', 2200);
    requestAnimationFrame(() => {
      window.__pz = puzzle = Puzzle.mount($('#puzzleWrap'), {
        onPlaced(placed) {
          if (placed >= total) { setTurn(null); $('#puzzleSub').textContent = '¡Mapa completo!'; return; }
          const who = puzzleTurn(placed);
          setTimeout(() => announceTurn(who, `Quedan ${total - placed} ${total - placed === 1 ? 'pieza' : 'piezas'}`, 1300), 450);
        },
        onDone() { setTurn(null); $('#puzzleSub').textContent = '¡Mapa completo!'; $('#btnToChest').classList.remove('hidden'); $('#btnToChest').classList.add('pulse'); }
      });
    });
  }
  $('#btnToChest').addEventListener('click', () => { Sound.play('click'); go('chest'); });

  /* ---------- Cofre ---------- */
  const MILESTONES = [
    [0, `Está sellado con cadenas… ¡${C.jugadores.join(' y ')}, golpeadlo a la vez para romperlas!`],
    [10, '¡Se ha movido! Algo hay ahí dentro…'],
    [25, '¡Más fuerte, exploradores!'],
    [34, '¡CRACK! ¡Una cadena rota!'],
    [50, '¡Ya vais por la mitad!'],
    [67, '¡Otra cadena menos! Solo queda el candado…'],
    [80, '¡Se escapa luz por las grietas!'],
    [90, '¡¡CASI!! ¡No paréis!'],
    [97, '¡¡¡YAAAA!!!']
  ];
  function enterChest() {
    const total = C.toquesCofre, circ = 326.7;
    $('#tapNum').textContent = total;
    $('#ringFg').style.strokeDashoffset = circ;
    $('#chestSub').textContent = MILESTONES[0][1];
    Chest.mount($('#chestSvgHolder'), {
      total, tapArea: $('#chestWrap'),
      onProgress(n) {
        const b = $('#tapNum');
        b.textContent = Math.max(0, total - n);
        b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick');
        $('#ringFg').style.strokeDashoffset = circ * (1 - n / total);
        const m = MILESTONES.filter(([k]) => n >= Math.round(k * total / 100)).pop();
        if (m) $('#chestSub').textContent = m[1];
      },
      onOpen() {
        $('#chestTitle').textContent = '¡¡ABIERTO!!';
        setTimeout(() => $('#flash').classList.add('go'), 600);
        setTimeout(() => { go('reveal'); setTimeout(() => $('#flash').classList.remove('go'), 1800); }, 1400);
      }
    });
  }

  /* ---------- Premio: parque de atracciones de día ----------
     Las zonas del parque real (castillo, montaña minera, laguna pirata, cúpula espacial, tazas y tren de
     vapor) dibujadas en el estilo del juego. El parque es una caja fija de 1600×780 que se escala entera. Lo que no se mueve va en dos SVG
     (fondo y primer plano); cada cosa que se mueve es un elemento aparte con su propia capa, así
     las animaciones solo desplazan capas y no repintan el dibujo. */
  const PARK_W = 1600, PARK_H = 780;
  function parkHTML() {
    const INK = '#14234B', G = 620, NS = 'http://www.w3.org/2000/svg';
    const o = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const COLS = ['#FF6B5E', '#FFC93C', '#2FBF71', '#18C5C9', '#7B5CFF', '#FF8FB8'];
    const f = n => n.toFixed(1);
    const el = (x, y, w, h, cls, inner, style = '') => `<svg class="pk ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${style}" viewBox="0 0 ${w} ${h}" xmlns="${NS}">${inner}</svg>`;
    const star4 = (x, y, r, fill = '#fff') => `<path d="M${x},${y - r} Q${x},${y} ${x + r},${y} Q${x},${y} ${x},${y + r} Q${x},${y} ${x - r},${y} Q${x},${y} ${x},${y - r}Z" fill="${fill}"/>`;
    const flag = (x, y, col, len = 34) => `<path d="M${x},${y} v${-len}" ${o(3)}/><path d="M${x},${y - len} q14,-5 26,4 q-12,6 -26,10z" fill="${col}" ${o(2.5)}/>`;
    const tree = (x, s = 1, c = '#2FBF71') => `<g transform="translate(${x} ${G}) scale(${s})"><path d="M0,0 v-34" stroke="#8A4B1E" stroke-width="10" stroke-linecap="round"/><circle cy="-60" r="32" fill="${c}" ${o()}/><circle cx="-10" cy="-70" r="9" fill="#fff" opacity=".35"/></g>`;

    /* --- castillo --- */
    const win = (x, y, w = 16, h = 28) => `<path d="M${x - w / 2},${y + h} v${-h + w / 2} a${w / 2},${w / 2} 0 0 1 ${w},0 v${h - w / 2}z" fill="#FFE27A" ${o(3)}/><path d="M${x},${y + 2} v${h - 2}" stroke="${INK}" stroke-width="2"/>`;
    const tower = (x, w, h, roof, wall, top, fl, teeth) => {
      const y = G - h, L = x - w / 2;
      let s = `<rect x="${L}" y="${y}" width="${w}" height="${h}" fill="${wall}" ${o()}/>`;
      s += `<rect x="${L + w * 0.68}" y="${y + 2}" width="${w * 0.32 - 2}" height="${h - 2}" fill="${INK}" opacity=".09"/><rect x="${L + 4}" y="${y + 2}" width="${w * 0.14}" height="${h - 2}" fill="#fff" opacity=".4"/>`;
      s += `<rect x="${L - 3}" y="${y + 18}" width="${w + 6}" height="7" fill="#FFC93C" ${o(2.5)}/>`;
      if (teeth) for (let i = 0; i < 3; i++) s += `<rect x="${L - 9 + i * (w + 18 - 14) / 2}" y="${y - 18}" width="14" height="16" rx="3" fill="#fff" ${o(3)}/>`;
      s += `<rect x="${L - 9}" y="${y - 6}" width="${w + 18}" height="16" rx="6" fill="#fff" ${o()}/>`;
      const b = y - 6, t = b - roof, hw = w / 2 + 12;
      s += `<path d="M${x - hw},${b} Q${x - w * 0.16},${b - roof * 0.5} ${x},${t} Q${x + w * 0.16},${b - roof * 0.5} ${x + hw},${b}Z" fill="${top}" ${o()}/>`;
      s += `<path d="M${x - hw + 9},${b - 4} Q${x - w * 0.18},${b - roof * 0.5} ${x - 2},${t + 16} Q${x - w * 0.3},${b - roof * 0.4} ${x - hw + 22},${b - 4}Z" fill="#fff" opacity=".38"/>`;
      s += `<circle cx="${x}" cy="${t}" r="7" fill="#FFC93C" ${o(3)}/>`;
      for (let wy = y + 44; wy < G - 70; wy += 78) s += win(x, wy, Math.min(18, w * 0.34));
      return s + (fl ? flag(x, t - 6, fl) : '');
    };
    const block = (x1, x2, h, fill, n) => {
      const y = G - h, w = x2 - x1, step = w / n;
      let s = `<rect x="${x1}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${o()}/><rect x="${x1 + w * 0.8}" y="${y + 2}" width="${w * 0.2 - 2}" height="${h - 2}" fill="${INK}" opacity=".07"/>`;
      for (let i = 0; i < n; i++) s += `<rect x="${f(x1 + i * step + step * 0.2)}" y="${y - 18}" width="${f(step * 0.6)}" height="20" rx="4" fill="#fff" ${o(3)}/>`;
      return s + `<rect x="${x1 - 4}" y="${y}" width="${w + 8}" height="9" rx="4" fill="#FFC93C" ${o(2.5)}/>`;
    };
    const banner = (x, y, col) => `<path d="M${x - 15},${y} h30 v62 l-15,-14 l-15,14z" fill="${col}" ${o(3)}/>` + star4(x, y + 24, 9, '#fff');
    let castle = '';
    castle += tower(676, 54, 300, 118, '#FFB7D2', '#7B5CFF', '#FFC93C') + tower(924, 54, 300, 118, '#FFB7D2', '#7B5CFF', '#FFC93C');
    castle += block(726, 874, 336, '#FFE9F2', 4);
    castle += tower(742, 44, 366, 112, '#FFC8DD', '#18C5C9', '#FF6B5E') + tower(858, 44, 366, 112, '#FFC8DD', '#18C5C9', '#FF6B5E');
    castle += tower(800, 78, 416, 160, '#FFF3F8', '#3D8BF0', '#FF6B5E', true);
    // torrecillas colgadas de la torre central
    [[-1, 759], [1, 841]].forEach(([k, x]) => { castle += `<path d="M${x - 13},${G - 380} v52 q13,16 26,0 v-52z" fill="#FFD6E6" ${o(3)}/><path d="M${x - 18},${G - 380} L${x},${G - 428} L${x + 18},${G - 380}Z" fill="#FF8FB8" ${o(3)}/><circle cx="${x}" cy="${G - 428}" r="4.5" fill="#FFC93C" ${o(2.5)}/>` + win(x, G - 372, 9, 18); void k; });
    castle += block(652, 948, 232, '#FFDCEA', 7);
    // balconada de arcos
    for (let i = 0; i < 6; i++) castle += `<path d="M${686 + i * 40},${G - 150} v-30 a14,14 0 0 1 28,0 v30z" fill="#3D8BF0" ${o(3)}/><path d="M${690 + i * 40},${G - 180} a10,10 0 0 1 10,-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    castle += `<rect x="676" y="${G - 150}" width="248" height="10" rx="5" fill="#fff" ${o(3)}/>`;
    castle += tower(612, 62, 222, 104, '#FFA9CB', '#3D8BF0', '#FFC93C') + tower(988, 62, 222, 104, '#FFA9CB', '#3D8BF0', '#FFC93C');
    castle += block(566, 1034, 122, '#FFD0E2', 11);
    castle += tower(554, 48, 158, 84, '#FFB7D2', '#18C5C9', '#7B5CFF') + tower(1046, 48, 158, 84, '#FFB7D2', '#18C5C9', '#7B5CFF');
    // rosetón, puerta, escalinata y estandartes
    castle += `<circle cx="800" cy="${G - 196}" r="27" fill="#fff" ${o()}/><circle cx="800" cy="${G - 196}" r="19" fill="#7B5CFF" ${o(3)}/>` + star4(800, G - 196, 15, '#FFC93C');
    castle += `<path d="M744,${G} v-64 a56,56 0 0 1 112,0 v64z" fill="#fff" ${o()}/><path d="M756,${G} v-62 a44,44 0 0 1 88,0 v62z" fill="#8A4B1E" ${o()}/><path d="M800,${G - 106} V${G} M778,${G - 99} V${G} M822,${G - 99} V${G}" stroke="${INK}" stroke-width="3" opacity=".55"/><circle cx="790" cy="${G - 44}" r="5" fill="#FFC93C" ${o(2)}/><circle cx="810" cy="${G - 44}" r="5" fill="#FFC93C" ${o(2)}/>`;
    castle += banner(700, G - 108, '#FF6B5E') + banner(900, G - 108, '#FF6B5E') + banner(628, G - 100, '#FFC93C') + banner(972, G - 100, '#FFC93C');
    castle += `<path d="M734,${G} h132 l14,14 h-160z" fill="#fff" ${o(3)}/><path d="M720,${G + 14} h160 l14,14 h-188z" fill="#F3E3F0" ${o(3)}/>`;
    [600, 640, 960, 1000].forEach(x => { castle += `<circle cx="${x}" cy="${G - 14}" r="20" fill="#2FBF71" ${o()}/><circle cx="${x - 6}" cy="${G - 20}" r="4" fill="#FF8FB8"/><circle cx="${x + 7}" cy="${G - 10}" r="4" fill="#FFC93C"/>`; });

    /* --- fondo estático --- */
    let back = '';
    back += `<ellipse cx="240" cy="${G + 30}" rx="640" ry="110" fill="#9BE694"/><ellipse cx="1390" cy="${G + 40}" rx="660" ry="120" fill="#9BE694"/>`;

    // FRONTIER: montaña de roca roja con su tren minero
    const rock = (d, fill) => `<path d="${d}" fill="${fill}" ${o()}/>`;
    back += rock(`M10,${G} L52,430 L96,412 L118,300 L176,268 L214,300 L236,360 L276,350 L312,452 L356,470 L392,${G}Z`, '#E8743B');
    back += `<path d="M118,300 L176,268 L214,300 L200,330 L150,322Z M52,430 L96,412 L128,440 L80,462Z M236,360 L276,350 L312,452 L262,440Z" fill="#F6A461"/>`;
    back += `<path d="M236,360 L262,440 L312,452 L356,470 L392,${G} H300 L270,520 L250,440Z" fill="#C4532A" opacity=".55"/>`;
    back += `<path d="M40,500 q80,-18 150,0 t150,-6 M60,548 q90,-16 170,2 t140,-4 M110,356 q50,-12 110,2 M130,404 q60,-12 150,6" fill="none" stroke="${INK}" stroke-width="3" opacity=".28" stroke-linecap="round"/>`;
    back += rock(`M352,${G} L372,470 L392,392 L430,384 L450,474 L486,${G}Z`, '#EE8A4A') + `<path d="M392,392 L430,384 L440,430 L404,436Z" fill="#F9B77A"/><path d="M372,520 q50,-12 96,2" fill="none" stroke="${INK}" stroke-width="3" opacity=".28"/>`;
    const MINE = 'M34,560 C110,520 150,468 232,482 C318,496 322,566 410,552 C452,545 468,574 486,592';
    const mp = document.createElementNS(NS, 'path'); mp.setAttribute('d', MINE);
    for (let l = 22; l < mp.getTotalLength(); l += 26) { const p = mp.getPointAtLength(l); back += `<path d="M${f(p.x)},${f(p.y)} V${G} M${f(p.x - 9)},${f(p.y + 22)} L${f(p.x + 9)},${f(p.y + 44)}" stroke="#7A4420" stroke-width="4" stroke-linecap="round"/>`; }
    back += `<path d="${MINE}" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="${MINE}" fill="none" stroke="#B5682F" stroke-width="7" stroke-linecap="round"/><path d="${MINE}" fill="none" stroke="#FFE29A" stroke-width="2.5" stroke-dasharray="3 9"/>`;
    const cactus = (x, s) => `<g transform="translate(${x} ${G}) scale(${s})"><path d="M0,0 v-58 M0,-26 h-16 v-18 M0,-36 h15 v-16" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/><path d="M0,0 v-58 M0,-26 h-16 v-18 M0,-36 h15 v-16" fill="none" stroke="#2FBF71" stroke-width="10" stroke-linecap="round"/></g>`;
    back += cactus(22, 1);

    // DISCOVERY: cúpula espacial con su cañón de lanzamiento
    const dx = 1452, dr = 146;
    back += `<path d="M${dx - dr},${G} A${dr},${dr * 1.08} 0 0 1 ${dx + dr},${G}Z" fill="#EAF4FF" ${o()}/>`;
    back += `<path d="M${dx + dr * 0.3},${G} A${dr * 0.9},${dr * 1.08} 0 0 0 ${dx + dr * 0.1},${G - dr * 1.07} A${dr},${dr * 1.08} 0 0 1 ${dx + dr},${G}Z" fill="${INK}" opacity=".1"/>`;
    [-0.62, -0.22, 0.22, 0.62].forEach(k => { back += `<path d="M${f(dx + k * dr)},${G} Q${f(dx + k * dr * 0.9)},${f(G - dr * 0.75)} ${dx},${f(G - dr * 1.08)}" fill="none" stroke="#C88A2B" stroke-width="6" stroke-linecap="round"/>`; });
    back += `<path d="M${dx - dr - 6},${G - 46} h${dr * 2 + 12}" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M${dx - dr - 6},${G - 46} h${dr * 2 + 12}" stroke="#18C5C9" stroke-width="12" stroke-linecap="round"/>`;
    for (let i = 0; i < 9; i++) back += `<circle cx="${dx - dr + 14 + i * 33}" cy="${G - 46}" r="5" fill="#FFF3B0" ${o(2)}/>`;
    back += `<path d="M${dx},${f(G - dr * 1.08)} v-70" ${o(6)}/><circle cx="${dx}" cy="${f(G - dr * 1.08 - 76)}" r="10" fill="#FFC93C" ${o(3)}/><ellipse cx="${dx}" cy="${f(G - dr * 1.08 - 40)}" rx="24" ry="7" fill="none" stroke="#FFC93C" stroke-width="5"/>`;
    // cañón (los cohetes salen por él)
    back += `<g transform="translate(1300 ${G - 8}) rotate(-52)"><rect x="0" y="-27" width="300" height="54" rx="12" fill="#C88A2B" ${o()}/><rect x="0" y="-27" width="300" height="16" rx="8" fill="#fff" opacity=".3"/>${[40, 120, 200].map(x => `<rect x="${x}" y="-33" width="22" height="66" rx="7" fill="#7B5CFF" ${o(3.5)}/>`).join('')}<rect x="282" y="-36" width="26" height="72" rx="9" fill="#FFC93C" ${o()}/></g>`;
    back += `<path d="M1262,${G} h118 l-16,-44 h-86z" fill="#6F7FA8" ${o()}/>`;
    // cohetes giratorios: torre
    const ox = 1166;
    back += `<path d="M${ox - 34},${G} L${ox - 13},${G - 150} h26 L${ox + 34},${G}Z" fill="#EAF4FF" ${o()}/><path d="M${ox - 24},${G - 60} h48 M${ox - 18},${G - 110} h36" ${o(3)}/><circle cx="${ox}" cy="${G - 180}" r="34" fill="#FFC93C" ${o()}/><ellipse cx="${ox}" cy="${G - 180}" rx="54" ry="13" fill="none" stroke="${INK}" stroke-width="9"/><ellipse cx="${ox}" cy="${G - 180}" rx="54" ry="13" fill="none" stroke="#FF6B5E" stroke-width="4"/><circle cx="${ox - 11}" cy="${G - 191}" r="9" fill="#fff" opacity=".6"/>`;

    back += castle;
    back += `<path d="M690,${PARK_H} Q770,${G + 70} 760,${G + 28} H840 Q830,${G + 70} 910,${PARK_H}Z" fill="#FFE29A" ${o()}/>`;

    /* --- primer plano estático --- */
    let front = '';
    // ADVENTURE: laguna con la roca calavera
    front += `<ellipse cx="392" cy="${G + 44}" rx="214" ry="36" fill="#3DB8EE" ${o()}/><path d="M250,${G + 40} q16,-8 32,0 M470,${G + 62} q16,-8 32,0 M320,${G + 66} q16,-8 32,0 M520,${G + 36} q14,-7 28,0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
    front += `<g transform="translate(232 ${G + 40})"><path d="M-56,6 q-14,-54 10,-88 q36,-40 78,-6 q26,30 20,94z" fill="#A9B6D6" ${o()}/><path d="M-30,-70 q30,-22 60,6" fill="none" stroke="#fff" stroke-width="5" opacity=".5" stroke-linecap="round"/><ellipse cx="-20" cy="-40" rx="13" ry="16" fill="${INK}"/><ellipse cx="18" cy="-40" rx="13" ry="16" fill="${INK}"/><path d="M-1,-22 l-7,14 h14z" fill="${INK}"/><path d="M-26,6 v-12 M-13,6 v-14 M0,6 v-14 M13,6 v-14 M26,6 v-12" ${o(4)}/></g>`;
    // FANTASY: plataforma de las tazas
    front += `<ellipse cx="1240" cy="${G + 56}" rx="176" ry="26" fill="#FF8FB8" ${o()}/><ellipse cx="1240" cy="${G + 52}" rx="150" ry="18" fill="#FFD0E2"/>`;
    // árboles, farolas con globos y carrito
    front += tree(590, .7, '#1FA862') + tree(1068, .7, '#1FA862') + tree(1582, .9);
    const lamp = (x, cols) => {
      let s = `<path d="M${x},${G + 44} v-110" ${o(7)}/><path d="M${x},${G + 44} v-110" stroke="#18C5C9" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${G - 78}" r="15" fill="#FFF3B0" ${o(3.5)}/><rect x="${x - 14}" y="${G + 40}" width="28" height="10" rx="4" fill="${INK}"/>`;
      cols.forEach((c, i) => { const bx = x + (i - 1) * 26, by = G - 150 - (i % 2) * 20; s += `<path d="M${x},${G - 40} Q${x + (i - 1) * 8},${G - 90} ${bx},${by + 22}" fill="none" ${o(2)}/><ellipse cx="${bx}" cy="${by}" rx="17" ry="21" fill="${c}" ${o(3)}/><circle cx="${bx - 6}" cy="${by - 8}" r="4" fill="#fff" opacity=".7"/>`; });
      return s;
    };
    front += lamp(660, ['#FF6B5E', '#FFC93C', '#18C5C9']) + lamp(940, ['#7B5CFF', '#FF8FB8', '#2FBF71']);
    for (let i = 0; i < 9; i++) { const x = 640 + (i % 2 ? 300 + i * 16 : -i * 6), y = G + 20 + (i % 4) * 8; front += `<circle cx="${x}" cy="${y}" r="5.5" fill="${COLS[i % 6]}" stroke="${INK}" stroke-width="2"/>`; }

    /* --- montaje: fondo, piezas animadas, primer plano --- */
    let h = `<div class="park-ground"></div><div class="park" id="park">`;
    h += `<svg class="pk pk-static" viewBox="0 0 ${PARK_W} ${PARK_H}" xmlns="${NS}">${back}</svg>`;
    // globo cautivo
    h += el(70, 30, 120, 176, 'pk-balloon', `<path d="M40,122 L50,150 M80,122 L70,150" ${o(3)}/><path d="M60,4 C112,4 124,62 86,122 H34 C-4,62 8,4 60,4Z" fill="#3D8BF0" ${o()}/><path d="M60,4 C84,26 84,90 72,122 H48 C36,90 36,26 60,4Z" fill="#fff" ${o(3)}/><path d="M22,40 q38,16 76,0" fill="none" stroke="#FFC93C" stroke-width="6"/><rect x="45" y="150" width="30" height="22" rx="5" fill="#D98A45" ${o()}/>`);
    // tren minero
    [0, 1, 2].forEach(i => { h += el(0, 0, 38, 30, 'pk-mine', i === 0 ? `<rect x="4" y="8" width="30" height="18" rx="5" fill="#FF6B5E" ${o(3)}/><rect x="22" y="0" width="9" height="12" rx="2" fill="${INK}"/><circle cx="12" cy="12" r="4" fill="#FFC93C"/>` : `<circle cx="19" cy="8" r="6.5" fill="${['', '#FFD9B8', '#F2C29B'][i]}" ${o(2.5)}/><rect x="4" y="10" width="30" height="16" rx="5" fill="#8A4B1E" ${o(3)}/>`, `animation-delay:${(-i * 0.3 - 0.01).toFixed(2)}s`); });
    // cohete del cañón y cohetes giratorios
    h += el(1290, G - 46, 60, 34, 'pk-shot', `<path d="M2,17 L16,6 V28Z" fill="#FFC93C" ${o(2.5)}/><path d="M14,5 H40 Q58,17 40,29 H14Z" fill="#fff" ${o(3)}/><circle cx="34" cy="17" r="6" fill="#18C5C9" ${o(2.5)}/>`);
    [0, 1, 2, 3].forEach(i => { h += el(ox - 30, G - 196, 60, 34, 'pk-orbit', `<path d="M4,17 L16,7 V27Z" fill="#FF6B5E" ${o(2.5)}/><path d="M14,6 H38 Q56,17 38,28 H14Z" fill="${['#18C5C9', '#FFC93C', '#7B5CFF', '#FF8FB8'][i]}" ${o(3)}/><circle cx="30" cy="12" r="6.5" fill="#FFD9B8" ${o(2.5)}/>`, `animation-delay:${-i * 1.5}s`); });
    h += `<svg class="pk pk-static" viewBox="0 0 ${PARK_W} ${PARK_H}" xmlns="${NS}">${front}</svg>`;
    // galeón pirata
    h += el(318, G - 150, 236, 214, 'pk-galleon', `<path d="M64,150 V34 M124,150 V8 M178,150 V44" ${o(6)}/>
      <path d="M36,58 q28,14 56,0 l-3,52 q-25,-12 -50,0z M92,26 q32,16 64,0 l-4,74 q-28,-14 -56,0z M152,62 q26,12 52,0 l-3,46 q-23,-10 -46,0z" fill="#FFF6E4" ${o(3.5)}/>
      <path d="M124,8 h34 l-9,10 l9,10 h-34z" fill="${INK}"/><circle cx="138" cy="18" r="5" fill="#fff"/><path d="M64,34 l-24,7 l24,7z M178,44 l24,6 l-24,6z" fill="#FF6B5E" ${o(2.5)}/>
      <path d="M8,138 q10,10 28,12 h150 q30,-4 44,-30 q4,56 -46,74 h-126 q-44,-8 -50,-56z" fill="#B5682F" ${o()}/><path d="M20,162 q100,16 200,-8" fill="none" stroke="#FFC93C" stroke-width="7" stroke-linecap="round"/>${[60, 96, 132, 168].map(x => `<circle cx="${x}" cy="182" r="7" fill="${INK}"/>`).join('')}`);
    // tazas giratorias
    [[1124, '#18C5C9', 0], [1206, '#FFC93C', -1.1], [1292, '#7B5CFF', -2.2]].forEach(([x, c, d]) => { h += el(x, G + 2, 96, 62, 'pk-cup', `<circle cx="34" cy="12" r="9" fill="#FFD9B8" ${o(2.5)}/><circle cx="56" cy="12" r="9" fill="#F2C29B" ${o(2.5)}/><path d="M74,26 q20,0 16,14 q-4,12 -20,10" fill="none" ${o(6)}/><path d="M74,26 q20,0 16,14 q-4,12 -20,10" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M12,18 h66 q0,36 -33,36 q-33,0 -33,-36z" fill="${c}" ${o()}/><path d="M18,30 q27,10 54,0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/><ellipse cx="45" cy="56" rx="38" ry="5" fill="#fff" ${o(3)}/>`, `animation-delay:${d}s`); });
    // destellos y estrella fugaz sobre el castillo
    [[800, 40, 16], [690, 190, 11], [912, 176, 12], [742, 110, 9], [866, 96, 10], [600, 330, 10], [1004, 318, 11], [540, 420, 8], [1062, 412, 9]].forEach(([x, y, r], i) => { h += el(x - r, y - r, r * 2, r * 2, 'pk-spark', star4(r, r, r, i % 3 ? '#fff' : '#FFF3B0'), `animation-delay:${(-i * 0.37).toFixed(2)}s`); });
    h += el(0, 0, 70, 30, 'pk-comet', `<path d="M4,15 L50,9 L50,21Z" fill="#fff" opacity=".85"/>` + star4(54, 15, 14, '#FFF3B0'));
    // globos que se escapan
    [[560, '#FF6B5E', 0], [1050, '#7B5CFF', -7], [1330, '#FF8FB8', -3]].forEach(([x, c, d]) => { h += el(x, G - 60, 36, 70, 'pk-loose', `<path d="M18,44 q-6,12 2,24" fill="none" ${o(2)}/><ellipse cx="18" cy="24" rx="15" ry="19" fill="${c}" ${o(3)}/><circle cx="12" cy="16" r="4" fill="#fff" opacity=".7"/>`, `animation-delay:${d}s`); });
    // tren de vapor que rodea el parque
    const wagon = (x, c) => `<path d="M${x + 4},26 h84 l6,-10 h-96z" fill="#FFC93C" ${o(3)}/><rect x="${x}" y="26" width="92" height="44" rx="8" fill="${c}" ${o()}/><rect x="${x + 10}" y="32" width="72" height="18" rx="5" fill="#DDF8FF" ${o(2.5)}/><circle cx="${x + 28}" cy="42" r="8" fill="#FFD9B8" ${o(2)}/><circle cx="${x + 62}" cy="42" r="8" fill="#F2C29B" ${o(2)}/><circle cx="${x + 22}" cy="74" r="11" fill="#FF6B5E" ${o()}/><circle cx="${x + 70}" cy="74" r="11" fill="#FF6B5E" ${o()}/>`;
    h += el(0, PARK_H - 96, 450, 92, 'pk-train', wagon(6, '#2FBF71') + wagon(110, '#FF6B5E') + wagon(214, '#2FBF71') +
      `<path d="M322,70 V20 h46 v20 h44 q16,0 16,16 v14z" fill="${INK}"/><path d="M326,66 V24 h38 v20 h48 q12,0 12,12 v10z" fill="#1E9655"/><rect x="334" y="30" width="24" height="18" rx="4" fill="#DDF8FF" ${o(2.5)}/><rect x="392" y="8" width="18" height="34" rx="3" fill="${INK}"/><path d="M386,10 h30 l-5,-10 h-20z" fill="#FF6B5E" ${o(2.5)}/><rect x="372" y="30" width="12" height="12" rx="6" fill="#FFC93C" ${o(2.5)}/><circle cx="346" cy="74" r="14" fill="#FF6B5E" ${o()}/><circle cx="384" cy="76" r="11" fill="#FF6B5E" ${o()}/><circle cx="412" cy="76" r="11" fill="#FF6B5E" ${o()}/><path d="M424,70 l18,10 h-18z" fill="#FFC93C" ${o(2.5)}/><path d="M308,58 h14 M204,58 h10 M100,58 h10" ${o(5)}/>`);
    return h + '</div>';
  }
  function sizePark() {
    const c = $('#castle'); if (!c) return;
    c.style.setProperty('--k', Math.min(innerHeight * 0.66 / PARK_H, innerWidth / 1300).toFixed(4));
  }
  addEventListener('resize', sizePark);
  let revealed = false;
  async function enterReveal() {
    if (revealed) return;
    revealed = true;
    $('#castle').innerHTML = parkHTML(); sizePark();
    Sound.music('fiesta');
    const P = C.premio;
    const title = `¡Nos vamos a ${P.destino}!`;
    $('#revealTitle').innerHTML = title.split(' ').map(w => `<span style="display:inline-block;white-space:nowrap">${[...w].map(ch => `<span class="l">${ch}</span>`).join('')}</span>`).join(' ');
    [...$('#revealTitle').querySelectorAll('.l')].forEach((l, i) => l.style.animationDelay = (i * 0.06) + 's');
    $('#ticket').innerHTML = `
      <div class="main">
        <div class="t-k">BILLETE DORADO · EXPEDICIÓN OHANA</div>
        <div class="t-dest">${P.destino}</div>
        <div class="t-grid">
          <div><small>CUÁNDO</small>${P.cuando}</div>
          <div><small>DURACIÓN</small>${P.duracion}</div>
          <div><small>PASAJEROS</small>${P.pasajeros}</div>
          <div><small>OS ESPERAN</small>Mickey y Stitch</div>
        </div>
      </div>
      <div class="stub"><small>VÁLIDO PARA</small><b>5</b><small>DÍAS</small><b>4</b><small>NOCHES</small></div>`;
    $('#finalMsg').innerHTML = `<div class="date">${C.fechaBoda}</div>` + `<div class="body"><p>${C.mensajeFinal.slice(0, 2).join(' ')}</p></div>` + `<blockquote>${C.mensajeFinal.slice(2).join(' ')}</blockquote>` + `<div class="sig">${C.firma}</div>`;
    const img = $('#familyPhoto');
    img.onload = () => $('#polaroid').classList.remove('hidden');
    img.onerror = () => $('#polaroid').remove();
    img.src = C.fotoFamilia;

    const steps = [...document.querySelectorAll('#s-reveal .reveal-step')];
    await wait(600);
    steps[0].classList.add('on');
    await wait(1600);
    Sound.play('fanfare');
    steps[1].classList.add('on');
    FX.startFireworks({ day: true });
    FX.confetti(220);
    await wait(2600);
    for (const s of steps.slice(2)) { s.classList.add('on'); await wait(1400); }
    setInterval(() => FX.confetti(60), 9000);
    // aviso para bajar: la primera pantalla es el título sobre el parque; billete y mensaje van debajo
    const sc = $('#s-reveal'), hint = $('#scrollHint');
    if (sc.scrollHeight > sc.clientHeight + 80 && sc.scrollTop < 40) hint.classList.remove('hidden');
    sc.addEventListener('scroll', () => { if (sc.scrollTop > 40) hint.classList.add('hidden'); }, { passive: true });
    hint.addEventListener('click', () => sc.scrollTo({ top: $('#ticket').offsetTop - 28, behavior: 'smooth' }));
  }

  /* ---------- Panel de padres ---------- */
  let lp;
  const pb = $('#parentBtn');
  pb.addEventListener('pointerdown', () => { lp = setTimeout(openParent, 1500); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => pb.addEventListener(e, () => clearTimeout(lp)));
  function openParent() {
    $('#parentPanel').classList.remove('hidden');
    $('#pinStep').classList.remove('hidden'); $('#parentTools').classList.add('hidden');
    $('#pinInput').value = ''; $('#pinInput').focus();
  }
  $('#pinOk').addEventListener('click', () => {
    if ($('#pinInput').value !== C.pinPadres) { $('#pinInput').value = ''; return; }
    $('#pinStep').classList.add('hidden'); $('#parentTools').classList.remove('hidden');
    $('#parentCodes').innerHTML = C.pistas.map((p, i) => `${i + 1}. ${p.lugar} — <code>${p.codigo}</code>${i === S.clue && S.stage === 'clue' ? ' ← actual' : ''}`).join('<br>');
  });
  $('#parentClose').addEventListener('click', () => $('#parentPanel').classList.add('hidden'));
  $('#parentTools').addEventListener('click', ev => {
    const a = ev.target.dataset.act; if (!a) return;
    $('#parentPanel').classList.add('hidden');
    if (a === 'skip' && S.stage === 'clue') showPiece(S.clue);
    if (a === 'puzzle') { S.clue = N; go('puzzle'); }
    if (a === 'chest') { S.clue = N; go('chest'); }
    if (a === 'reveal') { S.clue = N; go('reveal'); }
    if (a === 'reset') { S = fresh(); save(); location.reload(); }
  });

  /* ---------- Arranque ---------- */
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  $('#s-intro').classList.add('active');
  current = 'intro';
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

  // modo prueba: ?ir=puzzle | chest | reveal
  const ir = new URLSearchParams(location.search).get('ir');
  if (ir) { S.clue = ir === 'clue' ? 0 : N; Sound.init(); go(ir); }
})();
