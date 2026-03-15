// content_main.js
// Runs in the MAIN world to intercept fetch/XHR
(function() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const url = args[0];
        if (typeof url === 'string' && url.includes('switch.json')) {
            console.log('[X-Redirect-Main] Switch detected via fetch:', url);
            window.dispatchEvent(new CustomEvent('X_ACCOUNT_SWITCH_DETECTED', { detail: { url } }));
        }
        return originalFetch.apply(this, args);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && url.includes('switch.json')) {
            console.log('[X-Redirect-Main] Switch detected via XHR:', url);
            window.dispatchEvent(new CustomEvent('X_ACCOUNT_SWITCH_DETECTED', { detail: { url } }));
        }
        return originalOpen.apply(this, arguments);
    };
    
    console.log('[X-Redirect-Main] Fetch/XHR interceptors active');
})();
