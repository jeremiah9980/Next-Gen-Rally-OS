/* schedule.js — list of upcoming practices, tournaments, and events. */
export function render(config, ctx) {
  const { esc } = ctx;
  const s = config.schedule || {};
  if (s.enabled === false) return '';
  const events = s.events || [];
  if (!events.length) return '';
  const rows = events.map((e) => `
    <div class="schedule-row">
      <div class="schedule-date">${esc(e.date || '')}</div>
      <div class="schedule-info">
        <div class="schedule-name">${esc(e.name || '')}</div>
        ${e.location ? `<div class="schedule-loc">${esc(e.location)}</div>` : ''}
      </div>
      ${e.type ? `<div class="schedule-type">${esc(e.type)}</div>` : ''}
    </div>`).join('');

  return `
  <section class="section" id="schedule">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Calendar</div>
        <h2 class="section-title">${esc(s.heading || 'Schedule')}</h2>
        <div class="section-rule"></div>
        ${s.subtitle ? `<p class="section-subtitle">${esc(s.subtitle)}</p>` : ''}
      </div>
      <div class="schedule-list">${rows}</div>
    </div>
  </section>`;
}
