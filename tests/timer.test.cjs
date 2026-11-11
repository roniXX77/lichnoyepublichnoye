const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync('JS/shared/timer.js', 'utf8');
function page(storage) {
  const events = {}, documentEvents = {};
  let now = 0, tick;
  const timer = { textContent: '' };
  const document = { hidden: false, querySelector: () => timer, addEventListener: (name, fn) => documentEvents[name] = fn };
  vm.runInNewContext(code, {
    window: { addEventListener: (name, fn) => events[name] = fn }, document,
    localStorage: { getItem: k => storage[k], setItem: (k, v) => storage[k] = v },
    performance: { now: () => now }, setInterval: fn => tick = fn
  });
  events.DOMContentLoaded();
  return { timer, events, advance(ms) { now += ms; tick(); }, visibility(hidden) { document.hidden = hidden; documentEvents.visibilitychange(); } };
}
test('time continues across character navigation, excluding time outside characters', () => {
  const storage = {};
  const author = page(storage);
  author.advance(65250);
  assert.equal(author.timer.textContent, '01:05');
  author.events.pagehide();
  const rain = page(storage);
  assert.equal(rain.timer.textContent, '01:05');
  rain.advance(2000);
  assert.equal(rain.timer.textContent, '01:07');
  rain.visibility(true);
  rain.advance(100000);
  rain.visibility(false);
  assert.equal(rain.timer.textContent, '01:07');
  rain.advance(3000);
  assert.equal(rain.timer.textContent, '01:10');
});
test('restoring a cached page resumes the clock without counting the gap', () => {
  const p = page({});
  p.advance(1000); p.events.pagehide(); p.advance(90000); p.events.pageshow(); p.advance(1000);
  assert.equal(p.timer.textContent, '00:02');
});
