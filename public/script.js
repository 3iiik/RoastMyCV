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
  uploadZone: document.getElementById('uploadZone'),
  fileInput: document.getElementById('fileInput'),
  fileInfo: document.getElementById('fileInfo'),
  fileName: document.getElementById('fileName'),
  removeFile: document.getElementById('removeFile'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  btnText: document.querySelector('.btn-text'),
  btnSpinner: document.querySelector('.btn-spinner'),
  uploadSection: document.getElementById('uploadSection'),
  loadingSection: document.getElementById('loadingSection'),
  loadingMessage: document.getElementById('loadingMessage'),
  errorSection: document.getElementById('errorSection'),
  errorText: document.getElementById('errorText'),
  retryBtn: document.getElementById('retryBtn'),
  resultsSection: document.getElementById('resultsSection'),
  roastBody: document.getElementById('roastBody'),
  fixBody: document.getElementById('fixBody'),
  fixCard: document.getElementById('fixCard'),
  fixBtn: document.getElementById('fixBtn'),
  supportSection: document.getElementById('supportSection'),
  shareTwitter: document.getElementById('shareTwitter'),
  shareWhatsapp: document.getElementById('shareWhatsapp'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
};

let currentFile = null;
let currentResumeText = null;
let currentRoast = null;
let currentFix = null;
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

elements.fixBtn.addEventListener('click', fixResume);

elements.retryBtn.addEventListener('click', () => {
  hideError();
  if (currentFile) analyzeResume();
});

document.querySelectorAll('.btn-copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    const text = target === 'roast' ? currentRoast : currentFix;
    if (!text) return;
    copyToClipboard(text, btn);
  });
});

elements.shareTwitter.addEventListener('click', (e) => {
  e.preventDefault();
  const url = SHARE_URL;
  const text = encodeURIComponent(`I just got my resume roasted by AI 😂 Try RoastMyCV for free →`);
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
});

elements.shareWhatsapp.addEventListener('click', (e) => {
  e.preventDefault();
  const url = SHARE_URL;
  const text = encodeURIComponent(`Check this out, it roasts your resume and fixes it for free 🔥`);
  window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(url)}`, '_blank');
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
  elements.fileInput.value = '';
  elements.fileInfo.hidden = true;
  elements.fileName.textContent = '';
  elements.analyzeBtn.disabled = true;
  hideResults();
  hideError();
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

    const response = await fetch('/api/roast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: currentResumeText }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Server error. Please try again.');
    }

    currentRoast = data.text;
    displayRoast(currentRoast);
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
    displayFix(currentFix);
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

function displayRoast(roast) {
  elements.roastBody.innerHTML = renderMarkdown(roast);
  elements.resultsSection.hidden = false;
  elements.fixBtn.hidden = false;
  elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayFix(fix) {
  elements.fixBody.innerHTML = renderMarkdown(fix);
  elements.fixCard.hidden = false;
  elements.fixBtn.hidden = true;
  elements.supportSection.hidden = false;
  elements.fixCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderMarkdown(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      block = block.trim();
      if (!block) return '';

      // Headings
      if (/^### (.+)/.test(block)) {
        return `<h3>${block.replace(/^### /, '')}</h3>`;
      }
      if (/^## (.+)/.test(block)) {
        return `<h2>${block.replace(/^## /, '')}</h2>`;
      }
      if (/^# (.+)/.test(block)) {
        return `<h2>${block.replace(/^# /, '')}</h2>`;
      }

      // Bold headings (e.g. **Overall Impression**)
      if (/^\*\*(.+)\*\*/.test(block)) {
        const match = block.match(/^\*\*(.+)\*\*(.*)/);
        if (match) {
          const rest = renderInline(match[2]);
          return `<h2>${match[1]}</h2>${rest ? `<p>${rest}</p>` : ''}`;
        }
      }

      // Unordered list
      if (/^[-*] /.test(block)) {
        const items = block.split('\n').map((line) => {
          const clean = line.replace(/^[-*] /, '').trim();
          return clean ? `<li>${renderInline(clean)}</li>` : '';
        }).filter(Boolean);
        return `<ul>${items.join('')}</ul>`;
      }

      // Paragraph
      const lines = block.split('\n').filter(Boolean);
      if (lines.length === 1) {
        return `<p>${renderInline(lines[0])}</p>`;
      }
      return lines.map((l) => `<p>${renderInline(l)}</p>`).join('');
    })
    .join('');
}

function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function showLoading(messages) {
  elements.uploadSection.hidden = true;
  elements.loadingSection.hidden = false;
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
  elements.uploadSection.hidden = false;
}

function showError(msg) {
  hideLoading();
  hideResults();
  elements.errorText.textContent = msg;
  elements.errorSection.hidden = false;
}

function hideError() {
  elements.errorSection.hidden = true;
}

function hideResults() {
  elements.resultsSection.hidden = true;
  elements.fixCard.hidden = true;
  elements.fixBtn.hidden = true;
  elements.supportSection.hidden = true;
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = '✅ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
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
