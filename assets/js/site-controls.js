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
  const newsletterDialog = document.getElementById('newsletter-dialog');
  const newsletterNudge = document.getElementById('newsletter-nudge');
  const newsletterAccept = document.querySelector('[data-newsletter-accept]');
  const newsletterOpeners = document.querySelectorAll('[data-newsletter-open]');
  const newsletterForms = document.querySelectorAll('[data-sv-form]');
  const siteHeader = document.getElementById('site-header');
  const newsletterUID = siteHeader?.dataset.newsletterUid || '';
  const newsletterRuntimeURL = siteHeader?.dataset.newsletterRuntime || '';
  const assistantLauncher = document.querySelector('.assistant-launcher');
  const engagementPage = siteHeader?.dataset.engagementPage;
  const serviceWorkerURL = siteHeader?.dataset.serviceWorkerUrl;
  const newsletterSubscribedKey = 'vidun-newsletter-subscribed';
  const newsletterCooldownKey = 'vidun-newsletter-cooldown-until';
  const dayInMilliseconds = 24 * 60 * 60 * 1000;
  let pagefindPromise;
  let newsletterRuntimePromise;
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

  function newsletterRuntimeReady(form) {
    return Boolean(Array.from(window.__sv_forms || []).some((entry) => (
      entry === form || entry?.element === form
    )));
  }

  function showNewsletterRuntimeError(form) {
    const errors = form?.querySelector('[data-element="errors"]');
    if (!errors) return;

    const item = document.createElement('li');
    item.textContent = 'Secure signup could not load. Please check your connection and try again.';
    errors.replaceChildren(item);
  }

  function loadNewsletterRuntime() {
    if (!newsletterForms.length || Array.from(newsletterForms).every(newsletterRuntimeReady)) {
      return Promise.resolve();
    }
    if (newsletterRuntimePromise) return newsletterRuntimePromise;
    if (!newsletterRuntimeURL) {
      return Promise.reject(new Error('Newsletter runtime URL is missing.'));
    }

    newsletterRuntimePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = newsletterRuntimeURL;
      script.async = true;
      script.dataset.newsletterRuntime = 'true';

      script.addEventListener('load', () => {
        const deadline = Date.now() + 3000;
        const waitForForms = () => {
          if (Array.from(newsletterForms).every(newsletterRuntimeReady)) {
            resolve();
          } else if (Date.now() >= deadline) {
            reject(new Error('Kit did not initialise the newsletter forms.'));
          } else {
            window.setTimeout(waitForForms, 50);
          }
        };
        waitForForms();
      }, { once: true });

      script.addEventListener('error', () => {
        reject(new Error('Kit runtime failed to load.'));
      }, { once: true });

      document.head.appendChild(script);
    }).catch((error) => {
      newsletterRuntimePromise = null;
      newsletterForms.forEach(showNewsletterRuntimeError);
      throw error;
    });

    return newsletterRuntimePromise;
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

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !serviceWorkerURL) return;

    const register = () => navigator.serviceWorker.register(serviceWorkerURL).catch(() => {});
    const schedule = () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(register, { timeout: 2500 });
      } else {
        window.setTimeout(register, 1500);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }
  }

  function readStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storeValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  }

  function setNewsletterCooldown(days) {
    storeValue(newsletterCooldownKey, String(Date.now() + (days * dayInMilliseconds)));
  }

  function hideNewsletterNudge(cooldownDays = 0) {
    if (!newsletterNudge) return;
    newsletterNudge.classList.remove('is-visible');
    assistantLauncher?.classList.remove('is-inviting');
    window.setTimeout(() => {
      newsletterNudge.hidden = true;
    }, 180);
    if (cooldownDays) setNewsletterCooldown(cooldownDays);
  }

  function showNewsletterNudge() {
    if (!newsletterNudge || document.querySelector('dialog[open]')) return false;
    newsletterNudge.hidden = false;
    window.requestAnimationFrame(() => newsletterNudge.classList.add('is-visible'));
    assistantLauncher?.classList.add('is-inviting');
    return true;
  }

  function initialiseNewsletterPrompt() {
    if (!newsletterNudge || engagementPage === 'excluded') return;
    if (readStoredValue(newsletterSubscribedKey) === 'true') return;

    const cooldownUntil = Number(readStoredValue(newsletterCooldownKey) || 0);
    if (cooldownUntil > Date.now()) return;

    const requiredActiveTime = 15000;
    let activeTime = 0;
    let previousTick = Date.now();
    let hasShown = false;

    const stopListening = () => {
      window.clearInterval(engagementTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };

    const checkEngagement = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') activeTime += now - previousTick;
      previousTick = now;

      const isEngaged = activeTime >= requiredActiveTime;
      if (!hasShown && isEngaged && showNewsletterNudge()) {
        hasShown = true;
        stopListening();
      }
    };

    const onVisibilityChange = () => {
      previousTick = Date.now();
    };

    const engagementTimer = window.setInterval(checkEngagement, 1000);
    document.addEventListener('visibilitychange', onVisibilityChange);
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

  newsletterAccept?.addEventListener('click', () => {
    hideNewsletterNudge(7);
    openDialog(newsletterDialog, newsletterDialog?.querySelector('input[name="email_address"]'));
    loadNewsletterRuntime().catch(() => {});
  });

  newsletterOpeners.forEach((button) => {
    button.addEventListener('click', () => {
      hideNewsletterNudge(7);
      openDialog(newsletterDialog, newsletterDialog?.querySelector('input[name="email_address"]'));
      loadNewsletterRuntime().catch(() => {});
    });
  });

  newsletterForms.forEach((form) => {
    const warmNewsletterRuntime = () => loadNewsletterRuntime().catch(() => {});
    form.addEventListener('focusin', warmNewsletterRuntime, { once: true });
    form.addEventListener('pointerenter', warmNewsletterRuntime, { once: true });

    form.addEventListener('submit', async function (event) {
      if (newsletterRuntimeReady(this)) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const submitButton = this.querySelector('[data-element="submit"]');
      const originalLabel = submitButton?.textContent || 'Subscribe';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Loading secure signup…';
      }

      try {
        await loadNewsletterRuntime();
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
        this.requestSubmit();
      } catch (error) {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalLabel;
        }
        showNewsletterRuntimeError(this);
      }
    }, { capture: true });
  });

  if ('IntersectionObserver' in window) {
    const newsletterObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      newsletterObserver.disconnect();
      loadNewsletterRuntime().catch(() => {});
    }, { rootMargin: '500px 0px' });

    document.querySelectorAll('.newsletter-inline-form').forEach((form) => {
      newsletterObserver.observe(form);
    });
  }

  document.querySelectorAll('[data-newsletter-dismiss]').forEach((button) => {
    button.addEventListener('click', () => hideNewsletterNudge(30));
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

  contactForm?.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!this.reportValidity()) return;

    if (this.dataset.contactConfigured !== 'true' || !this.action) {
      if (contactStatus) {
        contactStatus.textContent = 'The contact form is being connected. Please try again shortly.';
      }
      return;
    }

    const submitButton = this.querySelector('[data-contact-submit]');
    const originalLabel = submitButton?.textContent || 'Send enquiry';
    const formData = new FormData(this);
    formData.set('source_page', window.location.href);

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }
    if (contactStatus) contactStatus.textContent = 'Sending your enquiry…';

    try {
      const response = await fetch(this.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.error || (Array.isArray(result.errors) && result.errors.length > 0)) {
        throw new Error('Contact form submission failed');
      }

      this.reset();
      if (contactStatus) {
        contactStatus.textContent = 'Thanks — your enquiry has been sent. I’ll get back to you as soon as I can.';
      }
    } catch (error) {
      if (contactStatus) {
        contactStatus.textContent = 'I couldn’t send that just now. Please check your connection and try again.';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });

  document.addEventListener('ckjs:submission:complete', (event) => {
    const completedUID = String(event.detail?.uid || '');
    if (!newsletterUID || !completedUID.startsWith(newsletterUID)) return;
    storeValue(newsletterSubscribedKey, 'true');
    setNewsletterCooldown(3650);
  });

  updateThemeButton();
  registerServiceWorker();
  initialiseNewsletterPrompt();
})();
