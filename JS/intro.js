/* Request sound on arrival and offer a visible gesture when autoplay is blocked. */
window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('mainPageVideo');
  const pause = document.getElementById('pauseButton');
  if (!video || !pause) return;
  const positionKey='personal-public:intro-pause';
  let saved=null;
  try {saved=JSON.parse(sessionStorage.getItem(positionKey));} catch {}
  const returning=saved?.unlocked===true && Number.isFinite(saved.time) && saved.time>=0;
  const fromCharacter=new URLSearchParams(window.location.search).get("return")==="1";
  let restored=!returning;
  function unlock(immediate=false) {
    pause.classList.add('show');
    pause.classList.toggle('isReturning',immediate);
    pause.disabled=false;
  }

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
  pause.disabled=true;
  if (returning) {
    unlock(true);
    video.pause();
    const restore=()=>{
      if(Number.isFinite(video.duration) && video.duration>0) video.currentTime=Math.min(saved.time,Math.max(0,video.duration-.1));
      restored=true;
      enableSound();
    };
    if(video.readyState>=1)restore();
    else video.addEventListener('loadedmetadata',restore,{once:true});
  } else {
    enableSound();
    if(fromCharacter)unlock(true);
    else setTimeout(()=>unlock(),16000);
  }
  window.addEventListener('pageshow',event=>{
    if(!event.persisted)return;
    try {
      const state=JSON.parse(sessionStorage.getItem(positionKey));
      if(state?.unlocked && Number.isFinite(state.time)) {
        unlock(true);
        if(Number.isFinite(video.duration))video.currentTime=Math.min(state.time,Math.max(0,video.duration-.1));
        enableSound();
      }
    } catch {}
  });
  pause.addEventListener('click', () => {
    if(pause.disabled)return;
    try {sessionStorage.setItem(positionKey,JSON.stringify({time:restored?video.currentTime:saved.time,unlocked:true}));} catch {}
    video.pause();
    window.location.href = 'choicePage/choice.html';
  });
});
