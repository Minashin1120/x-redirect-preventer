// X Account Redirect Preventer - Isolated Content Script
// This script bridges events between the MAIN world and the Background script.

console.log('[X-Redirect-Isolated] Content script loaded at', window.location.href);

// Listen for custom events from the MAIN world (content_main.js)
window.addEventListener('X_ACCOUNT_SWITCH_DETECTED', (event) => {
    if (!chrome.runtime?.id) return;
    try {
        console.log('[X-Redirect-Isolated] Relay switch detection to background:', event.detail.url);
        chrome.runtime.sendMessage({
            type: 'SWITCH_API_DETECTED_CS',
            url: event.detail.url
        });
    } catch (e) {}
});

// Monitor SPA-style navigation
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
    if (!chrome.runtime?.id) return;
    if (window.location.href !== lastUrl) {
        const oldUrl = lastUrl;
        lastUrl = window.location.href;
        try {
            chrome.runtime.sendMessage({
                type: 'URL_CHANGE_SPA',
                oldUrl: oldUrl,
                newUrl: lastUrl
            });
        } catch (e) {}
    }
});
observer.observe(document, { subtree: true, childList: true });

// Regular heartbeat and immediate report
function sendUrl(type) {
    if (!chrome.runtime?.id) return;
    try {
        chrome.runtime.sendMessage({
            type: type,
            url: window.location.href
        });
    } catch (e) {
        // Context invalidated, ignore
    }
}
sendUrl('TRACK_URL_CS');
setInterval(() => sendUrl('TRACK_URL_CS'), 5000); // 5s is enough for tracking

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'PING') {
        sendResponse({ type: 'PONG', url: window.location.href });
    }
});
