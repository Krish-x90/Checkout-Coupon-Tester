// Define heuristics for finding promo code inputs and buttons
const INPUT_SELECTORS = [
  'input[name*="coupon" i]',
  'input[name*="promo" i]',
  'input[name*="discount" i]',
  'input[id*="coupon" i]',
  'input[id*="promo" i]',
  'input[id*="discount" i]',
  'input[placeholder*="promo" i]',
  'input[placeholder*="coupon" i]'
];

const BUTTON_SELECTORS = [
  'button[name*="apply" i]',
  'button[id*="apply" i]',
  'button[class*="apply" i]',
  'button[aria-label*="apply" i]',
  'input[type="submit"][value*="apply" i]'
];

let isTesting = false;
let foundCoupons = [];

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'findCheckoutForm') {
    const inputField = findInputField();
    const applyButton = findApplyButton(inputField);
    sendResponse({ found: !!inputField, hasButton: !!applyButton });
  } else if (request.action === 'startTesting') {
    if (!isTesting) {
      isTesting = true;
      foundCoupons = request.coupons;
      startCouponTesting();
      sendResponse({ status: 'started' });
    }
  }
  return true;
});

function findInputField() {
  for (const selector of INPUT_SELECTORS) {
    const element = document.querySelector(selector);
    if (element && element.type !== 'hidden') {
      return element;
    }
  }
  return null;
}

function findApplyButton(inputField) {
  if (!inputField) return null;
  
  // Look near the input field first
  const parentForm = inputField.closest('form') || inputField.parentElement.parentElement;
  if (parentForm) {
    for (const selector of BUTTON_SELECTORS) {
      const button = parentForm.querySelector(selector);
      if (button) return button;
    }
    // Fallback: look for any submit button in the form
    const submitBtn = parentForm.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) return submitBtn;
  }
  
  // Global search
  for (const selector of BUTTON_SELECTORS) {
    const button = document.querySelector(selector);
    if (button) return button;
  }
  
  return null;
}

async function startCouponTesting() {
  const inputField = findInputField();
  const applyButton = findApplyButton(inputField);
  
  if (!inputField || !applyButton) {
    chrome.runtime.sendMessage({ action: 'testingComplete', success: false, message: 'Could not locate input/apply button.' });
    isTesting = false;
    return;
  }

  let bestCode = null;
  let successFound = false;

  for (let i = 0; i < foundCoupons.length; i++) {
    const code = foundCoupons[i];
    
    // Update UI in popup
    chrome.runtime.sendMessage({ action: 'testingProgress', currentCode: code, index: i, total: foundCoupons.length });
    
    // Apply the code
    inputField.value = code;
    // Dispatch events to simulate real user typing for React/Vue sites
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
    inputField.dispatchEvent(new Event('change', { bubbles: true }));
    
    await sleep(500); // Wait for UI to update
    
    applyButton.click();
    
    // Wait for network request/DOM update
    await sleep(2500);
    
    // Naive heuristic to check for success: Look for the word "applied" or a negative price amount
    // In a production app, we would snapshot the total price before and after
    const pageText = document.body.innerText.toLowerCase();
    if (pageText.includes('applied') && !pageText.includes('invalid') && !pageText.includes('expired')) {
      bestCode = code;
      successFound = true;
      
      // Report successful code back to Firebase for crowdsourcing
      chrome.runtime.sendMessage({
        action: 'reportSuccessfulCode',
        code: bestCode
      });
      
      break;
    }
  }
  
  chrome.runtime.sendMessage({ 
    action: 'testingComplete', 
    success: successFound, 
    bestCode: bestCode 
  });
  
  isTesting = false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
