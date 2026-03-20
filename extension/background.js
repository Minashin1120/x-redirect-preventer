// X Account Redirect Preventer - Background Script (Ultra-Persistent Version)

// --- HELPER: LOGGING ---
async function logEvent(data) {
    const timestamp = new Date().toISOString();
    const logEntry = { t: timestamp, ...data };
    console.log('[X-Redirect-Log]', logEntry);
    
    try {
        const res = await chrome.storage.local.get(['logs']);
        const logs = res.logs || [];
        logs.push(logEntry);
        if (logs.length > 500) logs.shift(); // Increased log limit
        await chrome.storage.local.set({ logs: logs });
    } catch (e) {
        console.error('Logging failed', e);
    }
}

// --- STATE MANAGEMENT (Storage-Based) ---
async function setTabState(tabId, data) {
    const key = `tab_${tabId}`;
    const res = await chrome.storage.local.get([key]);
    const newState = { ...(res[key] || {}), ...data };
    await chrome.storage.local.set({ [key]: newState });
}

async function getTabState(tabId) {
    const key = `tab_${tabId}`;
    const res = await chrome.storage.local.get([key]);
    return res[key] || {};
}

// --- URL TRACKING ---
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    
    const url = details.url;
    if (url && (url.includes('x.com') || url.includes('twitter.com'))) {
        const isHome = !!url.match(/https?:\/\/(x|twitter)\.com\/home/);
        const state = await getTabState(details.tabId);
        
        if (!isHome || !state.switchPending) {
            await setTabState(details.tabId, { lastGoodUrl: url });
            logEvent({ event: 'TRACK_URL_NAV', tabId: details.tabId, url, isHome });
        }
        
        if (isHome) {
            logEvent({ event: 'HOME_LOADED_NAV', tabId: details.tabId, pending: !!state.switchPending });
            // Immediate check for pending switch
            if (state.switchPending && (Date.now() - state.switchPending < 30000)) {
                triggerReturn(details.tabId, "WebNav Committed (Immediate)");
            }
        }
    }
});

// Layer 2: API Interception (Network Level Fallback)
chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        if (details.tabId === chrome.tabs.TAB_ID_NONE) return;
        
        const res = await chrome.storage.local.get(['consented']);
        if (!res.consented) return;

        const state = await getTabState(details.tabId);
        logEvent({ event: 'SWITCH_API_WEB_REQUEST', tabId: details.tabId, hasUrl: !!state.lastGoodUrl });
        
        if (state.lastGoodUrl) {
            await detectSwitch(details.tabId, state.lastGoodUrl, "Web Request");
        }
    },
    { urls: ["*://*.x.com/1.1/account/multi/switch.json*", "*://*.twitter.com/i/api/1.1/account/multi/switch.json*"] }
);

async function detectSwitch(tabId, returnUrl, source) {
    logEvent({ event: 'SWITCH_DETECTED', source, tabId, returnUrl });
    await setTabState(tabId, { switchPending: Date.now() });
    setupDNR(tabId, returnUrl);
}

// --- CORE ACTIONS ---
async function triggerReturn(tabId, source) {
    const res = await chrome.storage.local.get(['consented']);
    const state = await getTabState(tabId);
    
    if (res.consented && state.lastGoodUrl) {
        logEvent({ event: 'TRIGGER_RETURN', source, tabId, target: state.lastGoodUrl });
        await setTabState(tabId, { switchPending: null });
        chrome.tabs.update(tabId, { url: state.lastGoodUrl });
        // Clean up DNR (Session Rule)
        chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId + 5000] });
    } else {
        logEvent({ event: 'RETURN_SKIPPED', tabId, source, consented: !!res.consented, hasUrl: !!state.lastGoodUrl });
    }
}

function setupDNR(tabId, targetUrl) {
    const ruleId = tabId + 5000;
    logEvent({ event: 'SETUP_DNR', tabId, ruleId, target: targetUrl });
    chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [ruleId],
        addRules: [{
            id: ruleId,
            priority: 10,
            action: { type: 'redirect', redirect: { url: targetUrl } },
            condition: {
                urlFilter: "*/home*",
                tabIds: [tabId],
                resourceTypes: ['main_frame']
            }
        }]
    });
    // Long cleanup to ensure it catches reloads
    setTimeout(() => {
        chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId] });
    }, 30000);
}

// Inter-script Communication
chrome.runtime.onMessage.addListener(async (msg, sender) => {
    if (!sender.tab) return;
    const tabId = sender.tab.id;

    if (msg.type === 'SWITCH_API_DETECTED_CS') {
        const state = await getTabState(tabId);
        if (state.lastGoodUrl) {
            await detectSwitch(tabId, state.lastGoodUrl, "Content Script (Fetch)");
        } else {
            logEvent({ event: 'SWITCH_DETECTED_NO_URL', tabId });
        }
    } else if (msg.type === 'URL_CHANGE_SPA' || msg.type === 'TRACK_URL_CS') {
        const urlRequest = msg.newUrl || msg.url;
        const isHome = !!urlRequest.match(/https?:\/\/(x|twitter)\.com\/home/);
        
        if (!isHome || !state.switchPending) {
            await setTabState(tabId, { lastGoodUrl: urlRequest });
            if (msg.type === 'URL_CHANGE_SPA') logEvent({ event: 'TRACK_URL_SPA', tabId, url: urlRequest, isHome });
        }
        
        if (isHome) {
            const state = await getTabState(tabId);
            logEvent({ event: 'HOME_DETECTED_CS', tabId, type: msg.type, pending: !!state.switchPending });
            if (state.switchPending && (Date.now() - state.switchPending < 30000)) {
                triggerReturn(tabId, `Content Script (${msg.type})`);
            }
        }
    }
});

// Cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(`tab_${tabId}`);
    chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: [tabId + 5000] });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.create({ url: 'consent.html' });
    logEvent({ event: 'EXTENSION_INSTALLED' });
});

logEvent({ event: 'SERVICE_WORKER_STARTUP' });
