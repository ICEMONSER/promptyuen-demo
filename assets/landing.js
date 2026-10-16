// Progressive enhancement only. The existing application owns all case data and workflows.
const landing = document.getElementById('landing');
const workspace = document.getElementById('workspace');
function showRoute({focus = false} = {}) {
  const active = location.hash === '#workspace';
  landing.hidden = active;
  workspace.hidden = !active;
  const tweaks = document.getElementById('display-tweaks');
  (active ? document.querySelector('.py-workspace-bar') : document.querySelector('.py-header')).append(tweaks);
  if (focus) {
    const target = active ? workspace : document.getElementById(location.hash.slice(1));
    if (target) {
      target.scrollIntoView({block: 'start'});
      if (active) { target.tabIndex = -1; target.focus({preventScroll: true}); }
    }
  }
}
window.addEventListener('hashchange', () => showRoute({focus: true}));
showRoute();

const tabs = [...document.querySelectorAll('.py-tabs [role="tab"]')];
function selectTab(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  if (focus) tab.focus();
}
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const next = {ArrowDown: (index + 1) % tabs.length, ArrowUp: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1}[event.key];
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
}

const toggle = document.getElementById('tweaks-toggle');
const panel = document.getElementById('tweaks-panel');
const root = document.documentElement;
const controls = [...panel.querySelectorAll('input')];
function togglePanel(open) {
  panel.hidden = !open;
  toggle.setAttribute('aria-expanded', String(open));
}
toggle.addEventListener('click', () => togglePanel(panel.hidden));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { togglePanel(false); toggle.focus(); } });
function luminance(hex) {
  const rgb = hex.match(/[a-f\d]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function applyTweaks() {
  const primary = document.getElementById('tweak-primary').value;
  const light = luminance(primary);
  const whiteRatio = 1.05 / (light + .05);
  const darkRatio = (light + .05) / .05;
  root.style.setProperty('--py-primary', primary);
  root.style.setProperty('--py-on-primary', whiteRatio >= darkRatio ? '#ffffff' : '#000000');
  // Keep links and key numbers AA even if the custom button color is very light.
  root.style.setProperty('--py-link', whiteRatio >= 4.5 ? primary : '#103c4d');
  root.style.setProperty('--py-space-scale', document.getElementById('tweak-spacing').value / 100);
  root.style.setProperty('--py-font-size', document.getElementById('tweak-font').value + 'px');
  root.style.setProperty('--py-radius', document.getElementById('tweak-radius').value + 'px');
  for (const input of controls) {
    const output = panel.querySelector(`output[for="${input.id}"]`);
    if (output) output.value = input.value + (input.id === 'tweak-spacing' ? '%' : '');
  }
}
for (const control of controls) control.addEventListener('input', applyTweaks);
document.getElementById('tweaks-reset').addEventListener('click', () => {
  for (const control of controls) control.value = control.defaultValue;
  applyTweaks();
});

// Small, distinct entrances; content is visible if observation or animation is unavailable.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('py-in');
      observer.unobserve(entry.target);
    }
  }, {threshold: .12});
  document.querySelectorAll('.py-stats h2, .py-stat-row p, .py-how li, .py-limits dl > div, .py-close h2').forEach(item => observer.observe(item));
}
