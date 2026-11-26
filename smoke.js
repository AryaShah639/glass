const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
let js = html.split('<script>')[1].split('</script>')[0];
js += '\nglobalThis.__G = { game, beginAnneal, quality };';

const noop = () => {};
const ctxStub = new Proxy({}, {
  get: (t, p) => {
    if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => ({ addColorStop: noop });
    if (p === 'measureText') return () => ({ width: 10 });
    return noop;
  },
  set: () => true,
});
const listeners = {};
const elements = {
  game: { width: 960, height: 640, getContext: () => ctxStub,
    addEventListener: (ev, fn) => { listeners['cvs:' + ev] = fn; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 640 }) },
};
global.document = { getElementById: id => elements[id] };
let rafCb = null;
global.requestAnimationFrame = cb => { rafCb = cb; };
global.performance = { now: () => Date.now() };
let store = {};
global.localStorage = { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; }, removeItem: k => { delete store[k]; } };
global.window = { addEventListener: (ev, fn) => { listeners['win:' + ev] = fn; }, AudioContext: undefined };

eval(js);
const game = globalThis.__G.game;
const quality = globalThis.__G.quality;
const SIZES_REF = { small: 40, medium: 56, large: 74 };
let t = 0;
const step = (n = 5, dt = 0.016) => { for (let i = 0; i < n; i++) { t += dt * 1000; rafCb(t); } };
const keydown = () => listeners['win:keydown']({ code: 'Space', preventDefault: noop, repeat: false });
const keyup = () => listeners['win:keyup']({ code: 'Space' });

step(10);
keydown(); keyup(); step(5);
console.assert(game.phase === 'shop', 'shop after title, got ' + game.phase);

function heatToZone() {
  let guard = 0;
  let released = false;
  while (guard++ < 900) {
    keydown(); step(2);
    if (game.temp >= 74 && game.temp <= 90) { keyup(); released = true; break; }
  }
  if (!released) keyup();
  step(3);
  if (game.phase !== 'blow') throw new Error('expected blow after heat, got ' + game.phase);
}
function blowToTarget(overblow) {
  const target = SIZES_REF[game.order.size];
  let guard = 0;
  keydown();
  while (game.phase === 'blow' && guard++ < 2000) {
    step(3);
    if (!overblow && game.size >= target - 2) { keyup(); break; }
  }
  if (game.phase === 'blow') keyup();
  step(3);
}
function shapeAll() {
  for (let i = 0; i < 20 && game.phase === 'shape'; i++) {
    const z = game.zones[game.tapsDone];
    if (!z) break;
    game.pointer = z.c;
    keydown(); keyup();
    step(2);
  }
}
function playOrder(opts = {}) {
  keydown(); keyup(); step(5);
  if (game.phase !== 'heat' && !opts.force) throw new Error('expected heat, got ' + game.phase);

  heatToZone();
  blowToTarget(opts.overblow);
  if (game.phase === 'result') return;
  if (game.phase === 'shape') {
    shapeAll();
    if (game.phase === '_shaping') globalThis.__G.beginAnneal();
  }
  if (game.phase === 'anneal') {
    game.temp = 53;
    keydown(); keyup();
  }
  step(5);
}

playOrder();
console.log('ORDER 1:', 'phase:', game.phase, 'fail:', game.fail, 'quality:', game.fail ? 0 : quality(game.order), 'pay:', game.pay);
console.assert(game.phase === 'result' && !game.fail && game.pay > 0, 'order 1 should succeed');
console.assert(store['glasmacher_save_v1'], 'save persisted');

keydown(); keyup(); step(5);
console.assert(game.phase === 'shop', 'back to shop, got ' + game.phase);

playOrder();
console.log('ORDER 2:', 'fail:', game.fail, 'pay:', game.pay);
console.assert(!game.fail, 'order 2 should succeed');
keydown(); keyup(); step(5);
console.assert(game.phase === 'shop', 'shop again, got ' + game.phase);

playOrder({ overblow: true });
console.log('overblow path -> fail:', game.fail, 'phase:', game.phase);
console.assert(game.fail && game.phase === 'result', 'overblow should fail');
keydown(); keyup(); step(5);
console.assert(game.phase === 'shop', 'shop after fail, got ' + game.phase);

// cold crack: reach shaping, then drop temperature
keydown(); keyup(); step(5);
if (game.phase !== 'heat') throw new Error('expected heat');
heatToZone();
blowToTarget(false);
shapeAll();
game.holding = true;
game.temp = 8;
step(3);
console.log('cold crack -> fail:', game.fail, 'phase:', game.phase);
console.assert(game.fail, 'cold crack should fail');
keydown(); keyup(); step(5);
console.assert(game.phase === 'shop', 'shop after cold crack, got ' + game.phase);

// overheat drip
keydown(); keyup(); step(5);
if (game.phase !== 'heat') throw new Error('expected heat');
let guard3 = 0;
game.holding = true;
while (game.temp < 108 && guard3++ < 2000) { keydown(); step(2); }
game.holding = true;
step(3);
console.log('drip -> fail:', game.fail, 'phase:', game.phase);
console.assert(game.fail, 'overheat should fail');

console.log('SMOKE TEST PASSED');
