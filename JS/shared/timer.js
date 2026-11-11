/* One accumulated clock for all character pages. Hidden pages do not accrue time. */
(() => {
  const key = 'personal-public:elapsed-ms';
  const read = () => { try { return Math.max(0, Number(localStorage.getItem(key)) || 0); } catch { return 0; } };
  window.addEventListener('DOMContentLoaded', () => {
    const timer = document.querySelector('#turistTimer, #timer, #avtorTimer, #mailTimer, #dozhdTimer, #alexTimer');
    if (!timer && !window.location?.pathname.includes("/characters/")) return;
    let elapsed = read();
    let started = document.hidden ? null : performance.now();
    const total = () => elapsed + (started === null ? 0 : performance.now() - started);
    const render = () => {
      if (!timer) return;
      const seconds = Math.floor(total() / 1000);
      timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    };
    const save = () => {
      elapsed = total();
      started = null;
      try { localStorage.setItem(key, String(elapsed)); } catch {}
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) save();
      else { elapsed = read(); started = performance.now(); render(); }
    });
    window.addEventListener('pagehide', save);
    window.addEventListener('pageshow', () => { if (!document.hidden && started === null) { elapsed = read(); started = performance.now(); } render(); });
    setInterval(() => { render(); if (started !== null) { save(); started = performance.now(); } }, 250);
    render();
  });
})();
