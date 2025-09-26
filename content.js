
(() => {
  const DEFAULTS = {
    labels: ['メールを今すぐ確認する', 'Check mail now'],
    targetEmails: [],
    clickDelayMs: 1700,
    scanRetryMax: 14,
    scrollStepPx: 700,
    maxRunMs: 30000  // failsafe: hide overlay after 30s
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function ensureOverlay() {
    let o = document.getElementById('__fetchnow_overlay__');
    if (o) return o;
    o = document.createElement('div');
    o.id = '__fetchnow_overlay__';
    Object.assign(o.style, {
      position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.35)',
      display: 'none', zIndex: 2147483647, alignItems: 'center', justifyContent: 'center'
    });
    const card = document.createElement('div');
    Object.assign(card.style, {
      minWidth: '320px', maxWidth: '80vw', background: '#fff', borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.3)', padding: '18px 22px', textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
    });
    const sp = document.createElement('div');
    Object.assign(sp.style, {
      width: '28px', height: '28px', margin: '0 auto 12px', borderRadius: '50%',
      border: '3px solid #e0e0e0', borderTopColor: '#1a73e8', animation: 'fetchnow_spin 1s linear infinite'
    });
    const title = document.createElement('div');
    title.id = '__fetchnow_title__';
    title.textContent = 'Fetching mail...';
    Object.assign(title.style, { fontSize: '14px', color: '#111', fontWeight: 600, marginBottom: '6px' });
    const sub = document.createElement('div');
    sub.id = '__fetchnow_sub__';
    sub.textContent = 'Working through linked accounts';
    Object.assign(sub.style, { fontSize: '12px', color: '#555' });
    card.appendChild(sp); card.appendChild(title); card.appendChild(sub); o.appendChild(card);
    const style = document.createElement('style');
    style.textContent = '@keyframes fetchnow_spin{to{transform:rotate(360deg)}}';
    document.documentElement.appendChild(style);
    document.body.appendChild(o);
    return o;
  }
  function showOverlay(progressText) {
    const o = ensureOverlay();
    o.style.display = 'flex';
    const sub = document.getElementById('__fetchnow_sub__');
    if (progressText) sub.textContent = progressText;
  }
  function updateOverlayProgress(done, total) {
    const sub = document.getElementById('__fetchnow_sub__');
    if (sub) sub.textContent = `Processing ${Math.min(done,total)}/${total} account(s)...`;
  }
  function hideOverlay() {
    const o = document.getElementById('__fetchnow_overlay__');
    if (o) o.style.display = 'none';
  }

  function inSettingsAccounts() {
    return location.hash.includes('#settings/accounts');
  }
  function getSectionScope() {
    const header = Array.from(document.querySelectorAll('td.r8 .rc'))
      .find(el => /他のアカウントのメールを確認/.test(el.textContent || ''));
    return header ? header.closest('tr')?.querySelector('td.r9') : null;
  }
  function rowMatches(rowText, targetEmails) {
    if (!targetEmails || !targetEmails.length) return true;
    return targetEmails.some(addr => rowText.includes(addr));
  }
  function enumerateButtons(labels, targetEmails) {
    const scope = getSectionScope() || document.body;
    const rows = Array.from(scope.querySelectorAll('table.cf.qv tbody tr, div#\\:34 table.cf.qv tbody tr'));
    const list = [];
    for (const tr of rows) {
      const txt = (tr.innerText || '').trim();
      if (!rowMatches(txt, targetEmails)) continue;
      const cand = tr.querySelectorAll('span.sA[role="link"], a, button, span[role="button"], div[role="button"]');
      for (const el of cand) {
        const t = (el.textContent || '').trim();
        if (labels.some(label => new RegExp(label, 'i').test(t))) list.push(el);
      }
    }
    return list;
  }
  function findOneButton(labels, targetEmails) {
    const scope = getSectionScope() || document.body;
    const rows = Array.from(scope.querySelectorAll('table.cf.qv tbody tr, div#\\:34 table.cf.qv tbody tr'));
    for (const tr of rows) {
      const txt = (tr.innerText || '').trim();
      if (!rowMatches(txt, targetEmails)) continue;
      const cand = tr.querySelectorAll('span.sA[role="link"], a, button, span[role="button"], div[role="button"]');
      for (const el of cand) {
        const t = (el.textContent || '').trim();
        if (labels.some(label => new RegExp(label, 'i').test(t))) return el;
      }
    }
    const cand2 = scope.querySelectorAll('span.sA[role="link"], a, button, span[role="button"], div[role="button"]');
    for (const el of cand2) {
      const t = (el.textContent || '').trim();
      if (labels.some(label => new RegExp(label, 'i').test(t))) return el;
    }
    return null;
  }

  async function clickAllSequential(cfg) {
    showOverlay('Preparing...');

    for (let i = 0; i < 3; i++) { window.scrollBy(0, cfg.scrollStepPx); await sleep(250); }

    // Fix total at start (best-effort). If zero, treat as 1 to avoid division by zero.
    let total = enumerateButtons(cfg.labels, cfg.targetEmails).length;
    if (total <= 0) total = 1;
    let clicked = 0;
    let retries = 0;
    const startedAt = Date.now();

    updateOverlayProgress(clicked, total);

    while (retries < cfg.scanRetryMax) {
      // Failsafe timeout
      if (Date.now() - startedAt > (cfg.maxRunMs || 30000)) {
        hideOverlay();
        return;
      }
      // If we reached the initially-determined total, hide overlay and stop,
      // even if Gmail is still "receiving" in the background.
      if (clicked >= total) {
        hideOverlay();
        return;
      }

      const btn = findOneButton(cfg.labels, cfg.targetEmails);
      if (btn) {
        try {
          btn.scrollIntoView({ block: 'center' });
          btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          btn.click();
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
          clicked++;
          updateOverlayProgress(clicked, total);
          await sleep(cfg.clickDelayMs);
          retries = 0;
          continue;
        } catch (e) {
          await sleep(500);
        }
      }
      window.scrollBy(0, cfg.scrollStepPx);
      await sleep(400);
      retries++;
    }
    hideOverlay(); // On retries exhausted, hide overlay anyway
  }

  let armed = false;
  function maybeArm(cfg) {
    if (!inSettingsAccounts()) { armed = false; return; }
    if (armed) return;
    armed = true;
    const obs = new MutationObserver(() => {});
    obs.observe(document.body, { childList: true, subtree: true });
    clickAllSequential(cfg).finally(() => obs.disconnect());
  }

  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    window.addEventListener('hashchange', () => maybeArm(cfg));
    const t = setInterval(() => {
      if (document.readyState === 'complete') maybeArm(cfg);
    }, 800);
  });
})();
