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
    $('#s-' + stage).classList.add('active');
    $('#hud').classList.toggle('hidden', ['intro', 'reveal'].includes(stage));
    current = stage;
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
    return `<div class="avatar"><div class="medallion">${src ? `<img src="${src}" alt="${name}" onerror="this.outerHTML='<div class=&quot;mono&quot;>${name[0]}</div>'">` : `<div class="mono">${name[0]}</div>`}</div>${name}</div>`;
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
    const P = C.pistas[S.clue];
    $('#clueNum').textContent = `Fragmento ${S.clue + 1} de ${N}`;
    $('#clueTitle').textContent = P.titulo;
    $('#riddle').innerHTML = P.enigma.map(l => `<p>${l}</p>`).join('');
    renderHints();
    $('#clueMascot').innerHTML = mascot(M[S.clue % Math.max(1, M.length)], 'm-clue');
    $('#codeInput').value = ''; $('#codeMsg').textContent = ''; $('#codeMsg').className = 'code-msg';
    const lines = [...document.querySelectorAll('#riddle p')];
    for (let i = 0; i < lines.length; i++) { await wait(i ? 650 : 500); lines[i].classList.add('on'); }
  }
  function renderHints() {
    const P = C.pistas[S.clue], n = S.hints[S.clue] || 0;
    $('#hints').innerHTML = P.ayudas.slice(0, n).map((h, i) => `<div class="hint"><b>Ayuda ${i + 1}:</b> ${h}</div>`).join('');
    $('#btnHint').classList.toggle('hidden', n >= P.ayudas.length);
    $('#btnHint').textContent = n === 0 ? '✧ Necesitamos una ayuda' : '✧ Necesitamos otra ayuda';
  }
  $('#btnHint').addEventListener('click', () => {
    S.hints[S.clue] = (S.hints[S.clue] || 0) + 1; save();
    Sound.play('hint'); renderHints();
  });
  $('#codeInput').addEventListener('input', () => Sound.play('key'));
  const BAD = ['Ese código no abre nada… seguid buscando.', 'Las runas no brillan. Revisad bien las letras.', 'El mapa no reconoce ese código. ¿Seguro que es aquí?'];
  let badN = 0;
  $('#codeForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const v = norm($('#codeInput').value);
    if (!v) return;
    const P = C.pistas[S.clue], msg = $('#codeMsg');
    if (v === norm(P.codigo)) {
      $('#codeInput').blur();
      msg.className = 'code-msg good'; msg.textContent = '¡Las runas brillan!';
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
    $('#ovPhrase').innerHTML = 'Palabras del pergamino: ' + words.map((w, k) => k === i ? `<em>${w}</em>` : w).join(' · ') + (last ? '…' : '');
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
    requestAnimationFrame(() => {
      window.__pz = puzzle = Puzzle.mount($('#puzzleWrap'), {
        onDone() { $('#btnToChest').classList.remove('hidden'); $('#btnToChest').classList.add('pulse'); }
      });
    });
  }
  $('#btnToChest').addEventListener('click', () => { Sound.play('click'); go('chest'); });

  /* ---------- Cofre ---------- */
  const MILESTONES = [
    [0, `Está sellado con cadenas antiguas… ¡${C.jugadores.join(' y ')}, golpeadlo a la vez para romperlas!`],
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

  /* ---------- Premio ---------- */
  function castleSVG() {
    const R = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    const tower = (x, base, w, h, roof, fill, lit) => {
      let o = `<rect x="${x - w / 2}" y="${base - h}" width="${w}" height="${h}" fill="${fill}"/>`;
      o += `<path d="M${x - w / 2 - 6},${base - h} L${x},${base - h - roof} L${x + w / 2 + 6},${base - h}Z" fill="${fill}"/>`;
      o += `<path d="M${x},${base - h - roof} v-22" stroke="${fill}" stroke-width="2"/><path d="M${x},${base - h - roof - 22} l16,5 l-16,5z" fill="#ff7aa8" opacity=".9"/>`;
      if (lit) for (let i = 0; i < 3; i++) if (R() < 0.75) o += `<rect x="${x - 3}" y="${base - h + 18 + i * 30}" width="6" height="12" rx="3" fill="#ffd98a" opacity=".9"/>`;
      return o;
    };
    let s = `<svg viewBox="0 0 1200 500" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="csA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a6e"/><stop offset="1" stop-color="#1a1240"/></linearGradient>
      <linearGradient id="csB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#24184e"/><stop offset="1" stop-color="#0d0828"/></linearGradient>
      <radialGradient id="csGlow" cx="50%" cy="80%" r="50%"><stop offset="0" stop-color="#ffb3d1" stop-opacity=".55"/><stop offset="1" stop-color="#ffb3d1" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="600" cy="420" rx="520" ry="200" fill="url(#csGlow)"/>`;
    // fondo
    [[380, 330, 34, 150, 70], [820, 330, 34, 150, 70], [470, 330, 30, 210, 80], [730, 330, 30, 210, 80]].forEach(t => s += tower(t[0], t[1] + 100, t[2], t[3], t[4], 'url(#csA)', true));
    // cuerpo principal
    s += `<rect x="430" y="300" width="340" height="130" fill="url(#csB)"/>`;
    for (let x = 430; x < 770; x += 20) s += `<rect x="${x}" y="290" width="12" height="12" fill="url(#csB)"/>`;
    s += tower(600, 330, 70, 220, 120, 'url(#csB)', true);
    s += tower(540, 330, 40, 150, 90, 'url(#csB)', true) + tower(660, 330, 40, 150, 90, 'url(#csB)', true);
    s += tower(440, 430, 44, 170, 80, 'url(#csB)', true) + tower(760, 430, 44, 170, 80, 'url(#csB)', true);
    s += `<path d="M570,430 v-50 a30,30 0 0 1 60,0 v50z" fill="#ffcf7a" opacity=".85"/>`;
    s += `<path d="M-3000,520 V440 Q300,400 600,428 Q900,400 4200,440 V520Z" fill="#0b0720"/></svg>`;
    return s;
  }
  function stars() {
    let h = '';
    for (let i = 0; i < 140; i++) h += `<circle cx="${(Math.random() * 100).toFixed(2)}%" cy="${(Math.random() * 70).toFixed(2)}%" r="${(Math.random() * 1.4 + 0.3).toFixed(2)}" fill="#fff" opacity="${(Math.random() * 0.7 + 0.2).toFixed(2)}"><animate attributeName="opacity" values="1;.2;1" dur="${(2 + Math.random() * 4).toFixed(1)}s" repeatCount="indefinite" begin="${(Math.random() * 3).toFixed(1)}s"/></circle>`;
    return `<svg width="100%" height="100%" style="position:absolute;inset:0">${h}</svg>`;
  }
  let revealed = false;
  async function enterReveal() {
    if (revealed) return;
    revealed = true;
    document.getElementById('ambient').style.opacity = '0';
    $('.night').innerHTML = stars();
    $('#castle').innerHTML = castleSVG();
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
          <div><small>OS ESPERAN</small>Mickey y Stitch ✦</div>
        </div>
      </div>
      <div class="stub"><small>VÁLIDO PARA</small><b>5</b><small>DÍAS</small><b>4</b><small>NOCHES</small></div>`;
    $('#finalMsg').innerHTML = `<div class="date">${C.fechaBoda}</div>` + C.mensajeFinal.map(l => `<div>${l}</div>`).join('') + `<div class="sig">${C.firma}</div>`;
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
    FX.startFireworks();
    FX.confetti(220);
    await wait(2600);
    for (const s of steps.slice(2)) { s.classList.add('on'); await wait(1400); }
    setInterval(() => FX.confetti(60), 9000);
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
