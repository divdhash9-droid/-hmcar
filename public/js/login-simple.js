// [[ARABIC_HEADER]] هذا الملف (public/js/login-simple.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// Simple Login Role Switching - HM CAR
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
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitBtn = document.getElementById('submitBtn');
            
            // Show loading state
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
            }
            
            // Submit form
            fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = data.redirect || '/';
                } else {
                    // Show error
                    showError(data.message || 'حدث خطأ في تسجيل الدخول');
                    
                    // Reset button
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        const submitText = document.getElementById('submitText');
                        const submitIcon = document.getElementById('submitIcon');
                        if (submitText) submitText.textContent = submitBtn.dataset.originalText || 'تسجيل الدخول';
                        if (submitIcon) submitIcon.className = 'fas fa-sign-in-alt';
                    }
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                showError('حدث خطأ في الاتصال بالخادم');
                
                // Reset button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    const submitText = document.getElementById('submitText');
                    const submitIcon = document.getElementById('submitIcon');
                    if (submitText) submitText.textContent = submitBtn.dataset.originalText || 'تسجيل الدخول';
                    if (submitIcon) submitIcon.className = 'fas fa-sign-in-alt';
                }
            });
        });
    }
    
    function showError(message) {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Create new alert
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger';
        alert.textContent = message;
        
        // Insert at the top of the form
        const form = document.querySelector('.hm-login-3d__login-card');
        if (form) {
            form.insertBefore(alert, form.firstChild);
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
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
