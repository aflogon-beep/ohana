/* Puzzle del mapa: arrastrar y encajar 6 fragmentos */
window.Puzzle = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SNAP = 60;

  function mount(wrap, opts) {
    const { W, H, pieces } = MapArt;
    wrap.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    wrap.appendChild(svg);

    const board = `
      <rect class="pz-turn" x="-26" y="-26" width="${W + 52}" height="${H + 52}" rx="34"/>
      <rect class="pz-frame" x="-14" y="-14" width="${W + 28}" height="${H + 28}" rx="22"/>
      <use href="#mapArt" opacity=".16"/>
      ${pieces.map(p => `<path class="pz-slot" d="${p.d}"/>`).join('')}`;
    svg.innerHTML = `<g id="pzBoard">${board}</g><g id="pzLocked"></g><g id="pzLoose"></g><g id="pzTop"></g>`;
    const gLocked = svg.querySelector('#pzLocked'), gLoose = svg.querySelector('#pzLoose');

    const st = pieces.map(() => ({ x: 0, y: 0, locked: false }));
    const els = pieces.map((p, i) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'piece');
      g.dataset.i = i;
      g.innerHTML = `
        <path class="shadow" d="${p.d}" transform="translate(10 16)"/>
        <g clip-path="url(#pc${i})"><use href="#mapArt"/></g>
        <path class="outline" d="${p.d}"/>`;
      gLoose.appendChild(g);
      return g;
    });

    let vb;
    function layout() {
      const r = wrap.getBoundingClientRect();
      const aspect = r.width / Math.max(1, r.height);
      if (aspect > 1.25) {
        const h = H + 200, w = Math.max(W + 920, h * aspect);
        vb = { x: (W - w) / 2, y: -100, w, h };
      } else {
        const w = W + 100, h = Math.max(H + 900, w / aspect);
        vb = { x: -50, y: -60, w, h };
      }
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    }
    function scatter() {
      const wide = vb.w / vb.h > 1.25;
      // huecos alrededor del tablero
      const slots = wide
        ? [[vb.x + 130, -40], [vb.x + 150, 200], [vb.x + 120, 440], [W + 40, -40], [W + 60, 230], [W + 30, 470]]
        : [[-20, H + 40], [400, H + 70], [790, H + 40], [-10, H + 380], [410, H + 350], [800, H + 390]];
      const order = [...pieces.keys()].sort(() => Math.random() - 0.5);
      order.forEach((pi, k) => {
        if (st[pi].locked) return;
        const p = pieces[pi], [sx, sy] = slots[k];
        st[pi].x = sx - p.x0 + (Math.random() - 0.5) * 30;
        st[pi].y = sy - p.y0 + (Math.random() - 0.5) * 30;
        place(pi);
      });
    }
    function place(i) { els[i].setAttribute('transform', `translate(${st[i].x.toFixed(1)} ${st[i].y.toFixed(1)})`); }
    function pt(ev) {
      const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    }

    let drag = null;
    svg.addEventListener('pointerdown', ev => {
      const g = ev.target.closest('.piece');
      if (!g || drag) return;
      const i = +g.dataset.i;
      if (st[i].locked) return;
      ev.preventDefault();
      svg.setPointerCapture(ev.pointerId);
      const p = pt(ev);
      drag = { i, id: ev.pointerId, ox: p.x - st[i].x, oy: p.y - st[i].y };
      gLoose.appendChild(g);
      g.classList.add('dragging');
      g.querySelector('.shadow').setAttribute('transform', 'translate(18 28)');
      Sound.play('pick');
    });
    svg.addEventListener('pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const p = pt(ev);
      st[drag.i].x = p.x - drag.ox; st[drag.i].y = p.y - drag.oy;
      place(drag.i);
    });
    const end = ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const i = drag.i, g = els[i];
      drag = null;
      g.classList.remove('dragging');
      g.querySelector('.shadow').setAttribute('transform', 'translate(10 16)');
      if (Math.hypot(st[i].x, st[i].y) < SNAP) {
        st[i].x = 0; st[i].y = 0; st[i].locked = true; place(i);
        g.classList.add('locked');
        g.querySelector('.shadow').remove();
        gLocked.appendChild(g);
        const glow = document.createElementNS(NS, 'path');
        glow.setAttribute('d', pieces[i].d); glow.setAttribute('fill', 'none'); glow.setAttribute('class', 'piece-glow');
        gLocked.appendChild(glow); setTimeout(() => glow.remove(), 1100);
        Sound.play('snap');
        try { navigator.vibrate && navigator.vibrate(30); } catch (e) {}
        const r = g.getBoundingClientRect();
        FX.sparks(r.left + r.width / 2, r.top + r.height / 2, 30, { speed: 7 });
        opts.onPlaced && opts.onPlaced(st.filter(s => s.locked).length, st.length);
        if (st.every(s => s.locked)) finish();
      }
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);

    function finish() {
      const top = svg.querySelector('#pzTop');
      top.innerHTML = `
        <path d="${MapArt.trailD()}" fill="none" stroke="#14234B" stroke-width="16" stroke-linecap="round" class="trail-draw"/>
        <path d="${MapArt.trailD()}" fill="none" stroke="#FFC93C" stroke-width="9" stroke-linecap="round" class="trail-draw"/>
        <g class="map-x">
          <circle cx="${MapArt.X.x}" cy="${MapArt.X.y}" r="58" fill="none" stroke="#14234B" stroke-width="10" stroke-dasharray="6 12" stroke-linecap="round"/>
          <circle cx="${MapArt.X.x}" cy="${MapArt.X.y}" r="58" fill="none" stroke="#FFC93C" stroke-width="5" stroke-dasharray="6 12" stroke-linecap="round"/>
        </g>`;
      Sound.play('mapDone');
      setTimeout(() => FX.confetti(90), 600);
      opts.onDone && setTimeout(opts.onDone, 2600);
    }

    layout(); scatter();
    let rt;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { layout(); scatter(); }, 200); };
    addEventListener('resize', onResize);
    return { solveAll() { st.forEach((s, i) => { s.x = 0; s.y = 0; s.locked = true; place(i); els[i].classList.add('locked'); els[i].querySelector('.shadow')?.remove(); }); finish(); } };
  }
  return { mount };
})();
