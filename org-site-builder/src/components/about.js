/* about.js — mission/pillars block. */
export function render(config, ctx) {
  const { esc } = ctx;
  const a = config.about || {};
  if (a.enabled === false) return '';
  const body = (a.body || []).map((p) => `<p>${esc(p)}</p>`).join('');
  const pillars = (a.pillars || [])
    .map((p) => `
      <div class="card">
        <div class="card-icon" aria-hidden="true">${esc(p.icon || '')}</div>
        <h3 class="card-title">${esc(p.title)}</h3>
        <p class="card-text">${esc(p.text)}</p>
      </div>`)
    .join('');

  return `
  <section class="section" id="about">
    <div class="container">
      <div class="section-header">
        <div class="section-label">About</div>
        <h2 class="section-title">${esc(a.heading || 'About Us')}</h2>
        <div class="section-rule"></div>
        ${a.subtitle ? `<p class="section-subtitle">${esc(a.subtitle)}</p>` : ''}
      </div>
      ${body ? `<div class="about-split"><div>${body}</div><div></div></div>` : ''}
      ${pillars ? `<div class="card-grid" style="margin-top:28px">${pillars}</div>` : ''}
    </div>
  </section>`;
}
