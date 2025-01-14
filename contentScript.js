// contentScript.js

let selecting = false;
let currentElement = null;
let selectionOverlay = null;
let selectionMessage = null;

// Add this line at the top of contentScript.js to define lastTabCreated
let lastTabCreated = 0;

// Create and inject custom styles for the selector window and highlighted elements
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
    /* border: 2px solid #8545CF; */
    z-index: 999999999;
    position: relative;
    border-radius: 8px;  /* adjust to your preference */
    overflow: hidden;  /* clip the border gradient to match border radius */
    box-shadow: 0px 2px 15px 15px rgba(0,0,0,0.1);
    border: 1px solid #e0e0e0;
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

  /* Styles for the selection overlay and message */
  #selection-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999999998; /* Below the selector window and message */
    pointer-events: none; /* Allow interactions with underlying elements */
    box-sizing: border-box;
    border: 5px solid #40c057;
  }

  #selection-message {
    position: fixed;
    font-weight: bold;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 10px;
    background-color: #40c057;
    border: 1px solid #53ad63;
    color: white;
    border-radius: 60px; /* Pill shape */
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 999999999; /* On top */
    opacity: 0.96;
    box-shadow: -1px 6px 5px 1px rgba(0, 0, 0, 0.1);
    user-select: none; /* Prevent text selection */
    pointer-events: auto; /* Enable pointer events initially */
    transition: opacity 0.3s ease, visibility 0.3s ease; /* Smoother transition */
  }

  /* Fade out the selection message when the cursor is near */
  #selection-message.fade-out {
    opacity: 0;
    visibility: hidden; /* Hide the element after fading */
    pointer-events: none; /* Disable pointer events during and after fade */
  }

  @keyframes bounce {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-3px); }
    100% { transform: translateY(0px); }
  }

  /* Add hover effect for intentButton */
  #intent-button:hover {
    filter: brightness(0.8);
  }

  /* Tooltip styles */
  #intent-button-tooltip {
    position: absolute;
    bottom: 120%; /* Position above the button */
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.75);
    color: #ffffff;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 10px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease-in-out;
    pointer-events: none;
    z-index: 1000000001; /* Above the intentButton */
  }

  /* Show tooltip on hover */
  #intent-button:hover #intent-button-tooltip {
    opacity: 1;
    visibility: visible;
  }

  .parent-container {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative; /* Ensure positioning context */
    height: 100vh; /* Adjust as needed */
    width: 100%; /* Adjust as needed */
  }

  #intent-button {
    /* Existing styles */
  }
`;
document.head.appendChild(style);

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

// Create the element selector window
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

// Create a h3 title for the window
let title = document.createElement("h3");
title.innerText = "Path Selected!";
title.style.color = "rgb(107 87 153)";
title.style.width = "100%";
title.style.float = "left";
title.style.fontFamily = "Arial, sans-serif";
title.style.fontWeight = "bold";
title.style.fontSize = "17px";

elementSelectorWindow.appendChild(title);

// Create a p subtitle for the window
let subtitle = document.createElement("p");
subtitle.innerText = "Please copy the path below.";
subtitle.style.color = "rgb(135 135 135)";
subtitle.style.width = "100%";
subtitle.style.float = "left";
subtitle.style.fontFamily = "Arial, sans-serif";
subtitle.style.fontSize = "14px";
subtitle.style.marginBottom = "15px";
elementSelectorWindow.appendChild(subtitle);

// Create a p element for displaying the CSS path
let pathDisplay = document.createElement("p");
pathDisplay.id = "pathDisplay";
elementSelectorWindow.appendChild(pathDisplay);

// Copy CSS path button
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

// Create a close button for the window
let closeButton = document.createElement("button");
closeButton.innerText = "Close"; // We'll use an image as the button icon
closeButton.id = "closeButton"; // Add a CSS id for further modification
closeButton.style.backgroundColor = "#cd004d"; // Red
closeButton.style.border = "none"; // No border
closeButton.style.borderRadius = "4px"; // Rounded corners
closeButton.style.cursor = "pointer"; // Mouse cursor changes when hovering
//closeButton.style.backgroundImage = 'url("close-icon.png")'; // Set the image as the background
closeButton.style.backgroundSize = "contain"; // Ensure the image fits within the button
closeButton.style.backgroundRepeat = "no-repeat"; // Don't repeat the background image
closeButton.style.backgroundPosition = "center"; // Center the background image
closeButton.style.fontSize = "12px";
closeButton.style.margin = "0px 2px";
closeButton.style.float = "left";

// Change color on hover
closeButton.onmouseover = function () {
  closeButton.style.backgroundColor = "#da190b";
};

// Reset color when not hovering
closeButton.onmouseout = function () {
  closeButton.style.backgroundColor = "#cd004d";
};

closeButton.addEventListener("click", function () {
  // Stop selecting and hide the window
  selecting = false;
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement = null;
  }
  elementSelectorWindow.style.display = "none";

  // Remove the overlay and message if they exist
  removeSelectionOverlay();

  // Remove the event listener that prevents default actions
  document.removeEventListener(
    "click",
    preventDefaultActions,
    true // Capture phase
  );

  // Remove the intentButton
  if (window.intentButton) {
    window.intentButton.style.opacity = "0"; // Start fade-out
    setTimeout(() => {
      window.intentButton.remove();
      window.intentButton = null;
    }, 300); // Match the transition duration
  }
});
elementSelectorWindow.appendChild(closeButton);

// Add the "Select Another Element" button
let reselectButton = document.createElement("button");
reselectButton.innerHTML = `
  Select Another Element
