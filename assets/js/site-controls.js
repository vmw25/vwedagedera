(function initialiseSiteControls() {
  const navToggle = document.querySelector('.simple-nav__toggle');
  const navMenu = document.getElementById('simple-nav-menu');
  const moreToggle = document.querySelector('[data-more-toggle]');
  const moreMenu = document.getElementById('simple-nav-more-menu');
  const moreItem = moreToggle?.closest('.simple-nav__item--dropdown');
  const themeButton = document.getElementById('theme-toggle');
  const themeIcon = themeButton?.querySelector('[data-theme-icon]');
  const themeLabel = themeButton?.querySelector('[data-theme-label]');
  const searchDialog = document.getElementById('site-search-dialog');
  const searchOpen = document.getElementById('site-search-open');
  const searchInput = document.getElementById('site-search-input');
  const searchStatus = document.getElementById('site-search-status');
  const searchResults = document.getElementById('site-search-results');
  const contactDialog = document.getElementById('contact-dialog');
  const contactOpen = document.getElementById('contact-dialog-open');
  const contactForm = document.getElementById('contact-form');
  const contactStatus = document.getElementById('contact-form-status');
  let pagefindPromise;
  let searchTimer;
  let searchSequence = 0;

  function updateThemeButton() {
    const isLight = document.documentElement.dataset.theme === 'light';
    if (themeIcon) themeIcon.textContent = isLight ? '☾' : '☀';
    if (themeLabel) themeLabel.textContent = isLight ? 'Dark' : 'Light';
    themeButton?.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
  }

  function setMoreMenu(isOpen) {
    moreToggle?.setAttribute('aria-expanded', String(isOpen));
    moreMenu?.classList.toggle('is-open', isOpen);
  }

  function openDialog(dialog, firstField) {
    if (!dialog) return;
    dialog.showModal();
    window.setTimeout(() => firstField?.focus(), 0);
  }

  function loadPagefind() {
    const pagefindURL = searchDialog?.dataset.pagefindUrl;
    if (!pagefindURL) return Promise.reject(new Error('Search index is unavailable.'));
    if (!pagefindPromise) {
      pagefindPromise = import(pagefindURL).then(async (pagefind) => {
        await pagefind.init?.();
        return pagefind;
      });
    }
    return pagefindPromise;
  }

  function stripMarkup(value) {
    const container = document.createElement('span');
    container.innerHTML = value || '';
    return container.textContent || '';
  }

  function renderSearchResults(results) {
    if (!searchResults) return;
    const fragment = document.createDocumentFragment();

    results.forEach((result) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const title = document.createElement('span');
      const summary = document.createElement('small');

      link.href = result.url;
      title.textContent = result.meta?.title || 'Untitled page';
      summary.textContent = stripMarkup(result.excerpt || result.meta?.description || '');
      link.append(title, summary);
      item.append(link);
      fragment.append(item);
    });

    searchResults.replaceChildren(fragment);
  }

  async function runSearch(query, sequence) {
    try {
      const pagefind = await loadPagefind();
      const response = await pagefind.search(query);
      const results = await Promise.all(response.results.slice(0, 10).map((result) => result.data()));
      if (sequence !== searchSequence) return;

      renderSearchResults(results);
      if (searchStatus) {
        searchStatus.textContent = results.length
          ? `${results.length} result${results.length === 1 ? '' : 's'} found.`
          : `No results for “${query}”.`;
      }
    } catch (error) {
      if (sequence !== searchSequence) return;
      if (searchResults) searchResults.replaceChildren();
      if (searchStatus) searchStatus.textContent = 'Search could not load. Please try again.';
    }
  }

  navToggle?.addEventListener('click', function () {
    const isOpen = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!isOpen));
    navMenu?.classList.toggle('is-open', !isOpen);
    if (isOpen) setMoreMenu(false);
  });

  moreToggle?.addEventListener('click', function (event) {
    event.stopPropagation();
    setMoreMenu(this.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (event) => {
    if (moreItem && !moreItem.contains(event.target)) setMoreMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && moreToggle?.getAttribute('aria-expanded') === 'true') {
      setMoreMenu(false);
      moreToggle.focus();
    }
  });

  themeButton?.addEventListener('click', function () {
    const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    try {
      localStorage.setItem('vidun-theme', nextTheme);
    } catch (error) {}
    updateThemeButton();
  });

  searchOpen?.addEventListener('click', () => {
    openDialog(searchDialog, searchInput);
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => loadPagefind().catch(() => {}), { timeout: 1200 });
    } else {
      window.setTimeout(() => loadPagefind().catch(() => {}), 0);
    }
  });

  contactOpen?.addEventListener('click', () => {
    openDialog(contactDialog, contactDialog?.querySelector('input[name="name"]'));
  });

  document.querySelectorAll('[data-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      const bounds = dialog.getBoundingClientRect();
      const isBackdrop = event.clientX < bounds.left
        || event.clientX > bounds.right
        || event.clientY < bounds.top
        || event.clientY > bounds.bottom;
      if (isBackdrop) dialog.close();
    });
  });

  searchInput?.addEventListener('input', function () {
    const query = this.value.trim();
    searchSequence += 1;
    window.clearTimeout(searchTimer);

    if (!query) {
      if (searchResults) searchResults.replaceChildren();
      if (searchStatus) searchStatus.textContent = 'Start typing to search the public pages.';
      return;
    }

    if (searchStatus) searchStatus.textContent = 'Searching…';
    const currentSequence = searchSequence;
    searchTimer = window.setTimeout(() => runSearch(query, currentSequence), 120);
  });

  contactForm?.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!this.reportValidity()) return;

    const formData = new FormData(this);
    const value = (name) => String(formData.get(name) || '').trim();
    const subject = `Website enquiry — ${value('subject')}`;
    const message = [
      `Name: ${value('name')}`,
      `Reply email: ${value('email')}`,
      `Reason: ${value('reason')}`,
      '',
      'Message:',
      value('message'),
      '',
      `Sent from: ${window.location.href}`
    ].join('\n');
    const emailAddress = this.dataset.contactEmail;
    const mailtoURL = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

    if (contactStatus) contactStatus.textContent = 'Opening your email app…';
    window.location.href = mailtoURL;
  });

  updateThemeButton();
})();
