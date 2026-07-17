/* coaches.js — coaching staff cards with graceful photo fallback. */
export function render(config, ctx) {
  const { esc, asset } = ctx;
  const coaches = config.coaches || [];
  if (!coaches.length) return '';
  const cards = coaches.map((c) => {
    const initials = (c.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const photo = c.photo
      ? `<img src="${asset(c.photo)}" alt="${esc(c.photoAlt || c.name)}" loading="lazy" onerror="this.style.display='none';this.closest('.coach-card').classList.add('no-photo')">`
      : '';
    const noPhotoClass = c.photo ? '' : ' no-photo';
    return `
      <div class="coach-card${noPhotoClass}">
        <div class="coach-photo">${photo}<div class="coach-photo-fallback" aria-hidden="true">${esc(initials)}</div></div>
        <div class="coach-body">
          <div class="coach-name">${esc(c.name)}</div>
          ${c.role ? `<div class="coach-role">${esc(c.role)}</div>` : ''}
          ${c.bio ? `<p class="coach-bio">${esc(c.bio)}</p>` : ''}
        </div>
      </div>`;
  }).join('');

  return `
  <section class="section section-soft" id="coaches">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Staff</div>
        <h2 class="section-title">Coaching Staff</h2>
        <div class="section-rule"></div>
      </div>
      <div class="coach-grid">${cards}</div>
    </div>
  </section>`;
}
