pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const ROAST_STEPS = [
  'Uploading Resume', 'Extracting PDF', 'Reading Resume',
  'Looking for Red Flags', 'Roasting Resume', 'Rewriting Resume',
  'Finalizing Report',
];

const FIX_LOADING_MESSAGES = [
  'Rewriting your career... ✨', 'Polishing bullet points... 💎',
  'Making you sound impressive... 🚀', 'Applying STAR method... ⭐',
  'Almost done... your new resume awaits 😎',
];

let currentFile = null;
let currentResumeText = null;
let currentRoast = null;
let currentFix = null;
let currentScore = null;
let currentTips = null;
let currentCategories = null;
let currentStrengths = null;
let currentVerdict = null;
let currentKeywords = null;
let loadingInterval = null;
let currentJobDesc = '';
let currentRoastLevel = 'brutal';

const $ = (id) => document.getElementById(id);

const el = {
  uploadPage: $('uploadPage'), resultsPage: $('results'),
  uploadZone: $('drop-zone'), fileInput: $('file-upload'),
  fileInfo: $('fileInfo'), fileName: $('fileName'), removeFile: $('removeFile'),
  analyzeBtn: $('roast-btn'), uploadSection: $('uploadSection'),
  loadingSection: $('loadingSection'), loadingMessage: $('loadingMessage'),
  errorSection: $('errorSection'), errorText: $('errorText'), retryBtn: $('retryBtn'),
  resultsBody: $('resultsBody'), resultsScroll: $('resultsScroll'),
  resultsLogo: $('resultsLogo'), roastToggleBtn: $('roastToggleBtn'), fixToggleBtn: $('fixToggleBtn'),
  shareBtn: $('shareBtn'), shareDropdown: $('shareDropdown'), shareCopyLink: $('shareCopyLink'),
  scoreCard: $('scoreCard'), scoreRingFill: $('scoreRingFill'), scoreValue: $('scoreValue'),
  tipsCard: $('tipsCard'), tipsList: $('tipsList'),
  toast: $('toast'), toastMessage: $('toastMessage'), progressBar: $('progressBar'),
  contentTitle: $('contentTitle'), contentSubtitle: $('contentSubtitle'),
  kofiPopup: $('kofiPopup'), kofiPopupClose: $('kofiPopupClose'),
  targetRole: $('targetRole'), jobDescription: $('jobDescription'),
  strengthsSection: $('strengthsSection'), strengthsList: $('strengthsList'),
  keywordSection: $('keywordSection'), keywordMatchList: $('keywordMatchList'),
  keywordMatchBar: $('keywordMatchBar'), keywordMatchRate: $('keywordMatchRate'),
  missingKeywordsSection: $('missingKeywordsSection'), missingKeywordsList: $('missingKeywordsList'),
  categoryScoresSection: $('categoryScoresSection'), categoryScoresList: $('categoryScoresList'),
  verdictSection: $('verdictSection'), verdictBadge: $('verdictBadge'), verdictDetails: $('verdictDetails'),
  roastLevelBtns: document.querySelectorAll('.roast-level-btn'),
};

let currentStepIdx = 0;

el.uploadZone.addEventListener('click', () => el.fileInput.click());
el.uploadZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.fileInput.click(); }
});

el.uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); el.uploadZone.classList.add('drag-active'); });
el.uploadZone.addEventListener('dragleave', () => { el.uploadZone.classList.remove('drag-active'); });
el.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  el.uploadZone.classList.remove('drag-active');
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

el.fileInput.addEventListener('change', () => {
  if (el.fileInput.files.length > 0) handleFile(el.fileInput.files[0]);
});

el.fileInput.addEventListener('click', (e) => e.stopPropagation());

el.removeFile.addEventListener('click', resetUpload);
el.analyzeBtn.addEventListener('click', analyzeResume);
el.roastToggleBtn.addEventListener('click', () => showRoastView());
el.fixToggleBtn.addEventListener('click', () => showFixView());
el.resultsLogo.addEventListener('click', resetUpload);
el.retryBtn.addEventListener('click', () => { hideError(); if (currentFile) analyzeResume(); });

