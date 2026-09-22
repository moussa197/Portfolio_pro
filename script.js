document.querySelectorAll('details').forEach((item) =>
  item.addEventListener('toggle', () => {
    if (item.open) {
      document.querySelectorAll('details').forEach((other) => {
        if (other !== item) other.open = false;
      });
    }
  })
);

const themeButton = document.querySelector('.theme-toggle');

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeButton.setAttribute(
    'aria-label',
    theme === 'light' ? 'Activer le thème sombre' : 'Activer le thème clair'
  );
  themeButton.setAttribute('aria-pressed', String(theme === 'light'));
}

try {
  applyTheme(localStorage.getItem('mk-theme') === 'light' ? 'light' : 'dark');
} catch {
  applyTheme('dark');
}

themeButton.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(theme);
  try {
    localStorage.setItem('mk-theme', theme);
  } catch {}
});

const projects = [...document.querySelectorAll('.project')];

document.querySelectorAll('[data-filter]').forEach((button) =>
  button.addEventListener('click', () => {
    document
      .querySelectorAll('[data-filter]')
      .forEach((other) => other.setAttribute('aria-pressed', String(other === button)));

    projects.forEach(
      (project) =>
        (project.hidden =
          button.dataset.filter !== 'all' &&
          project.dataset.category !== button.dataset.filter)
    );

    const pair = document.querySelector('.project-pair');
    pair.hidden = ![...pair.children].some((project) => !project.hidden);
    pair.classList.toggle('filtered', button.dataset.filter === 'site');

    const count = projects.filter((project) => !project.hidden).length;
    document.querySelector('#filter-status').textContent =
      `${count} projet${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}.`;
  })
);

document.querySelector('#copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText('moussa01kta@gmail.com');
    status.textContent = 'Adresse copiée !';
  } catch {
    status.textContent =
      'Sélectionne l’adresse ci-dessus pour la copier, ou clique dessus pour écrire.';
  }
});

// One-time, progressive motion: content remains visible without JavaScript.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let revealObserver;

function reveal(element, delay = 0) {
  if (!motionPreference.matches && element.animate)
    element.animate(
      [
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      {
        duration: 450,
        delay,
        easing: 'cubic-bezier(.2,.65,.3,1)',
        fill: 'backwards',
      }
    );
}

if (!motionPreference.matches) {
  reveal(document.querySelector('.opportunity-note'), 80);

  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    document
      .querySelectorAll('.section-head,.project,.timeline')
      .forEach((element) => revealObserver.observe(element));
  }
}

motionPreference.addEventListener('change', (event) => {
  if (event.matches) {
    revealObserver?.disconnect();
    document.getAnimations().forEach((animation) => animation.cancel());
  }
});
