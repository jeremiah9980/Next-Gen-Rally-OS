/* finances.js — public dues + where-the-money-goes block. Renders the
   bridge's `finances` block: annual dues headline, what dues cover, and
   the coach-waiver policy. Transparency is the point — it stays public. */
export function render(config, ctx) {
  const { esc } = ctx;
  const f = config.finances || {};
  if (f.enabled === false || (!f.annualDues && !(f.duesCovers || []).length)) return '';

  const covers = (f.duesCovers || []).map((c) => `<li>${esc(c)}</li>`).join('');

  return `
  <section class="section" id="finances">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Finances</div>
        <h2 class="section-title">${esc(f.heading || 'Finances')}</h2>
        <div class="section-rule"></div>
        ${f.note ? `<p class="section-subtitle">${esc(f.note)}</p>` : ''}
      </div>
      <div class="card-grid">
        ${f.annualDues ? `
        <div class="card">
          <h3 class="card-title">Annual Dues — ${esc(f.annualDues)}</h3>
          ${covers ? `<p class="card-text"><strong>Dues cover:</strong></p><ul class="card-text">${covers}</ul>` : ''}
        </div>` : ''}
        ${f.coachWaivers ? `
        <div class="card">
          <h3 class="card-title">Coach Waivers</h3>
          <p class="card-text">${esc(f.coachWaivers)}</p>
        </div>` : ''}
      </div>
    </div>
  </section>`;
}
