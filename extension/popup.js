document.addEventListener('DOMContentLoaded', () => {
    // Localization
    function applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const message = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
            if (message) el.textContent = message;
        });
    }

    const statusDiv = document.getElementById('status');
    const openBtn = document.getElementById('openConsent');
    const downloadBtn = document.getElementById('downloadLogs');

    function updateStatus() {
        chrome.storage.local.get(['consented'], (result) => {
            const label = chrome.i18n.getMessage('popup_status_label') || 'Status: ';
            if (result.consented) {
                const text = chrome.i18n.getMessage('popup_status_active') || 'Active & Protected';
                statusDiv.innerHTML = `${label}<span class="active">${text}</span>`;
            } else {
                const text = chrome.i18n.getMessage('popup_status_inactive') || 'Inactive';
                statusDiv.innerHTML = `${label}<span class="inactive">${text}</span>`;
            }
        });
    }

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'consent.html' });
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                const res = await chrome.storage.local.get(['logs']);
                const logs = res.logs || [];
                const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `x_redirect_logs_${new Date().getTime()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Download failed', e);
            }
        });
    }

    applyI18n();
    updateStatus();
    setInterval(updateStatus, 1000);
});
