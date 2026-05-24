// ==========================================
// UI — drop zone, file handling, render, export
// ==========================================

const LS = {
  get: (k, fallback) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set: (k, v)        => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ---- OS Guide ----
const osPaths = {
  windows: 'C:\\Users\\user\\AppData\\Local\\CapCut\\User Data\\Projects\\com.lveditor.draft\\',
  mac:     '/Users/user/Movies/CapCut/User Data/Projects/com.lveditor.draft/',
  ios:     'Files app → On My iPhone → CapCut → Projects → com.lveditor.draft',
  android: '/sdcard/Android/data/com.lemon.lvoideo/files/draft/',
  other:   'Please check your CapCut app settings for the project file location.',
};
const osIcons = { windows: '🪟', mac: '🍎', ios: '📱', android: '🤖', other: '🐧' };
function detectOS() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua))          return 'android';
  if (/Win/.test(ua))               return 'windows';
  if (/Mac/.test(ua))               return 'mac';
  return 'other';
}
function renderOsGuide() {
  const os = detectOS();
  document.getElementById('os-icon').textContent = osIcons[os];
  document.getElementById('os-path').textContent = osPaths[os];
}

// ---- Particle Picker ----
function buildParticlePicker() {
  const container = document.getElementById('particle-picker');
  if (!container) return;
  container.innerHTML = '';
  for (const word of getAllParticles()) container.appendChild(makeParticleChip(word));
}
function makeParticleChip(word) {
  const isCustom = !DEFAULT_PARTICLES.includes(word);
  const active   = particleState[word] !== false;
  const chip = document.createElement('label');
  chip.className = 'particle-chip' + (active ? ' active' : '');
  const cb = document.createElement('input');
  cb.type = 'checkbox'; cb.checked = active; cb.style.display = 'none';
  cb.addEventListener('change', () => {
    particleState[word] = cb.checked;
    chip.classList.toggle('active', cb.checked);
    saveParticleState();
    if (parsedSubs.length && document.getElementById('toggle-particles').checked) renderResults();
  });
  const span = document.createElement('span');
  span.textContent = word;
  chip.appendChild(cb); chip.appendChild(span);
  if (isCustom) {
    const del = document.createElement('button');
    del.textContent = '×'; del.className = 'chip-del';
    del.addEventListener('click', e => {
      e.preventDefault();
      customParticles = customParticles.filter(w => w !== word);
      delete particleState[word];
      saveParticleState();
      chip.remove();
      if (parsedSubs.length && document.getElementById('toggle-particles').checked) renderResults();
    });
    chip.appendChild(del);
  }
  return chip;
}
function initParticlePicker() {
  buildParticlePicker();
  const addBtn = document.getElementById('particle-add-btn');
  const addInput = document.getElementById('particle-add-input');
  if (!addBtn || !addInput) return;
  addInput.placeholder = t('particleAddPlaceholder');
  const doAdd = () => {
    const word = addInput.value.trim();
    if (!word || getAllParticles().includes(word)) { addInput.value = ''; return; }
    customParticles.push(word);
    particleState[word] = true;
    saveParticleState();
    document.getElementById('particle-picker').appendChild(makeParticleChip(word));
    addInput.value = '';
    if (parsedSubs.length && document.getElementById('toggle-particles').checked) renderResults();
  };
  addBtn.addEventListener('click', doAdd);
  addInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
}

// ---- Persist toggles ----
function loadToggleState() {
  for (const id of ['toggle-particles','toggle-empty','toggle-merge']) {
    const el = document.getElementById(id); if (!el) continue;
    const saved = LS.get('toggle:' + id, null);
    if (saved !== null) el.checked = saved;
    el.addEventListener('change', () => LS.set('toggle:' + id, el.checked));
  }
  const off = document.getElementById('time-offset');
  if (off) {
    const sv = LS.get('timeOffset', null); if (sv !== null) off.value = sv;
    off.addEventListener('input', () => LS.set('timeOffset', off.value));
  }
  const lst = document.getElementById('long-sub-threshold');
  if (lst) {
    lst.value = LS.get('longSubThreshold', 8);
    lst.addEventListener('input', () => { LS.set('longSubThreshold', lst.value); if (parsedSubs.length) renderResults(); });
  }
  const sol = document.getElementById('toggle-show-only-long');
  if (sol) {
    sol.checked = LS.get('showOnlyLong', false);
    sol.addEventListener('change', () => { LS.set('showOnlyLong', sol.checked); if (parsedSubs.length) renderResults(); });
  }
  const zhSel = document.getElementById('zh-convert-select');
  if (zhSel) {
    zhSel.value = LS.get('zhConvert', 'none');
    zhSel.addEventListener('change', () => { LS.set('zhConvert', zhSel.value); if (parsedSubs.length) renderResults(); });
  }
}

