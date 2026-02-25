// [[ARABIC_HEADER]] هذا الملف (public/js/login-secure.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// Secure Login System - HM CAR
document.addEventListener('DOMContentLoaded', function() {
    
    // Role switching function
    window.switchRole = function(role) {
        console.log('Switching to role:', role);
        
        // Update URL
        const newUrl = role === 'admin' ? '/auth/login?admin=true' : '/auth/login';
        window.location.href = newUrl;
    };
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            console.log('Form submitted!');
            
            // Show loading state
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.classList.add('is-clicked');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
            }
            
            // Add device info to form
            addDeviceInfoToForm(this);
            
            // Let form submit normally
        });
    }
    
    // Add device information to form
    function addDeviceInfoToForm(form) {
        // Create device fingerprint
        const deviceInfo = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: Date.now()
        };
        
        // Add device info as hidden field
        let deviceField = document.getElementById('deviceInfo');
        if (!deviceField) {
            deviceField = document.createElement('input');
            deviceField.type = 'hidden';
            deviceField.name = 'deviceInfo';
            deviceField.id = 'deviceInfo';
            form.appendChild(deviceField);
        }
        
        deviceField.value = JSON.stringify(deviceInfo);
        
        console.log('Device info added:', deviceInfo);
    }
    
    // Show device binding warning
    const deviceWarning = document.getElementById('deviceWarning');
    if (deviceWarning) {
        deviceWarning.style.display = 'block';
    }
    
    console.log('Secure login system loaded');
});
