(function initialisePortfolioExplorer() {
  const root = document.querySelector('[data-portfolio]');
  if (!root) return;

  const filterButtons = Array.from(root.querySelectorAll('[data-portfolio-filter]'));
  const entries = Array.from(root.querySelectorAll('[data-portfolio-entry]'));
  const subentries = Array.from(root.querySelectorAll('[data-portfolio-subentry]'));
  const sections = Array.from(root.querySelectorAll('[data-portfolio-section]'));
  const searchInput = root.querySelector('[data-portfolio-search]');
  const status = root.querySelector('[data-portfolio-status]');
  const expandButton = root.querySelector('[data-portfolio-expand]');
  const collapseButton = root.querySelector('[data-portfolio-collapse]');
  const explorerAnchor = root.querySelector('[data-portfolio-explorer-anchor]');
  const explorer = root.querySelector('[data-portfolio-explorer]');
  const explorerToggle = root.querySelector('[data-portfolio-explorer-toggle]');
  const desktopViewport = window.matchMedia('(min-width: 761px)');
  let activeFilter = 'all';
  let isDocked = false;
  let dockingTimer = null;

  function updatePortfolio() {
    const query = searchInput?.value.trim().toLowerCase() || '';
    let visibleCount = 0;

    entries.forEach((entry) => {
      const matchesFilter = activeFilter === 'all' || entry.dataset.category === activeFilter;
      const matchesSearch = !query || entry.textContent.toLowerCase().includes(query);
      const isVisible = matchesFilter && matchesSearch;
      entry.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    sections.forEach((section) => {
      const hasVisibleEntry = Array.from(section.querySelectorAll('[data-portfolio-entry]')).some((entry) => !entry.hidden);
      section.hidden = !hasVisibleEntry;
    });

    if (status) {
      status.textContent = `${visibleCount} entr${visibleCount === 1 ? 'y' : 'ies'} shown`;
    }
  }

  function setExplorerOpen(isOpen) {
    if (!explorer || !explorerToggle || !isDocked) return;
    explorer.classList.toggle('is-open', isOpen);
    explorerToggle.setAttribute('aria-expanded', String(isOpen));
    explorerToggle.setAttribute('aria-label', isOpen ? 'Close portfolio explorer' : 'Open portfolio explorer');
  }

  function setDocked(shouldDock) {
    if (!explorer || !explorerAnchor || !explorerToggle || shouldDock === isDocked) return;
    isDocked = shouldDock;

    if (shouldDock) {
      explorerAnchor.style.minHeight = `${explorer.offsetHeight}px`;
      explorer.classList.add('is-docked');
      explorerToggle.removeAttribute('aria-hidden');
      explorerToggle.tabIndex = 0;
    } else {
      explorer.classList.remove('is-docked', 'is-open');
      explorerAnchor.style.minHeight = '';
      explorerToggle.setAttribute('aria-hidden', 'true');
      explorerToggle.setAttribute('aria-expanded', 'false');
      explorerToggle.setAttribute('aria-label', 'Open portfolio explorer');
      explorerToggle.tabIndex = -1;
    }
  }

  function updateDocking() {
    dockingTimer = null;
    if (!explorer || !explorerAnchor || !desktopViewport.matches) {
      setDocked(false);
      return;
    }

    const anchorTop = explorerAnchor.getBoundingClientRect().top + window.scrollY;
    const triggerPoint = anchorTop + Math.min(explorerAnchor.offsetHeight * 0.45, 180);
    setDocked(window.scrollY > triggerPoint);
  }

  function requestDockingUpdate() {
    if (dockingTimer !== null) return;
    dockingTimer = window.setTimeout(updateDocking, 120);
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.portfolioFilter;
      filterButtons.forEach((candidate) => {
        const isActive = candidate === button;
        candidate.classList.toggle('is-active', isActive);
        candidate.setAttribute('aria-pressed', String(isActive));
      });
      updatePortfolio();
    });
  });

  searchInput?.addEventListener('input', updatePortfolio);

  expandButton?.addEventListener('click', () => {
    entries.forEach((entry) => {
      if (!entry.hidden) entry.open = true;
    });
    subentries.forEach((entry) => {
      if (!entry.closest('[data-portfolio-entry]')?.hidden) entry.open = true;
    });
  });

  collapseButton?.addEventListener('click', () => {
    [...entries, ...subentries].forEach((entry) => {
      entry.open = false;
    });
  });

  explorerToggle?.addEventListener('click', () => {
    const willOpen = !explorer?.classList.contains('is-open');
    setExplorerOpen(willOpen);
    if (willOpen) {
      window.requestAnimationFrame(() => searchInput?.focus());
    }
  });

  document.addEventListener('click', (event) => {
    if (isDocked && explorer?.classList.contains('is-open') && !explorer.contains(event.target)) {
      setExplorerOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setExplorerOpen(false);
  });

  window.addEventListener('scroll', requestDockingUpdate, { passive: true });
  window.addEventListener('resize', requestDockingUpdate);
  desktopViewport.addEventListener?.('change', requestDockingUpdate);

  updatePortfolio();
  updateDocking();
})();
