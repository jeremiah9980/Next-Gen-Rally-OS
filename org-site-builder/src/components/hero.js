/* hero.js — full-bleed hero with optional background photo, title, taglines, CTAs. */
export function render(config, ctx) {
  const { esc, asset } = ctx;
  const h = config.hero || {};
  const brand = config.branding || {};
  const org = config.organization || {};

  const bgPhoto = brand.heroImage
    ? `<img class="hero-photo" src="${asset(brand.heroImage)}" alt="${esc(brand.heroImageAlt || '')}" onerror="this.style.display='none'">`
    : '';
  const logo = brand.logo
    ? `<img class="hero-logo" src="${asset(brand.logo)}" alt="${esc(brand.logoAlt || org.name + ' logo')}" onerror="this.style.display='none'">`
    : '';
  const primary = h.primaryCta
    ? `<a class="btn btn-primary" href="${esc(h.primaryCta.href)}">${esc(h.primaryCta.label)}</a>` : '';
  const secondary = h.secondaryCta
    ? `<a class="btn btn-outline" href="${esc(h.secondaryCta.href)}">${esc(h.secondaryCta.label)}</a>` : '';

  return `
  <section class="hero" id="home">
    ${bgPhoto}
    <div class="hero-content">
      ${logo}
      ${h.kicker ? `<div class="hero-badge">${esc(h.kicker)}</div>` : ''}
      <h1 class="hero-title">${esc(h.title || org.name || '')}</h1>
      ${h.subtitle ? `<div class="hero-subtitle">${esc(h.subtitle)}</div>` : ''}
      <div class="hero-rule"></div>
      ${h.tagline || org.tagline ? `<p class="hero-tagline">${esc(h.tagline || org.tagline)}</p>` : ''}
      <div class="hero-cta">${primary}${secondary}</div>
    </div>
  </section>`;
}
