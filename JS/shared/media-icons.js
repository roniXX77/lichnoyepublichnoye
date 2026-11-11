/* Vector controls render consistently without emoji fonts on iOS. */
(() => {
  const svg = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  window.MediaIcons = Object.freeze({
    play: svg('<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>'),
    pause: svg('<rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>'),
    previous: svg('<path d="M6 5v14M19 5 9 12l10 7Z"/>'),
    next: svg('<path d="M18 5v14M5 5l10 7-10 7Z"/>')
  });
})();
