const checkbox = document.getElementById("toggleMask");

function updateCheckbox() {
  chrome.storage.sync.get(["maskEnabled"], (result) => {
    checkbox.checked = result.maskEnabled !== false; // default: enabled
  });
}

// When checkbox changes, save value and send message to content script
checkbox.addEventListener("change", async () => {
  const enabled = checkbox.checked;
  chrome.storage.sync.set({ maskEnabled: enabled });
  // Tell the active tab to re-mask or unmask
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  chrome.tabs.sendMessage(tab.id, { action: enabled ? "mask" : "unmask" });
});

// On popup open, set the checkbox state
updateCheckbox();
