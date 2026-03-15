# X Account Redirect Preventer

Prevents X (Twitter) from automatically redirecting to /home after an account switch.

## Description
This extension monitors API calls to detect account switches and ensures you stay on your current page by preventing the mandatory redirect to the Home feed.

## Features
- Ultra-fast redirection using Chrome's `declarativeNetRequest` and `webNavigation` APIs.
- Bilingual support (English & Japanese).
- No DOM manipulation (safe for account security).
- Local-only data processing.

## Installation (Development mode)
1. Download or clone this repository.
2. Go to `chrome://extensions/` in your browser.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the `extension` folder.

## License
MIT
