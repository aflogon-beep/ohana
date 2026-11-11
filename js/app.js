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

  /* ---------- Premio: parque de atracciones de día ---------- */
  function parkSVG() {
    const INK = '#14234B', G = 520; // G = línea del suelo
    const o = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const flag = (x, y, col) => `<path d="M${x},${y} v-30" ${o(3)}/><path class="pk-flag" d="M${x},${y - 30} l22,7 l-22,7z" fill="${col}" ${o(2.5)}/>`;
    const tower = (x, w, h, roof, wall, top, fl) => {
      const y = G - h;
      let s = `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" fill="${wall}" ${o()}/>`;
      s += `<rect x="${x - w / 2 - 7}" y="${y - 4}" width="${w + 14}" height="14" rx="5" fill="#fff" ${o()}/>`;
      s += `<path d="M${x - w / 2 - 9},${y - 4} L${x},${y - roof} L${x + w / 2 + 9},${y - 4}Z" fill="${top}" ${o()}/>`;
      s += `<circle cx="${x}" cy="${y - roof}" r="6" fill="#FFC93C" ${o(3)}/>`;
      for (let wy = y + 30; wy < G - 50; wy += 62) s += `<rect x="${x - 7}" y="${wy}" width="14" height="24" rx="7" fill="#3D8BF0" ${o(3)}/>`;
      return s + (fl ? flag(x, y - roof - 5, fl) : '');
    };
    const tree = (x, s = 1) => `<g transform="translate(${x} ${G}) scale(${s})"><path d="M0,0 v-34" stroke="#8A4B1E" stroke-width="10" stroke-linecap="round"/><circle cy="-58" r="30" fill="#2FBF71" ${o()}/><circle cx="-9" cy="-66" r="8" fill="#6BE08F"/></g>`;
    const bez = (p, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
    const COLS = ['#FF6B5E', '#FFC93C', '#2FBF71', '#18C5C9', '#7B5CFF', '#FF8FB8'];

    let s = `<svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">`;
    // colinas y césped
    s += `<ellipse cx="250" cy="560" rx="620" ry="130" fill="#8FE08A"/><ellipse cx="1380" cy="570" rx="640" ry="140" fill="#8FE08A"/>`;
    s += `<rect x="-3000" y="${G}" width="7600" height="200" fill="#5FCF78"/><path d="M-3000,${G} H4600" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M690,600 Q760,548 770,${G} H830 Q840,548 910,600Z" fill="#FFE29A" ${o()}/>`;

    // globos aerostáticos
    const balloon = (x, y, a, b, cls) => `<g class="pk-balloon ${cls}" transform="translate(${x} ${y})"><g>
      <path d="M-20,58 L-12,84 M20,58 L12,84" ${o(3)}/>
      <path d="M0,-62 C52,-62 62,-6 26,56 H-26 C-62,-6 -52,-62 0,-62Z" fill="${a}" ${o()}/>
      <path d="M0,-62 C22,-40 22,20 12,56 H-12 C-22,20 -22,-40 0,-62Z" fill="${b}" ${o(3)}/>
      <rect x="-15" y="84" width="30" height="22" rx="5" fill="#D98A45" ${o()}/></g></g>`;
    s += balloon(110, 70, '#FF6B5E', '#FFC93C', 'b1') + balloon(1490, 20, '#7B5CFF', '#FF8FB8', 'b2');

    // noria
    const wx = 285, wy = 285, wr = 180;
    s += `<path d="M${wx},${wy} L${wx - 95},${G} M${wx},${wy} L${wx + 95},${G}" stroke="${INK}" stroke-width="18" stroke-linecap="round"/><path d="M${wx},${wy} L${wx - 95},${G} M${wx},${wy} L${wx + 95},${G}" stroke="#18C5C9" stroke-width="9" stroke-linecap="round"/>`;
    s += `<g transform="translate(${wx} ${wy})"><g class="pk-wheel">`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<path d="M0,0 L${(Math.cos(a) * wr).toFixed(1)},${(Math.sin(a) * wr).toFixed(1)}" ${o(5)}/>`; }
    s += `<circle r="${wr}" fill="none" stroke="${INK}" stroke-width="16"/><circle r="${wr}" fill="none" stroke="#FF6B5E" stroke-width="8"/><circle r="${wr * 0.62}" fill="none" stroke="${INK}" stroke-width="9"/><circle r="${wr * 0.62}" fill="none" stroke="#FFC93C" stroke-width="4"/>`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; s += `<circle cx="${(Math.cos(a) * wr).toFixed(1)}" cy="${(Math.sin(a) * wr).toFixed(1)}" r="24" fill="${COLS[i % 6]}" ${o()}/><circle cx="${(Math.cos(a) * wr - 7).toFixed(1)}" cy="${(Math.sin(a) * wr - 8).toFixed(1)}" r="6" fill="#fff" opacity=".8"/>`; }
    s += `<circle r="26" fill="#FFC93C" ${o()}/><path d="M0,-13 L4,-4 L13,-3 L6,3 L8,12 L0,7 L-8,12 L-6,3 L-13,-3 L-4,-4Z" fill="#fff"/></g></g>`;
    s += `<rect x="${wx - 120}" y="${G - 16}" width="240" height="22" rx="8" fill="#7B5CFF" ${o()}/>`;

    // tiovivo
    const cx = 520;
    s += `<rect x="${cx - 76}" y="${G - 22}" width="152" height="24" rx="8" fill="#FFC93C" ${o()}/>`;
    [-56, 0, 56].forEach((dx, i) => {
      s += `<path d="M${cx + dx},${G - 128} V${G - 22}" stroke="${INK}" stroke-width="7"/><path d="M${cx + dx},${G - 128} V${G - 22}" stroke="#fff" stroke-width="3"/>`;
      s += `<g class="pk-horse h${i}"><ellipse cx="${cx + dx}" cy="${G - 62}" rx="19" ry="11" fill="${['#FF8FB8', '#fff', '#18C5C9'][i]}" ${o(3)}/><circle cx="${cx + dx + 17}" cy="${G - 76}" r="9" fill="${['#FF8FB8', '#fff', '#18C5C9'][i]}" ${o(3)}/></g>`;
    });
    s += `<path d="M${cx - 92},${G - 126} L${cx},${G - 196} L${cx + 92},${G - 126}Z" fill="#FF6B5E" ${o()}/><path d="M${cx - 32},${G - 126} L${cx},${G - 196} L${cx + 32},${G - 126}Z" fill="#fff" ${o(3)}/>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${cx - 77 + i * 30.8}" cy="${G - 124}" r="15.4" fill="${i % 2 ? '#fff' : '#FFC93C'}" ${o(3)}/>`;
    s += `<circle cx="${cx}" cy="${G - 200}" r="9" fill="#FFC93C" ${o(3)}/>` + flag(cx, G - 208, '#7B5CFF');

    // montaña rusa
    const segs = [[[1075, G], [1110, 280], [1170, 200], [1230, 250]], [[1230, 250], [1290, 300], [1280, 430], [1345, 430]], [[1345, 430], [1410, 430], [1400, 170], [1470, 160]], [[1470, 160], [1545, 150], [1570, 360], [1590, G]]];
    const d = segs.map((p, i) => (i ? '' : `M${p[0]}`) + `C${p[1]} ${p[2]} ${p[3]}`).join('');
    segs.forEach(p => { for (let t = 0.12; t < 1; t += 0.2) { const [x, y] = bez(p, t); if (y < G - 30) s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} V${G}" stroke="${INK}" stroke-width="5" opacity=".75"/>`; } });
    s += `<path id="pkTrack" d="${d}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#FF8FB8" stroke-width="8" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" stroke-dasharray="3 14" stroke-linecap="round"/>`;
    [0, 0.34, 0.68].forEach((b, i) => { s += `<g><rect x="-17" y="-28" width="34" height="22" rx="7" fill="${['#FFC93C', '#18C5C9', '#7B5CFF'][i]}" ${o(3)}/><circle cx="0" cy="-32" r="7" fill="#FFD9B8" ${o(2.5)}/><animateMotion dur="9s" begin="-${b}s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear"><mpath href="#pkTrack"/></animateMotion></g>`; });

    // árboles
    s += tree(60, 1.1) + tree(650, .8) + tree(1010, .9) + tree(1050, .7) + tree(1560, 1.1);

    // castillo
    s += tower(712, 46, 300, 96, '#FFC2DA', '#18C5C9', '#FFC93C') + tower(888, 46, 300, 96, '#FFC2DA', '#18C5C9', '#FFC93C');
    s += `<rect x="600" y="${G - 96}" width="400" height="96" fill="#FFD6E6" ${o()}/>`;
    for (let x = 600; x < 1000; x += 40) s += `<rect x="${x + 4}" y="${G - 114}" width="24" height="20" rx="4" fill="#fff" ${o(3)}/>`;
    s += tower(606, 50, 170, 80, '#FFB7D2', '#3D8BF0', '#FF6B5E') + tower(994, 50, 170, 80, '#FFB7D2', '#3D8BF0', '#FF6B5E');
    s += `<rect x="690" y="${G - 210}" width="220" height="210" fill="#FFE3EE" ${o()}/>`;
    for (let x = 690; x < 910; x += 44) s += `<rect x="${x + 6}" y="${G - 228}" width="32" height="20" rx="4" fill="#fff" ${o(3)}/>`;
    s += tower(800, 84, 370, 150, '#FFF0F6', '#3D8BF0', '#FF6B5E');
    s += tower(668, 54, 236, 92, '#FFB7D2', '#7B5CFF', '#FFC93C') + tower(932, 54, 236, 92, '#FFB7D2', '#7B5CFF', '#FFC93C');
    s += `<path d="M762,${G} v-66 a38,38 0 0 1 76,0 v66z" fill="${INK}"/><path d="M772,${G} v-64 a28,28 0 0 1 56,0 v64z" fill="#FFC93C"/><path d="M800,${G - 92} V${G}" stroke="${INK}" stroke-width="3"/>`;
    s += `<circle cx="800" cy="${G - 150}" r="24" fill="#fff" ${o()}/><path d="M800,${G - 150} v-14 M800,${G - 150} l10,6" ${o(3.5)}/>`;

    // banderines
    const bunting = (x1, y1, x2, y2, sag) => {
      const q = t => [(1 - t) ** 2 * x1 + 2 * t * (1 - t) * (x1 + x2) / 2 + t * t * x2, (1 - t) ** 2 * y1 + 2 * t * (1 - t) * ((y1 + y2) / 2 + sag) + t * t * y2];
      let b = `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + sag} ${x2},${y2}" fill="none" ${o(3)}/>`;
      for (let i = 1; i < 9; i++) { const [x, y] = q(i / 9); b += `<path d="M${(x - 9).toFixed(0)},${y.toFixed(0)} h18 l-9,20z" fill="${COLS[i % 6]}" ${o(2.5)}/>`; }
      return b;
    };
    s += bunting(380, G - 130, 580, G - 250, 60) + bunting(1020, G - 250, 1200, G - 150, 60);
    return s + '</svg>';
  }
  let revealed = false;
  async function enterReveal() {
    if (revealed) return;
    revealed = true;
    $('#castle').innerHTML = parkSVG();
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
    // aviso para bajar hasta el mensaje: el parque ocupa la primera pantalla
    const sc = $('#s-reveal'), hint = $('#scrollHint');
    if (sc.scrollHeight > sc.clientHeight + 80 && sc.scrollTop < 40) hint.classList.remove('hidden');
    sc.addEventListener('scroll', () => { if (sc.scrollTop > 40) hint.classList.add('hidden'); }, { passive: true });
    hint.addEventListener('click', () => $('#keepsake').scrollIntoView({ behavior: 'smooth', block: 'center' }));
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
