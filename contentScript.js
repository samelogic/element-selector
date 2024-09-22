let selecting = false;
let currentElement = null;

// Create and append styles
let style = document.createElement("style");
style.innerHTML = `
  /* Overlay Styles */
  #selection-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1); /* Slight dimming */
    z-index: 999999998;
    display: none;
    cursor: crosshair; /* Change cursor to crosshair */
  }

  /* Element Selector Window Styles */
  #element-selector-window * {
    all: initial;
  }
  #element-selector-window {
    width: 350px;
    background-color: #ffffff;
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    border: 2px solid #8545CF;
    border-radius: 8px;
    box-shadow: 0px 4px 20px rgba(0,0,0,0.2);
    z-index: 999999999;
    font-family: Arial, sans-serif;
  }

  #element-selector-window h3 {
    color: rgb(107, 87, 153);
    text-align: center;
    margin-bottom: 10px;
  }

  #element-selector-window p {
    color: rgb(135, 135, 135);
    text-align: center;
    margin-bottom: 15px;
    font-size: 14px;
  }

  #pathDisplay {
    font-family: monospace;
    padding: 10px;
    background-color: #f0f0f0;
    border: 3px solid #dfdfdf;
    border-radius: 5px;
    width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: 14px;
    color: #393939;
    margin-bottom: 15px;
  }

  #copyButton, #cancelButton, #closeButton {
    background-color: #8545CF;
    color: white;
    border: none;
    padding: 10px 20px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 14px;
    margin: 5px 0;
    cursor: pointer;
    border-radius: 4px;
    width: 100%;
    font-family: Arial, sans-serif;
    font-weight: bold;
    transition: background-color 0.3s ease;
  }

  #copyButton:hover, #cancelButton:hover {
    background-color: #450d85;
  }

  #closeButton {
    background-color: #cd004d;
    margin-top: 10px;
  }

  #closeButton:hover {
    background-color: #da190b;
  }

  footer {
    margin-top: 14px;
    text-align: center;
    font-size: 10px;
    color: rgba(55, 53, 47, 0.7);
    font-family: Arial, sans-serif;
  }

  /* Instructional Text Styles */
  #instructionText {
    font-size: 13px;
    color: #555;
    text-align: center;
    margin-bottom: 10px;
  }
`;
document.head.appendChild(style);

// Create the overlay element
let selectionOverlay = document.createElement("div");
selectionOverlay.id = "selection-overlay";
document.body.appendChild(selectionOverlay);

// Create the element selector window
let elementSelectorWindow = document.createElement("div");
elementSelectorWindow.id = "element-selector-window";
document.body.appendChild(elementSelectorWindow);

// Add content to the selector window
let title = document.createElement("h3");
title.innerText = "Path Selected!";
elementSelectorWindow.appendChild(title);

let instruction = document.createElement("p");
instruction.id = "instructionText";
instruction.innerText =
  "Please copy the path below or cancel if you made a mistake.";
elementSelectorWindow.appendChild(instruction);

let pathDisplay = document.createElement("p");
pathDisplay.id = "pathDisplay";
elementSelectorWindow.appendChild(pathDisplay);

let copyButton = document.createElement("button");
copyButton.innerText = "Copy to Clipboard";
copyButton.id = "copyButton";
elementSelectorWindow.appendChild(copyButton);

let cancelButton = document.createElement("button");
cancelButton.innerText = "Cancel Selection";
cancelButton.id = "cancelButton";
elementSelectorWindow.appendChild(cancelButton);

let closeButton = document.createElement("button");
closeButton.innerText = "Close";
closeButton.id = "closeButton";
elementSelectorWindow.appendChild(closeButton);

let footer = document.createElement("footer");
footer.innerHTML = "Powered by Samelogic &reg;<br>User Intent as a Service";
elementSelectorWindow.appendChild(footer);

// Toast notification function
function createToast(message) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "25px";
  toast.style.right = "25px";
  toast.style.backgroundColor = "#8545CF";
  toast.style.color = "white";
  toast.style.padding = "10px";
  toast.style.borderRadius = "5px";
  toast.style.zIndex = "9999999999";
  toast.style.fontFamily = "Arial, sans-serif";
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 1s ease-in-out";
  toast.innerText = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
  }, 0);

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Show overlay and change cursor when selection starts
function showOverlay() {
  selectionOverlay.style.display = "block";
  document.body.style.cursor = "crosshair"; // Indicate selection mode
}

