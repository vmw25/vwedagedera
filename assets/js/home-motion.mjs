// The document keeps its native scroll position; only the presentation eases.
// No wheel/touch interception, scroll locks, or third-party animation runtime.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function easeScroll(current, target, dt) {
  return current + (target - current) * (1 - Math.exp(-dt * 14));
}
export function readingStrength(centre, scroll, height) {
  return clamp(1 - Math.abs(centre - scroll - height * .52) / (height * .65), 0, 1);
}

if (typeof document !== 'undefined' && document.querySelector('.heart-home')) initialiseHomeMotion();

function initialiseHomeMotion() {
  const main = document.querySelector('.page-body');
  const footer = document.querySelector('.page-footer');
  const header = document.querySelector('.page-header');
  if (!main || !footer || !header) return;
  const viewport = document.createElement('div');
  const content = document.createElement('div');
  const spacer = document.createElement('div');
  const progress = document.createElement('div');
  viewport.className = 'home-stage-viewport';
  content.className = 'home-stage-content';
  spacer.className = 'home-stage-spacer';
  progress.className = 'home-scroll-progress';
  spacer.setAttribute('aria-hidden', 'true');
  progress.setAttribute('aria-hidden', 'true');
  main.before(viewport);
  viewport.append(content);
  content.append(main, footer);
  viewport.after(spacer);
  document.body.append(progress);

  const desktop = matchMedia('(min-width: 861px) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const focusItems = [...document.querySelectorAll('[data-scroll-focus]')];
  const portrait = document.querySelector('.home-portrait img');
  let enabled = false, current = window.scrollY, target = current, frame = 0, last = 0;
  let maxScroll = 0, metrics = [], portraitCentre = 0, measuring = false;

  function measure() {
    if (measuring) return;
    measuring = true;
    const headerHeight = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--home-header-height', `${headerHeight}px`);
    const nextEnabled = desktop.matches && !reduced.matches;
    if (nextEnabled !== enabled) {
      enabled = nextEnabled;
      document.body.classList.toggle('home-stage-enabled', enabled);
      document.documentElement.classList.toggle('home-stage-enabled', enabled);
      current = window.scrollY;
    }
    content.style.transform = enabled ? `translate3d(0,${-current}px,0)` : '';
    spacer.style.height = enabled ? `${content.scrollHeight}px` : '0px';
    maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
    const renderedScroll = enabled ? current : window.scrollY;
    metrics = focusItems.map(element => {
      const rect = element.getBoundingClientRect();
      return { element, centre: rect.top + rect.height / 2 + renderedScroll };
    });
    if (portrait) {
      const rect = portrait.parentElement.getBoundingClientRect();
      portraitCentre = rect.top + rect.height / 2 + renderedScroll;
    }
    measuring = false;
    schedule();
  }

  function paint(scroll) {
    for (const { element, centre } of metrics) {
      const strength = reduced.matches ? 1 : readingStrength(centre, scroll, innerHeight);
      element.style.setProperty('--reading-opacity', (.52 + strength * .48).toFixed(3));
      element.classList.toggle('is-reading', strength > .7);
    }
    if (portrait && !reduced.matches) {
      const offset = clamp((portraitCentre - scroll - innerHeight / 2) / innerHeight, -1, 1) * 22;
      portrait.style.transform = `translate3d(0,${offset.toFixed(2)}px,0) scale(1.06)`;
    } else if (portrait) portrait.style.transform = '';
    progress.style.transform = `scaleX(${maxScroll ? clamp(scroll / maxScroll, 0, 1) : 0})`;
  }

  function tick(now) {
    frame = 0;
    target = clamp(window.scrollY, 0, maxScroll);
    const dt = Math.min((now - (last || now - 16)) / 1000, .05);
    last = now;
    current = enabled ? easeScroll(current, target, dt) : target;
    if (Math.abs(target - current) < .15) current = target;
    if (enabled) content.style.transform = `translate3d(0,${-current.toFixed(2)}px,0)`;
    paint(current);
    if (enabled && current !== target) schedule(); else last = 0;
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  desktop.addEventListener('change', measure);
  reduced.addEventListener('change', measure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else { current = window.scrollY; last = 0; schedule(); }
  });
  new ResizeObserver(measure).observe(content);
  document.fonts.ready.then(measure);

  function revealTarget(element) {
    const top = element.getBoundingClientRect().top + current - header.getBoundingClientRect().height - 28;
    window.scrollTo({ top: clamp(top, 0, maxScroll), behavior: 'instant' });
  }
  document.addEventListener('click', event => {
    if (!enabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || anchor.hash.length < 2) return;
    let id; try { id = decodeURIComponent(anchor.hash.slice(1)); } catch { return; }
    const destination = document.getElementById(id);
    if (!destination || !content.contains(destination)) return;
    event.preventDefault();
    history.pushState(null, '', anchor.hash);
    revealTarget(destination);
  });
  document.addEventListener('focusin', event => {
    if (!enabled || !content.contains(event.target)) return;
    const rect = event.target.getBoundingClientRect();
    if (rect.top < header.getBoundingClientRect().height || rect.bottom > innerHeight) revealTarget(event.target);
  });
  window.addEventListener('hashchange', () => {
    if (!enabled || !location.hash) return;
    const destination = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (destination) revealTarget(destination);
  });

  // One-time entrance reveals and line draws follow the visual viewport.
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .08 });
  document.querySelectorAll('[data-reveal]').forEach(element => revealObserver.observe(element));
  document.body.classList.add('home-motion-ready');
  measure();
}
