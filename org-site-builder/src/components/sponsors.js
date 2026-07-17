/* sponsors.js — sponsor logo grid with tiers and a "become a sponsor" CTA. */
export function render(config, ctx) {
  const { esc, asset } = ctx;
  const s = config.sponsors || {};
  if (s.enabled === false) return '';
  const items = s.items || [];
  const cards = items.map((sp) => {
    const inner = `
      ${sp.logo ? `<img src="${asset(sp.logo)}" alt="${esc(sp.name || 'Sponsor')} logo" loading="lazy" onerror="this.style.display='none'">` : ''}
      <div class="sponsor-name">${esc(sp.name || '')}</div>
      ${sp.tier ? `<div class="sponsor-tier">${esc(sp.tier)} Sponsor</div>` : ''}`;
    return sp.url
      ? `<a class="sponsor-card" href="${esc(sp.url)}" target="_blank" rel="noopener">${inner}</a>`
      : `<div class="sponsor-card">${inner}</div>`;
  }).join('');
  const cta = s.ctaLabel ? `<div style="margin-top:24px"><a class="btn btn-solid" href="${esc(s.ctaHref || '#contact')}">${esc(s.ctaLabel)}</a></div>` : '';

  return `
  <section class="section" id="sponsors">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Partners</div>
        <h2 class="section-title">${esc(s.heading || 'Sponsors')}</h2>
        <div class="section-rule"></div>
        ${s.subtitle ? `<p class="section-subtitle">${esc(s.subtitle)}</p>` : ''}
      </div>
      ${cards ? `<div class="sponsor-grid">${cards}</div>` : '<p>Sponsorship opportunities available — see Contact below.</p>'}
      ${cta}
    </div>
  </section>`;
}
