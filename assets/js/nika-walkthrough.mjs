/** Progressive enhancement: without JS every numbered guide stays readable. */
export function initialiseWalkthrough(doc = document) {
  const root = doc.querySelector('[data-walkthrough]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = 'true';
  const tabs = [...root.querySelectorAll('[data-guide]')];
  const panels = [...root.querySelectorAll('[data-guide-panel]')];
  const announcement = root.querySelector('[data-walk-announcement]');
  const tablist = root.querySelector('.walk-tabs');
  tablist.setAttribute('role', 'tablist');
  const speak = text => { announcement.textContent = text; };
  function selectGuide(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    tab.addEventListener('click', event => { event.preventDefault(); selectGuide(index); });
    tab.addEventListener('keydown', event => {
      const moves = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 };
      if (!(event.key in moves)) return;
      event.preventDefault(); selectGuide(moves[event.key], true);
    });
  });
  panels.forEach(panel => {
    const paths = [...panel.querySelectorAll('[data-path-panel]')];
    const choices = [...panel.querySelectorAll('[data-path]')];
    const choosePath = index => {
      paths.forEach((path, i) => { path.hidden = i !== index; });
      choices.forEach((choice, i) => choice.setAttribute('aria-pressed', String(i === index)));
    };
    choices.forEach((choice, i) => {
      choice.setAttribute('role', 'button');
      choice.setAttribute('aria-controls', paths[i].id);
      choice.addEventListener('click', event => { event.preventDefault(); choosePath(i); });
      choice.addEventListener('keydown', event => {
        if (event.key === ' ') { event.preventDefault(); choice.click(); }
      });
    });
    paths.forEach(path => {
      const steps = [...path.querySelectorAll('[data-step]')];
      const controls = path.querySelector('.walk-controls');
      const back = controls.querySelector('[data-back]');
      const next = controls.querySelector('[data-next]');
      const dots = controls.querySelector('.walk-dots');
      let current = 0;
      const buttons = steps.map((step, i) => {
        const button = doc.createElement('button');
        button.type = 'button';
        button.textContent = String(i + 1);
        button.setAttribute('aria-label', `Step ${i + 1}: ${step.querySelector('h3').textContent}`);
        button.addEventListener('click', () => show(i));
        dots.append(button);
        return button;
      });
      function show(index, announce = true) {
        current = Math.max(0, Math.min(index, steps.length - 1));
        steps.forEach((step, i) => { step.hidden = i !== current; });
        buttons.forEach((button, i) => {
          if (i === current) button.setAttribute('aria-current', 'step');
          else button.removeAttribute('aria-current');
        });
        back.disabled = current === 0;
        next.disabled = current === steps.length - 1;
        if (announce) speak(`Step ${current + 1} of ${steps.length}: ${steps[current].querySelector('h3').textContent}`);
      }
      back.addEventListener('click', () => show(current - 1));
      next.addEventListener('click', () => show(current + 1));
      controls.hidden = false;
      show(0, false);
    });
    choosePath(0);
  });
  selectGuide(0);

  const dialog = root.querySelector('.walk-dialog');
  const full = dialog.querySelector('[data-full-image]');
  const canvas = dialog.querySelector('.walk-zoom-canvas');
  const zoom = dialog.querySelector('[data-zoom]');
  const status = dialog.querySelector('[data-image-status]');
  let opener = null;
  let zoomed = false;
  const resetZoom = () => {
    zoomed = false;
    canvas.classList.remove('is-zoomed');
    zoom.textContent = 'Zoom in';
    zoom.setAttribute('aria-pressed', 'false');
    canvas.scrollTop = 0; canvas.scrollLeft = 0;
  };
  root.querySelectorAll('[data-enlarge]').forEach(link => {
    link.addEventListener('click', event => {
      // Ordinary full-image links remain functional in older browsers.
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      opener = link;
      resetZoom();
      status.textContent = 'Loading full-resolution image…';
      full.hidden = true;
      zoom.disabled = true;
      full.onload = () => { status.textContent = ''; full.hidden = false; zoom.disabled = false; };
      full.onerror = () => { status.textContent = 'The image could not load. Close and try again.'; };
      dialog.querySelector('#walk-dialog-title').textContent = link.dataset.caption;
      dialog.querySelector('[data-image-resolution]').textContent = `${link.dataset.resolution} pixels · Scroll to explore when zoomed`;
      full.alt = link.querySelector('img').alt;
      // No full-size image is requested until the visitor chooses to enlarge it.
      full.src = link.href;
      dialog.showModal();
      dialog.querySelector('[data-close]').focus();
    });
  });
  zoom.addEventListener('click', () => {
    zoomed = !zoomed;
    canvas.classList.toggle('is-zoomed', zoomed);
    zoom.textContent = zoomed ? 'Fit image' : 'Zoom in';
    zoom.setAttribute('aria-pressed', String(zoomed));
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { resetZoom(); full.removeAttribute('src'); opener?.focus(); });
  return { selectGuide };
}

if (typeof document !== 'undefined') initialiseWalkthrough();
