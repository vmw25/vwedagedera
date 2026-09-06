// Page-only enhancement. No tracking, storage, embeds or third-party scripts.
export function motionAllowed({ paused, reduced, saveData, hidden, inView, hovered = false }) {
  return !paused && !reduced && !saveData && !hidden && inView && !hovered;
}

export function nextFeature(index, count) { return count > 0 ? (index + 1) % count : 0; }

export function initialiseShowcase(root, win = window, doc = document) {
  const panels = [...root.querySelectorAll('[data-showcase-panel]')];
  const choices = [...root.querySelectorAll('[data-showcase-choice]')];
  const toggle = root.querySelector('[data-showcase-motion]');
  const phrase = root.querySelector('#showcase-phrase');
  const interaction = root.querySelector('[data-showcase-controls]');
  const announcement = root.querySelector('[data-showcase-announcement]');
  if (panels.length < 2 || choices.length !== panels.length || !toggle || !phrase || !interaction) return;
  const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = win.navigator.connection;
  let index = 0, timer = null, pointerIntent = null;
  const state = { paused: false, reduced: preference.matches, saveData: !!connection?.saveData,
    hidden: doc.hidden, inView: !win.IntersectionObserver, hovered: false };

  function show(value, manual = false) {
    if (!Number.isInteger(value) || value < 0 || value >= panels.length) return;
    index = value;
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      panel.classList.toggle('is-entering', i === index);
      choices[i].setAttribute('aria-pressed', String(i === index));
    });
    phrase.textContent = panels[index].dataset.phrase;
    phrase.classList.remove('is-entering');
    // The panel changes immediately; no content depends on animation finishing.
    win.requestAnimationFrame(() => phrase.classList.add('is-entering'));
    if (manual && announcement) announcement.textContent = choices[index].textContent.trim() + ' selected';
  }
  function sync() {
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
    toggle.disabled = state.reduced || state.saveData;
    toggle.textContent = toggle.disabled ? 'Automatic motion off' : state.paused ? 'Play showcase' : 'Pause showcase';
    if (motionAllowed(state)) timer = win.setTimeout(() => { show(nextFeature(index, panels.length)); sync(); }, 6500);
  }
  interaction.hidden = false;
  choices.forEach((choice, i) => choice.addEventListener('click', () => { state.paused = true; show(i, true); sync(); }));
  toggle.addEventListener('pointerdown', () => { pointerIntent = state.paused; });
  toggle.addEventListener('pointercancel', () => { pointerIntent = null; });
  toggle.addEventListener('click', () => {
    const play = pointerIntent ?? state.paused;
    pointerIntent = null;
    state.paused = !play;
    sync();
  });
  // Keep the restored heading animated when the pointer rests elsewhere in the
  // tall hero. Pause over the actual interactive controls, or on keyboard focus.
  interaction.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { state.hovered = true; sync(); } });
  interaction.addEventListener('pointerleave', () => { state.hovered = false; pointerIntent = null; sync(); });
  root.addEventListener('focusin', () => { state.paused = true; sync(); });
  doc.addEventListener('visibilitychange', () => { state.hidden = doc.hidden; sync(); });
  preference.addEventListener('change', () => { state.reduced = preference.matches; sync(); });
  connection?.addEventListener?.('change', () => { state.saveData = !!connection.saveData; sync(); });
  if (win.IntersectionObserver) new win.IntersectionObserver(entries => {
    state.inView = entries[0].isIntersecting; sync();
  }, { threshold: 0 }).observe(root);
  sync();
  return { show, state, get index() { return index; } };
}

export function initialiseDemo(root, win = window, doc = document) {
  const preview = root.querySelector('[data-demo-preview]');
  const player = root.querySelector('[data-demo-player]');
  const dialog = root.querySelector('[data-demo-dialog]');
  const watch = root.querySelector('[data-demo-watch]');
  const close = root.querySelector('[data-demo-close]');
  const toggle = root.querySelector('[data-demo-motion]');
  const status = root.querySelector('[data-demo-status]');
  if (!preview || !player || !dialog || !watch || !toggle) return;
  const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = win.navigator.connection;
  const state = { paused: false, reduced: preference.matches, saveData: !!connection?.saveData,
    hidden: doc.hidden, inView: !win.IntersectionObserver };
  let requestId = 0, explicitPreview = false;
  function source(video) {
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
  }
  function allowed() {
    return !dialog.open && motionAllowed({ ...state, reduced: state.reduced && !explicitPreview, saveData: state.saveData && !explicitPreview });
  }
  async function sync() {
    const request = ++requestId;
    if (!allowed()) { preview.pause(); return; }
    source(preview);
    preview.muted = true;
    try {
      await preview.play();
      // A tab switch, pause or dialog opening may race a pending play promise.
      if (request !== requestId || !allowed()) { if (!allowed()) preview.pause(); return; }
      status.textContent = '';
    } catch {
      if (request === requestId) {
        state.paused = true;
        status.textContent = 'The preview could not start. Choose Watch the demo to open the full player.';
        toggle.textContent = 'Play preview';
      }
    }
  }
  root.querySelector('[data-demo-controls]').hidden = false;
  preview.addEventListener('playing', () => { toggle.textContent = 'Pause preview'; });
  preview.addEventListener('pause', () => { toggle.textContent = 'Play preview'; });
  preview.addEventListener('error', () => {
    state.paused = true; ++requestId;
    status.textContent = 'The preview is unavailable. You can still try the full video.';
    toggle.textContent = 'Play preview';
  });
  toggle.addEventListener('click', () => {
    if (!preview.paused) { state.paused = true; explicitPreview = false; }
    else { state.paused = false; explicitPreview = true; }
    sync();
  });
  watch.addEventListener('click', async () => {
    state.paused = true; sync();
    source(player);
    if (typeof dialog.showModal !== 'function') { win.location.assign(player.dataset.src); return; }
    dialog.showModal(); close.focus();
    try { await player.play(); } catch { /* Native controls and a direct video link remain usable. */ }
    if (!dialog.open || doc.hidden) player.pause();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { player.pause(); watch.focus(); });
  doc.addEventListener('visibilitychange', () => {
    state.hidden = doc.hidden;
    if (state.hidden) player.pause();
    sync();
  });
  preference.addEventListener('change', () => { state.reduced = preference.matches; explicitPreview = false; sync(); });
  connection?.addEventListener?.('change', () => { state.saveData = !!connection.saveData; explicitPreview = false; sync(); });
  if (win.IntersectionObserver) new win.IntersectionObserver(entries => {
    state.inView = entries[0].isIntersecting; sync();
  }, { threshold: 0.2 }).observe(root);
  sync();
  return { state, sync };
}

export function initialiseNavigation(menu, doc = document) {
  const summary = menu.querySelector('summary');
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      event.preventDefault();
      summary.focus();
    }
  });
  doc.addEventListener('click', event => { if (menu.open && !menu.contains(event.target)) menu.open = false; });
  menu.addEventListener('focusout', event => { if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false; });
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('.nav-menu').forEach(menu => initialiseNavigation(menu));
  document.querySelectorAll('[data-nika-showcase]').forEach(root => initialiseShowcase(root));
  document.querySelectorAll('[data-nika-demo]').forEach(root => initialiseDemo(root));
}