`;
reselectButton.id = "reselectButton";
reselectButton.style.backgroundColor = "#40c057";
reselectButton.style.color = "white";
reselectButton.style.border = "none";
reselectButton.style.padding = "10px 20px";
reselectButton.style.textAlign = "center";
reselectButton.style.textDecoration = "none";
reselectButton.style.display = "flex";
reselectButton.style.alignItems = "center";
reselectButton.style.fontSize = "11px";
reselectButton.style.margin = "4px 2px";
reselectButton.style.cursor = "pointer";
reselectButton.style.borderRadius = "4px";
reselectButton.style.float = "left";
reselectButton.style.fontFamily = "Arial, sans-serif";
reselectButton.style.fontWeight = "bold";
reselectButton.style.gap = "8px"; // Ensure consistent spacing between icon and text

// Change color on hover
reselectButton.onmouseover = function () {
  reselectButton.style.backgroundColor = "#28a745";
};

reselectButton.onmouseout = function () {
  reselectButton.style.backgroundColor = "#40c057";
};

// Event listener to relaunch selection mode
reselectButton.addEventListener("click", function () {
  // Directly toggle selection mode without sending a message
  toggleSelectionMode(true);

  // Hide the element selector window
  elementSelectorWindow.style.display = "none";

  // Create a toast notification
  createToast("Select an element.");

  // Remove the intentButton
  if (window.intentButton) {
    window.intentButton.style.opacity = "0"; // Start fade-out
    setTimeout(() => {
      window.intentButton.remove();
      window.intentButton = null;
    }, 300); // Match the transition duration
  }
});

elementSelectorWindow.appendChild(reselectButton);

// Create a footer for the window
let footer = document.createElement("footer");
footer.innerHTML =
  "Powered by Samelogic &reg;<br>The Fastest Way to Understand Customer Intent";
footer.style.marginTop = "14px";
footer.style.marginLeft = "3px";
footer.style.fontSize = "10px";
footer.style.color = "rgba(55, 53, 47, 0.7)";
footer.style.fontFamily = "Arial, sans-serif";
footer.style.float = "left";
elementSelectorWindow.appendChild(footer);

// Function to prevent default actions during selection mode
function preventDefaultActions(event) {
  if (!selecting) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

// Add a function to toggle selection mode
function toggleSelectionMode(isSelecting) {
  selecting = isSelecting;
  if (selecting) {
    // Create and show the overlay and message
    createSelectionOverlay();

    // Add event listeners to prevent default actions during selection
    document.addEventListener("click", preventDefaultActions, true);
  } else {
    // Remove overlay and message
    removeSelectionOverlay();

    if (currentElement) {
      currentElement.style.outline = "";
      currentElement.style.cursor = "";
      currentElement = null;
    }

    // Remove event listener
    document.removeEventListener("click", preventDefaultActions, true);

    // Remove the intentButton if it exists
    if (window.intentButton) {
      window.intentButton.remove();
      window.intentButton = null;
    }
  }
}

// Modify the message listener to use the new toggle function
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleSelect") {
    toggleSelectionMode(request.selecting);

    if (!request.selecting && window.intentButton) {
      window.intentButton.remove();
      window.intentButton = null;
    }
  }
});

// Function to create the selection overlay and message
function createSelectionOverlay() {
  // Create overlay
  selectionOverlay = document.createElement("div");
  selectionOverlay.id = "selection-overlay";
  document.body.appendChild(selectionOverlay);

  // Create message
  selectionMessage = document.createElement("div");
  selectionMessage.id = "selection-message";
  selectionMessage.innerText = "Click Any Element To Copy Its Selector";
  document.body.appendChild(selectionMessage);
}

// Function to remove the selection overlay and message
function removeSelectionOverlay() {
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }
  if (selectionMessage) {
    selectionMessage.remove();
    selectionMessage = null;
  }
}

// Handle mouseover event to highlight elements during selection
document.addEventListener("mouseover", function (event) {
  if (!selecting) return;

  // Highlight the element
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement.style.cursor = ""; // Reset cursor style
  }
  currentElement = event.target;
  currentElement.style.outline = "4px dashed #8545cf";
  currentElement.style.borderRadius = "6px";
  currentElement.style.cursor = "pointer"; // Change cursor to pointer
});

// Handle mouseout event to remove highlight
document.addEventListener("mouseout", function (event) {
  if (!selecting || !currentElement) return;

  // Remove highlight
  currentElement.style.outline = "";
  currentElement.style.cursor = ""; // Reset cursor style
  currentElement = null;
});

// Handle click event to select the element and get its CSS path
document.addEventListener(
  "click",
  function (event) {
    if (!selecting) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    let path = getPathTo(event.target);
    pathDisplay.innerText = path; // Display the CSS path in our window

    // Stop the selection process
    selecting = false;
    if (currentElement) {
      currentElement.style.outline = "";
      currentElement.style.cursor = ""; // Reset cursor style
      currentElement = null;
    }

    // Remove the overlay and message
    removeSelectionOverlay();

    // Show our window
    elementSelectorWindow.style.display = "block";

    // Send a message back to popup.js to update the button status
    chrome.runtime.sendMessage({
      action: "toggleSelect",
      selecting: selecting,
    });

    // Remove the event listener that prevents default actions
    document.removeEventListener(
      "click",
      preventDefaultActions,
      true // Capture phase
    );

    // Create the small clickable element above the selected element
    const intentButton = document.createElement("div");
    // intentButton.title = "Ask a quick question when users pause here";
    intentButton.id = "intent-button"; // Assign an ID for easy reference
    intentButton.innerText = "Survey users who hover here";
    intentButton.style.position = "absolute";
    intentButton.style.backgroundColor = "#4206ba"; // Example background color
    intentButton.style.color = "#ffffff";
    intentButton.style.padding = "10px 15px";
    intentButton.style.borderRadius = "60px";
    intentButton.style.cursor = "pointer";
    intentButton.style.zIndex = "1000000000"; // Ensure it's on top
    intentButton.style.boxShadow = "0px 2px 8px rgba(141, 70, 255, 0.3)"; // Add subtle shadow
    intentButton.style.fontWeight = "600";
    intentButton.style.fontFamily = "Arial, sans-serif";
    intentButton.style.fontSize = "12px";
    intentButton.style.opacity = "0"; // Start invisible
    intentButton.style.transition = "opacity 0.3s ease"; // Fade transition
    intentButton.style.animation = "bounce 3s ease-in-out infinite"; // Add bounce animation
    intentButton.style.border = "1px solid #521eba";

    // Ensure the parent element is positioned relative
    const parentElement = document.body; // Replace with your actual parent element if different
    parentElement.style.position = "relative";

    // Center the button horizontally and vertically within the parent
    intentButton.style.top = "50%";
    intentButton.style.left = "50%";
    intentButton.style.transform = "translate(-50%, -50%)";

    // Append the intent button to the parent element
    parentElement.appendChild(intentButton);

    // Create tooltip element
    const tooltip = document.createElement("div");
    tooltip.id = "intent-button-tooltip";
    tooltip.innerText = "Ask a quick question when users pause here";
    intentButton.appendChild(tooltip);
    tooltip.style.opacity = "1";

    // Position the button above the selected element
    const rect = event.target.getBoundingClientRect();
    intentButton.style.left = `${rect.left + window.scrollX}px`;
    intentButton.style.top = `${rect.top + window.scrollY - 50}px`; // 30px above

    // Add click event listener for intentButton
    intentButton.addEventListener("click", function () {
      const now = Date.now();
      if (now - lastTabCreated < 1000) return; // 1 second cooldown
      lastTabCreated = now;

      const cssSelector = encodeURIComponent(pathDisplay.innerText);
      // Send message to background script instead of directly creating tab
      chrome.runtime.sendMessage({
        action: "createTab",
        url: `https://samelogic.com?ref=selector_${cssSelector}`,
      });
    });

    // Trigger fade-in
    requestAnimationFrame(() => {
      intentButton.style.opacity = "1";
    });

    // Store a reference to the intentButton for later removal
    window.intentButton = intentButton;

    return false;
  },
  true // Use capture phase
);

