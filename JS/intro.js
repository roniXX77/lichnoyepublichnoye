/* Request sound on arrival and offer a visible gesture when autoplay is blocked. */
window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('mainPageVideo');
  const pause = document.getElementById('pauseButton');
  if (!video || !pause) return;
  const sound = document.createElement('button');
  sound.id = 'soundButton';
  sound.type = 'button';
  sound.className = 'siteUtility siteSound';
  const icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></svg>';
  const render = () => {
    const audible = !video.muted && !video.paused;
    const label = window.SiteLanguage.translate(audible ? 'звук включён' : 'включить звук');
    sound.innerHTML = `${icon}<span>${label}</span>`;
    sound.setAttribute('aria-pressed', String(audible));
  };
  document.body.append(sound);
  const enableSound = async () => {
    video.muted = false;
    try { await video.play(); }
    catch { video.muted = true; await video.play().catch(() => {}); }
    render();
  };
  sound.addEventListener('click', () => {
    if (!video.muted && !video.paused) { video.muted = true; render(); }
    else enableSound();
  });
  video.addEventListener('volumechange', render);
  video.addEventListener('play', render);
  render();
  enableSound();
  pause.disabled = true;
  setTimeout(() => { pause.classList.add('show'); pause.disabled = false; }, 16000);
  pause.addEventListener('click', () => {
    video.pause();
    window.location.href = 'choicePage/choice.html';
  });
});