// Hide overlay and revert cursor when selection ends
function hideOverlay() {
  selectionOverlay.style.display = "none";
  document.body.style.cursor = "default"; // Revert cursor
}

// Listen for messages from the extension
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleSelect") {
    selecting = request.selecting;
    if (selecting) {
      showOverlay();
      elementSelectorWindow.style.display = "none"; // Hide window during selection
    } else {
      hideOverlay();
      if (currentElement) {
        currentElement.style.outline = "";
        currentElement.style.cursor = "";
        currentElement = null;
      }
      elementSelectorWindow.style.display = "none";
    }
  }
});

// Copy to clipboard functionality
copyButton.addEventListener("click", async function () {
  try {
    await navigator.clipboard.writeText(pathDisplay.innerText);
    createToast("CSS Path copied to clipboard!");
    elementSelectorWindow.style.display = "none"; // Hide window after copying
  } catch (err) {
    console.error("Failed to copy text: ", err);
    createToast("Failed to copy CSS Path.");
  }
});

// Cancel selection functionality
cancelButton.addEventListener("click", function () {
  selecting = false;
  hideOverlay();
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement.style.cursor = "";
    currentElement = null;
  }
  elementSelectorWindow.style.display = "none";
  chrome.runtime.sendMessage({ action: "toggleSelect", selecting: selecting });
});

// Close button functionality
closeButton.addEventListener("click", function () {
  // Close the selection window without affecting the selection state
  elementSelectorWindow.style.display = "none";
});

// Highlight elements on hover
document.addEventListener("mouseover", function (event) {
  if (!selecting) return;

  if (currentElement) {
    currentElement.style.outline = "";
    currentElement.style.cursor = "";
  }
  currentElement = event.target;
  currentElement.style.outline = "4px dashed #FF5733"; // Enhanced visibility
  currentElement.style.borderRadius = "6px";
  currentElement.style.cursor = "pointer";
});

// Remove highlight on mouseout
document.addEventListener("mouseout", function (event) {
  if (!selecting || !currentElement) return;

  currentElement.style.outline = "";
  currentElement.style.cursor = "";
  currentElement = null;
});

// Consolidated click event listener in the capture phase
document.addEventListener(
  "click",
  function (event) {
    if (!selecting) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    let path = getPathTo(event.target);
    pathDisplay.innerText = path; // Display the CSS path in the "window"

    // Send the selected path to the background script or popup
    chrome.runtime.sendMessage({ action: "selectedElement", path: path });

    // Stop the selection process
    selecting = false;
    hideOverlay();
    if (currentElement) {
      currentElement.style.outline = "";
      currentElement.style.cursor = "";
      currentElement = null;
    }

    // Show the selection window
    elementSelectorWindow.style.display = "block";

    // Update the extension's state
    chrome.runtime.sendMessage({
      action: "toggleSelect",
      selecting: selecting,
    });

    return false;
  },
  true // Use capture phase
);

// Prevent keyboard interactions during selection
document.addEventListener(
  "keydown",
  function (event) {
    if (selecting) {
      // Allow 'Escape' key to cancel selection
      if (event.key === "Escape") {
        selecting = false;
        hideOverlay();
        if (currentElement) {
          currentElement.style.outline = "";
          currentElement.style.cursor = "";
          currentElement = null;
        }
        elementSelectorWindow.style.display = "none";
        chrome.runtime.sendMessage({
          action: "toggleSelect",
          selecting: selecting,
        });
        createToast("Selection canceled.");
      } else {
        // Prevent other keys
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }
  },
  true // Use capture phase
);

// Function to calculate CSS path
function getPathTo(element) {
  if (!(element instanceof Element)) return;
  const path = [];

  let node = element;
  while (node instanceof Element) {
    let selector = node.nodeName.toLowerCase();
    if (node.id) {
      selector += `[id='${node.id}']`;
      path.unshift(selector);
      break;
    } else {
      let sib = node,
        nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth != 1) selector += `:nth-of-type(${nth})`;
    }
    path.unshift(selector);
    node = node.parentNode;
  }
  return path.join(" > ");
}
