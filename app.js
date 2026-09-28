const profile = window.portfolio;
const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeURL = (value) => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
document.querySelectorAll('[data-name]').forEach((el) => el.textContent = profile.name);
document.title = `${profile.name} — Robotics & AI Simulation`;
$('#year').textContent = new Date().getFullYear();

const contacts = [];
if (profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) contacts.push(`<a class="contact-link" href="mailto:${escapeHTML(encodeURIComponent(profile.email))}">Email me ↗</a>`);
for (const [key, label] of [['github', 'GitHub'], ['linkedin', 'LinkedIn']]) {
  const url = safeURL(profile[key]);
  if (url) contacts.push(`<a class="contact-link" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`);
}
if (contacts.length) $('#contact-links').innerHTML = contacts.join('');

// Analytic inverse kinematics for a planar two-link arm; no physics or AI model.
const canvas = $('#robot-canvas');
const ctx = canvas.getContext('2d');
const xInput = $('#target-x');
const yInput = $('#target-y');
let scene = { width: 0, height: 0, scale: 1, baseX: 0, baseY: 0 };
function drawArm() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min(width / 420, height / 340);
  const baseX = width * .47, baseY = height - 34;
  scene = { width, height, scale, baseX, baseY };
  ctx.strokeStyle = '#30392e'; ctx.lineWidth = .6;
  for (let x = 0; x < width; x += 26) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y < height; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
  const point = (x, y) => [baseX + x * scale, baseY - y * scale];
  const line = (a, b, color, size) => { ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.stroke(); };
  const circle = (p, radius, fill, stroke) => { ctx.beginPath(); ctx.arc(...p, radius, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); } };
  const tx = Number(xInput.value), ty = Number(yInput.value), l1 = 136, l2 = 112;
  $('#value-x').textContent = tx; $('#value-y').textContent = ty;
  const distance = Math.hypot(tx, ty);
  const reachable = distance <= l1 + l2 && distance >= Math.abs(l1 - l2);
  $('#reach-status').textContent = reachable ? 'Target reachable' : 'Outside reach — arm extended';
  const clamped = Math.max(Math.abs(l1 - l2) + .001, Math.min(distance, l1 + l2 - .001));
  const x = tx * clamped / distance, y = ty * clamped / distance;
  const a2 = -Math.acos(Math.max(-1, Math.min(1, (x*x + y*y - l1*l1 - l2*l2)/(2*l1*l2))));
  const a1 = Math.atan2(y, x) - Math.atan2(l2 * Math.sin(a2), l1 + l2 * Math.cos(a2));
  const elbow = point(l1 * Math.cos(a1), l1 * Math.sin(a1));
  const tip = point(x, y), base = point(0, 0), target = point(tx, ty);
  ctx.setLineDash([3, 6]); ctx.beginPath(); ctx.arc(...base, (l1+l2)*scale, Math.PI, 2*Math.PI); ctx.strokeStyle = '#566847'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
  line(point(-165, 0), point(195, 0), '#7e8c71', 1);
  ctx.fillStyle = '#37402e'; ctx.fillRect(baseX-32*scale, baseY, 64*scale, 12*scale);
  ctx.lineCap = 'round';
  for (const [a,b] of [[base, elbow], [elbow, tip]]) { line(a,b,'#171c16',24*scale); line(a,b,'#b7c9a0',17*scale); line(a,b,'#d5dfc6',10*scale); }
  for (const joint of [base, elbow]) { circle(joint, 15*scale, '#242d20', '#b4c799'); circle(joint, 5*scale, '#d9fa88'); }
  circle(tip, 8*scale, '#d9fa88', '#20251a');
  circle(target, 18*scale, null, '#d9fa88');
  line([target[0]-24*scale,target[1]], [target[0]+24*scale,target[1]], '#d9fa88', 1);
  line([target[0],target[1]-24*scale], [target[0],target[1]+24*scale], '#d9fa88', 1);
  ctx.fillStyle = '#a5b49a'; ctx.font = '9px monospace';
  ctx.fillText('J₁', baseX-29*scale, baseY-19*scale);
  ctx.fillText('J₂', elbow[0]-28*scale, elbow[1]-19*scale);
  ctx.fillText('x', width-23, baseY-9);
  ctx.fillStyle = '#d9fa88'; ctx.fillText('TARGET', Math.max(8, Math.min(width-55,target[0]+26*scale)), Math.max(12,target[1]-20*scale));
}
xInput.addEventListener('input', drawArm); yInput.addEventListener('input', drawArm);
new ResizeObserver(drawArm).observe(canvas);
let dragging = false;
function moveTarget(event) {
  const rect = canvas.getBoundingClientRect();
  xInput.value = Math.round((event.clientX - rect.left - scene.baseX) / scene.scale);
  yInput.value = Math.round((scene.baseY - (event.clientY - rect.top)) / scene.scale);
  drawArm();
}
canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const dx = event.clientX - rect.left - (scene.baseX + Number(xInput.value) * scene.scale);
  const dy = event.clientY - rect.top - (scene.baseY - Number(yInput.value) * scene.scale);
  if (Math.hypot(dx,dy) > 30) return;
  dragging = true; canvas.setPointerCapture(event.pointerId); moveTarget(event);
});
canvas.addEventListener('pointermove', (event) => { if (dragging) moveTarget(event); });
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointercancel', () => dragging = false);
drawArm();
