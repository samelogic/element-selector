chrome.runtime.onInstalled.addListener(function () {
  chrome.runtime.setUninstallURL(
    "https://samelogic.com/csspathselector/uninstall"
  );
});