// Function to calculate the unique CSS path to the element
function getPathTo(element) {
  if (!(element instanceof Element)) return;
  const path = [];

  let node = element;
  while (node instanceof Element) {
    element = node;
    let selector = element.nodeName.toLowerCase();
    if (element.id) {
      // Use the ID in the selector
      selector += `[id='${element.id}']`;
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

// Add event listener to handle cursor proximity to the selection message
document.addEventListener("mousemove", handleMouseMove);

function handleMouseMove(event) {
  if (!selectionMessage) return;

  const messageRect = selectionMessage.getBoundingClientRect();
  const cursorX = event.clientX;
  const cursorY = event.clientY;
  const proximity = 50; // Distance in pixels to trigger fade out

  // Calculate the distance between the cursor and the center of the selection message
  const messageCenterX = messageRect.left + messageRect.width / 2;
  const messageCenterY = messageRect.top + messageRect.height / 2;
  const distance = Math.hypot(
    cursorX - messageCenterX,
    cursorY - messageCenterY
  );

  if (distance < proximity) {
    // Add the fade-out class if not already added
    if (!selectionMessage.classList.contains("fade-out")) {
      selectionMessage.classList.add("fade-out");

      // Optionally hide the message after the transition
      setTimeout(() => {
        if (selectionMessage) {
          selectionMessage.style.display = "none";
        }
      }, 300); // Match the transition duration
    }
  } else {
    // Remove the fade-out class if the cursor moves away
    if (selectionMessage.classList.contains("fade-out")) {
      selectionMessage.classList.remove("fade-out");
      selectionMessage.style.display = "block";
    }
  }
}
