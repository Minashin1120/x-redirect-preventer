# X Account Redirect Preventer

Prevents X (Twitter) from automatically redirecting to /home after an account switch.

## Description
This extension monitors API calls to detect account switches and ensures you stay on your current page by preventing the mandatory redirect to the Home feed.

## Features
- **Ultra-fast redirection**: Using Chrome's `declarativeNetRequest` and `webNavigation` APIs.
- **Bilingual support**: English & Japanese UI.
- **Privacy focused**: No DOM manipulation, local-only data processing.
- **Detailed Logging**: Built-in debug logs for troubleshooting.

## Directory Structure
- `/extension`: The Chrome extension source code.
- `/website`: The policy website and documentation (deployed via Cloudflare Pages).

## Installation (Development mode)
1. Download or clone this repository.
2. Go to `chrome://extensions/` in your browser.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the `extension` folder.

## License
MIT