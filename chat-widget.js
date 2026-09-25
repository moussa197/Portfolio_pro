// Ask Moussa: the portfolio's AI assistant. Self-contained, no dependency on script.js.
// Any element with [data-open-chat] opens the chat; window.AskMoussa.open() works too.
(() => {
  'use strict';

  const API_URL = 'https://askmoussa.onrender.com/chat';
  const EMAIL = 'moussa01kta@gmail.com';
  const MAX_LENGTH = 500;
  const WAKE_UP_DELAY = 5000;
  const REQUEST_TIMEOUT = 90000;

  const SUGGESTIONS = [
    'Quels sont ses projets ?',
    'Quelles technologies maîtrise-t-il ?',
    'Comment le contacter ?',
  ];

  const TEXT = {
    welcome:
      "Bonjour ! Je suis Ask Moussa, l'assistant IA de ce portfolio. Posez-moi une question sur le parcours, les projets ou les compétences de Moussa.",
    wakeUp: "L'assistant se réveille, cela peut prendre jusqu'à une minute…",
    invalid: "Je n'ai pas pu traiter cette question. Pouvez-vous la reformuler ?",
    tooLong: `Votre question est trop longue. Merci de la raccourcir (${MAX_LENGTH} caractères maximum).`,
    rateLimited:
      "Vous avez posé beaucoup de questions en peu de temps. Merci de réessayer dans quelques instants, ou d'écrire directement à Moussa :",
    unavailable:
      "L'assistant est momentanément indisponible, désolé. Vous pouvez réessayer un peu plus tard, ou écrire directement à Moussa :",
  };

  const ICONS = {
    chat: ['M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.4-5.1A8.5 8.5 0 1 1 21 11.5Z', 'M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01'],
    close: ['M6 6l12 12', 'M18 6 6 18'],
    send: ['M5 12h14', 'M13 6l6 6-6 6'],
  };

  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') node.className = value;
      else if (key === 'text') node.textContent = value;
      else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
  }

  function icon(name, className = '') {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const attrs = {
      viewBox: '0 0 24 24',
      width: '22',
      height: '22',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    };
    for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);
    if (className) svg.setAttribute('class', className);
    ICONS[name].forEach((d) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      svg.append(path);
    });
    return svg;
  }

  // ---- Markup ----
  const launcher = el(
    'button',
    {
      className: 'amc-launcher',
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'amc-panel',
      'aria-label': "Ouvrir Ask Moussa, l'assistant IA",
    },
    [icon('chat', 'amc-icon-chat'), icon('close', 'amc-icon-close')]
  );

  const closeButton = el(
    'button',
    { className: 'amc-close', type: 'button', 'aria-label': "Fermer l'assistant" },
    [icon('close')]
  );

  const header = el('div', { className: 'amc-head' }, [
    el('span', { className: 'amc-avatar', 'aria-hidden': 'true', text: 'mk' }),
    el('div', { className: 'amc-head-text' }, [
      el('p', { className: 'amc-title', id: 'amc-title', text: 'Ask Moussa' }),
      el('p', {
        className: 'amc-disclaimer',
        id: 'amc-disclaimer',
        text: 'Assistant IA, il peut faire des erreurs',
      }),
    ]),
    closeButton,
  ]);

  const log = el('div', {
    className: 'amc-log',
    role: 'log',
    'aria-live': 'polite',
    'aria-label': 'Conversation avec Ask Moussa',
  });

  const suggestions = el(
    'div',
    { className: 'amc-suggestions', role: 'group', 'aria-label': 'Questions suggérées' },
    SUGGESTIONS.map((question) =>
      el('button', { className: 'amc-suggestion', type: 'button', text: question })
    )
  );

  const body = el('div', { className: 'amc-body' }, [log, suggestions]);

  const input = el('textarea', {
    className: 'amc-input',
    id: 'amc-input',
    rows: '1',
    maxlength: String(MAX_LENGTH),
    placeholder: 'Posez votre question…',
    'aria-describedby': 'amc-counter',
    autocomplete: 'off',
  });

  const counter = el('span', {
    className: 'amc-counter',
    id: 'amc-counter',
    'aria-label': `0 caractère sur ${MAX_LENGTH}`,
    text: `0/${MAX_LENGTH}`,
  });

  const sendButton = el('button', { className: 'amc-send', type: 'submit' }, [
    el('span', { text: 'Envoyer' }),
    icon('send'),
  ]);

  const form = el('form', { className: 'amc-form', novalidate: '' }, [
    el('label', { className: 'amc-sr-only', for: 'amc-input', text: 'Votre question' }),
    input,
    el('div', { className: 'amc-form-foot' }, [counter, sendButton]),
  ]);

  const panel = el(
    'section',
    {
      className: 'amc-panel',
      id: 'amc-panel',
      role: 'dialog',
      'aria-labelledby': 'amc-title',
      'aria-describedby': 'amc-disclaimer',
    },
    [header, body, form]
  );
  panel.hidden = true;

  const root = el('div', { className: 'amc' }, [panel, launcher]);

  // ---- Messages ----
  function scrollToEnd() {
    body.scrollTop = body.scrollHeight;
  }

  function addMessage(kind, text) {
    const who = kind === 'user' ? 'Vous : ' : 'Ask Moussa : ';
    const bubble = el('p', { className: `amc-msg amc-msg--${kind}` }, [
      el('span', { className: 'amc-sr-only', text: who }),
    ]);
    // Answers are always inserted as plain text, never as HTML.
    bubble.append(document.createTextNode(text));
    log.append(bubble);
    scrollToEnd();
    return bubble;
  }

  function addError(text, withEmail) {
    const bubble = addMessage('bot', text);
    bubble.classList.add('amc-msg--error');
    if (withEmail) {
      bubble.append(' ', el('a', { href: `mailto:${EMAIL}`, text: EMAIL }));
    }
    scrollToEnd();
  }

  function addTyping() {
    const typing = el('p', { className: 'amc-msg amc-msg--bot amc-typing' }, [
      el('span', { className: 'amc-sr-only', text: 'Ask Moussa rédige une réponse…' }),
      el('span', { className: 'amc-dot', 'aria-hidden': 'true' }),
      el('span', { className: 'amc-dot', 'aria-hidden': 'true' }),
      el('span', { className: 'amc-dot', 'aria-hidden': 'true' }),
    ]);
    log.append(typing);
    scrollToEnd();
    return typing;
  }

  // ---- Input ----
  function updateInput() {
    const length = input.value.length;
    counter.textContent = `${length}/${MAX_LENGTH}`;
    counter.setAttribute('aria-label', `${length} caractère${length > 1 ? 's' : ''} sur ${MAX_LENGTH}`);
    counter.classList.toggle('is-near-limit', length >= MAX_LENGTH - 50);
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  }

  let pending = false;

  function setBusy(busy) {
    pending = busy;
    sendButton.disabled = busy;
    form.setAttribute('aria-busy', String(busy));
    suggestions.querySelectorAll('button').forEach((button) => (button.disabled = busy));
  }

  // ---- API ----
  async function ask(raw) {
    const question = raw.trim().slice(0, MAX_LENGTH);
    if (pending) return;
    if (!question) {
      input.focus();
      return;
    }

    suggestions.remove();
    addMessage('user', question);
    input.value = '';
    updateInput();
    setBusy(true);

    const typing = addTyping();
    let wakeUpNote;
    const wakeUpTimer = setTimeout(() => {
      wakeUpNote = addMessage('status', TEXT.wakeUp);
    }, WAKE_UP_DELAY);
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    let answer = null;
    let error = null;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (typeof data.answer === 'string' && data.answer.trim()) answer = data.answer.trim();
        else error = 'unavailable';
      } else if (response.status === 422) error = 'invalid';
      else if (response.status === 413) error = 'tooLong';
      else if (response.status === 429) error = 'rateLimited';
      else error = 'unavailable';
    } catch {
      error = 'unavailable';
    } finally {
      clearTimeout(wakeUpTimer);
      clearTimeout(timeoutTimer);
      typing.remove();
      wakeUpNote?.remove();
    }

    if (answer) addMessage('bot', answer);
    else addError(TEXT[error], error === 'rateLimited' || error === 'unavailable');

    setBusy(false);
    if (!panel.hidden) input.focus({ preventScroll: true });
  }

  // ---- Open / close ----
  let returnFocusTo = launcher;

  function open(trigger) {
    if (trigger instanceof HTMLElement) returnFocusTo = trigger;
    if (panel.hidden) {
      panel.hidden = false;
      root.classList.add('is-open');
      launcher.setAttribute('aria-expanded', 'true');
      launcher.setAttribute('aria-label', "Fermer Ask Moussa, l'assistant IA");
      scrollToEnd();
    }
    input.focus({ preventScroll: true });
  }

  function close() {
    if (panel.hidden) return;
    panel.hidden = true;
    root.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-label', "Ouvrir Ask Moussa, l'assistant IA");
    const target = document.contains(returnFocusTo) ? returnFocusTo : launcher;
    target.focus({ preventScroll: true });
    returnFocusTo = launcher;
  }

  // ---- Events ----
  launcher.addEventListener('click', () => (panel.hidden ? open(launcher) : close()));
  closeButton.addEventListener('click', close);

  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('.amc-suggestion');
    if (button) ask(button.textContent);
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    ask(input.value);
  });

  input.addEventListener('input', updateInput);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      ask(input.value);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) close();
  });

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-open-chat]');
    if (trigger) {
      event.preventDefault();
      open(trigger);
    }
  });

  addMessage('bot', TEXT.welcome);
  document.body.append(root);

  window.AskMoussa = { open, close };
})();
