let selecting = false;

let toggleButton = document.getElementById('toggle-select');

toggleButton.addEventListener('click', function () {
  selecting = !selecting;
  this.innerText = selecting ? 'Stop Selecting' : 'Start Selecting';
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSelect", selecting: selecting });
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.action === "selectedElement") {
    document.getElementById('selected-path').innerText = request.path;
  } else if(request.action === "toggleSelect") {
    selecting = request.selecting;
    toggleButton.innerText = selecting ? 'Stop Selecting' : 'Start Selecting';
  }
});

// Auto-click the "Start Selecting" button when the popup opens
window.addEventListener('DOMContentLoaded', (event) => {
    toggleButton.click();
});
