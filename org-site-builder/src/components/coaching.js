/* coaching.js — the bridge's `coaching` block: philosophy, staff cards,
   and the two firewalls (Coaching Firewall + Family-First Coverage).
   Distinct from coaches.js, which renders a hand-written `coaches` array;
   this section carries the nav's #coaching anchor for bridged configs. */
export function render(config, ctx) {
  const { esc } = ctx;
  const c = config.coaching || {};
  if (c.enabled === false || (!(c.staff || []).length && !c.firewall)) return '';

  const staff = (c.staff || [])
    .map((s) => {
      const initials = (s.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      const meta = [s.background, s.years ? `${s.years} yrs` : ''].filter(Boolean).join(' · ');
      return `
      <div class="coach-card no-photo">
        <div class="coach-photo"><div class="coach-photo-fallback" aria-hidden="true">${esc(initials)}</div></div>
        <div class="coach-body">
          <div class="coach-name">${esc(s.name)}</div>
          ${s.role ? `<div class="coach-role">${esc(s.role)}</div>` : ''}
          ${s.bio ? `<p class="coach-bio">${esc(s.bio)}</p>` : ''}
          ${meta ? `<p class="coach-bio">${esc(meta)}</p>` : ''}
        </div>
      </div>`;
    })
    .join('');

  const firewalls = [c.firewall, c.familyFirst]
    .filter((f) => f && f.text)
    .map((f) => `
      <div class="card">
        <h3 class="card-title">${esc(f.title)}</h3>
        <p class="card-text">${esc(f.text)}</p>
      </div>`)
    .join('');

  return `
  <section class="section" id="coaching">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Coaching</div>
        <h2 class="section-title">${esc(c.heading || 'Coaching')}</h2>
        <div class="section-rule"></div>
        ${c.philosophy ? `<p class="section-subtitle">${esc(c.philosophy)}</p>` : ''}
      </div>
      ${staff ? `<div class="coach-grid">${staff}</div>` : ''}
      ${firewalls ? `<div class="card-grid" style="margin-top:28px">${firewalls}</div>` : ''}
    </div>
  </section>`;
}
