/* governance.js — the four-tier org structure + board rules. Renders the
   bridge's `governance` block: tier cards (owns / does-not-own / people)
   plus the board's voting cadence, quorum, and decision domains. The two
   firewalls render with the coaching section (see coaching.js). */
export function render(config, ctx) {
  const { esc } = ctx;
  const g = config.governance || {};
  if (g.enabled === false || (!(g.tiers || []).length && !g.board)) return '';

  const tiers = (g.tiers || [])
    .map((t) => {
      const people = (t.people || [])
        .map((p) => `<li><strong>${esc(p.name)}</strong>${p.detail ? ` — ${esc(p.detail)}` : ''}</li>`)
        .join('');
      return `
      <div class="card">
        <h3 class="card-title">${esc(t.tier)}</h3>
        ${t.body ? `<p class="card-text"><strong>${esc(t.body)}</strong></p>` : ''}
        ${t.owns ? `<p class="card-text"><strong>Owns:</strong> ${esc(t.owns)}</p>` : ''}
        ${t.notOwns ? `<p class="card-text"><strong>Does not own:</strong> ${esc(t.notOwns)}</p>` : ''}
        ${people ? `<ul class="card-text">${people}</ul>` : ''}
      </div>`;
    })
    .join('');

  const b = g.board || {};
  const domains = (b.decisionDomains || []).map((d) => `<li>${esc(d)}</li>`).join('');
  const board = (b.votingCadence || b.quorum || domains)
    ? `
      <div class="card">
        <h3 class="card-title">How the Board Decides</h3>
        ${b.votingCadence ? `<p class="card-text"><strong>Voting cadence:</strong> ${esc(b.votingCadence)}</p>` : ''}
        ${b.quorum ? `<p class="card-text"><strong>Quorum:</strong> ${esc(b.quorum)}</p>` : ''}
        ${domains ? `<p class="card-text"><strong>Board votes decide:</strong></p><ul class="card-text">${domains}</ul>` : ''}
      </div>`
    : '';

  return `
  <section class="section section-soft" id="governance">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Governance</div>
        <h2 class="section-title">${esc(g.heading || 'Governance')}</h2>
        <div class="section-rule"></div>
        ${g.subtitle ? `<p class="section-subtitle">${esc(g.subtitle)}</p>` : ''}
      </div>
      ${tiers ? `<div class="card-grid">${tiers}</div>` : ''}
      ${board ? `<div class="card-grid" style="margin-top:28px">${board}</div>` : ''}
    </div>
  </section>`;
}
