/* footer.js — brand footer with quick links and tagline. */
export function render(config, ctx) {
  const { esc } = ctx;
  const org = config.organization || {};
  const f = config.footer || {};
  const nav = config.nav || {};
  const links = (nav.links || [])
    .map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`)
    .join('');
  const year = new Date().getFullYear();
  return `
  <footer>
    <div class="footer-brand">${esc(org.nickname || org.name || '')}</div>
    <ul class="footer-links">${links}</ul>
    ${f.tagline ? `<p>${esc(f.tagline)}</p>` : ''}
    ${f.credit ? `<p>${esc(f.credit)}</p>` : ''}
    <p>&copy; ${year} ${esc(org.name || '')}. All rights reserved.</p>
  </footer>`;
}
