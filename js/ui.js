// ==========================================
// UI — drop zone, file handling, render, export
// ==========================================

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

// ---- Replace Rules UI ----
let replaceRules = [];

function addReplaceRow(find = '', rep = '') {
  const id = Date.now() + '_' + Math.random();
  replaceRules.push({ id, find, rep });

  const row = document.createElement('div');
  row.className = 'replace-row';
  row.dataset.id = id;
  row.innerHTML = `
    <input type="text" value="${escHtml(find)}" placeholder="${t('findPlaceholder')}" class="replace-find flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500">
    <svg class="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
    <input type="text" value="${escHtml(rep)}" placeholder="${t('replacePlaceholder')}" class="replace-with flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500">
    <button onclick="removeReplaceRow('${id}')" class="text-slate-600 hover:text-red-400 transition-colors shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>`;

  row.querySelector('.replace-find').addEventListener('input', e => {
    const r = replaceRules.find(x => x.id === id);
    if (r) { r.find = e.target.value; if (parsedSubs.length) renderResults(); }
  });
  row.querySelector('.replace-with').addEventListener('input', e => {
    const r = replaceRules.find(x => x.id === id);
    if (r) { r.rep = e.target.value; if (parsedSubs.length) renderResults(); }
  });

  document.getElementById('replace-list').appendChild(row);
}

window.removeReplaceRow = function (id) {
  replaceRules = replaceRules.filter(r => r.id !== id);
  document.querySelector(`.replace-row[data-id="${id}"]`)?.remove();
  if (parsedSubs.length) renderResults();
};

document.getElementById('add-replace-btn').addEventListener('click', () => addReplaceRow());

// ---- File Handling ----
let parsedSubs = [];
let currentFileName = 'subtitles';

const dropZone  = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e =>
  document.body.addEventListener(e, ev => { ev.preventDefault(); ev.stopPropagation(); })
);
['dragenter', 'dragover'].forEach(e =>
  dropZone.addEventListener(e, () => dropZone.classList.add('drag-over'))
);
['dragleave', 'drop'].forEach(e =>
  dropZone.addEventListener(e, () => dropZone.classList.remove('drag-over'))
);
dropZone.addEventListener('drop', e => {
  if (e.dataTransfer && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', e => {
  if (e.target.files && e.target.files.length) handleFile(e.target.files[0]);
});

async function handleFile(file) {
  document.getElementById('error-msg').classList.add('hidden');
  try {
    const raw   = await file.text();
    const isSRT = file.name.toLowerCase().endsWith('.srt');
    if (isSRT) {
      parsedSubs = parseSRT(raw);
      if (parsedSubs.length === 0) throw new Error('No valid SRT blocks found.');
      currentFileName = file.name.replace(/\.srt$/i, '');
    } else {
      const json = JSON.parse(raw);
      parsedSubs = parseCapcut(json);
      if (parsedSubs.length === 0) throw new Error('No subtitle tracks found. Make sure the file has auto-transcribed subtitles.');
      currentFileName = file.name.replace(/\.json$/i, '');
    }
    // sync filename input
    const fnInput = document.getElementById('filename-input');
    if (fnInput) {
      fnInput.value = currentFileName;
      autoResizeFilenameInput(fnInput);
    }
    document.getElementById('tools-panel').classList.remove('hidden');
    renderResults();
  } catch (err) {
    showError(t('errorBadFile') + (err.message ? ' (' + err.message + ')' : ''));
  }
}

// ---- Filename input auto-width ----
function autoResizeFilenameInput(el) {
  // use a hidden span to measure text width
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

// ---- Render ----
function renderResults() {
  const processed = applyTools(parsedSubs);
  document.getElementById('subtitle-count').textContent = processed.length;

  // render each subtitle row with an editable textarea
  const list = document.getElementById('preview-list');
  list.innerHTML = '';

  processed.slice(0, 200).forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'subtitle-row px-4 py-3 flex gap-4 items-start hover:bg-slate-800/30 transition-colors';

    const ta = document.createElement('textarea');
    ta.className = 'sub-text-input';
    ta.rows = 1;
    ta.spellcheck = false;
    ta.value = s.text;
    ta.dataset.origIdx = i;

    // auto-height on render
    ta.style.height = 'auto';

    // write-back to parsedSubs when user edits
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
      // update the processed entry and the source parsedSubs entry by matching index
      processed[i].text = this.value;
      // find the closest match in parsedSubs by start time
      const src = parsedSubs.find(x => Math.abs(x.start - s.start) < 0.001);
      if (src) src.text = this.value;
    });

    const numSpan = document.createElement('span');
    numSpan.className = 'text-xs text-slate-600 font-mono w-8 shrink-0 pt-1 text-right select-none';
    numSpan.textContent = i + 1;

    const right = document.createElement('div');
    right.className = 'flex-1 min-w-0';

    const timeLine = document.createElement('p');
    timeLine.className = 'text-xs text-slate-500 mt-1 font-mono';
    timeLine.textContent = toSRTTime(s.start) + ' → ' + toSRTTime(s.end);

    right.appendChild(ta);
    right.appendChild(timeLine);
    row.appendChild(numSpan);
    row.appendChild(right);
    list.appendChild(row);

    // set height after appended to DOM
    requestAnimationFrame(() => {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  });

  const panel = document.getElementById('results-panel');
  panel.classList.remove('hidden');
  panel.classList.add('flex');
}

['toggle-particles', 'toggle-empty', 'toggle-merge'].forEach(id =>
  document.getElementById(id).addEventListener('change', () => { if (parsedSubs.length) renderResults(); })
);
document.getElementById('time-offset').addEventListener('input', () => { if (parsedSubs.length) renderResults(); });

// ---- Filename input wiring (runs after DOM ready) ----
const fnInput = document.getElementById('filename-input');
if (fnInput) {
  fnInput.addEventListener('input', function () {
    currentFileName = this.value.trim() || 'subtitles';
    autoResizeFilenameInput(this);
  });
}

// ---- Export ----
window.exportFile = function (type) {
  const p = applyTools(parsedSubs);
  const map = {
    srt:   [buildSRT(p),   'srt'],
    txt:   [buildTXT(p),   'txt'],
    plain: [buildPlain(p), 'txt'],
  };
  const [content, ext] = map[type];
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `${currentFileName}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
};

window.copyAllSubs = function () {
  navigator.clipboard.writeText(buildPlain(applyTools(parsedSubs))).then(() => {
    const btn = document.querySelector('[onclick="copyAllSubs()"]');
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.textContent = t('copied');
    btn.classList.add('bg-green-600');
    btn.classList.remove('bg-slate-700');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove('bg-green-600');
      btn.classList.add('bg-slate-700');
    }, 1800);
  });
};

window.clearAll = function () {
  parsedSubs = [];
  document.getElementById('results-panel').classList.add('hidden');
  document.getElementById('tools-panel').classList.add('hidden');
  document.getElementById('preview-list').innerHTML = '';
  fileInput.value = '';
  const fn = document.getElementById('filename-input');
  if (fn) { fn.value = ''; autoResizeFilenameInput(fn); }
};

// ---- Helpers ----
function showError(msg) {
  document.getElementById('error-text').textContent = msg;
  document.getElementById('error-msg').classList.remove('hidden');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// Init OS guide on load
renderOsGuide();
