/* support.js — sponsor tiers + brand partners. Renders the bridge's
   `support` block (distinct from the simple `sponsors` logo grid):
   tier cards with amounts + benefits, then partner names. */
export function render(config, ctx) {
  const { esc } = ctx;
  const s = config.support || {};
  if (s.enabled === false || (!(s.tiers || []).length && !(s.partners || []).length)) return '';

  const tiers = (s.tiers || [])
    .map((t) => {
      const benefits = (t.benefits || []).map((b) => `<li>${esc(b)}</li>`).join('');
      return `
      <div class="card">
        <h3 class="card-title">${esc(t.tier)}${t.amount ? ` — ${esc(t.amount)}` : ''}</h3>
        ${benefits ? `<ul class="card-text">${benefits}</ul>` : ''}
      </div>`;
    })
    .join('');

  const partners = (s.partners || []).length
    ? `<p class="section-subtitle" style="margin-top:24px"><strong>Brand partners:</strong> ${s.partners.map(esc).join(' · ')}</p>`
    : '';

  return `
  <section class="section" id="support">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Support Us</div>
        <h2 class="section-title">${esc(s.heading || 'Support Us')}</h2>
        <div class="section-rule"></div>
        ${s.subtitle ? `<p class="section-subtitle">${esc(s.subtitle)}</p>` : ''}
      </div>
      ${tiers ? `<div class="card-grid">${tiers}</div>` : ''}
      ${partners}
    </div>
  </section>`;
}
