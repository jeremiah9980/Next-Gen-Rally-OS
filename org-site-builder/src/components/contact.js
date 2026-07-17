/* contact.js — coach contact details + social links. */
export function render(config, ctx) {
  const { esc } = ctx;
  const c = config.contact || {};
  if (c.enabled === false) return '';
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
          ${c.coachName ? `<div class="info-row"><span class="info-label">Contact</span><span class="info-value">${esc(c.coachName)}</span></div>` : ''}
          ${c.phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value"><a href="tel:${esc((c.phone || '').replace(/[^0-9+]/g, ''))}">${esc(c.phone)}</a></span></div>` : ''}
          ${c.email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></span></div>` : ''}
          ${social ? `<div class="contact-social">${social}</div>` : ''}
        </div>
        <div class="info-card">
          <p class="card-text">Interested in joining, coaching, or sponsoring? Reach out using the details on the left and we will get right back to you.</p>
        </div>
      </div>
    </div>
  </section>`;
}
