/* gallery.js — responsive photo grid with optional captions. */
export function render(config, ctx) {
  const { esc, asset } = ctx;
  const g = config.gallery || {};
  if (g.enabled === false) return '';
  const items = (g.items || []).filter((i) => i.image);
  if (!items.length) return '';
  const cells = items.map((i) => `
    <figure class="gallery-item">
      <img src="${asset(i.image)}" alt="${esc(i.alt || '')}" loading="lazy" onerror="this.closest('.gallery-item').style.display='none'">
      ${i.caption ? `<figcaption class="gallery-caption">${esc(i.caption)}</figcaption>` : ''}
    </figure>`).join('');

  return `
  <section class="section section-soft" id="gallery">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Photos</div>
        <h2 class="section-title">${esc(g.heading || 'Gallery')}</h2>
        <div class="section-rule"></div>
        ${g.subtitle ? `<p class="section-subtitle">${esc(g.subtitle)}</p>` : ''}
      </div>
      <div class="gallery-grid">${cells}</div>
    </div>
  </section>`;
}
