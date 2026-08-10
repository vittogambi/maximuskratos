// Injected via page.addInitScript() before any navigation, so the observers
// are attached before the first paint of the page under test.
(() => {
  window.__qa = {
    lcp: null,
    cls: 0,
    clsShifts: [],
    longTasks: [],
    tbtApprox: 0,
    inpProxy: null,
    fcp: null,
  };

  const describeElement = (el) => {
    if (!el) return null;
    const tag = el.tagName ? el.tagName.toLowerCase() : 'unknown';
    const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : '';
    const src = el.currentSrc || el.src || null;
    const bg = !src && window.getComputedStyle ? window.getComputedStyle(el).backgroundImage : null;
    return {
      tag,
      selector: `${tag}${cls}`,
      src: src || (bg && bg !== 'none' ? bg : null),
      id: el.id || null,
    };
  };

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (!last) return;
      window.__qa.lcp = {
        renderTime: last.renderTime || last.loadTime || 0,
        size: last.size || 0,
        url: last.url || null,
        element: describeElement(last.element),
      };
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    window.__qa.lcpError = String(e);
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          window.__qa.cls += entry.value;
          window.__qa.clsShifts.push({
            value: entry.value,
            time: entry.startTime,
            sources: (entry.sources || []).slice(0, 3).map((s) => describeElement(s.node)),
          });
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    window.__qa.clsError = String(e);
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__qa.longTasks.push({ start: entry.startTime, duration: entry.duration });
        window.__qa.tbtApprox += Math.max(0, entry.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch (e) {
    window.__qa.longTaskError = String(e);
  }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          window.__qa.fcp = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });
  } catch (e) {
    window.__qa.fcpError = String(e);
  }

  // INP proxy: durationThreshold 40ms is the lowest PerformanceObserver allows.
  // This captures ONE scripted interaction per run (see measure.mjs), not a
  // real p98 INP over a session. Labeled clearly downstream.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (window.__qa.inpProxy === null || entry.duration > window.__qa.inpProxy) {
          window.__qa.inpProxy = entry.duration;
        }
      }
    }).observe({ type: 'event', durationThreshold: 40, buffered: true });
  } catch (e) {
    window.__qa.inpError = String(e);
  }
})();
