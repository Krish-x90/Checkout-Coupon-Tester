import { FIREBASE_PROJECT_ID, FIREBASE_API_KEY } from './config.js';

// Firestore REST API Endpoints
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const FIRESTORE_COUPONS_URL = `${FIRESTORE_BASE_URL}/coupons?key=${FIREBASE_API_KEY}`;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Checkout Coupon Tester installed.");
  chrome.alarms.create('updateCoupons', { periodInMinutes: 1440 }); // Update daily
  fetchAndCacheCoupons();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateCoupons') fetchAndCacheCoupons();
});

async function fetchAndCacheCoupons() {
  console.log("Fetching latest coupons from Firebase Firestore...");
  try {
    const response = await fetch(FIRESTORE_COUPONS_URL);
    if (!response.ok) {
      if (response.status === 403) {
         throw new Error(`Firebase 403 Forbidden. This usually means your Firestore Security Rules are blocking access. Go to the Firebase Console -> Firestore Database -> Rules, and set them to "allow read, write: if true;" for testing.`);
      }
      throw new Error(`Firebase HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const parsedCoupons = { 'default': ['TESTCODE10'] }; // Fallback/default codes
    
    // Parse Firebase REST API format to our simple dictionary
    // Expected Firestore Document: { domain: "amazon.com", code: "SAVE20" }
    if (data.documents) {
      data.documents.forEach(doc => {
        if (doc.fields) {
          const domain = doc.fields.domain?.stringValue || 'default';
          const code = doc.fields.code?.stringValue;
          
          if (code) {
            if (!parsedCoupons[domain]) parsedCoupons[domain] = [];
            // Avoid duplicates
            if (!parsedCoupons[domain].includes(code)) {
               parsedCoupons[domain].push(code);
            }
          }
        }
      });
    }

    chrome.storage.local.set({ cachedCoupons: parsedCoupons }, () => {
      console.log("Coupons successfully synced from Firebase:", parsedCoupons);
    });
  } catch (error) {
    console.error("Failed to fetch coupons from Firebase:", error);
  }
}

// Function to save a new valid coupon back to Firebase (Crowdsourcing)
async function saveCouponToFirebase(domain, code) {
  try {
    const payload = {
      fields: {
        domain: { stringValue: domain },
        code: { stringValue: code },
        timestamp: { timestampValue: new Date().toISOString() }
      }
    };

    const response = await fetch(FIRESTORE_COUPONS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`Successfully contributed ${code} for ${domain} to Firebase!`);
      // Refresh cache so the new code is immediately available
      fetchAndCacheCoupons();
    }
  } catch (error) {
    console.error("Failed to save coupon to Firebase:", error);
  }
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCouponsForSite') {
    chrome.storage.local.get(['cachedCoupons'], (result) => {
      const coupons = result.cachedCoupons || { 'default': [] };
      const site = request.hostname.replace('www.', '');
      
      let matchedCoupons = coupons['default'] || [];
      for (const domain in coupons) {
        if (site.includes(domain)) {
          matchedCoupons = coupons[domain];
          break;
        }
      }
      sendResponse({ coupons: matchedCoupons });
    });
    return true; 
  } 
  
  // Listen for successful codes found by users to add to the database
  else if (request.action === 'reportSuccessfulCode') {
    const site = request.hostname.replace('www.', '');
    saveCouponToFirebase(site, request.code);
    sendResponse({ status: "received" });
    return true;
  }
});
