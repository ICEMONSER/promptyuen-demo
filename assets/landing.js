// Progressive enhancement only. The existing application owns all case data and workflows.
const landing = document.getElementById('landing');
const workspace = document.getElementById('workspace');
function showRoute({focus = false} = {}) {
  const active = location.hash === '#workspace';
  landing.hidden = active;
  workspace.hidden = !active;
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

// Small, distinct entrances; content is visible if observation or animation is unavailable.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      entry.target.classList.add('py-in');
      observer.unobserve(entry.target);
    }
  }, {threshold: .12});
  document.querySelectorAll('.pk-principles .pk-wrap > div, .pk-type, .pk-steps li, .pk-tile, .pk-privacy-lists > div, .pk-access-panel').forEach(item => observer.observe(item));
}
