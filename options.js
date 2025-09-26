
(() => {
  const DEFAULTS = {
    labels: ['メールを今すぐ確認する', 'Check mail now'],
    targetEmails: [],
    clickDelayMs: 1700,
    scanRetryMax: 14,
    scrollStepPx: 700
  };

  const emailsEl = document.getElementById('emails');
  const delayEl = document.getElementById('delay');
  const labelsEl = document.getElementById('labels');
  const statusEl = document.getElementById('status');
  const chipsEl = document.getElementById('emailChips');

  function renderChips(list) {
    chipsEl.innerHTML = '';
    list.forEach(s => {
      const span = document.createElement('span');
      span.className = 'chip';
      span.textContent = s;
      chipsEl.appendChild(span);
    });
  }

  function parseList(text) {
    return text.split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  chrome.storage.sync.get(DEFAULTS, (cfg) => {
    emailsEl.value = (cfg.targetEmails || []).join(', ');
    delayEl.value = Number(cfg.clickDelayMs || DEFAULTS.clickDelayMs);
    labelsEl.value = (cfg.labels || DEFAULTS.labels).join(', ');
    renderChips(parseList(emailsEl.value));
  });

  emailsEl.addEventListener('input', () => renderChips(parseList(emailsEl.value)));

  document.getElementById('save').addEventListener('click', () => {
    const data = {
      targetEmails: parseList(emailsEl.value),
      clickDelayMs: Math.max(500, Number(delayEl.value) || 1700),
      labels: parseList(labelsEl.value)
    };
    chrome.storage.sync.set(data, () => {
      statusEl.textContent = '保存しました。Gmailタブで反映されます。';
      setTimeout(() => statusEl.textContent = '', 2000);
    });
  });
})();
