// [[ARABIC_HEADER]] هذا الملف (public/js/language-switcher.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// public/js/language-switcher.js - Global Language switcher functionality
(function() {
    'use strict';
    
    // Get current language from URL or localStorage
    function getCurrentLanguage() {
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && ['ar', 'en'].includes(urlLang)) {
            return urlLang;
        }
        return localStorage.getItem('preferredLanguage') || 'ar';
    }
    
    // Set language globally
    function setLanguage(lang) {
        if (!['ar', 'en'].includes(lang)) return;
        
        localStorage.setItem('preferredLanguage', lang);
        
        // Update URL and reload to apply server-side rendering
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.location.href = url.toString();
    }
    
    // Expose global function for language toggle
    window.switchLanguage = function(lang) {
        setLanguage(lang);
    };
    
    window.toggleGlobalLanguage = function() {
        const current = getCurrentLanguage();
        const newLang = current === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
    };
    
    document.addEventListener('DOMContentLoaded', function() {
        // Language switcher buttons (legacy support)
        const langBtns = document.querySelectorAll('.lang-btn');
        langBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const href = this.getAttribute('href');
                if (href && href.includes('lang=')) {
                    const lang = href.split('lang=')[1].split('&')[0];
                    setLanguage(lang);
                }
            });
        });
        
        // Check if we need to sync language
        const url = new URL(window.location.href);
        const langParam = url.searchParams.get('lang');
        const storedLang = localStorage.getItem('preferredLanguage');
        
        // If URL has lang param, store it
        if (langParam && ['ar', 'en'].includes(langParam)) {
            localStorage.setItem('preferredLanguage', langParam);
            return;
        }
        
        // If no URL param but we have stored preference, apply it
        if (!langParam && storedLang && ['ar', 'en'].includes(storedLang)) {
            url.searchParams.set('lang', storedLang);
            window.location.replace(url.toString());
        }
    });
})();