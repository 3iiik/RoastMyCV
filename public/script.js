pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const LOADING_MESSAGES = [
  'Judging your life choices... 👀',
  'Finding all your mistakes... 🔍',
  'Preparing the roast... 🔥',
  'Rewriting your career... ✨',
  'Almost done... please don\'t cry 😂',
];

const FIX_LOADING_MESSAGES = [
  'Rewriting your career... ✨',
  'Polishing bullet points... 💎',
  'Making you sound impressive... 🚀',
  'Applying STAR method... ⭐',
  'Almost done... your new resume awaits 😎',
];

const SHARE_URL = window.location.origin;

const elements = {
  uploadPage: document.getElementById('uploadPage'),
  resultsPage: document.getElementById('results'),
  uploadZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-upload'),
  fileInfo: document.getElementById('fileInfo'),
  fileName: document.getElementById('fileName'),
  removeFile: document.getElementById('removeFile'),
  analyzeBtn: document.getElementById('roast-btn'),
  uploadSection: document.getElementById('uploadSection'),
  loadingSection: document.getElementById('loadingSection'),
  loadingMessage: document.getElementById('loadingMessage'),
  errorSection: document.getElementById('errorSection'),
  errorText: document.getElementById('errorText'),
  retryBtn: document.getElementById('retryBtn'),
  resultsBody: document.getElementById('resultsBody'),
  resultsScroll: document.getElementById('resultsScroll'),
  resultsLogo: document.getElementById('resultsLogo'),
  toggleBtn: document.getElementById('fixBtn'),
  copyResultBtn: document.getElementById('copyResultBtn'),
  scoreCard: document.getElementById('scoreCard'),
  scoreRingFill: document.getElementById('scoreRingFill'),
  scoreValue: document.getElementById('scoreValue'),
  tipsCard: document.getElementById('tipsCard'),
  tipsList: document.getElementById('tipsList'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  progressBar: document.getElementById('progressBar'),
  contentTitle: document.getElementById('contentTitle'),
  contentSubtitle: document.getElementById('contentSubtitle'),
  roastFeedback: document.getElementById('roastFeedback'),
};

let currentFile = null;
let currentResumeText = null;
let currentRoast = null;
let currentFix = null;
let currentScore = null;
let currentTips = null;
let isShowingFix = false;
let loadingInterval = null;

elements.uploadZone.addEventListener('click', () => elements.fileInput.click());

elements.uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  elements.uploadZone.classList.add('dragover');
});

elements.uploadZone.addEventListener('dragleave', () => {
  elements.uploadZone.classList.remove('dragover');
});

elements.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  elements.uploadZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  if (files.length > 0) handleFile(files[0]);
});

elements.fileInput.addEventListener('change', () => {
  if (elements.fileInput.files.length > 0) {
    handleFile(elements.fileInput.files[0]);
  }
});

elements.removeFile.addEventListener('click', resetUpload);

elements.analyzeBtn.addEventListener('click', analyzeResume);

elements.toggleBtn.addEventListener('click', toggleView);

elements.resultsLogo.addEventListener('click', resetUpload);

elements.copyResultBtn.addEventListener('click', () => {
  const text = isShowingFix ? currentFix : currentRoast;
  if (!text) return;
  copyToClipboard(text);
});

elements.retryBtn.addEventListener('click', () => {
  hideError();
  if (currentFile) analyzeResume();
});

function handleFile(file) {
  if (file.type !== 'application/pdf') {
    showError('Please upload a valid PDF file.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showError('File is too large. Maximum size is 10MB.');
    return;
  }
  currentFile = file;
  elements.fileName.textContent = file.name;
  elements.fileInfo.hidden = false;
  elements.analyzeBtn.disabled = false;
}

function resetUpload() {
  currentFile = null;
  currentResumeText = null;
  currentRoast = null;
  currentFix = null;
  currentScore = null;
  currentTips = null;
  isShowingFix = false;
  elements.fileInput.value = '';
  elements.fileInfo.hidden = true;
  elements.fileName.textContent = '';
  elements.analyzeBtn.disabled = true;
  hideResults();
  hideError();
  elements.uploadPage.hidden = false;
  elements.resultsPage.hidden = true;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function analyzeResume() {
  if (!currentFile) return;

  showLoading(LOADING_MESSAGES);
  hideError();
  hideResults();

  try {
    currentResumeText = await extractTextFromPDF(currentFile);

    if (!currentResumeText || currentResumeText.trim().length < 20) {
      showError('Could not extract enough text from this PDF. Make sure it\'s a text-based PDF (not a scanned image).');
      hideLoading();
      return;
    }

    const [roastRes, scoreRes] = await Promise.all([
      fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: currentResumeText }),
      }),
      fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: currentResumeText }),
      }),
    ]);

    const roastData = await roastRes.json();

    if (!roastRes.ok) {
      throw new Error(roastData.error || 'Server error. Please try again.');
    }

    currentRoast = roastData.text;

    const scoreData = await scoreRes.json();
    currentScore = scoreData.score;
    currentTips = scoreData.tips;

    displayRoast();
  } catch (err) {
    showError(err.message || 'Something went wrong. Please check your connection and try again.');
  } finally {
    hideLoading();
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
      body: JSON.stringify({ resumeText: currentResumeText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error. Please try again.');
    }

    currentFix = data.text;
    displayFix();
  } catch (err) {
    showError(err.message || 'Something went wrong. Please check your connection and try again.');
  } finally {
    hideLoading();
  }
}

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ');
    fullText += text + '\n';
  }

  return fullText.trim();
}

