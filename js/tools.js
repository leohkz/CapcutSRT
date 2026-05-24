// ==========================================
// Tools — processing pipeline + formatters
// ==========================================

// Default particle list
const DEFAULT_PARTICLES = ['嗯','啊','哦','嗳','那','就','然后','然後','唔','系','即係','即是','問','啦','誒','話','悔','喔','咼'];

let particleState  = {};
let customParticles = [];

function loadParticleState() {
  try {
    const saved = localStorage.getItem('particleState');
    if (saved) particleState = JSON.parse(saved);
    const savedCustom = localStorage.getItem('customParticles');
    if (savedCustom) customParticles = JSON.parse(savedCustom);
  } catch (e) {}
  for (const w of DEFAULT_PARTICLES) {
    if (particleState[w] === undefined) particleState[w] = true;
  }
}

function saveParticleState() {
  try {
    localStorage.setItem('particleState', JSON.stringify(particleState));
    localStorage.setItem('customParticles', JSON.stringify(customParticles));
  } catch (e) {}
}

function getAllParticles() {
  return [...DEFAULT_PARTICLES, ...customParticles];
}

function buildParticleRegex() {
  const active = getAllParticles().filter(w => particleState[w]);
  if (active.length === 0) return null;
  const escaped = active.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(escaped.join('|'), 'g');
}

// ==========================================
// OpenCC lazy loader — loads ONLY when needed
// ==========================================
let _openccConverter = null;   // cached converter instance
let _openccLoading   = false;
let _openccCallbacks = [];

function getOpenCC(mode) {
  // mode: 's2t' | 't2s'
  return new Promise((resolve, reject) => {
    // If already have a converter for this mode, return it
    if (_openccConverter && _openccConverter._mode === mode) {
      return resolve(_openccConverter);
    }
    // Queue callback
    _openccCallbacks.push({ mode, resolve, reject });

    if (_openccLoading) return; // already loading, just queue
    _openccLoading = true;

    // Dynamically load opencc-js only now
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/opencc-js@1.0.5/dist/umd/bundle.js';
    script.onload = () => {
      // Drain all queued requests
      const pending = _openccCallbacks.splice(0);
      const converters = {};
      for (const { mode: m, resolve: res } of pending) {
        if (!converters[m]) {
          try {
            converters[m] = m === 's2t'
              ? OpenCC.Converter({ from: 'cn', to: 'twp' })
              : OpenCC.Converter({ from: 'tw', to: 'cn' });
            converters[m]._mode = m;
          } catch (e) {
            res(null); continue;
          }
        }
        res(converters[m]);
      }
      _openccLoading = false;
    };
    script.onerror = () => {
      _openccCallbacks.splice(0).forEach(({ reject: rej }) => rej(new Error('Failed to load opencc-js')));
      _openccLoading = false;
    };
    document.head.appendChild(script);
  });
}

// Convert an array of subs; returns a new array with converted text
async function convertSubtitles(subs, mode) {
  if (!mode || mode === 'none') return subs;
  try {
    const converter = await getOpenCC(mode);
    if (!converter) return subs;
    return subs.map(s => ({ ...s, text: converter(s.text) }));
  } catch (e) {
    console.warn('OpenCC conversion failed:', e);
    return subs;
  }
}

// Synchronous applyTools for display (no conversion — conversion is applied separately before export/render)
function applyTools(subs) {
  const offset      = parseFloat(document.getElementById('time-offset').value) || 0;
  const doParticles = document.getElementById('toggle-particles').checked;
  const doEmpty     = document.getElementById('toggle-empty').checked;
  const doMerge     = document.getElementById('toggle-merge').checked;

  let result = subs.map(s => ({
    ...s,
    start: Math.max(0, s.start + offset),
    end:   Math.max(0, s.end   + offset),
  }));

  result = result.map(s => {
    let text = s.text;
    for (const r of replaceRules) {
      if (r.find) text = text.split(r.find).join(r.rep);
    }
    return { ...s, text };
  });

  if (doParticles) {
    const re = buildParticleRegex();
    if (re) result = result.map(s => ({ ...s, text: s.text.replace(re, '').trim() }));
  }
  if (doEmpty) result = result.filter(s => s.text.trim().length > 0);
  if (doMerge) {
    const merged = [];
    for (const s of result) {
      if (merged.length && merged[merged.length - 1].text === s.text) {
        merged[merged.length - 1].end = s.end;
      } else {
        merged.push({ ...s });
      }
    }
    result = merged;
  }
  return result;
}

function isLongSub(s) {
  const threshold = parseFloat(document.getElementById('long-sub-threshold')?.value) || 8;
  return (s.end - s.start) > threshold;
}

function toSRTTime(sec) {
  const h  = Math.floor(sec / 3600);
  const m  = Math.floor((sec % 3600) / 60);
  const s  = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
}

function srtTimeToSecFromStr(str) {
  const m = str.match(/(\d+):(\d+):(\d+)[,\.](\d+)/);
  if (!m) return null;
  return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4].padEnd(3,'0')/1000;
}

function buildSRT(subs) {
  return subs.map((s, i) => `${i + 1}\n${toSRTTime(s.start)} --> ${toSRTTime(s.end)}\n${s.text}`).join('\n\n');
}
function buildTXT(subs) {
  return subs.map(s => `[${toSRTTime(s.start)} --> ${toSRTTime(s.end)}]\n${s.text}`).join('\n\n');
}
function buildPlain(subs) {
  return subs.map(s => s.text).join('\n');
}

loadParticleState();
