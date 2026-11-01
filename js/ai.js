// IA: tabs de casos reais; os passos entram em sequência (todos visíveis com movimento reduzido).
(() => {
  const motion = document.documentElement.classList.contains('motion');
  const rep = document.getElementById('replay');
  if (!rep) return;
  const tabs = rep.querySelector('.cases');
  const panels = [...rep.querySelectorAll('.panel')];
  let timers = [];
  let current = 0;

  const buttons = panels.map((p, i) => {
    p.id = `panel-${p.dataset.case}`;
    p.setAttribute('aria-labelledby', `tab-${p.dataset.case}`);
    const b = document.createElement('button');
    b.type = 'button';
    b.id = `tab-${p.dataset.case}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', p.id);
    b.innerHTML = `${p.dataset.title}<span>${p.dataset.sub}</span>`;
    b.addEventListener('click', () => select(i, true));
    b.addEventListener('keydown', (e) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (i + d + panels.length) % panels.length;
      select(n, true);
      buttons[n].focus();
    });
    tabs.append(b);
    return b;
  });

  function select(i, play) {
    timers.forEach(clearTimeout);
    timers = [];
    current = i;
    panels.forEach((p, k) => {
      const on = k === i;
      p.classList.toggle('on', on);
      p.hidden = !on;
      buttons[k].setAttribute('aria-selected', on);
      buttons[k].tabIndex = on ? 0 : -1;
    });
    const p = panels[i];
    const steps = [...p.querySelectorAll('.steps li')];
    p.classList.remove('done');
    steps.forEach((li) => li.classList.remove('on'));
    p.style.setProperty('--sp', 0);
    if (!motion) {
      steps.forEach((li) => li.classList.add('on'));
      p.style.setProperty('--sp', 1);
      p.classList.add('done');
      return;
    }
    if (!play) return;
    steps.forEach((li, k) => timers.push(setTimeout(() => {
      li.classList.add('on');
      p.style.setProperty('--sp', (k + 1) / steps.length);
      if (k === steps.length - 1) timers.push(setTimeout(() => p.classList.add('done'), 500));
    }, 350 + k * 950)));
  }

  select(0, false);
  if (motion) {
    const io = new IntersectionObserver((es) => {
      if (es[0].isIntersecting) { select(current, true); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(rep);
  }
})();
