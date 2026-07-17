/* platform.js — the tech-stack / Rally-IQ block. Renders the bridge's
   `platform` block: stats + communication apps, sanctioning bodies, and
   (when pageType is "rallyiq") the Rally-IQ module cards. */
export function render(config, ctx) {
  const { esc } = ctx;
  const p = config.platform || {};
  if (p.enabled === false || (!p.statsApp && !p.commApp && !(p.rallyiqModules || []).length)) return '';

  const stackBits = [
    p.statsApp ? `<strong>Stats:</strong> ${esc(p.statsApp)}` : '',
    p.commApp ? `<strong>Communication:</strong> ${esc(p.commApp)}` : '',
    (p.sanctioning || []).length ? `<strong>Sanctioned:</strong> ${p.sanctioning.map(esc).join(' · ')}` : '',
  ].filter(Boolean);

  const modules = (p.rallyiqModules || [])
    .map((m) => `
      <div class="card">
        <h3 class="card-title">${esc(m.name)}</h3>
        <p class="card-text">${esc(m.text)}</p>
      </div>`)
    .join('');

  return `
  <section class="section section-soft" id="platform">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Platform</div>
        <h2 class="section-title">${esc(p.heading || 'Tech Stack')}</h2>
        <div class="section-rule"></div>
        ${stackBits.length ? `<p class="section-subtitle">${stackBits.join(' &nbsp;&bull;&nbsp; ')}</p>` : ''}
      </div>
      ${modules ? `<div class="card-grid">${modules}</div>` : ''}
    </div>
  </section>`;
}
