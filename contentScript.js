let selecting = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.action === "toggleSelect") {
    selecting = request.selecting;
  }
});

document.addEventListener('mouseover', function (event) {
  if(!selecting) return;
  
  // highlight the element
  event.target.style.outline = '3px solid red';
});

document.addEventListener('click', function (event) {
  if(!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  chrome.runtime.sendMessage({action: "selectedElement", path: path});

  return false;
});

// calculate css path function goes here
