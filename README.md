# Checkout Coupon Tester

A production-ready Chrome extension that automatically tests promo codes during checkout on major e-commerce platforms.

## Installation for Development

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `checkout_coupon_tester` directory.

## Architecture

* `manifest.json`: Configuration using Manifest V3 standards.
* `background.js`: Service worker that fetches and caches the latest coupon codes (using a mock API for demonstration).
* `content.js`: Injected script that detects checkout input fields and sequentially applies codes.
* `popup.html/js`: The user interface for triggering the testing process.

## How it Works

1. When navigating to a supported e-commerce site, click the extension icon.
2. The extension uses heuristics (checking input names and IDs like 'promo', 'coupon') to locate the discount field.
3. It fetches cached codes from local storage.
4. It iterates through the codes, typing them into the field and clicking the Apply button, observing the DOM for success messages.

## Publishing to the Chrome Web Store

Before publishing:
1. Replace the mock data in `background.js` with real `fetch()` calls to your backend API.
2. Add custom branded icons (`icon-16.png`, `icon-48.png`, `icon-128.png`) into the root directory.
3. Zip the entire directory and upload it to the Chrome Developer Dashboard.
