// contentScript.js

// Initialize selection state
let selecting = false;
let currentElement = null;

// Create the selection overlay to dim the background
const selectionOverlay = document.createElement("div");
selectionOverlay.id = "selection-overlay";
selectionOverlay.style.position = "fixed";
selectionOverlay.style.top = "0";
selectionOverlay.style.left = "0";
selectionOverlay.style.width = "100%";
selectionOverlay.style.height = "100%";
selectionOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.1)"; // Slight dimming
selectionOverlay.style.zIndex = "999999998"; // Just below the popup
selectionOverlay.style.display = "none"; // Hidden by default
document.body.appendChild(selectionOverlay);

// Function to create toast notifications
function createToast(message) {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "25px";
  toast.style.right = "25px";
  toast.style.backgroundColor = "#8545CF";
  toast.style.color = "white";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.zIndex = "9999999999";
  toast.style.fontFamily = "Arial, sans-serif";
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 1s ease-in-out";
  toast.innerText = message;
  document.body.appendChild(toast);

  // Fade in the toast
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 100);

  // Fade out the toast after 2 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2100);

  // Remove the toast from the DOM after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3100);
}

// Function to enable selection mode
function enableSelectionMode() {
  selecting = true;
  document.body.style.cursor = "crosshair"; // Change cursor to crosshair

  // Show the selection overlay
  selectionOverlay.style.display = "block";

  // Optional: Inform users that selection mode is active
  createToast("Selection mode activated. Hover over elements to select.");
}

// Function to disable selection mode
function disableSelectionMode() {
  selecting = false;
  document.body.style.cursor = "default"; // Revert cursor to default

  // Hide the selection overlay
  selectionOverlay.style.display = "none";

  // Remove any existing highlight from the current element
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement.style.cursor = "";
    currentElement = null;
  }

  // Optional: Inform users that selection mode is deactivated
  createToast("Selection mode deactivated.");
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "toggleSelect") {
    if (request.selecting) {
      enableSelectionMode();
    } else {
      disableSelectionMode();
    }
  }
});

// Highlight elements on mouseover
document.addEventListener("mouseover", function (event) {
  if (!selecting) return;

  // Remove highlight from the previously highlighted element
  if (currentElement) {
    currentElement.style.outline = "";
    currentElement.style.cursor = "";
  }

  // Highlight the new element
  currentElement = event.target;
  currentElement.style.outline = "4px dashed #8545CF"; // Dashed purple border
  currentElement.style.borderRadius = "6px"; // Rounded corners for better aesthetics
  currentElement.style.cursor = "pointer"; // Change cursor to pointer
});

// Remove highlight on mouseout
document.addEventListener("mouseout", function (event) {
  if (!selecting || !currentElement) return;

  // Remove the highlight from the element
  currentElement.style.outline = "";
  currentElement.style.cursor = "";
  currentElement = null;
});

// Handle element click to capture CSS path
document.addEventListener(
  "click",
  function (event) {
    if (!selecting) return;

    event.preventDefault(); // Prevent default action (e.g., navigation)
    event.stopPropagation(); // Stop the event from bubbling up

    // Get the CSS path of the clicked element
    const path = getPathTo(event.target);

    // Send the CSS path back to the popup
    chrome.runtime.sendMessage({ action: "elementSelected", path: path });

    // Disable selection mode after selection
    disableSelectionMode();

    // Optional: Inform users that the element has been selected
    createToast("Element selected. CSS Path captured.");
  },
  true // Use capture phase to intercept the click before it propagates
);

// Handle Escape key to cancel selection mode
document.addEventListener(
  "keydown",
  function (event) {
    if (selecting && event.key === "Escape") {
      disableSelectionMode();

      // Inform the popup that selection has been canceled
      chrome.runtime.sendMessage({
        action: "toggleSelect",
        selecting: selecting,
      });
      chrome.runtime.sendMessage({ message: "selectionCanceled" });

      // Optional: Inform users that the selection has been canceled
      createToast("Selection canceled.");
    }
  },
  true // Use capture phase to ensure it catches the event early
);

// Function to calculate the CSS path of an element
function getPathTo(element) {
  if (!(element instanceof Element)) return;
  const path = [];

  let currentNode = element;
  while (currentNode instanceof Element) {
    let selector = currentNode.nodeName.toLowerCase();

    // If the element has an ID, use it and stop the loop
    if (currentNode.id) {
      selector += `#${currentNode.id}`;
      path.unshift(selector);
      break;
    } else {
      // Otherwise, find the nth-of-type
      let sibling = currentNode;
      let nth = 1;
      while ((sibling = sibling.previousElementSibling)) {
        if (sibling.nodeName.toLowerCase() === selector) nth++;
      }
      if (nth !== 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }

    path.unshift(selector);
    currentNode = currentNode.parentNode;
  }

  return path.join(" > ");
}
