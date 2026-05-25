// ==========================================
// Tools
// ==========================================

const DEFAULT_PARTICLES = ['嗯','啊','哦','哼','那','就','然後','然后','唔','系','即係','即是','問','啦','係','話','咦','喂','哎','咗'];

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
// Smart Duration Trim
// Formula: maxDur = max(MIN_SEC, charCount * SEC_PER_CHAR)
// Only shrinks end time (end = start + maxDur), never extends.
// Writes back into parsedFiles[fi].subs[si] AND parsedSubs flat array.
// ==========================================
const SMART_TRIM_SEC_PER_CHAR = 0.45;  // ~0.45s per Chinese char
const SMART_TRIM_MIN_SEC      = 1.2;   // minimum floor regardless of char count

/**
 * Count "effective" characters for timing purposes.
 * Chinese/Japanese chars count as 1, spaces/punctuation count as 0.3
 */
function countEffectiveChars(text) {
  let count = 0;
  for (const ch of text) {
    if (/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(ch)) count += 1;
    else if (/\S/.test(ch)) count += 0.5;  // latin / numbers / symbols
  }
  return count;
}

/**
 * Returns max allowed seconds for this subtitle's text.
 * 3 chars → ~1.35s → capped at MIN_SEC=1.2  → 1.35s
 * 7 chars → ~3.15s
 * 15 chars → ~6.75s
 */
function smartMaxDur(text) {
  const eff = countEffectiveChars(text);
  return Math.max(SMART_TRIM_MIN_SEC, eff * SMART_TRIM_SEC_PER_CHAR);
}

/**
 * Apply smart trim to all parsedFiles entries AND rebuild parsedSubs.
 * Returns number of subtitles that were actually changed.
 */
function smartTrimDurations() {
  let changed = 0;
  for (const file of parsedFiles) {
    for (const s of file.subs) {
      const maxDur = smartMaxDur(s.text);
      const curDur = s.end - s.start;
      if (curDur > maxDur) {
        s.end = s.start + maxDur;
        changed++;
      }
    }
  }
  // Rebuild flat parsedSubs to stay in sync
  parsedSubs.length = 0;
  for (let fi = 0; fi < parsedFiles.length; fi++) {
    for (let si = 0; si < parsedFiles[fi].subs.length; si++) {
      parsedSubs.push({ ...parsedFiles[fi].subs[si], _fileIdx: fi, _srcIdx: si });
    }
  }
  return changed;
}

// ==========================================
// OpenCC — full.js loaded in <head>, window.OpenCC always available
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
    return _zhConverters[mode];
  } catch(e) {
    console.error('OpenCC.Converter() failed:', e);
    return null;
  }
}

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
