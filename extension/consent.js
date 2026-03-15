document.addEventListener('DOMContentLoaded', () => {
    function applyI18n() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const message = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
            if (message) el.textContent = message;
        });
    }
    applyI18n();

    const checkbox = document.getElementById('agreeCheckbox');
    const button = document.getElementById('agreeBtn');

    checkbox.addEventListener('change', () => {
        button.disabled = !checkbox.checked;
    });

    button.addEventListener('click', () => {
        chrome.storage.local.set({ consented: true }, () => {
            // No alert needed for better UX, or use optional localization
            window.close();
        });
    });
});
