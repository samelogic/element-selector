let selecting = false;
let currentElement = null;

let style = document.createElement("style");
style.innerHTML = `
  #element-selector-window * {
    all: initial;
  }
  #element-selector-window {
     width: 300px;
    all: initial;
    display: none;
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 10px;
    background-color: #f4f4f4;
    // border: 2px solid #8545CF;
    z-index: 999999999;
    position: relative;
    border-radius: 8px;  // adjust to your preference
    overflow: hidden;  // clip the border gradient to match border radius
    box-shadow: 0px 2px 15px 11px rgba(0,0,0,0.3);
   
  }

#pathDisplay {
 font-family: monospace;
    padding: 10px;
    background-color: #cecece;
    float: left;
    border-radius: 5px;
    margin-bottom: 4px;
    border: 3px solid #dfdfdf;
    width: 420px;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: 14px;
    color: #393939;
}
}

#copyButton {
    font-family: Arial, sans-serif;
    float: left;
    font-weight: bold;
}

#closeButton {
    font-family: Arial, sans-serif;
    font-weight: bold;
    color: #ffffff;
    float: left;
    width: 74px;
    padding: 15px 0px;
    text-align: center;
    
}

`;
document.head.appendChild(style);

// toast notification
function createToast(message) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "25px";
  toast.style.right = "25px";
  toast.style.backgroundColor = "#8545CF";
  toast.style.color = "white";
  toast.style.padding = "10px";
  toast.style.borderRadius = "5px";
  toast.style.marginTop = "10px";
  toast.style.zIndex = "9999999999";
  toast.style.fontFamily = "Arial, sans-serif";
  toast.style.fontSize = "14px";
  toast.style.opacity = "0"; // make the toast invisible initially
  toast.style.transition = "opacity 1s ease-in-out"; // add the transition
  toast.innerText = message;
  document.body.appendChild(toast);

  // make the toast visible after adding it to the body
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 0);

  // start the fade out process after 2 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);

  // remove the toast after 3 seconds (allowing 1 second for the fade out)
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// create a new div for our "window"
let elementSelectorWindow = document.createElement("div");
elementSelectorWindow.id = "element-selector-window";
elementSelectorWindow.style.display = "none"; // start hidden
elementSelectorWindow.style.position = "fixed";
elementSelectorWindow.style.top = "20px";
elementSelectorWindow.style.right = "20px";
elementSelectorWindow.style.padding = "15px";
elementSelectorWindow.style.zIndex = 999999999; // ensure it's on top
elementSelectorWindow.style.width = "450px";
document.body.appendChild(elementSelectorWindow);

// create a h3 title for our "window"
let title = document.createElement("h3");
title.innerText = "Path Selected!";
title.style.color = "rgb(107 87 153)";
title.style.width = "100%";
title.style.float = "left";
title.style.fontFamily = "Arial, sans-serif";
title.style.fontWeight = "bold";
title.style.fontSize = "17px";

elementSelectorWindow.appendChild(title);

// create a p subtitle for our "window"
let subtitle = document.createElement("p");
subtitle.innerText = "Please copy the path below.";
subtitle.style.color = "rgb(135 135 135)";
subtitle.style.width = "100%";
subtitle.style.float = "left";
subtitle.style.fontFamily = "Arial, sans-serif";
subtitle.style.fontSize = "14px";
subtitle.style.marginBottom = "15px";
elementSelectorWindow.appendChild(subtitle);

// create a p element for displaying the CSS path
let pathDisplay = document.createElement("p");
elementSelectorWindow.appendChild(pathDisplay);
pathDisplay.id = "pathDisplay";
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleSelect") {
    selecting = request.selecting;
    if (!selecting && currentElement) {
      currentElement.style.outline = "";
      currentElement = null;
    }
  }
});

// copy css path
let copyButton = document.createElement("button");
copyButton.innerText = "Copy to Clipboard";
copyButton.id = "copyButton";
copyButton.style.backgroundColor = "#8545CF";
copyButton.style.color = "white"; // White text
copyButton.style.border = "none"; // No border
copyButton.style.padding = "15px 32px"; // Y-padding of 15px, X-padding of 32px
copyButton.style.textAlign = "center"; // Centered text
copyButton.style.textDecoration = "none"; // No underline
copyButton.style.display = "inline-block";
copyButton.style.fontSize = "12px";
copyButton.style.margin = "0px 2px";
copyButton.style.cursor = "pointer"; // Mouse cursor changes when hovering
copyButton.style.borderRadius = "4px"; // Rounded corners
copyButton.style.width = "300px";
copyButton.style.fontFamily = "Arial, sans-serif";
copyButton.style.float = "left";
copyButton.style.fontWeight = "bold";

