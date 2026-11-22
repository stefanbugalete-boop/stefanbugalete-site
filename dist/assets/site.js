// The lamp and the windows on the home page, the portfolio filter, the menu, the form.
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // entrance
  document.querySelectorAll('[data-enter]').forEach((el, i) => el.style.setProperty('--i', i));
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('entered')));

  // header
  const bar = document.querySelector('.bar');
  const onScroll = () => bar && bar.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  // phone menu
  const menu = document.querySelector('.menu');
  if (menu && bar) {
    const set = (open) => {
      bar.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? menu.dataset.close : menu.dataset.open;
      document.body.style.overflow = open ? 'hidden' : '';
    };
    menu.addEventListener('click', () => set(menu.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && bar.classList.contains('is-open')) { set(false); menu.focus(); } });
  }

  // ---------- home: the projects turn behind the title ----------
  const hero = document.querySelector('.hw-hero');
  if (hero) {
    const slides = [...hero.querySelectorAll('.hw-slide')], steps = [...hero.querySelectorAll('.hw-step')];
    const now = hero.querySelector('.hw-bar__now'), nTitle = hero.querySelector('.hw-bar__title'), nCat = hero.querySelector('.hw-bar__cat'), nNum = hero.querySelector('.hw-bar__n');
    const DUR = 6000; let cur = 0, timer = null;
    hero.style.setProperty('--slide', DUR + 'ms');
    slides.forEach((s, k) => { if (k) s.querySelector('img').loading = 'eager'; });
    const show = (i) => {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle('is-on', k === cur); s.setAttribute('aria-hidden', String(k !== cur)); });
      steps.forEach((s, k) => { s.classList.toggle('is-on', k === cur); if (k === cur) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current'); });
      const s = slides[cur];
      now.href = s.getAttribute('href'); nTitle.textContent = s.dataset.title; nCat.textContent = s.dataset.cat; nNum.textContent = String(cur + 1).padStart(2, '0');
    };
    const play = () => {
      clearInterval(timer); if (reduced) return;
      hero.classList.remove('is-playing'); void hero.offsetWidth; hero.classList.add('is-playing');
      timer = setInterval(() => { if (!document.hidden) { show(cur + 1); hero.classList.remove('is-playing'); void hero.offsetWidth; hero.classList.add('is-playing'); } }, DUR);
    };
    steps.forEach((s, k) => s.addEventListener('click', () => { show(k); play(); }));
    play();
  }


  // ---------- trial homes: an endless scroll through every project ----------
  const inf = document.querySelector('.inf');
  if (inf) {
    const mode = inf.dataset.mode;
    let target = 0, pos = 0, last = performance.now();
    const drift = reduced ? 0 : 0.35;          // the page keeps moving gently on its own
    addEventListener('wheel', (e) => { e.preventDefault(); target += e.deltaY; }, { passive: false });
    let ty = null;
    addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchmove', (e) => { if (ty === null) return; const y = e.touches[0].clientY; target += (ty - y) * 1.6; ty = y; }, { passive: true });
    addEventListener('touchend', () => { ty = null; });
    addEventListener('keydown', (e) => {
      const step = { ArrowDown: 120, ArrowUp: -120, PageDown: innerHeight * .8, PageUp: -innerHeight * .8, ' ': innerHeight * .8 }[e.key];
      if (step && !document.querySelector('.bar.is-open')) { e.preventDefault(); target += step; }
    });
    const mod = (a, n) => ((a % n) + n) % n;

    let place;
    if (mode === 'colaj') {
      const items = [...inf.querySelectorAll('.inf-item')];
      let L = 0, base = [];
      const measure = () => {
        const n = items.length;
        L = Math.max(n * innerHeight * 0.36, innerHeight * 3);          // one full loop of the collage
        base = items.map((el, k) => ({ el, y: (k / n) * L, s: parseFloat(el.style.getPropertyValue('--s')) || 1, h: el.offsetHeight || 300 }));
      };
      measure(); addEventListener('resize', measure);
      items.forEach((el) => el.querySelector('img').addEventListener('load', measure, { once: true }));
      place = () => {
        for (const b of base) {
          // each picture loops through the same tall field at its own speed; it re-enters below when it leaves above
          const y = mod(b.y - pos * b.s, L) - b.h;
          b.el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        }
      };
    } else {
      const cols = [...inf.querySelectorAll('.inf-col')].map((c) => {
        const track = c.querySelector('.inf-track');
        track.innerHTML += track.innerHTML;                              // a second copy closes the loop
        track.querySelectorAll('.inf-item').forEach((a, k, all) => { if (k >= all.length / 2) { a.tabIndex = -1; a.setAttribute('aria-hidden', 'true'); } });
        return { track, s: parseFloat(c.dataset.speed) || 1, H: 0 };
      });
      const measure = () => cols.forEach((c) => { c.H = c.track.scrollHeight / 2; });
      measure(); addEventListener('resize', measure); addEventListener('load', measure);
      place = () => cols.forEach((c) => { if (c.H) c.track.style.transform = `translate3d(0, ${(-mod(pos * c.s, c.H)).toFixed(1)}px, 0)`; });
    }

    const loop = (now) => {
      const dt = Math.min(64, now - last); last = now;
      if (!document.hidden) target += drift * dt / 16;
      pos += (target - pos) * (reduced ? 1 : 0.085);
      place();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ---------- portfolio filter ----------
  const filters = document.querySelector('.filters');
  if (filters) {
    const cards = [...document.querySelectorAll('.pf-grid .hw-card')];
    const status = document.querySelector('[data-filter-status]');
    const grid = document.querySelector('.pf-grid');
    const apply = (cat, push) => {
      if (!filters.querySelector(`[data-filter="${cat}"]`)) cat = 'all';
      filters.querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
      let n = 0;
      cards.forEach((c) => { const on = cat === 'all' || c.dataset.cat === cat; c.hidden = !on; if (on) n++; });
      grid.classList.toggle('is-filtered', cat !== 'all'); grid.classList.remove('is-filtering'); void grid.offsetWidth; grid.classList.add('is-filtering');
      status.textContent = n === 1 ? filters.dataset.countOne : filters.dataset.countMany.replace('{n}', n);
      if (push) history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
    };
    filters.addEventListener('click', (e) => { const b = e.target.closest('.chip'); if (b) apply(b.dataset.filter, true); });
    if (location.hash) apply(location.hash.slice(1), false);
  }

  // ---------- contact form: checks, then opens a prepared email ----------
  const form = document.querySelector('.form');
  if (form) {
    const status = form.querySelector('.form__status');
    const checks = [['f-name', (v) => v.trim().length > 1], ['f-email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())], ['f-message', (v) => v.trim().length > 4]];
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const bad = [];
      for (const [id, ok] of checks) {
        const el = form.querySelector('#' + id), err = form.querySelector('#' + id + '-err'), fine = ok(el.value);
        el.setAttribute('aria-invalid', String(!fine)); if (err) err.hidden = fine; if (!fine) bad.push(el);
      }
      if (bad.length) { status.textContent = bad.length === 1 ? form.dataset.errOne : form.dataset.errMany.replace('{n}', bad.length); bad[0].focus(); return; }
      const v = (id) => form.querySelector('#' + id).value.trim();
      const label = (id) => form.querySelector(`label[for="${id}"]`).textContent;
      const body = ['f-name', 'f-email', 'f-type'].filter((id) => v(id)).map((id) => `${label(id)}: ${v(id)}`).concat(['', v('f-message')]).join('\n');
      const subject = `${form.dataset.subject}${v('f-type') ? ' · ' + v('f-type') : ''} · ${v('f-name')}`;
      location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = form.dataset.opened;
    });
    form.querySelectorAll('input, textarea').forEach((el) => el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') { el.removeAttribute('aria-invalid'); const err = form.querySelector('#' + el.id + '-err'); if (err) err.hidden = true; }
    }));
  }
})();
