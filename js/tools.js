// ==========================================
// Tools — processing pipeline + formatters
// ==========================================

const MODAL_PARTICLES = /[嗯啊哦嗳那就然后然後唔系即係即是]+/g;

function applyTools(subs) {
  const offset     = parseFloat(document.getElementById('time-offset').value) || 0;
  const doParticles = document.getElementById('toggle-particles').checked;
  const doEmpty     = document.getElementById('toggle-empty').checked;
  const doMerge     = document.getElementById('toggle-merge').checked;

  let result = subs.map(s => ({
    ...s,
    start: Math.max(0, s.start + offset),
    end:   Math.max(0, s.end   + offset),
  }));

  // text replacements
  result = result.map(s => {
    let text = s.text;
    for (const r of replaceRules) {
      if (r.find) text = text.split(r.find).join(r.rep);
    }
    return { ...s, text };
  });

  if (doParticles) result = result.map(s => ({ ...s, text: s.text.replace(MODAL_PARTICLES, '').trim() }));
  if (doEmpty)     result = result.filter(s => s.text.trim().length > 0);
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

function toSRTTime(sec) {
  const h  = Math.floor(sec / 3600);
  const m  = Math.floor((sec % 3600) / 60);
  const s  = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
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
