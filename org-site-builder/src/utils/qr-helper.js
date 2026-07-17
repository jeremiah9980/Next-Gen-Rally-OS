/* ============================================================
   qr-helper.js
   Renders a QR code for the tryout/signup URL.
   Strategy (no backend, GitHub Pages friendly):
   1. If the org uploaded an image at config.tryouts.qrCode and it
      loads, use it.
   2. Otherwise, fall back to an on-the-fly QR image generated from
      the signup URL via a public QR endpoint, so the QR always works
      even before a coach uploads their own.
   You can also pre-generate a QR PNG and drop it in /public/qr/.
   ============================================================ */

export function buildQrImg(signupUrl, uploadedQrPath, asset) {
  const img = document.createElement('img');
  img.alt = 'Scan to register';
  img.loading = 'lazy';
  img.width = 180;
  img.height = 180;

  const fallback = signupUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(signupUrl)}`
    : '';

  if (uploadedQrPath) {
    img.src = asset(uploadedQrPath);
    img.onerror = () => { if (fallback) { img.onerror = null; img.src = fallback; } };
  } else if (fallback) {
    img.src = fallback;
  }
  return img;
}
