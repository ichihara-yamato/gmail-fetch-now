
// Open/focus Gmail and navigate to Accounts & Import, reusing an existing tab if any.
async function openGmailSettings() {
  try {
    const tabs = await chrome.tabs.query({ url: "https://mail.google.com/*" });
    let target = null;
    if (tabs.length) {
      // Prefer the active tab in the focused window; otherwise pick most recently accessed
      const [currentWindow] = await chrome.windows.getAll({ populate: false, windowTypes: ["normal"] }).then(ws => ws.filter(w => w.focused));
      const activeInFocused = tabs.find(t => t.active && (!currentWindow || t.windowId === currentWindow.id));
      target = activeInFocused || tabs.sort((a, b) => (b.lastAccessed||0) - (a.lastAccessed||0))[0];
    }
    const buildUrl = (baseUrl) => {
      const m = (baseUrl || "").match(/\/u\/(\d+)\//);
      const idx = m ? m[1] : "0";
      return `https://mail.google.com/mail/u/${idx}/#settings/accounts`;
    };
    if (target) {
      await chrome.tabs.update(target.id, { url: buildUrl(target.url || ""), active: true });
      await chrome.windows.update(target.windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url: buildUrl("") });
    }
  } catch (e) {
    console.error("gmail-fetch-now: open error", e);
  }
}

chrome.action.onClicked.addListener(() => openGmailSettings());
