// ==========================================
// Tools
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
// OpenCC — full.js loaded in <head>, window.OpenCC always available
// getZhConverter() returns a cached SYNC converter function
// ==========================================
const _zhConverters = {};

function getZhConverter(mode) {
  if (_zhConverters[mode]) return _zhConverters[mode];
  if (typeof OpenCC === 'undefined') {
    console.error('OpenCC is not defined. Make sure full.js is loaded in <head>.');
    return null;
  }
  try {
    const args = mode === 's2t' ? { from: 'cn', to: 'tw' } : { from: 'tw', to: 'cn' };
    _zhConverters[mode] = OpenCC.Converter(args);
    console.log('OpenCC converter created for mode:', mode, typeof _zhConverters[mode]);
    return _zhConverters[mode];
  } catch(e) {
    console.error('OpenCC.Converter() failed:', e);
    return null;
  }
}

// kept for export compatibility
async function convertSubtitles(subs, mode) {
  if (!mode || mode === 'none') return subs;
  const converter = getZhConverter(mode);
  if (!converter) return subs;
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
