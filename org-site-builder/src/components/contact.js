/* contact.js — coach contact details + social links. */
export function render(config, ctx) {
  const { esc } = ctx;
  const c = config.contact || {};
  if (c.enabled === false) return '';
  // Bridged/portal configs use primary*; hand-written configs use the
  // older coachName/phone/email names. Support both.
  const name = c.primaryName || c.coachName || '';
  const phone = c.primaryPhone || c.phone || '';
  const email = c.primaryEmail || c.email || c.publicEmail || '';
  const social = (c.social || [])
    .map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.platform)}</a>`)
    .join('');

  return `
  <section class="section" id="contact">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Get In Touch</div>
        <h2 class="section-title">${esc(c.heading || 'Contact')}</h2>
        <div class="section-rule"></div>
        ${c.subtitle ? `<p class="section-subtitle">${esc(c.subtitle)}</p>` : ''}
      </div>
      <div class="contact-grid">
        <div class="info-card">
          ${name ? `<div class="info-row"><span class="info-label">Contact</span><span class="info-value">${esc(name)}</span></div>` : ''}
          ${phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value"><a href="tel:${esc(phone.replace(/[^0-9+]/g, ''))}">${esc(phone)}</a></span></div>` : ''}
          ${email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value"><a href="mailto:${esc(email)}">${esc(email)}</a></span></div>` : ''}
          ${c.tryoutsHandler ? `<div class="info-row"><span class="info-label">Tryouts</span><span class="info-value">${esc(c.tryoutsHandler)}</span></div>` : ''}
          ${social ? `<div class="contact-social">${social}</div>` : ''}
        </div>
        <div class="info-card">
          <p class="card-text">${esc(c.note || 'Interested in joining, coaching, or sponsoring? Reach out using the details on the left and we will get right back to you.')}</p>
        </div>
      </div>
    </div>
  </section>`;
}
