/* tryouts.js — tryout dates/details + signup button + QR card. */
import { buildQrImg } from '../utils/qr-helper.js';
export function render(config, ctx) {
  const { esc } = ctx;
  const t = config.tryouts || {};
  if (t.enabled === false) return '';
  const dates = (t.dates || []).map((d) => `<span class="schedule-type">${esc(d)}</span>`).join(' ');
  const signup = t.signupUrl
    ? `<a class="btn btn-solid" href="${esc(t.signupUrl)}" target="_blank" rel="noopener">${esc(t.signupLabel || 'Register Now')}</a>`
    : '';

  return `
  <section class="section section-soft" id="tryouts">
    <div class="container">
      <div class="section-header">
        <div class="section-label">Recruiting</div>
        <h2 class="section-title">${esc(t.heading || 'Tryouts')}</h2>
        <div class="section-rule"></div>
      </div>
      <div class="tryouts-grid">
        <div class="info-card">
          <div class="info-row"><span class="info-label">Dates</span><span class="info-value">${dates || 'TBA'}</span></div>
          ${t.time ? `<div class="info-row"><span class="info-label">Time</span><span class="info-value">${esc(t.time)}</span></div>` : ''}
          ${t.location ? `<div class="info-row"><span class="info-label">Location</span><span class="info-value">${esc(t.location)}</span></div>` : ''}
          ${t.details ? `<div class="info-row"><span class="info-label">Details</span><span class="info-value">${esc(t.details)}</span></div>` : ''}
          <div style="margin-top:18px">${signup}</div>
        </div>
        <div class="info-card qr-card" id="tryoutQr">
          <div class="info-label" style="margin-bottom:10px">Scan to Register</div>
        </div>
      </div>
    </div>
  </section>`;
}
/* mount hook: called by main.js after injection to attach the QR image */
export function mount(config, ctx) {
  const t = config.tryouts || {};
  if (t.enabled === false || !t.signupUrl) return;
  const host = document.getElementById('tryoutQr');
  if (!host) return;
  host.appendChild(buildQrImg(t.signupUrl, t.qrCode, ctx.asset));
}
