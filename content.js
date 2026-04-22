let scrollTimer = null;
let animFrame = null;
let isRunning = false;

function stopScroll() {
  isRunning = false;
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  if (animFrame !== null) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
}

function startScroll(speed, distance, pauseSec, direction) {
  stopScroll();
  isRunning = true;

  const dir = direction === 'down' ? 1 : -1;
  const totalDistance = distance * dir;
  const scrollDuration = Math.max(100, 700 - speed * 60);
  const pauseMs = pauseSec * 1000;

  function cycle() {
    if (!isRunning) return;
    smoothScroll(totalDistance, scrollDuration, () => {
      if (!isRunning) return;
      scrollTimer = setTimeout(cycle, pauseMs);
    });
  }

  cycle();
}

function smoothScroll(totalDelta, duration, callback) {
  const scrollable = findScrollable();
  const startTime = performance.now();
  let prevEase = 0;

  function step(now) {
    if (!isRunning) return;

    const progress = Math.min((now - startTime) / duration, 1);
    const ease = easeInOutCubic(progress);
    const frameDelta = totalDelta * (ease - prevEase);
    prevEase = ease;

    if (scrollable === document.documentElement || scrollable === document.body) {
      window.scrollBy(0, frameDelta);
    } else {
      scrollable.scrollTop += frameDelta;
    }

    if (progress < 1) {
      animFrame = requestAnimationFrame(step);
    } else {
      animFrame = null;
      callback();
    }
  }

  animFrame = requestAnimationFrame(step);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function findScrollable() {
  const doc = document.documentElement;
  const body = document.body;

  if (doc.scrollHeight > doc.clientHeight) return doc;
  if (body && body.scrollHeight > body.clientHeight) return body;

  const candidates = document.querySelectorAll('main, [role="main"], #content, .content, #app, .app');
  for (const el of candidates) {
    if (el.scrollHeight > el.clientHeight) {
      const style = getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') return el;
    }
  }

  const centerEl = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
  if (centerEl) {
    let el = centerEl;
    while (el && el !== doc) {
      if (el.scrollHeight > el.clientHeight + 1) {
        const style = getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') return el;
      }
      el = el.parentElement;
    }
  }

  return doc;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'start') {
    startScroll(msg.speed, msg.distance, msg.pauseSec, msg.direction);
    sendResponse({ ok: true });
  } else if (msg.action === 'stop') {
    stopScroll();
    sendResponse({ ok: true });
  } else if (msg.action === 'status') {
    sendResponse({ scrolling: isRunning });
  }
});
