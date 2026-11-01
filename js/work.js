// Projetos: galeria horizontal fixada na rolagem (suavizada por mola), inclinação das telas e <dialog> de detalhes.
(() => {
  const root = document.documentElement;
  const motion = root.classList.contains('motion');
  const wide = matchMedia('(min-width: 900px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const gal = $('.gallery');
  const pin = $('.pin');
  const rail = $('.rail');
  let range = 0;
  let top = 0;
  let active = false;

  const sp = new Spring(0, 0.45, (v) => {
    rail.style.transform = `translate3d(${-v * range}px,0,0)`;
    pin.style.setProperty('--gp', v.toFixed(4));
  });

  function progress() {
    return Math.min(1, Math.max(0, range ? (scrollY - top) / range : 0));
  }
  function measure() {
    active = motion && wide.matches;
    if (!active) { gal.style.height = ''; rail.style.transform = ''; return; }
    rail.style.transform = 'none';
    range = Math.max(0, rail.scrollWidth - innerWidth);
    gal.style.height = range + innerHeight + 'px';
    top = gal.getBoundingClientRect().top + scrollY;
    sp.v = sp.t = progress();
    sp.on(sp.v);
  }
  let raf = 0;
  addEventListener('scroll', () => { if (active && !raf) raf = requestAnimationFrame(() => { raf = 0; sp.to(progress()); }); }, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  wide.addEventListener('change', measure);
  new ResizeObserver(measure).observe(rail);
  measure();

  // o foco por teclado não pode empurrar o contêiner fixado: leva a página até o card
  pin.addEventListener('scroll', () => { pin.scrollLeft = 0; });
  rail.addEventListener('focusin', (e) => {
    if (!active) return;
    const card = e.target.closest('.pcard');
    const r = card.getBoundingClientRect();
    if (r.left >= 0 && r.right <= innerWidth) return;
    const pad = parseFloat(getComputedStyle(rail).paddingLeft);
    const p = Math.min(1, Math.max(0, (card.offsetLeft - pad) / range));
    scrollTo({ top: top + p * range, behavior: 'smooth' });
  });

  // inclinação das telas: X e Y em molas independentes, herdam a velocidade do ponteiro
  if (motion && fine) {
    $$('.pcard').forEach((card) => {
      const shot = $('.shot', card);
      const rx = new Spring(0, 0.35, (v) => card.style.setProperty('--rx', v.toFixed(2) + 'deg'));
      const ry = new Spring(0, 0.35, (v) => card.style.setProperty('--ry', v.toFixed(2) + 'deg'));
      shot.addEventListener('pointermove', (e) => {
        const r = shot.getBoundingClientRect();
        ry.to(((e.clientX - r.left) / r.width - 0.5) * 8);
        rx.to(-((e.clientY - r.top) / r.height - 0.5) * 6);
      });
      shot.addEventListener('pointerleave', () => { rx.to(0); ry.to(0); });
    });
  }

  // detalhes
  const dlg = document.getElementById('detail');
  const title = $('h2', dlg);
  const slot = $('.content', dlg);
  let opener = null;

  function open(card) {
    opener = $('.open', card);
    title.textContent = card.dataset.name;
    slot.replaceChildren($('template', card).content.cloneNode(true));
    document.body.classList.add('locked');
    dlg.showModal();
    dlg.scrollTop = 0;
  }
  function close() {
    if (!dlg.open) return;
    if (!motion) return dlg.close();
    dlg.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(16px) scale(.98)' }], { duration: 160, easing: 'ease-in' }).onfinish = () => dlg.close();
  }
  dlg.addEventListener('close', () => { document.body.classList.remove('locked'); opener?.focus({ preventScroll: true }); });
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  $('.close', dlg).addEventListener('click', close);
  $$('.pcard .open').forEach((b) => b.addEventListener('click', () => open(b.closest('.pcard'))));
})();
