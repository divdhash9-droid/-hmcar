// [[ARABIC_HEADER]] هذا الملف (public/js/login-normal.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// Simple Login Form Handler - HM CAR
document.addEventListener('DOMContentLoaded', function() {
    
    // Role switching function
    window.switchRole = function(role) {
        console.log('Switching to role:', role);
        
        // Update URL
        const newUrl = role === 'admin' ? '/auth/login?admin=true' : '/auth/login';
        window.location.href = newUrl;
    };
    
    // Handle form submission normally
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // Let the form submit normally
            // Don't prevent default behavior
            
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                const submitText = document.getElementById('submitText');
                const submitIcon = document.getElementById('submitIcon');
                if (submitText) submitText.textContent = 'جاري تسجيل الدخول...';
                if (submitIcon) submitIcon.className = 'fas fa-spinner fa-spin';
            }
        });
    }
    
    // Store original button text
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        const submitText = document.getElementById('submitText');
        if (submitText) {
            submitBtn.dataset.originalText = submitText.textContent;
        }
    }
});
