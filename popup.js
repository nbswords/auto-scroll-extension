const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const distanceSlider = document.getElementById('distance');
const distanceValue = document.getElementById('distanceValue');
const pauseSlider = document.getElementById('pause');
const pauseValue = document.getElementById('pauseValue');
const toggleBtn = document.getElementById('toggleBtn');
const statusEl = document.getElementById('status');
const statusBar = document.getElementById('statusBar');
const directionBtns = document.querySelectorAll('.direction-btn');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

let isScrolling = false;
let direction = 'down';

// --- Theme ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '\u263E' : '\u2600';
  localStorage.setItem('auto-scroll-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// Load saved theme
const savedTheme = localStorage.getItem('auto-scroll-theme') || 'dark';
applyTheme(savedTheme);

// --- Messaging ---
function getActiveTab() {
  return chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => tabs[0]);
}

async function sendMsg(msg) {
  const tab = await getActiveTab();
  if (!tab) return;
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    return await chrome.tabs.sendMessage(tab.id, msg);
  }
}

function getParams() {
  return {
    speed: parseInt(speedSlider.value),
    distance: parseInt(distanceSlider.value),
    pauseSec: parseFloat(pauseSlider.value),
    direction
  };
}

function sendStart() {
  sendMsg({ action: 'start', ...getParams() });
}

function setRunningUI() {
  toggleBtn.textContent = '\u23F9 Stop Scrolling';
  toggleBtn.classList.add('running');
  statusEl.textContent = 'Scrolling...';
  statusBar.classList.add('active');
}

function setStoppedUI() {
  toggleBtn.textContent = '\u25B6 Start Scrolling';
  toggleBtn.classList.remove('running');
  statusEl.textContent = 'Stopped';
  statusBar.classList.remove('active');
}

// On popup open, check if already scrolling
(async () => {
  try {
    const res = await sendMsg({ action: 'status' });
    if (res && res.scrolling) {
      isScrolling = true;
      setRunningUI();
    }
  } catch {}
})();

// Live update sliders
speedSlider.addEventListener('input', () => {
  speedValue.textContent = speedSlider.value;
  if (isScrolling) sendStart();
});

distanceSlider.addEventListener('input', () => {
  distanceValue.textContent = distanceSlider.value;
  if (isScrolling) sendStart();
});

pauseSlider.addEventListener('input', () => {
  pauseValue.textContent = parseFloat(pauseSlider.value).toFixed(1);
  if (isScrolling) sendStart();
});

// Direction buttons
directionBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    directionBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    direction = btn.dataset.dir;
    if (isScrolling) sendStart();
  });
});

// Toggle
toggleBtn.addEventListener('click', async () => {
  isScrolling = !isScrolling;
  if (isScrolling) {
    sendStart();
    setRunningUI();
  } else {
    await sendMsg({ action: 'stop' });
    setStoppedUI();
  }
});
