const currencyRegex = /-?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?\s*kr\.?/gi;

// --- Helper: Mask or Unmask ---
function maskCurrencyInText(node) {
  if (node.nodeType !== 3) return;
  node.originalText = node.originalText || node.nodeValue; // Save original
  node.nodeValue = node.originalText.replace(currencyRegex, (match) => {
    let suffix = match.match(/kr\.?/i);
    return "*** " + (suffix ? suffix[0] : "kr.");
  });
}
function unmaskCurrencyInText(node) {
  if (node.nodeType !== 3) return;
  if (node.originalText) node.nodeValue = node.originalText;
}

function walk(node, fn) {
  if (
    node.nodeName === "SCRIPT" ||
    node.nodeName === "STYLE" ||
    node.nodeName === "TEXTAREA" ||
    node.isContentEditable
  ) {
    return;
  }
  if (node.nodeType === 3) {
    fn(node);
  } else {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      walk(child, fn);
    }
  }
}

// --- Main Mask/Unmask Functions ---
function maskAll() { walk(document.body, maskCurrencyInText); }
function unmaskAll() { walk(document.body, unmaskCurrencyInText); }

// --- Mutation Observer for dynamic content ---
let observer;
function setupObserver(masking) {
  if (observer) observer.disconnect();
  if (masking) {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          walk(node, maskCurrencyInText);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// --- Listen for messages from popup ---
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "mask") {
    maskAll();
    setupObserver(true);
  } else if (msg.action === "unmask") {
    unmaskAll();
    setupObserver(false);
  }
});

// --- On load, check storage and set mask state ---
chrome.storage.sync.get(["maskEnabled"], (result) => {
  if (result.maskEnabled !== false) {
    maskAll();
    setupObserver(true);
  } else {
    unmaskAll();
    setupObserver(false);
  }
});
