chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "https://samelogic.com/csspathselector/install",
    });
  }

  chrome.runtime.setUninstallURL(
    "https://samelogic.com/csspathselector/uninstall"
  );
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "createTab") {
    chrome.tabs.create({
      url: message.url,
      active: true,
    });
  }
});
