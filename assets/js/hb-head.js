(function setInitialTheme() {
  const root = document.documentElement;

  try {
    const savedTheme = localStorage.getItem('vidun-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initialTheme = savedTheme || systemTheme;
    root.dataset.theme = initialTheme;
    root.classList.toggle('dark', initialTheme === 'dark');
    root.style.colorScheme = initialTheme;
  } catch (error) {
    root.dataset.theme = 'dark';
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }
})();
