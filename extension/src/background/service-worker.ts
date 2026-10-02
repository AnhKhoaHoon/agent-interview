void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

function notifyCaptureInterruption(type: 'tab-capture-tab-closed' | 'tab-capture-tab-navigated', tabId: number): void {
  void chrome.runtime.sendMessage({ type, tabId }).catch(() => undefined);
}

chrome.tabs.onRemoved.addListener((tabId) => notifyCaptureInterruption('tab-capture-tab-closed', tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') notifyCaptureInterruption('tab-capture-tab-navigated', tabId);
});
