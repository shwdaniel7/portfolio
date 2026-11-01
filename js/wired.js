// "The Wired": uma rede de nós que reage ao ponteiro, no espaço do GIF da seção de contato.
// Sem movimento permitido, desenha um único quadro estático.
(() => {
  const canvas = document.querySelector('.gif-slot canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const motion = document.documentElement.classList.contains('motion');
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const C = { line: color('--line'), muted: color('--muted'), led: color('--led'), crt: color('--crt') };
  const LABELS = ['NAVI', 'Layer 07', 'Protocol 7', 'Knights', 'Wired'];

  const LINK = 112;      // distância máxima entre nós para haver fio
  const REACH = 150;    // alcance do ponteiro
  let w = 0, h = 0, dpr = 1;
  let nodes = [];
  let packets = [];
  const pointer = { x: 0, y: 0, active: false };
  let visible = false;
  let raf = 0;
  let lastPacket = 0;

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((w * h) / 4300);
    nodes = Array.from({ length: count }, (_, i) => ({
      x: 0, y: 0, hx: Math.random() * w, hy: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      label: i < LABELS.length ? LABELS[i] : null,
    }));
    nodes.forEach((n) => { n.x = n.hx; n.y = n.hy; });
    packets = [];
    if (!motion) draw(0);
  }

  function step(t) {
    // sem ponteiro, um "fantasma" percorre a rede devagar
    const px = pointer.active ? pointer.x : w * (0.5 + 0.34 * Math.sin(t / 2600));
    const py = pointer.active ? pointer.y : h * (0.5 + 0.34 * Math.sin(t / 3300 + 1));
    pointer.gx = px; pointer.gy = py;
    for (const n of nodes) {
      const dx = px - n.x, dy = py - n.y, d = Math.hypot(dx, dy);
      if (d < REACH && d > 1) {
        const f = (1 - d / REACH) * (pointer.active ? 0.05 : 0.012); // atração suave
        n.vx += (dx / d) * f; n.vy += (dy / d) * f;
      }
      // mola de volta para a posição de origem: a rede se estica com o ponteiro e se recompõe
      n.vx += (n.hx - n.x) * 0.0016; n.vy += (n.hy - n.y) * 0.0016;
      n.vx *= 0.97; n.vy *= 0.97;
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) { n.vx *= -1; n.x = Math.min(w, Math.max(0, n.x)); }
      if (n.y < 0 || n.y > h) { n.vy *= -1; n.y = Math.min(h, Math.max(0, n.y)); }
      n.vx += (Math.random() - 0.5) * 0.01; n.vy += (Math.random() - 0.5) * 0.01;
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const links = [];
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < LINK) {
          links.push([nodes[i], nodes[j]]);
          ctx.strokeStyle = rgba(C.line, (1 - d / LINK) * 0.9);
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
        }
      }
    }
    const px = pointer.gx ?? w / 2, py = pointer.gy ?? h / 2;
    for (const n of nodes) {
      const d = Math.hypot(px - n.x, py - n.y);
      const near = d < REACH;
      if (near) {
        ctx.strokeStyle = rgba(C.led, (1 - d / REACH) * (pointer.active ? 0.85 : 0.35));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(n.x, n.y); ctx.stroke();
      }
      ctx.fillStyle = near ? rgba(C.led, 0.5 + 0.5 * (1 - d / REACH)) : rgba(C.muted, 0.7);
      ctx.beginPath(); ctx.arc(n.x, n.y, near ? 3 : 2, 0, Math.PI * 2); ctx.fill();
      if (n.label) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = rgba(near ? C.led : C.muted, near ? 0.95 : 0.55);
        ctx.fillText(n.label, n.x + 7, n.y + 3);
      }
    }
    // o ponteiro: um nó maior, com halo
    const g = ctx.createRadialGradient(px, py, 0, px, py, 34);
    g.addColorStop(0, rgba(C.led, pointer.active ? 0.55 : 0.28)); g.addColorStop(1, rgba(C.led, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.led; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill();

    // pacotes de dados correndo pelos fios
    if (motion && t - lastPacket > 450 && links.length && packets.length < 7) {
      lastPacket = t;
      packets.push({ link: links[(Math.random() * links.length) | 0], t0: t });
    }
    packets = packets.filter((p) => t - p.t0 < 900);
    for (const p of packets) {
      const k = (t - p.t0) / 900;
      const [a, b] = p.link;
      const x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k;
      ctx.fillStyle = rgba(C.crt, 1 - Math.abs(k - 0.5) * 1.4);
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
    }
  }

  function loop(t) {
    if (!visible) { raf = 0; return; }
    step(t); draw(t);
    raf = requestAnimationFrame(loop);
  }

  if (motion) {
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.active = true;
    });
    canvas.addEventListener('pointerleave', () => { pointer.active = false; });
    new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(canvas);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
})();
