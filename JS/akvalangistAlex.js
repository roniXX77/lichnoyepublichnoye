/* A looping film with locale-specific narration, followed by an illustrated case archive. */
window.addEventListener('DOMContentLoaded', () => {
  const locale = window.SiteLanguage.current;
  const en = locale === 'en';
  const texts = window.AlexContent[locale];
  const files = window.AlexContent.files;
  const subtitles = window.AlexContent.subtitles[locale];
  const $ = id => document.getElementById(id);
  const clean = text => text.replace(/\[\[(.*?)\]\]/g, '$1');
  const labels = en ? {
    name:'ALEX THE DIVER', exit:'exit ↗', chapter:'01 / THE SHORE', title:'alex the diver',
    skip:'skip the story ↠', start:'play the film', pause:'Play or pause narration',seek:'Seek narration',
    eyebrow:'PERSONAL PUBLIC', archive:'Urban Bestiary',
    replay:'↶ rewind the story',
    hint:'SELECT A FILE TO READ',
    file:'FILE', record:'PERSONAL RECORD', close:'Close file',error:'The narration could not load. Retry or skip to the files.'
  } : {
    name:'АКВАЛАНГИСТ АЛЕКС',exit:'выйти ↗',chapter:'01 / БЕРЕГ',title:'аквалангист алекс',
    skip:'пропустить историю ↠',start:'смотреть фильм',pause:'Воспроизвести или приостановить озвучку',seek:'Перемотать озвучку',
    eyebrow:'ЛИЧНОЕ ПУБЛИЧНОЕ',archive:'Городской бестиарий',
    replay:'↶ перемотать к истории',
    hint:'ВЫБЕРИ ДЕЛО, ЧТОБЫ ПРОЧИТАТЬ',
    file:'ДЕЛО',record:'ЛИЧНОЕ ДЕЛО',close:'Закрыть дело',error:'Не удалось загрузить озвучку. Попробуй ещё раз или перейди к досье.'
  };
  for (const [id,key] of Object.entries({alexName:'name',alexExit:'exit',filmChapter:'chapter',filmTitle:'title',skipStory:'skip',startFilmLabel:'start',archiveEyebrow:'eyebrow',archiveTitle:'archive',replayStory:'replay',archiveHint:'hint',documentStamp:'record'})) $(id).textContent=labels[key];
  $('archiveTitle').style.whiteSpace='pre-line';
  $('filmPlayPause').setAttribute('aria-label',labels.pause);
  $('filmSeek').setAttribute('aria-label',labels.seek);
  $('closeDossier').setAttribute('aria-label',labels.close);
  const video=$('alexVideo'),audio=$('alexNarration'),cinema=$('alexCinema'),archive=$('alexArchive');
  const dialog=$('dossierDialog');
  // Native modal dialogs make outside controls inert; keep a language switch inside.
  const modalLanguage=document.querySelector('.siteLanguage').cloneNode(true);
  modalLanguage.className='siteUtility dossierLanguage';
  modalLanguage.addEventListener('click',()=>document.querySelector('.siteLanguage').click());
  dialog.insertBefore(modalLanguage,dialog.children[1]);
  audio.src=`../../../imagesAndVideos/alex/alex${locale.toUpperCase()}.m4a`;
  let stage='cinema',activeFile=0,transitioning=false;
  const format = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
  const titleFor = file => clean(texts[file.id]).split('\n').find(line=>line.trim()) || `${labels.file} ${file.id}`;
  function updateSubtitles() {
    const cue=subtitles.cues.find(c=>audio.currentTime>=c.start && audio.currentTime<c.end);
    $('alexSubtitle').textContent=clean(cue?.text || (audio.currentTime<subtitles.cues[0].start ? subtitles.cues[0].text : ''));
    $('filmCurrent').textContent=format(audio.currentTime);
    if (Number.isFinite(audio.duration) && audio.duration>0) {
      $('filmDuration').textContent=format(audio.duration);
      $('filmSeek').value=String(audio.currentTime/audio.duration*1000);
    }
  }
  function updatePlayback() {
    $('filmPlayPause').textContent=audio.paused?'▶':'Ⅱ';
    $('startFilm').hidden=!audio.paused || stage!=='cinema';
  }
  async function play() {
    video.play().catch(()=>{});
    try {await audio.play();} catch {updatePlayback();}
  }
  audio.addEventListener('timeupdate',updateSubtitles);
  audio.addEventListener('loadedmetadata',updateSubtitles);
  audio.addEventListener('play',updatePlayback);
  audio.addEventListener('pause',updatePlayback);
  audio.addEventListener('error',()=>{$('startFilmLabel').textContent=labels.error;updatePlayback();});
  $('filmPlayPause').addEventListener('click',()=>audio.paused?play():audio.pause());
  $('startFilm').addEventListener('click',play);
  $('filmSeek').addEventListener('input',()=>{
    if (Number.isFinite(audio.duration)) audio.currentTime=Number($('filmSeek').value)/1000*audio.duration;
    updateSubtitles();
  });
  async function showArchive(withFade=true) {
    if (transitioning || stage==='archive') return;
    transitioning=true;stage='archive';audio.pause();video.pause();
    const finish=()=>{
      cinema.hidden=true;archive.hidden=false;
      document.body.classList.add('isArchive');window.scrollTo(0,0);
      $('dossierGrid').querySelector('button')?.focus({preventScroll:true});
    };
    if (!withFade) {finish();transitioning=false;return;}
    const curtain=$('sceneFade');
    const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?80:450;
    curtain.hidden=false;
    const fadeOut=curtain.animate([{opacity:0},{opacity:1}],{duration,easing:'ease-in',fill:'forwards'});
    await fadeOut.finished;
    finish();
    const fadeIn=curtain.animate([{opacity:1},{opacity:0}],{duration,easing:'ease-out',fill:'forwards'});
    await fadeIn.finished;
    curtain.hidden=true;fadeOut.cancel();fadeIn.cancel();transitioning=false;
  }
  $('skipStory').addEventListener('click',()=>showArchive());
  audio.addEventListener('ended',()=>showArchive());
  $('replayStory').addEventListener('click',()=>{
    stage='cinema';archive.hidden=true;cinema.hidden=false;document.body.classList.remove('isArchive');
    audio.currentTime=0;video.currentTime=0;window.scrollTo(0,0);updateSubtitles();play();
    $('skipStory').focus({preventScroll:true});
  });
  function setPortrait(image,file) {
    image.src=`../../../imagesAndVideos/alex/${file.image}`;
    image.style.transform=file.rotate?`rotate(${file.rotate}deg) scale(.85)`:'';
    image.dataset.crop=file.crop||'';
    // object-fit adds blank space: measure the visible scan before trimming its edges.
    const cropScan=()=>{
      if (!image.dataset.crop || !image.naturalWidth || !image.clientWidth || !image.clientHeight) { image.style.clipPath='';return; }
      const [top,right,bottom,left]=image.dataset.crop.split(' ').map(parseFloat);
      const scale=Math.min(image.clientWidth/image.naturalWidth,image.clientHeight/image.naturalHeight);
      const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
      const x=(image.clientWidth-width)/2,y=(image.clientHeight-height)/2;
      image.style.clipPath=`inset(${y+height*top/100}px ${x+width*right/100}px ${y+height*bottom/100}px ${x+width*left/100}px)`;
    };
    image.onload=cropScan;
    if (!image.scanCropObserver) {image.scanCropObserver=new ResizeObserver(()=>image.onload?.());image.scanCropObserver.observe(image);}
    cropScan();
    image.alt=`${labels.file} ${file.id}`;
  }
  function openFile(index) {
    activeFile=(index+files.length)%files.length;
    const file=files[activeFile];
    $('dossierNumber').textContent=`LP—${String(file.id).padStart(3,'0')}`;
    $('dossierTitle').textContent=`${labels.file} / ${String(file.id).padStart(2,'0')}`;
    $('dossierText').textContent=clean(texts[file.id]);
    $('dossierPosition').textContent=`${activeFile+1} / ${files.length}`;
    setPortrait($('dossierImage'),file);
    if(!dialog.open)dialog.showModal();
    dialog.scrollTop=0;
  }
  files.forEach((file,index)=>{
    const button=document.createElement('button');button.type='button';button.className='dossierCard';
    const tab=document.createElement('span');tab.className='cardTab';tab.setAttribute('aria-hidden','true');
    const meta=document.createElement('span');meta.className='cardMeta';
    const number=document.createElement('span');number.textContent=`${labels.file} ${String(file.id).padStart(2,'0')}`;
    const mark=document.createElement('span');mark.textContent='LP / A';meta.append(number,mark);
    const portrait=document.createElement('span');portrait.className='cardImage';
    const image=document.createElement('img');image.loading='lazy';setPortrait(image,file);portrait.append(image);
    const title=document.createElement('span');title.className='cardTitle';const firstLine=titleFor(file);title.textContent=firstLine.length>65?firstLine.slice(0,62)+'…':firstLine;
    const arrow=document.createElement('span');arrow.className='cardArrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    button.append(tab,meta,portrait,title,arrow);button.addEventListener('click',()=>openFile(index));$('dossierGrid').append(button);
  });
  $('closeDossier').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  $('previousDossier').addEventListener('click',()=>openFile(activeFile-1));
  $('nextDossier').addEventListener('click',()=>openFile(activeFile+1));
  window.addEventListener('site:before-language-change',()=>{
    try {sessionStorage.setItem('alex:language-resume',JSON.stringify({stage,ratio:audio.currentTime/(audio.duration||1),file:activeFile,dialog:dialog.open}));} catch {}
  });
  let resume=null;
  try {resume=JSON.parse(sessionStorage.getItem('alex:language-resume'));sessionStorage.removeItem('alex:language-resume');} catch {}
  if(resume?.stage==='archive') {showArchive(false);if(resume.dialog)openFile(resume.file);}
  else {
    if(resume?.ratio)audio.addEventListener('loadedmetadata',()=>{audio.currentTime=Math.min(.999,resume.ratio)*audio.duration;updateSubtitles();},{once:true});
    updateSubtitles();updatePlayback();play();
  }
});