// Change color on hover
copyButton.onmouseover = function () {
  copyButton.style.backgroundColor = "#450d85";
};

// Reset color when not hovering
copyButton.onmouseout = function () {
  copyButton.style.backgroundColor = "#8545CF";
};

copyButton.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(pathDisplay.innerText);
    createToast("CSS Path copied to clipboard!"); // Create toast notification instead of alert
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
});

elementSelectorWindow.appendChild(copyButton);

// create a close button for our "window"
let closeButton = document.createElement("button");
closeButton.innerText = "Close"; // We'll use an image as the button icon
closeButton.id = "closeButton"; // Add a CSS id for further modification
closeButton.style.backgroundColor = "#f44336"; // Red
closeButton.style.border = "none"; // No border
closeButton.style.borderRadius = "4px"; // Make it a perfect circle
closeButton.style.cursor = "pointer"; // Mouse cursor changes when hovering
closeButton.style.backgroundImage = 'url("close-icon.png")'; // Set the image as the background
closeButton.style.backgroundSize = "contain"; // Ensure the image fits within the button
closeButton.style.backgroundRepeat = "no-repeat"; // Don't repeat the background image
closeButton.style.backgroundPosition = "center"; // Center the background image
closeButton.style.fontSize = "12px";
closeButton.style.margin = "0px 2px";
closeButton.style.float = "left";

elementSelectorWindow.appendChild(closeButton);

// Change color on hover
closeButton.onmouseover = function () {
  closeButton.style.backgroundColor = "#da190b";
};

// Reset color when not hovering
closeButton.onmouseout = function () {
  closeButton.style.backgroundColor = "#f44336";
};

closeButton.addEventListener("click", function () {
  // stop selecting and hide the "window"
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement = null;
  }
  elementSelectorWindow.style.display = "none";
});
elementSelectorWindow.appendChild(closeButton);

// create a footer for our "window"
let footer = document.createElement("footer");
footer.innerHTML =
  "Powered by Samelogic &reg;<br>Action Based In-Product Surveys";
footer.style.marginTop = "14px";
footer.style.marginLeft = "3px";
footer.style.fontSize = "10px";
footer.style.color = "rgba(55, 53, 47, 0.7)";
footer.style.fontFamily = "Arial, sans-serif";
footer.style.float = "left";
elementSelectorWindow.appendChild(footer);

document.addEventListener("click", function (event) {
  if (!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  pathDisplay.innerText = path; // display the CSS path in our "window"

  // stop the selection process
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement = null;
  }

  // show our "window"
  elementSelectorWindow.style.display = "block";

  return false;
});

document.addEventListener("mouseover", function (event) {
  if (!selecting) return;

  // highlight the element
  if (currentElement) {
    currentElement.style.outline = "";
    //currentElement.style.boxShadow = "";
  }
  currentElement = event.target;
  currentElement.style.outline = "4px dotted #8545cf";
  currentElement.style.borderRadius = "6px";
});

document.addEventListener("mouseout", function (event) {
  if (!selecting || !currentElement) return;

  // remove highlight
  currentElement.style.outline = "";
  currentElement = null;
});

document.addEventListener("click", function (event) {
  if (!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  chrome.runtime.sendMessage({ action: "selectedElement", path: path });

  return false;
});

// calculate CSS path function
function getPathTo(element) {
  if (!(element instanceof Element)) return;
  const path = [];

  let node = element;
  while (node instanceof Element) {
    element = node;
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      selector += "#" + element.id;
      path.unshift(selector);
      break;
    } else {
      let sib = element,
        nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth != 1) selector += ":nth-of-type(" + nth + ")";
    }
    path.unshift(selector);
    node = element.parentNode;
  }
  return path.join(" > ");
}

document.addEventListener("click", function (event) {
  if (!selecting) return;

  event.preventDefault();

  let path = getPathTo(event.target);
  chrome.runtime.sendMessage({ action: "selectedElement", path: path });

  // stop the selection process
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement = null;
  }

  // Send a message back to popup.js to update the button status
  chrome.runtime.sendMessage({ action: "toggleSelect", selecting: selecting });

  return false;
});
