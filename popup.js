document.addEventListener('DOMContentLoaded', async () => {
  const statusText = document.getElementById('status-text');
  const testBtn = document.getElementById('test-btn');
  const progressContainer = document.getElementById('progress-bar-container');
  const progressBar = document.getElementById('progress-bar');
  const resultContainer = document.getElementById('result-container');
  const resultText = document.getElementById('result-text');

  let availableCoupons = [];

  // Query the current active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
    statusText.textContent = "Please navigate to an e-commerce checkout page.";
    return;
  }

  const url = new URL(tab.url);
  
  // Ask background for coupons for this site
  chrome.runtime.sendMessage({ action: 'getCouponsForSite', hostname: url.hostname }, (response) => {
    if (response && response.coupons) {
      availableCoupons = response.coupons;
      
      // Check if we are on a checkout page with inputs
      chrome.tabs.sendMessage(tab.id, { action: 'findCheckoutForm' }, (formResponse) => {
        if (chrome.runtime.lastError || !formResponse || !formResponse.found) {
          statusText.textContent = `Found ${availableCoupons.length} codes for ${url.hostname}, but no checkout input detected.`;
        } else {
          statusText.textContent = `Found ${availableCoupons.length} codes ready to test!`;
          testBtn.disabled = false;
        }
      });
    }
  });

  // Listen for progress updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'testingProgress') {
      const percentage = Math.round(((request.index + 1) / request.total) * 100);
      progressBar.style.width = percentage + '%';
      statusText.textContent = `Testing code: ${request.currentCode} (${request.index + 1}/${request.total})`;
    } else if (request.action === 'testingComplete') {
      progressContainer.classList.add('hidden');
      testBtn.textContent = 'Test Completed';
      
      resultContainer.classList.remove('hidden');
      if (request.success) {
        resultText.innerHTML = `<strong>Success!</strong> Applied code: <code>${request.bestCode}</code>`;
        resultContainer.style.backgroundColor = '#e8f5e9';
      } else {
        resultText.textContent = "No working codes found.";
        resultContainer.style.backgroundColor = '#ffebee';
      }
    }
  });

  testBtn.addEventListener('click', () => {
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    chrome.tabs.sendMessage(tab.id, { 
      action: 'startTesting', 
      coupons: availableCoupons 
    });
  });
});
