// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById("toggle-select");
  const advisoryButton = document.getElementById("advisory");
  const cssPathContainer = document.getElementById("css-path-container");
  const cssPathDisplay = document.getElementById("css-path");
  const copyButton = document.getElementById("copy-path");
  const closePopupButton = document.getElementById("close-popup");
  const instructions = document.getElementById("instructions");

  let selecting = false;

  // Initialize the toggle button
  toggleButton.innerText = "Select an Element";
  toggleButton.classList.remove("active"); // Ensure it's not active initially

  // Event listener for the toggle button
  toggleButton.addEventListener("click", () => {
    selecting = !selecting; // Toggle the state

    // Update button text and active class based on the state
    if (selecting) {
      toggleButton.innerText = "Stop Selecting";
      toggleButton.classList.add("active"); // Add active class for color
    } else {
      toggleButton.innerText = "Select an Element";
      toggleButton.classList.remove("active"); // Remove active class to reset color
    }

    // Send a message to the content script to toggle selection mode
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0].id) {
        console.log("Sending message to content script:", {
          action: "toggleSelect",
          selecting: selecting,
        });
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "toggleSelect",
            selecting: selecting,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending message:",
                chrome.runtime.lastError.message
              );
            }
          }
        );
      }
    });

    // Reset the CSS path display when toggling
    if (!selecting) {
      cssPathContainer.style.display = "none";
      instructions.style.display = "block";
    }
  });

  // Event listener for the advisory button
  advisoryButton.addEventListener("click", () => {
    // Reload the active tab to apply any changes
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0].id) {
        chrome.tabs.reload(tabs[0].id);
        window.close(); // Close the popup after reloading
      }
    });
  });

  // Listen for messages from the content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Popup received message:", request);
    if (request.action === "elementSelected") {
      // Display the captured CSS path
      displaySelectedPath(request.path);
    }

    if (request.message === "selectionCanceled") {
      // Reset the UI when selection is canceled
      selecting = false;
      toggleButton.innerText = "Select an Element";
      toggleButton.classList.remove("active");
      cssPathContainer.style.display = "none";
      instructions.style.display = "block";
    }
  });

  // Function to display the selected CSS path
  function displaySelectedPath(path) {
    // Update the textarea with the CSS path
    cssPathDisplay.value = path;

    // Show the CSS path container and hide instructions
    cssPathContainer.style.display = "block";
    instructions.style.display = "none";

    // Show the copy and close buttons
    copyButton.style.display = "block";
    closePopupButton.style.display = "block";
  }

  // Copy CSS path to clipboard
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(cssPathDisplay.value);
      createToast("CSS Path copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      createToast("Failed to copy CSS Path.");
    }
  });

  // Close the popup
  closePopupButton.addEventListener("click", () => {
    window.close();
  });

  // Function to create toast notifications in the popup
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
});
