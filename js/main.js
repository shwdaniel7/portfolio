// Efeitos da página. Sem JS ou com movimento reduzido, tudo já aparece no estado final.
(() => {
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // quebra o texto em caracteres para a entrada em máscara
  $$('[data-split]').forEach((el, n) => {
    const text = el.textContent;
    if (!el.closest('[aria-label]')) el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    if (el.closest('.name') && el.nextElementSibling) el.style.setProperty('--base', '0ms');
    else if (el.closest('.name')) el.style.setProperty('--base', '220ms');
  });

  // revelações ao rolar
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      if (e.target.matches('[data-count]')) count(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.15 });
  $$('[data-reveal], [data-split], .pcard, [data-count]').forEach((el) => {
    if (el.dataset.d) el.style.setProperty('--d', el.dataset.d);
    io.observe(el);
  });

  function count(el) {
    const to = Number(el.dataset.count);
    if (!motion) return;
    const start = performance.now();
    const fmt = (n) => (el.dataset.prefix ?? '') + n + (el.dataset.suffix ?? '');
    const tick = (now) => {
      const p = Math.min((now - start) / 1400, 1);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(tick);
    };
    el.textContent = fmt(0);
    requestAnimationFrame(tick);
  }

  // o fio: acompanha a rolagem e acende um LED em cada título de seção
  const wire = $('.wire');
  const nodes = [];
  const wp = new Spring(0, 0.3, (v) => wire.style.setProperty('--wp', v.toFixed(4)));
  let docH = 1;
  function layoutWire() {
    docH = document.documentElement.scrollHeight;
    nodes.forEach((n) => n.el.remove());
    nodes.length = 0;
    $$('[data-node]').forEach((h) => {
      const r = h.getBoundingClientRect();
      const y = r.top + scrollY + r.height * 0.5;
      const el = document.createElement('i');
      el.className = 'wire-node';
      el.style.top = y + 'px';
      wire.append(el);
      nodes.push({ el, y });
    });
    onScroll();
  }
  function onScroll() {
    const reach = scrollY + innerHeight * 0.6;
    wp.to(clamp(reach / docH, 0, 1));
    nodes.forEach((n) => n.el.classList.toggle('on', reach >= n.y));
  }

  // navegação: item ativo + traço que desliza com mola
  const links = $$('.nav a.link');
  const ul = $('.nav ul');
  const pill = document.createElement('span');
  pill.className = 'pill';
  ul.append(pill);
  const x = new Spring(0, 0.4, (v) => { pill.style.transform = `translateX(${v}px)`; });
  const w = new Spring(1, 0.4, (v) => { pill.style.width = v + 'px'; });
  let placed = false;
  function place(a) {
    const r = a.getBoundingClientRect();
    const u = ul.getBoundingClientRect();
    pill.style.opacity = 1;
    if (!placed || !motion) { x.v = x.t = r.left - u.left + 8; w.v = w.t = r.width - 16; x.on(x.v); w.on(w.v); placed = true; return; }
    x.to(r.left - u.left + 8); w.to(r.width - 16);
  }
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const so = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const a = byId.get(e.target.id);
      links.forEach((l) => l.removeAttribute('aria-current'));
      if (a) { a.setAttribute('aria-current', 'true'); place(a); } else pill.style.opacity = 0;
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['top', ...byId.keys()].forEach((id) => { const s = document.getElementById(id); if (s) so.observe(s); });

  // se existir assets/contact.gif, ele substitui a rede (js/wired.js)
  const slot = $('.gif-slot img');
  if (slot) {
    const probe = new Image();
    probe.onload = () => { slot.src = probe.src; slot.hidden = false; slot.closest('.gif-slot').classList.add('has-gif'); };
    probe.src = 'assets/contact.gif';
  }

  let sraf = 0;
  addEventListener('scroll', () => { if (!sraf) sraf = requestAnimationFrame(() => { sraf = 0; onScroll(); }); }, { passive: true });
  addEventListener('resize', layoutWire);
  addEventListener('load', layoutWire);
  new ResizeObserver(() => { if (Math.abs(document.documentElement.scrollHeight - docH) > 2) layoutWire(); }).observe(document.body);
  layoutWire();
})();
