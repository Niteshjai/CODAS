(function() {
  try {
    var localTheme = localStorage.getItem('vite-ui-theme') || localStorage.getItem('theme');
    var themeToSet = localTheme;

    if (!localTheme || localTheme === 'system') {
      themeToSet = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    if (themeToSet === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
