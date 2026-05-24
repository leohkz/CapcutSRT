// ==========================================
// i18n — translation strings
// ==========================================
const i18n = {
  en: {
    tagline: 'CapCut Subtitle Exporter',
    desc: 'Import <code class="bg-slate-800 px-1 py-0.5 rounded text-violet-300 text-xs">draft_content.json</code> (CapCut) or any <code class="bg-slate-800 px-1 py-0.5 rounded text-violet-300 text-xs">.srt</code> file. Export as SRT, TXT, or plain text. 100% local — nothing is uploaded.',
    osGuideTitle: '📂 Where is my CapCut project file?',
    osGuideSub: 'Navigate to the folder below, open your project folder, and drag the draft_content.json file here.',
    osGuideNote: 'Replace "user" with your actual username. Each project has its own subfolder inside com.lveditor.draft.',
    dropTitle: 'Click or drag & drop your file',
    dropSub: 'CapCut draft_content.json  ·  or any .srt file',
    dropHint: 'No upload · Fully private',
    advancedTools: 'Advanced Processing Tools',
    deleteParticles: 'Remove modal particles / filler words',
    deleteParticlesSub: 'Strips: 嗯、啊、哦、嗳、那、就、然后…',
    removeEmpty: 'Remove empty / whitespace-only lines',
    removeEmptySub: 'Skip lines with no meaningful text',
    mergeSame: 'Merge consecutive duplicate lines',
    mergeSameSub: 'Combine back-to-back identical subtitles',
    timeOffset: 'Time offset',
    seconds: 'seconds  (positive or negative)',
    textReplace: 'Text replacement rules',
    addRule: 'Add rule',
    findPlaceholder: 'Find…',
    replacePlaceholder: 'Replace with…',
    subtitleLines: ' subtitle lines',
    exportSRT: 'Export .srt',
    exportTXT: 'Export .txt (timestamps)',
    exportPlain: 'Export .txt (plain)',
    copyAll: 'Copy all',
    clearAll: 'Clear',
    preview: 'Preview',
    previewNote: 'Showing up to 200 lines',
    errorTitle: 'Parse Error',
    errorBadFile: 'Could not parse this file.',
    copied: 'Copied!',
  },
  'zh-TW': {
    tagline: 'CapCut 字幕匯出工具',
    desc: '匯入 <code class="bg-slate-800 px-1 py-0.5 rounded text-violet-300 text-xs">draft_content.json</code>（CapCut）或任何 <code class="bg-slate-800 px-1 py-0.5 rounded text-violet-300 text-xs">.srt</code> 檔。匯出 SRT、TXT 或純文字。100% 本機解析。',
    osGuideTitle: '📂 如何找到 CapCut 的存檔？',
    osGuideSub: '前往以下路徑，進入你的專案資料夾，把 draft_content.json 拖曳到這裡。',
    osGuideNote: '請將 "user" 替換為你的實際用戶名稱。每個專案在 com.lveditor.draft 內都有獨立資料夾。',
    dropTitle: '點擊或拖曳檔案',
    dropSub: 'CapCut draft_content.json  ·  或任何 .srt 檔案',
    dropHint: '不上傳 · 完全私密',
    advancedTools: '進階處理工具',
    deleteParticles: '刪除語氣詞 / 填充詞',
    deleteParticlesSub: '自動移除：嗯、啊、哦、嗳、那、就、然後…',
    removeEmpty: '移除空行',
    removeEmptySub: '跳過沒有實質內容的行',
    mergeSame: '合併連續重複行',
    mergeSameSub: '合併前後相同的字幕句',
    timeOffset: '時間偏移',
    seconds: '秒（正數或負數）',
    textReplace: '文字取代規則',
    addRule: '新增規則',
    findPlaceholder: '尋找…',
    replacePlaceholder: '取代為…',
    subtitleLines: ' 條字幕',
    exportSRT: '匯出 .srt',
    exportTXT: '匯出 .txt（含時間戳）',
    exportPlain: '匯出 .txt（純文字）',
    copyAll: '複製全部',
    clearAll: '清除',
    preview: '預覽',
    previewNote: '最多顯示 200 行',
    errorTitle: '解析錯誤',
    errorBadFile: '無法解析此檔案。',
    copied: '已複製！',
  },
  'zh-CN': {
    tagline: 'CapCut 字幕导出工具',
    desc: '导入 <code class="bg-slate-800 px-1 py-0.5 rounded text-violet-300 text-xs">draft_content.json</code>（CapCut）或任何 <code class="bg-slate-800 px-1 py-0.5 rounded text-violet-300 text-xs">.srt</code> 文件。导出 SRT、TXT 或纯文本。100% 本地解析。',
    osGuideTitle: '📂 如何找到 CapCut 的存档？',
    osGuideSub: '前往以下路径，进入你的项目文件夹，把 draft_content.json 拖拽到这里。',
    osGuideNote: '请将 "user" 替换为你的实际用户名。每个项目在 com.lveditor.draft 内都有独立文件夹。',
    dropTitle: '点击或拖拽文件',
    dropSub: 'CapCut draft_content.json  ·  或任何 .srt 文件',
    dropHint: '不上传 · 完全私密',
    advancedTools: '高级处理工具',
    deleteParticles: '删除语气词 / 填充词',
    deleteParticlesSub: '自动移除：嗯、啊、哦、嗳、那、就、然后…',
    removeEmpty: '移除空行',
    removeEmptySub: '跳过没有实质内容的行',
    mergeSame: '合并连续重复行',
    mergeSameSub: '合并前后相同的字幕句',
    timeOffset: '时间偏移',
    seconds: '秒（正数或负数）',
    textReplace: '文字替换规则',
    addRule: '添加规则',
    findPlaceholder: '查找…',
    replacePlaceholder: '替换为…',
    subtitleLines: ' 条字幕',
    exportSRT: '导出 .srt',
    exportTXT: '导出 .txt（含时间戳）',
    exportPlain: '导出 .txt（纯文本）',
    copyAll: '复制全部',
    clearAll: '清除',
    preview: '预览',
    previewNote: '最多显示 200 行',
    errorTitle: '解析错误',
    errorBadFile: '无法解析此文件。',
    copied: '已复制！',
  }
};

let currentLang = 'en';

function t(k) {
  return (i18n[currentLang] || i18n.en)[k] || k;
}

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.dataset.i18n);
  });
  document.querySelectorAll('.lang-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );
  document.querySelectorAll('.replace-find').forEach(i => i.placeholder = t('findPlaceholder'));
  document.querySelectorAll('.replace-with').forEach(i => i.placeholder = t('replacePlaceholder'));
  if (typeof renderOsGuide === 'function') renderOsGuide();
}

document.querySelectorAll('.lang-btn').forEach(b =>
  b.addEventListener('click', () => applyLang(b.dataset.lang))
);

// Auto-detect on load
(function () {
  const nav = navigator.language || 'en';
  if (nav.startsWith('zh-TW') || nav.startsWith('zh-HK') || nav === 'zh-Hant') applyLang('zh-TW');
  else if (nav.startsWith('zh')) applyLang('zh-CN');
  else applyLang('en');
})();
