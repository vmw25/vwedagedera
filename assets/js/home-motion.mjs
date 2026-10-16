// The document keeps its native scroll position; only the presentation eases.
// No wheel/touch interception, scroll locks, or third-party animation runtime.
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export function easeScroll(current, target, dt) {
  return current + (target - current) * (1 - Math.exp(-dt * 14));
}
export function easePortraitScroll(current, target, dt) {
  return current + (target - current) * (1 - Math.exp(-dt * 8));
}
export function readingStrength(centre, scroll, height) {
  return clamp(1 - Math.abs(centre - scroll - height * .52) / (height * .5), 0, 1);
}
export function readingOpacity(strength) {
  return .24 + .76 * Math.pow(clamp(strength / .8, 0, 1), 1.6);
}
const smooth = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (from, to, amount) => from + (to - from) * amount;

// A large, subdued background layer, independent of the hero's text layout.
export function portraitPlacement({ viewportWidth, heroTop, heroHeight, copyTop, copyWidth }) {
  const mobile = viewportWidth <= 860;
  const inset = mobile ? 6 : 18;
  const width = Math.min(viewportWidth * (mobile ? .88 : .49), mobile ? copyWidth : 760, (heroHeight - inset * 2) * .8);
  const nudge = mobile ? 12 : clamp(viewportWidth * .02, 18, 32);
  return { width, top: heroTop - copyTop + inset, left: (mobile ? Math.max(0, copyWidth - width) : copyWidth * .12) + nudge };
}

// Longer scroll ranges for departure and docking, without adding page height.
export function portraitTimings({ viewportHeight, endTop, clearance, railY }) {
  const departure = clamp(viewportHeight * .42, 280, 480);
  const dockingRange = clamp(viewportHeight * .65, 480, 760);
  const arrival = Math.max(departure + 504, endTop - viewportHeight * .08);
  const release = Math.max(departure + 24, Math.min(clearance - railY + 28, arrival - dockingRange));
  return { departure, release, arrival };
}

// Only opacity changes as the softly masked background becomes a clear photo.
export function portraitAppearance(scroll, { departure, release, arrival }, mobile = false) {
  const lift = smooth(scroll / departure);
  const docking = smooth((scroll - release) / (arrival - release));
  const clarity = mobile ? docking : lift;
  return { clarity, opacity: mix(.26, 1, clarity) * (mobile ? 1 - lift + docking : 1) };
}

