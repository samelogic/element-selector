chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: "https://samelogic.com/csspathselector/onboarding",
    });
  }

  chrome.runtime.setUninstallURL(
    "https://samelogic.com/csspathselector/uninstall"
  );
});
