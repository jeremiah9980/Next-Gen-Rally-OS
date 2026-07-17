/* ============================================================
   theme-toggle.js
   Light/dark theme controller.
   - Defaults to the visitor's system preference on first visit
   - Persists the choice in localStorage so it sticks across visits
   - Flips data-theme on <html>; CSS variables do the rest (no reflow)
   - Keeps the toggle button accessible (aria-pressed + label)
   Adapted and generalized from the data-theme pattern used on the
   reference sites; storage key is namespaced per organization.
   ============================================================ */

export function initThemeToggle({ storageKey = 'org-theme' } = {}) {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const label = toggle ? toggle.querySelector('.theme-toggle-label') : null;

  function preferredTheme() {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(storageKey, next); } catch (_) { /* private mode */ }
    if (toggle) {
      const isLight = next === 'light';
      toggle.setAttribute('aria-pressed', String(isLight));
      toggle.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      if (label) label.textContent = isLight ? 'Dark' : 'Light';
    }
  }

  // Apply immediately so there is no flash of the wrong theme.
  applyTheme(preferredTheme());

  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
      applyTheme(current === 'light' ? 'dark' : 'light');
    });
  }

  // Respond to OS-level changes only if the user hasn't chosen explicitly.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem(storageKey)) applyTheme(e.matches ? 'light' : 'dark');
    });
  }
}