// Travel through the empty left gutter, not across the name or introduction.
// All coordinates are cached at resize; scroll frames only update transforms.
export function portraitPose(scroll, { start, end, rail, departure, release, arrival }, viewportScroll = scroll) {
  if (scroll <= departure) {
    const t = smooth(scroll / departure);
    return { x: mix(start.x, rail.x, t), y: mix(start.y - viewportScroll, rail.y, t), width: mix(start.width, rail.width, t) };
  }
  const t = smooth((scroll - release) / (arrival - release));
  return { x: mix(rail.x, end.x, t), y: mix(rail.y, end.y - viewportScroll, t), width: mix(rail.width, end.width, t) };
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
  const portraitStart = document.querySelector('.hero-portrait');
  const heroCopy = document.querySelector('.heart-hero__copy');
  const hero = document.querySelector('.heart-hero');
  const home = document.querySelector('.heart-home');
  const flight = portraitStart ? document.createElement('div') : null;
  const flightImage = portraitStart?.querySelector('img').cloneNode();
  const flightClear = flightImage?.cloneNode();
  if (flight && flightImage) {
    flight.className = 'portrait-flight';
    flight.setAttribute('aria-hidden', 'true');
    flightImage.className = 'portrait-flight__soft';
    flightClear.className = 'portrait-flight__clear';
    flight.append(flightImage, flightClear);
    home.append(flight);
  }
  let enabled = false, current = window.scrollY, target = current, frame = 0, last = 0;
  let portraitScroll = current;
  let maxScroll = 0, metrics = [], portraitCentre = 0, measuring = false;
  let flightGeometry = null;

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
      if (portraitStart && flight && heroCopy) {
        const copy = heroCopy.getBoundingClientRect();
        const mobile = innerWidth <= 860;
        const gap = innerWidth <= 600 ? 8 : mobile ? 10 : 20;
        const preferredWidth = innerWidth <= 600 ? 24 : mobile ? 32 : clamp(innerWidth * .075, 80, 112);
        const availableHeight = copy.top + renderedScroll - headerHeight - gap - 8;
        // Keep the gutter waypoint independent of the large background portrait.
        const motionAnchorWidth = Math.min(preferredWidth, Math.max(16, availableHeight * .8));
        const motionAnchorTop = copy.top + renderedScroll - gap - motionAnchorWidth * 1.25;
        const heroBounds = hero.getBoundingClientRect();
        const placement = portraitPlacement({
          viewportWidth: innerWidth, heroTop: heroBounds.top + renderedScroll, heroHeight: heroBounds.height,
          copyTop: copy.top + renderedScroll,
          copyWidth: copy.width - parseFloat(getComputedStyle(heroCopy).paddingRight),
        });
        portraitStart.style.setProperty('--hero-portrait-width', `${placement.width}px`);
        portraitStart.style.setProperty('--hero-portrait-left', `${placement.left}px`);
        portraitStart.style.setProperty('--hero-portrait-top', `${placement.top}px`);
        const origin = portraitStart.getBoundingClientRect();
        const railWidth = Math.min(56, Math.max(12, copy.left - 20));
        const railY = mobile ? innerHeight * .3 : Math.max(headerHeight + 18, Math.min(motionAnchorTop, innerHeight * .24));
        const clearance = (mobile ? hero.getBoundingClientRect().bottom : copy.bottom) + renderedScroll;
        const timing = portraitTimings({ viewportHeight: innerHeight, endTop: rect.top + renderedScroll, clearance, railY });
        const homeBounds = home.getBoundingClientRect();
        flightGeometry = {
          parent: { x: homeBounds.left, y: homeBounds.top + renderedScroll },
          start: { x: origin.left, y: origin.top + renderedScroll, width: origin.width },
          end: { x: rect.left, y: rect.top + renderedScroll, width: rect.width },
          rail: { x: Math.max(4, (copy.left - railWidth) / 2), y: railY, width: railWidth },
          ...timing,
        };
        flight.style.width = `${rect.width}px`;
        flight.style.height = `${rect.height}px`;
      }
    }
    measuring = false;
    schedule();
  }

  function paint(scroll, portraitProgress) {
    for (const { element, centre } of metrics) {
      const strength = reduced.matches ? 1 : readingStrength(centre, scroll, innerHeight);
      element.style.setProperty('--reading-opacity', readingOpacity(strength).toFixed(3));
      element.classList.toggle('is-reading', strength > .7);
    }
    const offset = reduced.matches ? 0 : clamp((portraitCentre - scroll - innerHeight / 2) / innerHeight, -1, 1) * 22;
    if (portrait && !reduced.matches) {
      portrait.style.transform = `translate3d(0,${offset.toFixed(2)}px,0) scale(1.06)`;
    } else if (portrait) portrait.style.transform = '';
    if (flight && flightGeometry) {
      const travelling = !reduced.matches && portraitProgress < flightGeometry.arrival;
      document.body.classList.toggle('portrait-flight-active', travelling);
      flight.classList.toggle('is-travelling', travelling && portraitProgress > 0);
      flight.style.visibility = travelling ? 'visible' : 'hidden';
      if (travelling) {
        const pose = portraitPose(portraitProgress, flightGeometry, scroll);
        const scale = pose.width / flightGeometry.end.width;
        const docking = smooth((portraitProgress - flightGeometry.release) / (flightGeometry.arrival - flightGeometry.release));
        flight.style.transform = `translate3d(${(pose.x - flightGeometry.parent.x).toFixed(2)}px,${(pose.y + scroll - flightGeometry.parent.y).toFixed(2)}px,0) scale(${scale.toFixed(5)})`;
        // A phone's narrow gutter cannot hold a readable thumbnail: soften the
        // journey there, then reveal it again as it grows into the larger photo.
        const appearance = portraitAppearance(portraitProgress, flightGeometry, innerWidth <= 860);
        flight.style.opacity = appearance.opacity;
        flightImage.style.opacity = 1 - appearance.clarity;
        flightClear.style.opacity = appearance.clarity;
        flight.style.borderRadius = `${3 * (1 - docking) / scale}px`;
        flightImage.style.transform = `translate3d(0,${(offset * docking).toFixed(2)}px,0) scale(1.06)`;
        flightClear.style.transform = flightImage.style.transform;
      }
    }
    progress.style.transform = `scaleX(${maxScroll ? clamp(scroll / maxScroll, 0, 1) : 0})`;
  }

  function tick(now) {
    frame = 0;
    target = clamp(window.scrollY, 0, maxScroll);
    const dt = Math.min((now - (last || now - 16)) / 1000, .05);
    last = now;
    current = enabled ? easeScroll(current, target, dt) : target;
    if (Math.abs(target - current) < .15) current = target;
    portraitScroll = reduced.matches ? current : easePortraitScroll(portraitScroll, current, dt);
    if (Math.abs(current - portraitScroll) < .15) portraitScroll = current;
    if (enabled) content.style.transform = `translate3d(0,${-current.toFixed(2)}px,0)`;
    paint(current, portraitScroll);
    if ((enabled && current !== target) || portraitScroll !== current) schedule(); else last = 0;
  }
  function schedule() { if (!frame && !document.hidden) frame = requestAnimationFrame(tick); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', measure);
  desktop.addEventListener('change', measure);
  reduced.addEventListener('change', measure);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else { current = portraitScroll = window.scrollY; last = 0; schedule(); }
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
