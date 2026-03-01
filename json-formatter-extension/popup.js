const inputEl = document.getElementById('jsonInput');
const statusEl = document.getElementById('status');
const formatBtn = document.getElementById('formatBtn');
const minifyBtn = document.getElementById('minifyBtn');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');

const STORAGE_KEY = 'json_formatter_input';
let saveTimer;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function parseJson(text) {
  try {
    return { value: JSON.parse(text), error: null };
  } catch (error) {
    const message = buildReadableError(error, text);
    return { value: null, error: message };
  }
}

function buildReadableError(error, text) {
  const fallback = error?.message || 'Invalid JSON';
  const match = fallback.match(/position\s(\d+)/i);
  if (!match) {
    return fallback;
  }

  const pos = Number(match[1]);
  const before = text.slice(0, pos);
  const line = before.split('\n').length;
  const column = before.length - before.lastIndexOf('\n');

  return `${fallback} (line ${line}, column ${column})`;
}

async function copyToClipboard(text) {
  if (!text) {
    setStatus('Nothing to copy.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    setStatus('Copied to clipboard.');
  } catch {
    inputEl.select();
    document.execCommand('copy');
    setStatus('Copied to clipboard.');
  }
}

function formatJson() {
  const source = inputEl.value.trim();
  if (!source) {
    setStatus('Please paste JSON first.', true);
    return;
  }

  const { value, error } = parseJson(source);
  if (error) {
    setStatus(error, true);
    return;
  }

  inputEl.value = JSON.stringify(value, null, 2);
  setStatus('JSON formatted successfully.');
  saveToStorage();
}

function minifyJson() {
  const source = inputEl.value.trim();
  if (!source) {
    setStatus('Please paste JSON first.', true);
    return;
  }

  const { value, error } = parseJson(source);
  if (error) {
    setStatus(error, true);
    return;
  }

  inputEl.value = JSON.stringify(value);
  setStatus('JSON minified successfully.');
  saveToStorage();
}

function clearJson() {
  inputEl.value = '';
  setStatus('Cleared.');
  chrome.storage.local.remove(STORAGE_KEY);
  inputEl.focus();
}

function saveToStorage() {
  chrome.storage.local.set({ [STORAGE_KEY]: inputEl.value });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToStorage, 200);
}

function restoreFromStorage() {
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    if (typeof result[STORAGE_KEY] === 'string') {
      inputEl.value = result[STORAGE_KEY];
    }
  });
}

formatBtn.addEventListener('click', formatJson);
minifyBtn.addEventListener('click', minifyJson);
copyBtn.addEventListener('click', () => copyToClipboard(inputEl.value));
clearBtn.addEventListener('click', clearJson);
inputEl.addEventListener('input', scheduleSave);

inputEl.addEventListener('keydown', (event) => {
  const isCmdOrCtrl = event.metaKey || event.ctrlKey;
  if (isCmdOrCtrl && event.key === 'Enter') {
    event.preventDefault();
    formatJson();
  }
});

restoreFromStorage();
inputEl.focus();
