// ==========================================
// Parsers — CapCut JSON + SRT + TXT
// ==========================================

function parseCapcut(data) {
  const subs = [];
  const mats = data.materials || {};
  const cacheInfos = mats.subtitle_cache_info || [];

  for (const cacheBlock of cacheInfos) {
    const sentences = cacheBlock.sentence_list || cacheBlock.sentencelist || cacheBlock.sentences || [];
    for (const sentence of sentences) {
      const startUs = sentence.start_time ?? sentence.starttime ?? null;
      const endUs   = sentence.end_time   ?? sentence.endtime   ?? null;
      const text    = sentence.text ?? '';
      if (startUs === null || endUs === null || !text.trim()) continue;
      subs.push({ start: startUs / 1000000, end: endUs / 1000000, text: text.trim() });
    }
  }

  if (subs.length === 0) {
    const tracks = data.tracks || [];
    const textMats = {};
    for (const tm of (mats.texts || [])) { if (tm.id) textMats[tm.id] = tm; }
    for (const track of tracks) {
      if (track.type !== 'text') continue;
      for (const seg of (track.segments || [])) {
        const tr = seg.target_timerange || {};
        const start = (tr.start || 0) / 1000000;
        const dur   = (tr.duration || 0) / 1000000;
        const mat   = textMats[seg.material_id];
        let text = '';
        if (mat) {
          try { const p = typeof mat.content === 'string' ? JSON.parse(mat.content) : mat.content; text = (p && typeof p.text === 'string') ? p.text : String(mat.content || ''); } catch { text = String(mat.content || mat.text || ''); }
        } else if (seg.content) {
          try { const p = typeof seg.content === 'string' ? JSON.parse(seg.content) : seg.content; text = (p && typeof p.text === 'string') ? p.text : String(seg.content); } catch { text = String(seg.content); }
        }
        if (text.trim()) subs.push({ start, end: start + dur, text: text.trim() });
      }
    }
  }

  if (subs.length === 0) {
    for (const tm of (mats.texts || [])) {
      const tr = tm.timerange || {};
      const start = (tr.start || 0) / 1000000;
      const dur   = (tr.duration || 0) / 1000000;
      let text = '';
      try { const p = typeof tm.content === 'string' ? JSON.parse(tm.content) : tm.content; text = (p && typeof p.text === 'string') ? p.text : String(tm.content || tm.text || ''); } catch { text = String(tm.content || tm.text || ''); }
      if (text.trim()) subs.push({ start, end: start + dur, text: text.trim() });
    }
  }

  return subs.sort((a, b) => a.start - b.start);
}

function parseSRT(raw) {
  const subs = [];
  const blocks = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split(/\n\n+/);
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;
    const tIdx = lines.findIndex(l => /-->/.test(l));
    if (tIdx < 0) continue;
    const parts = lines[tIdx].split('-->');
    if (parts.length < 2) continue;
    const start = srtTimeToSec(parts[0].trim());
    const end   = srtTimeToSec(parts[1].trim());
    const text  = lines.slice(tIdx + 1).filter(l => l.trim()).join(' ');
    if (text) subs.push({ start, end, text });
  }
  return subs;
}

function srtTimeToSec(s) {
  const m = s.match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) return 0;
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4].padEnd(3, '0') / 1000;
}

// Parse .txt: supports two formats
//   Format A (timestamp blocks):
//     [00:00:01,000 --> 00:00:03,500]
//     subtitle text
//
//   Format B (plain lines, one subtitle per non-empty line, no timestamps):
//     line of text
function parseTXT(raw) {
  const normalised = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Try Format A first
  const tsPattern = /\[?(\d+:\d+:\d+[,.]\d+)\s*-->\s*(\d+:\d+:\d+[,.]\d+)\]?/;
  if (tsPattern.test(normalised)) {
    const subs = [];
    const blocks = normalised.split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      const tIdx  = lines.findIndex(l => tsPattern.test(l));
      if (tIdx < 0) continue;
      const m     = lines[tIdx].match(tsPattern);
      const start = srtTimeToSec(m[1]);
      const end   = srtTimeToSec(m[2]);
      const text  = lines.slice(tIdx + 1).filter(l => l.trim()).join(' ');
      if (text) subs.push({ start, end, text });
    }
    if (subs.length) return subs;
  }

  // Format B: plain lines, assign dummy sequential timestamps (1 s each)
  const lines = normalised.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map((text, i) => ({ start: i, end: i + 1, text }));
}
