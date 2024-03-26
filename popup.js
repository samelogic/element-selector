let selecting = false;

let toggleButton = document.getElementById("toggle-select");

toggleButton.addEventListener("click", function () {
  selecting = !selecting;
  this.innerText = selecting ? "Stop Selecting" : "Start Selecting";
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "toggleSelect",
      selecting: selecting,
    });
  });
});

chrome.runtime.sendMessage({ cmd: "read_file" }, function (response) {
  let toggleButton = document.getElementById("toggle-select");
  let selecting = false;
  toggleButton.onclick = function () {
    selecting = !selecting;
    toggleButton.innerText = selecting ? "Stop Selecting" : "Start Selecting";

    // change the button color
    if (selecting) {
      toggleButton.style.backgroundColor = "#cd004d";
    } else {
      toggleButton.style.backgroundColor = ""; // Reset to default color
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { cmd: "toggle_select_mode" });
    });
  };
});

// Auto-click the "Start Selecting" button when the popup opens
window.addEventListener("DOMContentLoaded", (event) => {
  toggleButton.click();
});

document.getElementById("advisory").addEventListener("click", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.reload(tabs[0].id);
    window.close();
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "check_extension") {
    sendResponse({ status: "installed" });
  }
});
