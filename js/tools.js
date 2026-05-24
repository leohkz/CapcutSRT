// ==========================================
// Tools — processing pipeline + formatters
// ==========================================

const DEFAULT_PARTICLES = ['嗯','啊','哦','嗳','那','就','然后','然後','唔','系','即係','即是','問','啦','誒','話','悔','喔','咼'];

let particleState   = {};
let customParticles = [];

function loadParticleState() {
  try {
    const s = localStorage.getItem('particleState');
    if (s) particleState = JSON.parse(s);
    const c = localStorage.getItem('customParticles');
    if (c) customParticles = JSON.parse(c);
  } catch(e) {}
  for (const w of DEFAULT_PARTICLES) {
    if (particleState[w] === undefined) particleState[w] = true;
  }
}
function saveParticleState() {
  try {
    localStorage.setItem('particleState', JSON.stringify(particleState));
    localStorage.setItem('customParticles', JSON.stringify(customParticles));
  } catch(e) {}
}
function getAllParticles() { return [...DEFAULT_PARTICLES, ...customParticles]; }
function buildParticleRegex() {
  const active = getAllParticles().filter(w => particleState[w]);
  if (!active.length) return null;
  return new RegExp(active.map(w => w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'), 'g');
}

// ==========================================
// OpenCC — lazy-load the right CDN file per mode
// README: use cn2t.js for s⇒t, t2cn.js for t⇒s
// Both expose window.OpenCC with a sync Converter()
// ==========================================
const _openccCache = {};   // mode → sync converter fn
const _openccLoading = {}; // mode → Promise

const OPENCC_CDN = {
  s2t: 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/cn2t.js',
  t2s: 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/t2cn.js',
};
const OPENCC_ARGS = {
  s2t: { from: 'cn', to: 'tw' },
  t2s: { from: 'tw', to: 'cn' },
};

function loadOpenCC(mode) {
  if (_openccCache[mode]) return Promise.resolve(_openccCache[mode]);
  if (_openccLoading[mode]) return _openccLoading[mode];

  _openccLoading[mode] = new Promise((resolve, reject) => {
    // Each CDN file defines its OWN window.OpenCC scoped object.
    // We capture it right after the script loads.
    const script = document.createElement('script');
    script.src = OPENCC_CDN[mode];
    script.onload = () => {
      try {
        if (typeof OpenCC === 'undefined') throw new Error('OpenCC not defined after script load');
        const converter = OpenCC.Converter(OPENCC_ARGS[mode]);
        _openccCache[mode] = converter;
        resolve(converter);
      } catch(e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error('Failed to load opencc CDN: ' + OPENCC_CDN[mode]));
    document.head.appendChild(script);
  });
  return _openccLoading[mode];
}

// Returns a new subs array with converted text. Fully async.
async function convertSubtitles(subs, mode) {
  if (!mode || mode === 'none') return subs;
  let converter;
  try {
    converter = await loadOpenCC(mode);
  } catch(e) {
    console.warn('OpenCC load failed:', e);
    return subs;
  }
  // converter is synchronous: converter(str) => str
  return subs.map(s => ({ ...s, text: converter(s.text) }));
}

// ==========================================
// Helpers
// ==========================================
function isLongSub(s) {
  const t = parseFloat(document.getElementById('long-sub-threshold')?.value) || 8;
  return (s.end - s.start) > t;
}

function toSRTTime(sec) {
  const h  = Math.floor(sec / 3600);
  const m  = Math.floor((sec % 3600) / 60);
  const s  = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}
function srtTimeToSecFromStr(str) {
  const m = str.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return null;
  return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4].padEnd(3,'0')/1000;
}
function buildSRT(subs)   { return subs.map((s,i)=>`${i+1}\n${toSRTTime(s.start)} --> ${toSRTTime(s.end)}\n${s.text}`).join('\n\n'); }
function buildTXT(subs)   { return subs.map(s=>`[${toSRTTime(s.start)} --> ${toSRTTime(s.end)}]\n${s.text}`).join('\n\n'); }
function buildPlain(subs) { return subs.map(s=>s.text).join('\n'); }

loadParticleState();
