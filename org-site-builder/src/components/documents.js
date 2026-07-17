/* documents.js — the public document library. Renders the bridge's
   `documents` block: one card per document (bylaws, welcome packet,
   sponsorship package, media release). Items with a url become links. */
export function render(config, ctx) {
  const { esc } = ctx;
  const d = config.documents || {};
  if (d.enabled === false || !(d.items || []).length) return '';

  const items = (d.items || [])
    .map((doc) => {
      const title = doc.url
        ? `<a href="${esc(doc.url)}" target="_blank" rel="noopener">${esc(doc.title)}</a>`
        : esc(doc.title);
      return `
      <div class="card">
        <h3 class="card-title">${title}${doc.format ? ` <span class="nav-tag">${esc(String(doc.format).toUpperCase())}</span>` : ''}</h3>
        ${doc.description ? `<p class="card-text">${esc(doc.description)}</p>` : ''}
      </div>`;
    })
    .join('');

  return `
  <section class="section section-soft" id="documents">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Documents</div>
        <h2 class="section-title">${esc(d.heading || 'Documents')}</h2>
        <div class="section-rule"></div>
      </div>
      <div class="card-grid">${items}</div>
    </div>
  </section>`;
}