// ---- Replace Rules ----
let replaceRules = [];
function saveReplaceRules() { LS.set('replaceRules', replaceRules.map(r => ({ find: r.find, rep: r.rep }))); }
function addReplaceRow(find = '', rep = '') {
  const id = Date.now() + '_' + Math.random();
  replaceRules.push({ id, find, rep });
  const row = document.createElement('div');
  row.className = 'replace-row'; row.dataset.id = id;
  row.innerHTML = `
    <input type="text" value="${escHtml(find)}" placeholder="${t('findPlaceholder')}" class="replace-find flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500">
    <svg class="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
    <input type="text" value="${escHtml(rep)}" placeholder="${t('replacePlaceholder')}" class="replace-with flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500">
    <button onclick="removeReplaceRow('${id}')" class="text-slate-600 hover:text-red-400 transition-colors shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>`;
  row.querySelector('.replace-find').addEventListener('input', e => { const r = replaceRules.find(x => x.id===id); if(r){r.find=e.target.value;saveReplaceRules();if(parsedSubs.length)renderResults();} });
  row.querySelector('.replace-with').addEventListener('input', e => { const r = replaceRules.find(x => x.id===id); if(r){r.rep=e.target.value;saveReplaceRules();if(parsedSubs.length)renderResults();} });
  document.getElementById('replace-list').appendChild(row);
}
window.removeReplaceRow = function(id) {
  replaceRules = replaceRules.filter(r => r.id !== id);
  document.querySelector(`.replace-row[data-id="${id}"]`)?.remove();
  saveReplaceRules(); if(parsedSubs.length) renderResults();
};
document.getElementById('add-replace-btn').addEventListener('click', () => { addReplaceRow(); saveReplaceRules(); });
(function(){ const saved = LS.get('replaceRules',[]); for(const r of saved) addReplaceRow(r.find,r.rep); })();

// ---- File Handling ----
let parsedSubs = [];
let currentFileName = 'subtitles';

