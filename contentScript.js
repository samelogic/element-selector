let selecting = false;
let currentElement = null;

let style = document.createElement('style');
style.innerText = `
  #element-selector-window * {
    all: initial;
  }
  #element-selector-window {
    all: initial;
    display: none;
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 10px;
    background-color: white;
    border: 1px solid black;
    z-index: 999999999;
  }
`;
document.head.appendChild(style);

// create a new div for our "window"
let elementSelectorWindow = document.createElement('div');
elementSelectorWindow.id = 'element-selector-window';
elementSelectorWindow.style.display = 'none';  // start hidden
elementSelectorWindow.style.position = 'fixed';
elementSelectorWindow.style.top = '20px';
elementSelectorWindow.style.right = '20px';
elementSelectorWindow.style.padding = '15px';
elementSelectorWindow.style.backgroundColor = 'white';
elementSelectorWindow.style.border = '1px solid black';
elementSelectorWindow.style.borderRadius = '6px';
elementSelectorWindow.style.color = '#000000';
elementSelectorWindow.style.zIndex = 999999999;  // ensure it's on top
document.body.appendChild(elementSelectorWindow);

// create a close button for our "window"
let closeButton = document.createElement('button');
closeButton.innerText = 'x';
closeButton.style.backgroundColor = '#f44336'; // Red
closeButton.style.color = 'white'; // White text
closeButton.style.border = 'none'; // No border
closeButton.style.padding = '15px 15px'; // Y-padding of 15px, X-padding of 32px
closeButton.style.textAlign = 'center'; // Centered text
closeButton.style.textDecoration = 'none'; // No underline
closeButton.style.display = 'inline-block';
closeButton.style.fontSize = '16px';
closeButton.style.margin = '4px 4px';
closeButton.style.cursor = 'pointer'; // Mouse cursor changes when hovering
closeButton.style.borderRadius = '80px'; // Rounded corners
closeButton.style.width = '10px';

// Change color on hover
closeButton.onmouseover = function() {
  closeButton.style.backgroundColor = '#da190b';
}

// Reset color when not hovering
closeButton.onmouseout = function() {
  closeButton.style.backgroundColor = '#f44336';
}

closeButton.addEventListener('click', function() {
  // stop selecting and hide the "window"
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = '';
    currentElement = null;
  }
  elementSelectorWindow.style.display = 'none';
});
elementSelectorWindow.appendChild(closeButton);

// create a p element for displaying the CSS path
let pathDisplay = document.createElement('p');
elementSelectorWindow.appendChild(pathDisplay);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if(request.action === "toggleSelect") {
    selecting = request.selecting;
    if (!selecting && currentElement) {
      currentElement.style.outline = '';
      currentElement = null;
    }
  }
});

// copy css path
let copyButton = document.createElement('button');
copyButton.innerText = 'Copy to Clipboard';

copyButton.style.backgroundColor = '#4CAF50'; // Green
copyButton.style.color = 'white'; // White text
copyButton.style.border = 'none'; // No border
copyButton.style.padding = '15px 32px'; // Y-padding of 15px, X-padding of 32px
copyButton.style.textAlign = 'center'; // Centered text
copyButton.style.textDecoration = 'none'; // No underline
copyButton.style.display = 'inline-block';
copyButton.style.fontSize = '16px';
copyButton.style.margin = '4px 2px';
copyButton.style.cursor = 'pointer'; // Mouse cursor changes when hovering
copyButton.style.borderRadius = '4px'; // Rounded corners
copyButton.style.width = '50%';

// Change color on hover
copyButton.onmouseover = function() {
  copyButton.style.backgroundColor = '#45a049';
}

// Reset color when not hovering
copyButton.onmouseout = function() {
  copyButton.style.backgroundColor = '#4CAF50';
}

copyButton.addEventListener('click', async function() {
    try {
        await navigator.clipboard.writeText(pathDisplay.innerText);
        alert('CSS Path copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy text: ', err);
    }
});

elementSelectorWindow.appendChild(copyButton);




document.addEventListener('click', function (event) {
  if(!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  pathDisplay.innerText = path;  // display the CSS path in our "window"

  // stop the selection process
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = '';
    currentElement = null;
  }

  // show our "window"
  elementSelectorWindow.style.display = 'block';

  return false;
});

document.addEventListener('mouseover', function (event) {
  if(!selecting) return;

  // highlight the element
  if (currentElement) {
    currentElement.style.outline = '';
  }
  currentElement = event.target;
  currentElement.style.outline = '3px solid red';
});

document.addEventListener('mouseout', function (event) {
  if(!selecting || !currentElement) return;

  // remove highlight
  currentElement.style.outline = '';
  currentElement = null;
});

document.addEventListener('click', function (event) {
  if(!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  chrome.runtime.sendMessage({action: "selectedElement", path: path});

  return false;
});

// calculate CSS path function
function getPathTo(element) {
    if (element.id!=='')
        return 'id("'+element.id+'")';
    if (element===document.body)
        return element.tagName.toLowerCase();

    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling===element)
            return getPathTo(element.parentNode)+'/'+element.tagName.toLowerCase()+'['+(ix+1)+']';
        if (sibling.nodeType===1 && sibling.tagName===element.tagName)
            ix++;
    }
}

document.addEventListener('click', function (event) {
  if(!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  chrome.runtime.sendMessage({action: "selectedElement", path: path});

  // stop the selection process
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = '';
    currentElement = null;
  }
  
  // Send a message back to popup.js to update the button status
  chrome.runtime.sendMessage({action: "toggleSelect", selecting: selecting});

  return false;
});