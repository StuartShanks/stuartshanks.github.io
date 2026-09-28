const profile = window.portfolio;
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
document.querySelectorAll('[data-name]').forEach((el) => el.textContent = profile.name);
document.title = `${profile.name} — Robotics & AI`;
$('#year').textContent = new Date().getFullYear();

const contacts = [];
if (profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) contacts.push(`<a class="contact-link" href="mailto:${escapeHTML(encodeURIComponent(profile.email))}">Email me ↗</a>`);
for (const [key, label] of [['github', 'GitHub'], ['linkedin', 'LinkedIn']]) {
  const url = safeURL(profile[key]);
  if (url) contacts.push(`<a class="contact-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`);
}
if (contacts.length) $('#contact-links').innerHTML = contacts.join('');
