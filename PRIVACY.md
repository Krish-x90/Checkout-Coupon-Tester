# Privacy Policy

**Effective Date:** 2026-05-31

## Data Collection

Checkout Coupon Tester is designed with privacy in mind. 
* **Personal Information:** We do not collect, store, or transmit any personally identifiable information (PII) such as your name, email address, or payment details.
* **Browsing Data:** The extension only activates on relevant checkout pages to detect promo code input fields. We do not track your browsing history.
* **Storage:** Coupon codes are cached locally on your device using Chrome's local storage API.

## Permissions Required

* `activeTab`: Used to access the DOM of the active checkout page to find and interact with the coupon input field.
* `scripting`: Required to inject the content script that automates the testing process.
* `storage`: Used to locally cache coupon codes to minimize network requests.
* `alarms`: Used to periodically refresh the coupon database in the background.

If you have any questions or concerns about this privacy policy, please contact the developer.
