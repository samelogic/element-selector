let selecting = false;

document.getElementById('toggle-select').addEventListener('click', function () {
  selecting = !selecting;
  this.innerText = selecting ? 'Stop Selecting' : 'Start Selecting';
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSelect", selecting: selecting });
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.action === "selectedElement") {
    document.getElementById('selected-path').innerText = request.path;
  }
});
