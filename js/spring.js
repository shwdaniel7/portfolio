// Mola criticamente amortecida (apple-design): parte do valor atual e herda a velocidade,
// então pode ser interrompida e redirecionada a qualquer momento. `response` em segundos.
(() => {
  const active = new Set();
  let raf = 0;
  let last = 0;

  function step(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    for (const s of active) {
      s.vel += (-s.k * (s.v - s.t) - s.c * s.vel) * dt;
      s.v += s.vel * dt;
      if (Math.abs(s.v - s.t) < 0.001 && Math.abs(s.vel) < 0.001) {
        s.v = s.t;
        active.delete(s);
      }
      s.on?.(s.v);
    }
    raf = active.size ? requestAnimationFrame(step) : 0;
  }

  window.Spring = class Spring {
    constructor(value = 0, response = 0.35, onUpdate) {
      this.v = this.t = value;
      this.vel = 0;
      this.k = (2 * Math.PI / response) ** 2;
      this.c = 2 * Math.sqrt(this.k);
      this.on = onUpdate;
    }
    to(target) {
      this.t = target;
      active.add(this);
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    }
  };
})();
