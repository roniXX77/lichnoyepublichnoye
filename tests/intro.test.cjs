const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync('JS/intro.js','utf8');
const key='personal-public:intro-pause';
function open(storage={},readyState=1,search='') {
  function element() {
    const classes=new Set(),events={};
    return {disabled:false,events,classList:{add:name=>classes.add(name),toggle:(name,on)=>on?classes.add(name):classes.delete(name),contains:name=>classes.has(name)},addEventListener:(name,fn)=>events[name]=fn,setAttribute(){}};
  }
  const button=element(),video=Object.assign(element(),{currentTime:0,duration:610,readyState,muted:true,paused:true,pause(){this.paused=true;},play(){this.paused=false;return Promise.resolve();}});
  const events={},timers=[],location={href:'main.html',search};
  const window={SiteLanguage:{translate:text=>text},location,addEventListener:(name,fn)=>events[name]=fn};
  const document={getElementById:id=>id==='mainPageVideo'?video:button,createElement:element,body:{append(){}}};
  vm.runInNewContext(source,{window,document,URLSearchParams,sessionStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},setTimeout:(fn,delay)=>timers.push({fn,delay})});
  events.DOMContentLoaded();
  return {button,video,events,timers,location};
}
test('first arrival waits once; a pause saves the exact movie position',()=>{
  const storage={},p=open(storage);
  assert.equal(p.button.disabled,true);
  assert.equal(p.timers[0].delay,16000);
  p.timers[0].fn();p.video.currentTime=42.5;p.button.events.click();
  assert.deepEqual(JSON.parse(storage[key]),{time:42.5,unlocked:true});
  assert.equal(p.location.href,'choicePage/choice.html');
});
test('return restores the last pause and immediately permits another character choice',()=>{
  const storage={[key]:JSON.stringify({time:42.5,unlocked:true})},p=open(storage);
  assert.equal(p.video.currentTime,42.5);
  assert.equal(p.button.disabled,false);
  assert.equal(p.button.classList.contains('isReturning'),true);
  assert.equal(p.timers.length,0);
  p.button.events.click();
  assert.equal(p.location.href,'choicePage/choice.html');
});
test('an immediate return click before metadata does not overwrite the pause with zero',()=>{
  const storage={[key]:JSON.stringify({time:37,unlocked:true})},p=open(storage,0);
  assert.equal(p.video.currentTime,0);
  assert.equal(p.button.disabled,false);
  p.button.events.click();
  assert.equal(JSON.parse(storage[key]).time,37);
  p.video.events.loadedmetadata();
  assert.equal(p.video.currentTime,37);
});
test('browser back from the page cache also restores an immediately usable pause',()=>{
  const storage={},p=open(storage);
  storage[key]=JSON.stringify({time:61,unlocked:true});
  p.events.pageshow({persisted:true});
  assert.equal(p.button.disabled,false);
  assert.equal(p.button.classList.contains('isReturning'),true);
  assert.equal(p.video.currentTime,61);
});

test('exiting a directly opened character also skips the intro delay',()=>{
  const p=open({},1,'?return=1');
  assert.equal(p.button.disabled,false);
  assert.equal(p.button.classList.contains('isReturning'),true);
  assert.equal(p.timers.length,0);
});