el.shareBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = el.shareDropdown.hidden;
  el.shareDropdown.hidden = !isOpen;
  el.shareBtn.setAttribute('aria-expanded', String(!isOpen));
});
el.shareCopyLink.addEventListener('click', () => {
  navigator.clipboard.writeText('https://roastmycv-production.up.railway.app').then(() => {
    el.shareDropdown.hidden = true;
    el.shareBtn.setAttribute('aria-expanded', 'false');
    showToast('Link copied to clipboard!');
  });
});
document.addEventListener('click', (e) => {
  if (!el.shareBtn.contains(e.target) && !el.shareDropdown.contains(e.target)) {
    el.shareDropdown.hidden = true;
    el.shareBtn.setAttribute('aria-expanded', 'false');
  }
});

el.roastLevelBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    el.roastLevelBtns.forEach((b) => {
      b.className = 'roast-level-btn px-4 py-1.5 text-xs font-bold transition-all bg-transparent text-on-surface-variant hover:text-on-surface';
      b.setAttribute('aria-pressed', 'false');
    });
    btn.className = 'roast-level-btn px-4 py-1.5 text-xs font-bold transition-all bg-primary-container text-on-primary-container';
    btn.setAttribute('aria-pressed', 'true');
    currentRoastLevel = btn.dataset.level;
  });
});

function handleFile(file) {
  const name = file.name.toLowerCase();
  const isPDF = file.type === 'application/pdf' || name.endsWith('.pdf');
  const isDOCX = name.endsWith('.docx');
  if (!isPDF && !isDOCX) {
    showError('Please upload a PDF or DOCX file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError('File is too large. Maximum size is 10MB.');
    return;
  }
  currentFile = file;
  el.fileName.textContent = file.name;
  el.fileInfo.hidden = false;
  el.analyzeBtn.disabled = false;
  el.analyzeBtn.textContent = '🔥 Roast My Resume';
}

function resetUpload() {
  currentFile = null; currentResumeText = null;
  currentRoast = null; currentFix = null; currentScore = null; currentTips = null;
  currentCategories = null; currentStrengths = null; currentVerdict = null; currentKeywords = null;
  el.fileInput.value = '';
  el.fileInfo.hidden = true;
  el.fileName.textContent = '';
  el.analyzeBtn.disabled = true;
  el.analyzeBtn.textContent = '🔥 Roast My Resume';
  hideResults(); hideError();
  el.uploadPage.hidden = false;
  el.resultsPage.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function analyzeResume() {
  if (!currentFile) return;

  currentJobDesc = el.jobDescription.value.trim() || '';
  const targetRole = el.targetRole.value.trim();
  if (targetRole && !currentJobDesc) {
    currentJobDesc = `Target Role: ${targetRole}`;
  }

  currentStepIdx = 0;
  showLoadingSteps();
  hideError();
  hideResults();

  try {
    currentResumeText = await extractText(currentFile);
    if (!currentResumeText || currentResumeText.trim().length < 20) {
      if (currentFile.name.endsWith('.docx')) {
        showError('Could not extract enough text from this DOCX file. Make sure it contains selectable text.');
      } else {
        showError('Could not extract enough text from this PDF. Make sure it\'s a text-based PDF (not a scanned image).');
      }
      hideLoading();
      return;
    }

    advanceStep(2);

    const [roastRes, scoreRes] = await Promise.all([
      fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: currentResumeText, jobDescription: currentJobDesc, roastLevel: currentRoastLevel }),
      }),
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: currentResumeText, jobDescription: currentJobDesc }),
      }),
    ]);

    advanceStep(5);

    const roastData = await roastRes.json();
    if (!roastRes.ok) throw new Error(roastData.error || 'Server error. Please try again.');
    currentRoast = roastData.text;

    const scoreData = await scoreRes.json();
    currentScore = scoreData.score;
    currentTips = scoreData.tips;
    currentCategories = scoreData.categories;
    currentStrengths = scoreData.strengths;
    currentVerdict = scoreData.recruiterVerdict;
    currentKeywords = scoreData.keywords;

    advanceStep(6);
    displayRoast();
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      showError('Server is unavailable. Please check your connection and try again.');
    } else {
      showError(err.message || 'Something went wrong. Please check your connection and try again.');
    }
  } finally {
    hideLoading();
  }
}