const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
['dragenter','dragover','dragleave','drop'].forEach(e => document.body.addEventListener(e, ev => {ev.preventDefault();ev.stopPropagation();}));
['dragenter','dragover'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.add('drag-over')));
['dragleave','drop'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.remove('drag-over')));
dropZone.addEventListener('drop', e => { if(e.dataTransfer&&e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', e => { if(e.target.files&&e.target.files.length) handleFile(e.target.files[0]); });

async function handleFile(file) {
  document.getElementById('error-msg').classList.add('hidden');
  try {
    const raw  = await file.text();
    const name = file.name.toLowerCase();
    if (name.endsWith('.srt')) {
      parsedSubs = parseSRT(raw);
      if (!parsedSubs.length) throw new Error('No valid SRT blocks found.');
      currentFileName = file.name.replace(/\.srt$/i,'');
    } else if (name.endsWith('.txt')) {
      parsedSubs = parseTXT(raw);
      if (!parsedSubs.length) throw new Error('No content found in .txt file.');
      currentFileName = file.name.replace(/\.txt$/i,'');
    } else {
      const json = JSON.parse(raw);
      parsedSubs = parseCapcut(json);
      if (!parsedSubs.length) throw new Error('No subtitle tracks found. Make sure the file has auto-transcribed subtitles.');
      currentFileName = file.name.replace(/\.json$/i,'');
    }
    const fnInput = document.getElementById('filename-input');
    if (fnInput) { fnInput.value = currentFileName; autoResizeFilenameInput(fnInput); }
    document.getElementById('tools-panel').classList.remove('hidden');
    await renderResults();   // ← must await so results-panel shows correctly
  } catch(err) {
    showError(t('errorBadFile') + (err.message ? ' ('+err.message+')' : ''));
  }
}

function autoResizeFilenameInput(el) {
  let ruler = document.getElementById('filename-ruler');
  if (!ruler) {
    ruler = document.createElement('span');
    ruler.id = 'filename-ruler';
    ruler.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font-size:0.875rem;font-family:inherit;font-weight:500;';
    document.body.appendChild(ruler);
  }
  ruler.textContent = el.value || el.placeholder || 'subtitles';
  el.style.width = (ruler.offsetWidth + 16) + 'px';
}

// ==========================================
// renderResults  (async — awaits zh conversion only)
// ==========================================
async function renderResults() {
  const zhMode = (document.getElementById('zh-convert-select')?.value) || 'none';

  let tagged = parsedSubs.map((s, i) => ({ ...s, _srcIdx: i }));
  tagged = applyToolsTagged(tagged);

  if (zhMode !== 'none') {
    tagged = await convertSubtitles(tagged, zhMode);
  }

  const showOnlyLong = document.getElementById('toggle-show-only-long')?.checked || false;
  const display      = showOnlyLong ? tagged.filter(s => isLongSub(s)) : tagged;

  document.getElementById('subtitle-count').textContent = tagged.length;

  const list = document.getElementById('preview-list');
  list.innerHTML = '';

  display.slice(0, 200).forEach((s, visIdx) => {
    const srcIdx = s._srcIdx;
    const long   = isLongSub(s);

    const row = document.createElement('div');
    row.className = 'subtitle-row px-4 py-3 flex gap-4 items-start transition-colors'
      + (long ? ' long-sub-row' : ' hover:bg-slate-800/30');

    const numSpan = document.createElement('span');
    numSpan.className = 'text-xs text-slate-600 font-mono w-8 shrink-0 pt-1 text-right select-none';
    numSpan.textContent = visIdx + 1;

    const right = document.createElement('div');
    right.className = 'flex-1 min-w-0 flex flex-col gap-1';

    // Subtitle text textarea
    const ta = document.createElement('textarea');
    ta.className = 'sub-text-input'; ta.rows = 1; ta.spellcheck = false;
    ta.value = s.text;
    ta.addEventListener('input', function() {
      this.style.height = 'auto'; this.style.height = this.scrollHeight + 'px';
      parsedSubs[srcIdx].text = this.value;
    });

    // Timestamp + duration row
    const tsRow = document.createElement('div');
    tsRow.className = 'flex items-center gap-2 flex-wrap';

    const durBadge = document.createElement('span');
    durBadge.className = 'duration-badge' + (long ? ' long' : '');

    let curStart = s.start;
    let curEnd   = s.end;

    // IMPORTANT: declare durInput with let BEFORE updateDurBadge so it is in scope
    let durInput = null;

    function updateDurBadge() {
      const d = curEnd - curStart;
      durBadge.textContent = d.toFixed(2) + 's';
      const nowLong = d > (parseFloat(document.getElementById('long-sub-threshold')?.value) || 8);
      durBadge.className = 'duration-badge' + (nowLong ? ' long' : '');
      row.classList.toggle('long-sub-row', nowLong);
      row.classList.toggle('hover:bg-slate-800/30', !nowLong);
      if (durInput) durInput.value = d.toFixed(2);
    }
    updateDurBadge();  // safe: durInput is null here but guarded with if(durInput)

    function makeTimeInput(getSec, onCommit) {
      const inp = document.createElement('input');
      inp.type = 'text'; inp.className = 'time-input font-mono';
      inp.value = toSRTTime(getSec()); inp.spellcheck = false;
      inp.addEventListener('focus', function() { this.value = toSRTTime(getSec()); });
      inp.addEventListener('input', function() {
        const v = srtTimeToSecFromStr(this.value);
        if (v !== null && v >= 0) { onCommit(v); updateDurBadge(); }
      });
      inp.addEventListener('blur', function() {
        const v = srtTimeToSecFromStr(this.value);
        if (v !== null && v >= 0) { onCommit(v); this.value = toSRTTime(getSec()); updateDurBadge(); }
        else this.value = toSRTTime(getSec());
      });
      inp.addEventListener('keydown', e => { if(e.key==='Enter') inp.blur(); });
      return inp;
    }

    const startInp = makeTimeInput(
      () => curStart,
      v  => { curStart = v; parsedSubs[srcIdx].start = v; }
    );
    const endInp = makeTimeInput(
      () => curEnd,
      v  => { curEnd = v; parsedSubs[srcIdx].end = v; }
    );

    // Editable duration — assigned to the let declared above
    durInput = document.createElement('input');
    durInput.type = 'number'; durInput.className = 'dur-input';
    durInput.min = '0'; durInput.step = '0.1';
    durInput.value = (curEnd - curStart).toFixed(2);
    durInput.title = 'Duration — sets end = start + duration';
    durInput.addEventListener('focus', function() { this.value = (curEnd - curStart).toFixed(2); });
    durInput.addEventListener('input', function() {
      const d = parseFloat(this.value);
      if (!isNaN(d) && d >= 0) {
        curEnd = curStart + d;
        parsedSubs[srcIdx].end = curEnd;
        endInp.value = toSRTTime(curEnd);
        updateDurBadge();
      }
    });
    durInput.addEventListener('blur', function() { this.value = (curEnd-curStart).toFixed(2); });
    durInput.addEventListener('keydown', e => { if(e.key==='Enter') durInput.blur(); });

    const arrow = document.createElement('span');
    arrow.className = 'text-xs text-slate-600 select-none'; arrow.textContent = '→';
    const sLabel = document.createElement('span');
    sLabel.className = 'text-xs text-slate-600 select-none'; sLabel.textContent = 's';

    tsRow.appendChild(startInp); tsRow.appendChild(arrow); tsRow.appendChild(endInp);
    tsRow.appendChild(durBadge); tsRow.appendChild(durInput); tsRow.appendChild(sLabel);

    right.appendChild(ta); right.appendChild(tsRow);
    row.appendChild(numSpan); row.appendChild(right);
    list.appendChild(row);

    requestAnimationFrame(() => { ta.style.height='auto'; ta.style.height=ta.scrollHeight+'px'; });
  });

  const panel = document.getElementById('results-panel');
  panel.classList.remove('hidden'); panel.classList.add('flex');
}

// applyTools preserving _srcIdx
function applyToolsTagged(tagged) {
  const offset      = parseFloat(document.getElementById('time-offset').value) || 0;
  const doParticles = document.getElementById('toggle-particles').checked;
  const doEmpty     = document.getElementById('toggle-empty').checked;
  const doMerge     = document.getElementById('toggle-merge').checked;

  let result = tagged.map(s => ({...s, start:Math.max(0,s.start+offset), end:Math.max(0,s.end+offset)}));
  result = result.map(s => {
    let text = s.text;
    for(const r of replaceRules){ if(r.find) text=text.split(r.find).join(r.rep); }
    return {...s,text};
  });
  if (doParticles){ const re=buildParticleRegex(); if(re) result=result.map(s=>({...s,text:s.text.replace(re,'').trim()})); }
  if (doEmpty) result=result.filter(s=>s.text.trim().length>0);
  if (doMerge){
    const merged=[];
    for(const s of result){
      if(merged.length&&merged[merged.length-1].text===s.text) merged[merged.length-1].end=s.end;
      else merged.push({...s});
    }
    result=merged;
  }
  return result;
}

['toggle-particles','toggle-empty','toggle-merge'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => { if(parsedSubs.length) renderResults(); })
);
document.getElementById('time-offset').addEventListener('input', () => { if(parsedSubs.length) renderResults(); });

const fnInput = document.getElementById('filename-input');
if(fnInput) fnInput.addEventListener('input', function(){ currentFileName=this.value.trim()||'subtitles'; autoResizeFilenameInput(this); });

// ---- Export ----
async function getExportSubs() {
  const zhMode = (document.getElementById('zh-convert-select')?.value) || 'none';
  let tagged = parsedSubs.map((s,i) => ({...s,_srcIdx:i}));
  tagged = applyToolsTagged(tagged);
  if (zhMode !== 'none') tagged = await convertSubtitles(tagged, zhMode);
  return tagged;
}

window.exportFile = async function(type) {
  const p = await getExportSubs();
  const map = { srt:[buildSRT(p),'srt'], txt:[buildTXT(p),'txt'], plain:[buildPlain(p),'txt'] };
  const [content,ext] = map[type];
  const blob = new Blob(['\uFEFF'+content],{type:'text/plain;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=`${currentFileName}.${ext}`; a.click();
  URL.revokeObjectURL(url);
};

window.copyAllSubs = async function() {
  const p = await getExportSubs();
  navigator.clipboard.writeText(buildPlain(p)).then(() => {
    const btn = document.querySelector('[onclick="copyAllSubs()"]');
    if(!btn) return;
    const orig=btn.innerHTML;
    btn.textContent=t('copied'); btn.classList.add('bg-green-600'); btn.classList.remove('bg-slate-700');
    setTimeout(()=>{ btn.innerHTML=orig; btn.classList.remove('bg-green-600'); btn.classList.add('bg-slate-700'); },1800);
  });
};

window.clearAll = function() {
  parsedSubs=[];
  document.getElementById('results-panel').classList.add('hidden');
  document.getElementById('tools-panel').classList.add('hidden');
  document.getElementById('preview-list').innerHTML='';
  fileInput.value='';
  const fn=document.getElementById('filename-input');
  if(fn){fn.value='';autoResizeFilenameInput(fn);}
};

function showError(msg){ document.getElementById('error-text').textContent=msg; document.getElementById('error-msg').classList.remove('hidden'); }
function escHtml(str){ const d=document.createElement('div'); d.textContent=str; return d.innerHTML; }

renderOsGuide();
initParticlePicker();
loadToggleState();
