// public/js/language-switcher.js - Language switcher functionality
document.addEventListener('DOMContentLoaded', function() {
    // Language switcher buttons
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('href').split('lang=')[1];
            // Redirect with language parameter (preserve other query params)
            const url = new URL(window.location.href);
            url.searchParams.set('lang', lang);
            window.location.href = url.toString();
        });
    });

    // Keep language consistent across pages:
    // - If URL has ?lang=, store it
    // - Otherwise, if localStorage has a preferred language, inject ?lang= to make server render same locale
    const url = new URL(window.location.href);
    const langParam = url.searchParams.get('lang');
    if (langParam && ['ar', 'en'].includes(langParam)) {
        localStorage.setItem('preferredLanguage', langParam);
        return;
    }

    const preferred = localStorage.getItem('preferredLanguage');
    if (preferred && ['ar', 'en'].includes(preferred)) {
        url.searchParams.set('lang', preferred);
        window.location.replace(url.toString());
    }
});