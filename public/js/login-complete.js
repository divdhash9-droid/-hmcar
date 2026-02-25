// [[ARABIC_HEADER]] هذا الملف (public/js/login-complete.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// Simple Login System - HM CAR
document.addEventListener('DOMContentLoaded', function() {
    
    // Role switching function
    window.switchRole = function(role) {
        console.log('Switching to role:', role);
        
        // Update URL
        const newUrl = role === 'admin' ? '/auth/login?admin=true' : '/auth/login';
        window.location.href = newUrl;
    };
    
    // Handle form submission - NO PREVENT DEFAULT
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            console.log('Form submitted!');
            
            // Just show loading state, let form submit normally
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
            }
            
            // Don't prevent default - let it submit normally
        });
    }
    
    console.log('Login script loaded');
});