function loadMammoth() {
  return new Promise((resolve, reject) => {
    if (window.mammoth) return resolve(window.mammoth);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
    s.onload = () => resolve(window.mammoth);
    s.onerror = () => reject(new Error('Failed to load DOCX parser'));
    document.head.appendChild(s);
  });
}

async function extractText(file) {
  if (file.name.endsWith('.docx')) {
    const mammoth = await loadMammoth();
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value.trim();
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  if (pdf.numPages === 0) throw new Error('This PDF appears to be empty.');
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    if (!content.items.length) {
      throw new Error('This PDF appears to be a scanned image. Please use a text-based PDF.');
    }
    fullText += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return fullText.trim();
}

function displayRoast() {
  el.resultsBody.innerHTML = renderMarkdown(currentRoast);
  el.contentTitle.textContent = '🔥 The Roast';
  el.contentSubtitle.textContent = currentJobDesc ? 'Tailored analysis for your target role.' : 'The brutal truth about your resume.';
  el.uploadPage.hidden = true;
  el.resultsPage.hidden = false;
  setActiveToggle('roast');

  if (currentScore !== null) {
    el.scoreCard.hidden = false;
    updateScoreRing(currentScore);
  }
  if (currentTips !== null && currentTips.length > 0) {
    el.tipsCard.hidden = false;
    el.tipsList.innerHTML = currentTips.map((t) => `<li>${t}</li>`).join('');
  }
  if (currentStrengths && currentStrengths.length > 0) {
    el.strengthsSection.hidden = false;
    el.strengthsList.innerHTML = currentStrengths.map((s) => `<li>✅ ${s}</li>`).join('');
  }
  if (currentKeywords) {
    el.keywordSection.hidden = false;
    renderKeywordMatch(currentKeywords);
  }
  if (currentCategories) {
    el.categoryScoresSection.hidden = false;
    renderCategoryScores(currentCategories);
  }
  if (currentVerdict) {
    el.verdictSection.hidden = false;
    renderVerdict(currentVerdict);
  }

  el.resultsScroll.scrollTop = 0;
  startKofiPopupTimer();
}

function renderKeywordMatch(data) {
  if (data.matchRate !== undefined) {
    el.keywordMatchRate.textContent = `${data.matchRate}%`;
    el.keywordMatchBar.style.width = `${data.matchRate}%`;
  }
  let html = '';
  if (data.matched) {
    data.matched.forEach((kw) => {
      html += `<div class="flex items-center gap-1.5 text-xs text-on-surface-variant bg-[#0A0A0A] rounded-lg px-3 py-1.5"><span class="text-primary-container font-bold">✓</span> ${kw}</div>`;
    });
  }
  if (data.missing && data.missing.length > 0) {
    data.missing.forEach((kw) => {
      html += `<div class="flex items-center gap-1.5 text-xs text-on-surface-variant bg-[#0A0A0A] rounded-lg px-3 py-1.5"><span class="text-error font-bold">✗</span> ${kw.keyword || kw}</div>`;
    });
    el.missingKeywordsSection.hidden = false;
    el.missingKeywordsList.innerHTML = data.missing.map((m) => {
      const name = m.keyword || m;
      const why = m.why || '';
      return `<li><strong class="text-on-surface">${name}</strong>${why ? `: ${why}` : ''}</li>`;
    }).join('');
  }
  el.keywordMatchList.innerHTML = html;
}

function renderCategoryScores(categories) {
  const names = { content: 'Content', formatting: 'Formatting', impact: 'Impact', ats: 'ATS', readability: 'Readability' };
  el.categoryScoresList.innerHTML = Object.entries(categories).map(([key, cat]) => {
    const score = cat.score || cat;
    const note = cat.note || '';
    const color = score < 50 ? '#ff4500' : score < 75 ? '#ff8c00' : '#00c853';
    return `<div class="category-score-item">
      <div class="category-score-header flex justify-between items-center mb-1">
        <span class="category-score-name text-xs font-medium text-on-surface">${names[key] || key}</span>
        <span class="category-score-value text-xs font-bold text-on-surface" style="color:${color}">${score}</span>
      </div>
      <div class="h-1.5 bg-[#0A0A0A] rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" style="width:${score}%;background:${color}"></div>
      </div>
      ${note ? `<p class="text-[11px] text-on-surface-variant mt-1">${note}</p>` : ''}
    </div>`;
  }).join('');
}

function renderVerdict(v) {
  const badge = el.verdictBadge;
  badge.textContent = v.wouldInterview || 'N/A';
  badge.className = 'text-lg font-black font-display';
  if (v.wouldInterview === 'YES') badge.style.color = '#00c853';
  else if (v.wouldInterview === 'MAYBE') badge.style.color = '#ff8c00';
  else badge.style.color = '#ff4500';

  let html = '';
  if (v.reason) html += `<p><strong class="text-on-surface">Reason:</strong> ${v.reason}</p>`;
  if (v.biggestReason) html += `<p><strong class="text-on-surface">Biggest reason:</strong> ${v.biggestReason}</p>`;
  if (v.changeMyDecision) html += `<p><strong class="text-on-surface">What would change my decision:</strong> ${v.changeMyDecision}</p>`;
  el.verdictDetails.innerHTML = html;
}

function setActiveToggle(view) {
  if (view === 'roast') {
    el.roastToggleBtn.className = 'toggle-btn toggle-btn-active';
    el.roastToggleBtn.setAttribute('aria-pressed', 'true');
    el.fixToggleBtn.className = 'toggle-btn toggle-btn-inactive';
    el.fixToggleBtn.setAttribute('aria-pressed', 'false');
  } else {
    el.roastToggleBtn.className = 'toggle-btn toggle-btn-inactive';
    el.roastToggleBtn.setAttribute('aria-pressed', 'false');
    el.fixToggleBtn.className = 'toggle-btn toggle-btn-active';
    el.fixToggleBtn.setAttribute('aria-pressed', 'true');
  }
}

function showRoastView() {
  if (!currentRoast) return;
  el.resultsBody.innerHTML = renderMarkdown(currentRoast);
  el.contentTitle.textContent = '🔥 The Roast';
  el.contentSubtitle.textContent = currentJobDesc ? 'Tailored analysis for your target role.' : 'The brutal truth about your resume.';
  setActiveToggle('roast');
  el.resultsScroll.scrollTop = 0;
}

function showFixView() {
  if (currentFix) {
    el.resultsBody.innerHTML = renderMarkdown(currentFix);
    el.contentTitle.textContent = '✨ The Fix';
    el.contentSubtitle.textContent = 'Your polished and improved resume.';
    setActiveToggle('fix');
    el.resultsScroll.scrollTop = 0;
  } else {
    fixResume();
  }
}

async function fixResume() {
  if (!currentResumeText) return;
  showLoading(FIX_LOADING_MESSAGES);
  hideError();
  try {
    const response = await fetch('/api/fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: currentResumeText, jobDescription: currentJobDesc }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Server error. Please try again.');
    currentFix = data.text;
    displayFix();
  } catch (err) {
    showError(err.message || 'Something went wrong.');
  } finally {
    hideLoading();
  }
}

function displayFix() {
  el.resultsBody.innerHTML = renderMarkdown(currentFix);
  el.contentTitle.textContent = '✨ The Fix';
  el.contentSubtitle.textContent = 'Your polished and improved resume.';
  setActiveToggle('fix');
  el.resultsScroll.scrollTop = 0;
}

function renderMarkdown(text) {
  return `<div class="rmd">${
    text.split(/\n{2,}/).map((block) => {
      block = block.trim();
      if (!block) return '';
      if (/^### (.+)/.test(block)) return `<h3>${block.replace(/^### /, '')}</h3>`;
      if (/^## (.+)/.test(block)) return `<h2>${block.replace(/^## /, '')}</h2>`;
      if (/^# (.+)/.test(block)) return `<h2>${block.replace(/^# /, '')}</h2>`;
      if (/^\*\*(.+)\*\*/.test(block)) {
        const match = block.match(/^\*\*(.+)\*\*(.*)/);
        if (match) {
          const rest = renderInline(match[2]);
          return `<h2>${match[1]}</h2>${rest ? `<p>${rest}</p>` : ''}`;
        }
      }
      if (/^[-*] /.test(block)) {
        const items = block.split('\n').map((line) => {
          const clean = line.replace(/^[-*] /, '').trim();
          return clean ? `<li>${renderInline(clean)}</li>` : '';
        }).filter(Boolean);
        return `<ul>${items.join('')}</ul>`;
      }
      const lines = block.split('\n').filter(Boolean);
      if (lines.length === 1) return `<p>${renderInline(lines[0])}</p>`;
      return lines.map((l) => `<p>${renderInline(l)}</p>`).join('');
    }).join('')
  }</div>`;
}

function renderInline(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');
}

function showLoadingSteps() {
  el.loadingSection.hidden = false;
  el.progressBar.hidden = false;
  currentStepIdx = 0;
  el.loadingMessage.innerHTML = buildStepHTML(0);
  loadingInterval = setInterval(() => {
    if (currentStepIdx < ROAST_STEPS.length - 1) {
      currentStepIdx++;
      el.loadingMessage.innerHTML = buildStepHTML(currentStepIdx);
    }
  }, 2500);
}

function buildStepHTML(activeIdx) {
  return ROAST_STEPS.map((step, i) => {
    if (i < activeIdx) return `<div class="text-xs text-primary-container mb-1">✓ ${step}</div>`;
    if (i === activeIdx) return `<div class="text-xs text-on-surface font-medium mb-1 animate-pulse">● ${step}</div>`;
    return `<div class="text-xs text-on-surface-variant/40 mb-1">○ ${step}</div>`;
  }).join('');
}

function advanceStep(target) {
  if (target > currentStepIdx) {
    currentStepIdx = target;
    el.loadingMessage.innerHTML = buildStepHTML(currentStepIdx);
  }
}

function showLoading(messages) {
  el.loadingSection.hidden = false;
  el.progressBar.hidden = false;
  let idx = 0;
  el.loadingMessage.textContent = messages[0];
  loadingInterval = setInterval(() => {
    idx = (idx + 1) % messages.length;
    el.loadingMessage.textContent = messages[idx];
  }, 1800);
}

function hideLoading() {
  clearInterval(loadingInterval);
  loadingInterval = null;
  el.loadingSection.hidden = true;
  el.progressBar.hidden = true;
}

function updateScoreRing(score) {
  const r = 68;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  el.scoreRingFill.style.strokeDasharray = `${circumference}`;
  el.scoreRingFill.style.strokeDashoffset = offset;
  el.scoreValue.textContent = score;
  const color = score < 50 ? '#ff4500' : score < 75 ? '#ff8c00' : '#00c853';
  el.scoreRingFill.style.stroke = color;
}

function showError(msg) {
  hideLoading();
  if (!el.resultsPage.hidden) { showToast(msg); return; }
  hideResults();
  el.errorText.textContent = msg;
  el.errorSection.hidden = false;
}

function hideError() { el.errorSection.hidden = true; }

function hideResults() {
  el.resultsPage.hidden = true;
  el.uploadPage.hidden = false;
  el.scoreCard.hidden = true;
  el.tipsCard.hidden = true;
  el.strengthsSection.hidden = true;
  el.keywordSection.hidden = true;
  el.categoryScoresSection.hidden = true;
  el.verdictSection.hidden = true;
  el.missingKeywordsSection.hidden = true;
  hideKofiPopup();
}

let toastTimeout = null;
function showToast(msg) {
  clearTimeout(toastTimeout);
  el.toastMessage.textContent = msg;
  el.toast.hidden = false;
  toastTimeout = setTimeout(() => { el.toast.hidden = true; }, 3000);
}

let kofiPopupTimer = null;
let kofiScrolled = false;
function startKofiPopupTimer() {
  clearTimeout(kofiPopupTimer);
  kofiScrolled = false;
  const isMobile = window.innerWidth < 768;
  const delay = isMobile ? 8000 : 30000;
  kofiPopupTimer = setTimeout(() => {
    if (!el.resultsPage.hidden && (kofiScrolled || !isMobile)) el.kofiPopup.hidden = false;
  }, delay);
  if (isMobile) {
    const onScroll = () => { kofiScrolled = true; window.removeEventListener('scroll', onScroll); };
    window.addEventListener('scroll', onScroll, { once: true });
  }
}
function hideKofiPopup() { clearTimeout(kofiPopupTimer); el.kofiPopup.hidden = true; }
el.kofiPopupClose.addEventListener('click', hideKofiPopup);