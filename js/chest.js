/* El Cofre Ohana: SVG + mecánica de 100 toques */
window.Chest = (function () {
  function chain(id, x1, y1, x2, y2) {
    const n = 15, dx = (x2 - x1) / n, dy = (y2 - y1) / n, ang = Math.atan2(dy, dx) * 180 / Math.PI;
    let s = `<g id="${id}">`;
    for (let i = 0; i <= n; i++) {
      const x = x1 + dx * i, y = y1 + dy * i, flat = i % 2;
      s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})">` +
        (flat ? `<rect x="-15" y="-3.5" width="30" height="7" rx="3.5" fill="url(#chIron)" stroke="#14234B" stroke-width="1.5"/>`
              : `<ellipse rx="16" ry="10" fill="none" stroke="#14234B" stroke-width="8"/><ellipse rx="16" ry="10" fill="none" stroke="url(#chIron)" stroke-width="5"/>`) +
        `</g>`;
    }
    return s + '</g>';
  }
  function rivets(xs, ys) {
    let s = '';
    xs.forEach(x => ys.forEach(y => { s += `<circle cx="${x}" cy="${y}" r="5" fill="url(#chGold)" stroke="#14234B" stroke-width="1.2"/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.6" fill="#fff8d8"/>`; }));
    return s;
  }
  const CRACKS = [
    'M300,262 L318,290 L306,318 L330,350 L318,392',
    'M150,300 L182,318 L176,346 L214,370',
    'M450,286 L420,312 L432,338 L398,372 L410,410',
    'M220,170 L248,190 L240,214 L272,236',
    'M380,168 L352,196 L366,222 L340,244',
    'M120,410 L160,396 L172,426 L210,420',
    'M480,404 L446,392 L440,428 L404,436'
  ];

  function svg() {
    return `<svg viewBox="0 0 600 520" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#D98A45"/><stop offset=".5" stop-color="#B5682F"/><stop offset="1" stop-color="#8A4B1E"/></linearGradient>
        <linearGradient id="chWoodLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#E69B55"/><stop offset=".6" stop-color="#C2733A"/><stop offset="1" stop-color="#9A5626"/></linearGradient>
        <linearGradient id="chGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFF3B0"/><stop offset=".45" stop-color="#FFC93C"/><stop offset="1" stop-color="#F29E0C"/></linearGradient>
        <linearGradient id="chGoldV" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#F29E0C"/><stop offset=".3" stop-color="#FFE27A"/><stop offset=".6" stop-color="#FFC93C"/><stop offset="1" stop-color="#E58A0C"/></linearGradient>
        <linearGradient id="chIron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#F2F6FF"/><stop offset=".45" stop-color="#A9B6D6"/><stop offset="1" stop-color="#6F7FA8"/></linearGradient>
        <radialGradient id="chRuby" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#FFD0CB"/><stop offset=".35" stop-color="#FF6B5E"/><stop offset="1" stop-color="#C23A30"/></radialGradient>
        <radialGradient id="chInner" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#fffbe6"/><stop offset=".35" stop-color="#ffd76a" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a2a" stop-opacity="0"/></radialGradient>
        <filter id="chGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <pattern id="chGrain" width="60" height="18" patternUnits="userSpaceOnUse">
          <path d="M0,5 q15,-3 30,0 t30,0 M0,13 q20,3 40,0 t20,0" fill="none" stroke="#6B3512" stroke-width="1" opacity=".45"/></pattern>
      </defs>
      <ellipse cx="300" cy="474" rx="250" ry="26" fill="#14234B" opacity=".22"/>
      <ellipse id="innerGlow" cx="300" cy="250" rx="230" ry="160" fill="url(#chInner)" opacity="0"/>
      <g id="chestG">
        <!-- cuerpo -->
        <rect x="90" y="250" width="420" height="214" rx="8" fill="url(#chWood)" stroke="#14234B" stroke-width="4"/>
        <rect x="90" y="250" width="420" height="214" rx="8" fill="url(#chGrain)"/>
        ${[300, 352, 404].map(y => `<line x1="94" y1="${y}" x2="506" y2="${y}" stroke="#14234B" stroke-width="3"/><line x1="94" y1="${y + 2.5}" x2="506" y2="${y + 2.5}" stroke="#F2B77E" stroke-width="1" opacity=".5"/>`).join('')}
        ${[[90, 0], [283, 0], [476, 0]].map(([x]) => `<rect x="${x}" y="250" width="34" height="214" fill="url(#chGoldV)" stroke="#14234B" stroke-width="2"/>`).join('')}
        <rect x="86" y="446" width="428" height="20" rx="4" fill="url(#chGold)" stroke="#14234B" stroke-width="2"/>
        ${rivets([107, 300, 493], [275, 325, 377, 429])}
        <g id="cracks" filter="url(#chGlow)">${CRACKS.map(d => `<path d="${d}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="#ffe08a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>
        <!-- cerradura -->
        <path d="M262,252 h76 v40 q0,34 -38,48 q-38,-14 -38,-48z" fill="url(#chGold)" stroke="#14234B" stroke-width="3"/>
        <circle cx="300" cy="286" r="9" fill="#14234B"/><path d="M295,290 h10 l4,24 h-18z" fill="#14234B"/>
        <!-- tapa -->
        <g id="lid">
          <path d="M90,252 V196 Q90,118 300,112 Q510,118 510,196 V252 Z" fill="url(#chWoodLid)" stroke="#14234B" stroke-width="4"/>
          <path d="M90,252 V196 Q90,118 300,112 Q510,118 510,196 V252 Z" fill="url(#chGrain)"/>
          <path d="M96,200 Q300,150 504,200" fill="none" stroke="#14234B" stroke-width="3"/>
          ${[[107], [300], [493]].map(([x]) => `<path d="M${x - 17},252 V${x === 300 ? 112 : 168} ${x === 300 ? '' : ''} h34 V252z" fill="url(#chGoldV)" stroke="#14234B" stroke-width="2"/>`).join('')}
          <rect x="86" y="236" width="428" height="20" rx="4" fill="url(#chGold)" stroke="#14234B" stroke-width="2"/>
          ${rivets([107, 493], [190, 220])}
          <g transform="translate(300 172)">
            <circle r="30" fill="url(#chGold)" stroke="#14234B" stroke-width="3"/>
            <path d="M0,-20 L17,0 L0,20 L-17,0Z" fill="url(#chRuby)" stroke="#14234B" stroke-width="2"/>
            <path d="M-6,-8 L0,-16 L4,-6Z" fill="#fff" opacity=".7"/>
          </g>
        </g>
        <line id="seam" x1="96" y1="252" x2="504" y2="252" stroke="#ffe7a0" stroke-width="5" filter="url(#chGlow)" opacity="0"/>
        ${chain('chain1', 70, 190, 530, 440)}
        ${chain('chain2', 530, 190, 70, 440)}
        <!-- candado -->
        <g id="padlock" transform="translate(300 318)">
          <path d="M-30,0 V-30 a30,30 0 0 1 60,0 V0" fill="none" stroke="#14234B" stroke-width="15"/>
          <path d="M-30,0 V-30 a30,30 0 0 1 60,0 V0" fill="none" stroke="url(#chIron)" stroke-width="10"/>
          <rect x="-46" y="-4" width="92" height="76" rx="12" fill="url(#chIron)" stroke="#14234B" stroke-width="3"/>
          <rect x="-40" y="2" width="80" height="64" rx="9" fill="none" stroke="#ffffff" stroke-width="1.5" opacity=".5"/>
          <circle cy="26" r="9" fill="#14234B"/><path d="M-4,30 h8 l3,20 h-14z" fill="#14234B"/>
          <text y="-10" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="14" fill="#6F7FA8" opacity="0">O</text>
        </g>
      </g>
    </svg>`;
  }

  let state = null;
  function mount(holder, opts) {
    holder.innerHTML = svg();
    const $ = s => holder.querySelector(s);
    state = { n: 0, total: opts.total, done: false, broke1: false, broke2: false };
    const crackEls = [...holder.querySelectorAll('#cracks path')];
    const wrap = opts.tapArea;
    const rays = document.querySelector('.chest-rays');

    function render() {
      const p = state.n / state.total;
      $('#seam').setAttribute('opacity', Math.min(1, p * 1.2).toFixed(2));
      crackEls.forEach((el, i) => {
        const start = 0.12 + i * 0.1, local = Math.max(0, Math.min(1, (p - start) / 0.18));
        el.setAttribute('stroke-dashoffset', (1 - local).toFixed(3));
      });
      $('#innerGlow').setAttribute('opacity', Math.max(0, (p - 0.5) * 0.9).toFixed(2));
      if (rays) rays.style.opacity = Math.max(0, (p - 0.4) * 1.2).toFixed(2);
      $('#chestG').classList.toggle('quake', p >= 0.85 && !state.done);
      opts.onProgress && opts.onProgress(state.n, state.total);
    }
    function breakChain(id) {
      const ch = $(id);
      ch.style.transformBox = 'view-box'; ch.style.transformOrigin = '300px 300px';
      ch.classList.add('chain-fall');
      Sound.play('chain');
      try { navigator.vibrate && navigator.vibrate([60, 40, 120]); } catch (e) {}
      const r = holder.getBoundingClientRect();
      FX.sparks(r.left + r.width / 2, r.top + r.height * 0.55, 60, { speed: 9, colors: ['#A9B6D6', '#FFC93C', '#ffffff'] });
    }
    function onTap(ev) {
      if (state.done) return;
      ev.preventDefault();
      state.n++;
      const g = $('#chestG');
      g.classList.remove('bump'); void g.getBBox(); g.classList.add('bump');
      Sound.play('knock', state.n, state.total);
      try { navigator.vibrate && navigator.vibrate(14); } catch (e) {}
      FX.sparks(ev.clientX, ev.clientY, 8 + Math.round(state.n / 8), { speed: 4 + state.n / 20, size: 2.2 });
      if (!state.broke1 && state.n >= Math.round(state.total * 0.34)) { state.broke1 = true; breakChain('#chain1'); }
      if (!state.broke2 && state.n >= Math.round(state.total * 0.67)) { state.broke2 = true; breakChain('#chain2'); }
      render();
      if (state.n >= state.total) open();
    }
    function open() {
      state.done = true;
      wrap.removeEventListener('pointerdown', onTap);
      $('#chestG').classList.remove('quake');
      const pad = $('#padlock');
      pad.style.transformBox = 'view-box'; pad.style.transformOrigin = '300px 318px';
      pad.classList.add('chain-fall');
      Sound.play('unlock');
      try { navigator.vibrate && navigator.vibrate([100, 50, 100, 50, 300]); } catch (e) {}
      setTimeout(() => {
        $('#lid').classList.add('open');
        $('#innerGlow').setAttribute('opacity', '1');
        const r = holder.getBoundingClientRect();
        FX.sparks(r.left + r.width / 2, r.top + r.height * 0.45, 140, { speed: 14, up: 5, size: 3.5 });
        opts.onOpen && opts.onOpen();
      }, 2100);
    }
    wrap.addEventListener('pointerdown', onTap);
    render();
  }
  return { mount };
})();
