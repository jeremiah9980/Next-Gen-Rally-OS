/* header.js — sticky navigation bar, theme toggle, and mobile menu button. */
export function render(config, ctx) {
  const { esc, asset } = ctx;
  const org = config.organization || {};
  const brand = config.branding || {};
  const nav = config.nav || {};
  const links = (nav.links || [])
    .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
    .join('');

  const logo = brand.logo
    ? `<img src="${asset(brand.logo)}" alt="${esc(brand.logoAlt || org.name + ' logo')}" onerror="this.style.display='none'">`
    : '';

  const cta = nav.ctaLabel
    ? `<a href="${esc(nav.ctaHref || '#contact')}" class="nav-cta">${esc(nav.ctaLabel)}</a>`
    : '';

  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <nav class="navbar" aria-label="Primary">
    <div class="nav-inner">
      <a class="nav-brand" href="#home">
        ${logo}
        ${esc(org.nickname || org.name || 'Softball')} <span class="nav-tag">${esc(org.ageGroup || '')}</span>
      </a>
      <ul class="nav-links" id="navLinks">${links}</ul>
      <div class="nav-actions">
        <button class="theme-toggle" type="button" id="themeToggle" aria-pressed="false" aria-label="Switch to light mode">
          <span class="theme-toggle-track" aria-hidden="true"><span class="theme-toggle-knob"></span></span>
          <span class="theme-toggle-label">Light</span>
        </button>
        ${cta}
        <button class="nav-toggle-btn" type="button" id="navToggle" aria-label="Open menu" aria-expanded="false" aria-controls="navLinks">&#9776;</button>
      </div>
    </div>
  </nav>`;
}