function displayRoast() {
  isShowingFix = false;
  elements.resultsBody.innerHTML = renderMarkdown(currentRoast);
  elements.contentTitle.textContent = '🔥 The Roast';
  elements.contentSubtitle.textContent = 'The brutal truth about your resume.';
  elements.roastFeedback.innerHTML = renderRoastCards(currentRoast);
  elements.uploadPage.hidden = true;
  elements.resultsPage.hidden = false;
  elements.toggleBtn.hidden = false;
  elements.toggleBtn.textContent = '✨ Fix My Resume';

  if (currentScore !== null) {
    elements.scoreCard.hidden = false;
    updateScoreRing(currentScore);
  }
  if (currentTips !== null && currentTips.length > 0) {
    elements.tipsCard.hidden = false;
    elements.tipsList.innerHTML = currentTips.map(t => `<li>${t}</li>`).join('');
  }

  elements.resultsScroll.scrollTop = 0;
}

function updateScoreRing(score) {
  const r = 68;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);
  elements.scoreRingFill.style.strokeDasharray = `${circumference}`;
  elements.scoreRingFill.style.strokeDashoffset = offset;
  elements.scoreValue.textContent = score;
  const color = score < 50 ? '#ff4500' : score < 75 ? '#ff8c00' : '#00c853';
  elements.scoreRingFill.style.stroke = color;
}

function renderRoastCards(text) {
  const sections = text.split(/\n(?=#)/).filter(Boolean);
  return sections.map(section => {
    const lines = section.trim().split('\n').filter(Boolean);
    const heading = lines[0].replace(/^#+ /, '');
    const body = lines.slice(1).join(' ').slice(0, 120);
    return `<div class="bg-error-container border-l-4 border-error p-4 rounded-r-lg brutalist-border">
      <p class="text-sm font-bold mb-1 italic text-white">${heading}</p>
      <p class="text-xs text-on-surface-variant">${renderInline(body)}${body.length >= 120 ? '...' : ''}</p>
    </div>`;
  }).join('');
}

function displayFix() {
  isShowingFix = true;
  elements.resultsBody.innerHTML = renderMarkdown(currentFix);
  elements.contentTitle.textContent = '✨ The Fix';
  elements.contentSubtitle.textContent = 'Your polished and improved resume.';
  elements.toggleBtn.textContent = '🔥 See Roast Again';
  elements.resultsScroll.scrollTop = 0;
}

function toggleView() {
  if (isShowingFix) {
    isShowingFix = false;
    elements.resultsBody.innerHTML = renderMarkdown(currentRoast);
    elements.toggleBtn.textContent = '✨ Fix My Resume';
  } else {
    if (currentFix) {
      isShowingFix = true;
      elements.resultsBody.innerHTML = renderMarkdown(currentFix);
      elements.toggleBtn.textContent = '🔥 See Roast Again';
    } else {
      fixResume();
    }
  }
  elements.resultsScroll.scrollTop = 0;
}

function renderMarkdown(text) {
  return `<div class="rmd">${
    text
      .split(/\n{2,}/)
      .map((block) => {
        block = block.trim();
        if (!block) return '';

        if (/^### (.+)/.test(block)) {
          return `<h3>${block.replace(/^### /, '')}</h3>`;
        }
        if (/^## (.+)/.test(block)) {
          return `<h2>${block.replace(/^## /, '')}</h2>`;
        }
        if (/^# (.+)/.test(block)) {
          return `<h2>${block.replace(/^# /, '')}</h2>`;
        }

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
        if (lines.length === 1) {
          return `<p>${renderInline(lines[0])}</p>`;
        }
        return lines.map((l) => `<p>${renderInline(l)}</p>`).join('');
      })
      .join('')
  }</div>`;
}

function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function showLoading(messages) {
  elements.loadingSection.hidden = false;
  elements.progressBar.hidden = false;
  let idx = 0;
  elements.loadingMessage.textContent = messages[0];
  loadingInterval = setInterval(() => {
    idx = (idx + 1) % messages.length;
    elements.loadingMessage.textContent = messages[idx];
  }, 1800);
}

function hideLoading() {
  clearInterval(loadingInterval);
  loadingInterval = null;
  elements.loadingSection.hidden = true;
  elements.progressBar.hidden = true;
}

function showError(msg) {
  hideLoading();
  if (!elements.resultsPage.hidden) {
    showToast(msg);
    return;
  }
  hideResults();
  elements.errorText.textContent = msg;
  elements.errorSection.hidden = false;
}

function hideError() {
  elements.errorSection.hidden = true;
}

function hideResults() {
  elements.resultsPage.hidden = true;
  elements.uploadPage.hidden = false;
  elements.toggleBtn.hidden = true;
  elements.scoreCard.hidden = true;
  elements.tipsCard.hidden = true;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const original = elements.copyResultBtn.textContent;
    elements.copyResultBtn.textContent = '✅ Copied!';
    setTimeout(() => {
      elements.copyResultBtn.textContent = original;
    }, 2000);
  }).catch(() => {
    showToast('Failed to copy. Try selecting the text manually.');
  });
}

let toastTimeout = null;

function showToast(msg) {
  clearTimeout(toastTimeout);
  elements.toastMessage.textContent = msg;
  elements.toast.hidden = false;
  toastTimeout = setTimeout(() => {
    elements.toast.hidden = true;
  }, 3000);
}
