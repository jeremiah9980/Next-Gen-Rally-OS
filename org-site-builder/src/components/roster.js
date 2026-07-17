/* roster.js — GameChanger-style player cards. Profile links activate
   only when a player is marked live:true (i.e. a signed media release
   is on file) — a privacy-by-default pattern from the reference sites. */
export function render(config, ctx) {
  const { esc, asset } = ctx;
  const r = config.roster || {};
  if (r.enabled === false) return '';
  const players = r.players || [];
  if (!players.length) return '';

  const liveCount = players.filter((p) => p.live).length;
  const cards = players.map((p) => {
    const live = !!p.live;
    const hasPhoto = !!p.photo;
    const photo = hasPhoto
      ? `<img src="${asset(p.photo)}" alt="${esc(p.photoAlt || '')}" loading="lazy" onerror="this.style.display='none';this.closest('.roster-card').classList.add('no-photo')">`
      : '';
    const pos = (p.positions || []).join(' / ');
    const ctaInner = live && p.profileUrl
      ? `<a class="rc-cta" href="${esc(p.profileUrl)}">View Profile</a>`
      : `<span class="rc-cta">${live ? 'Profile' : 'Profile Coming Soon'}</span>`;
    return `
      <div class="roster-card ${live ? 'is-live' : ''} ${hasPhoto ? '' : 'no-photo'}">
        <div class="rc-photo">
          ${photo}
          <div class="rc-photo-fallback" aria-hidden="true"><span class="rc-spot">#${esc(p.number || '')}</span></div>
          <span class="rc-num">#${esc(p.number || '')}</span>
        </div>
        <div class="rc-body">
          <div class="rc-name">${esc(p.firstName || '')} <span class="rc-ln">${esc(p.lastInitial || '')}</span></div>
          ${pos ? `<div class="rc-pos">${esc(pos)}</div>` : ''}
          ${ctaInner}
        </div>
      </div>`;
  }).join('');

  return `
  <section class="section" id="roster">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Team</div>
        <h2 class="section-title">${esc(r.heading || 'Roster')}</h2>
        <div class="section-rule"></div>
      </div>
      <span class="roster-counter"><strong>${players.length}</strong> Players &bull; ${liveCount} Profiles Live</span>
      ${r.note ? `<p class="section-subtitle" style="margin-top:0">${esc(r.note)}</p>` : ''}
      <div class="roster-grid">${cards}</div>
    </div>
  </section>`;
}
