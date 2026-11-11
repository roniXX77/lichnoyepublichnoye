/* Rain playlist: one media element, locale-specific poems, sequential playback. */
window.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('mainAudio');
  const items = [...document.querySelectorAll('.trackItem')];
  const play = document.getElementById('playPauseBtn');
  const title = document.getElementById('trackTitle');
  const currentTime = document.getElementById('currentTime');
  const duration = document.getElementById('duration');
  const fill = document.getElementById('progressFill');
  const poem = document.getElementById('rainPoemText');
  const poems = window.RainContent[window.SiteLanguage.current];
  const en = window.SiteLanguage.current === 'en';
  let selected = -1;
  document.getElementById('previousTrack').innerHTML=window.MediaIcons.previous;
  document.getElementById('nextTrack').innerHTML=window.MediaIcons.next;

  // Stable positions with three depths; the animation lives behind the page.
  let seed = 42;
  const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
  document.querySelectorAll('.rainLayer').forEach((layer, depth) => {
    const drops = document.createDocumentFragment();
    for (let i = 0; i < 35; i++) {
      const drop = document.createElement('i');
      drop.className = 'rainDrop';
      drop.style.cssText = `--left:${random()*110}%;--length:${14+random()*65}px;--speed:${.65+random()*1.1+(2-depth)*.3}s;--delay:${-random()*4}s;--opacity:${.2+random()*.55}`;
      drops.append(drop);
    }
    layer.append(drops);
  });
  const format = value => Number.isFinite(value) ? `${String(Math.floor(value/60)).padStart(2,'0')}:${String(Math.floor(value%60)).padStart(2,'0')}` : '00:00';
  function showPoem(key) {
    poem.textContent = (poems[key] || poems.main).replace(/\[\[(.*?)\]\]/g, '$1');
    poem.scrollTop = 0;
    document.getElementById('rainPoemLabel').textContent = key === 'main' ? (en ? 'PROLOGUE' : 'ВСТУПЛЕНИЕ') : `${en ? 'TEXT' : 'ТЕКСТ'} / ${String(key).padStart(2,'0')}`;
  }
  function renderPlayback() {
    items.forEach((item,index) => {
      item.classList.toggle('active', index === selected);
      item.classList.toggle('playing', index === selected && !audio.paused);
      item.setAttribute('aria-pressed', String(index === selected));
    });
    play.innerHTML = window.MediaIcons[audio.paused ? 'play' : 'pause'];
    play.setAttribute('aria-label', en ? (audio.paused ? 'Play' : 'Pause') : (audio.paused ? 'Воспроизвести' : 'Пауза'));
  }
  function renderProgress() {
    currentTime.textContent = format(audio.currentTime);
    duration.textContent = format(audio.duration);
    fill.style.width = Number.isFinite(audio.duration) && audio.duration > 0 ? `${audio.currentTime/audio.duration*100}%` : '0%';
  }
  function start() { audio.play().catch(renderPlayback); }
  function select(index) {
    if (!items.length) return;
    selected = (index + items.length) % items.length;
    const item = items[selected];
    title.textContent = window.SiteLanguage.translate(item.dataset.title);
    showPoem(window.RainContent.tracks[selected].poem);
    audio.src = item.dataset.src;
    renderProgress();renderPlayback();start();
  }
  items.forEach((item,index) => item.addEventListener('click', () => select(index)));
  play.addEventListener('click', () => {
    if (selected < 0) select(0);
    else if (audio.paused) start();
    else audio.pause();
  });
  document.getElementById('previousTrack').addEventListener('click', () => select(selected < 0 ? items.length-1 : selected-1));
  document.getElementById('nextTrack').addEventListener('click', () => select(selected+1));
  audio.addEventListener('ended', () => select(selected+1));
  audio.addEventListener('play', renderPlayback);
  audio.addEventListener('pause', renderPlayback);
  audio.addEventListener('timeupdate', renderProgress);
  audio.addEventListener('loadedmetadata', () => {
    renderProgress();
    if (selected >= 0) items[selected].querySelector('.trackTime').textContent = format(audio.duration);
  });
  audio.addEventListener('error', () => {
    title.textContent = window.SiteLanguage.translate('не удалось загрузить аудио');
    renderPlayback();
  });
  showPoem('main');renderPlayback();
});
