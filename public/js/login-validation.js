// [[ARABIC_HEADER]] هذا الملف (public/js/login-validation.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// Enhanced Form Validation for HM CAR Login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    // Initialize validation state
    let validationState = {
        currentRole: '<%= isAdmin ? "admin" : "buyer" %>',
        isInitialized: false
    };

    // Enhanced role switching function
    window.switchRole = function(role) {
        console.log('Switching to role:', role);

        const roleBtns = document.querySelectorAll('.hm-login-3d__role-btn');
        const loginRoleInput = document.querySelector('input[name="loginRole"]');
        const titleElement = document.querySelector('.hm-login-3d__title');
        const subtitleElement = document.querySelector('.hm-login-3d__subtitle');

        // Update button states with animation
        roleBtns.forEach(btn => {
            btn.classList.remove('active');
            btn.style.transform = 'scale(0.95)';
        });

        const activeBtn = role === 'buyer' ? roleBtns[0] : roleBtns[1];
        if (activeBtn) {
            activeBtn.classList.add('active');
            setTimeout(() => {
                activeBtn.style.transform = 'scale(1)';
            }, 150);
        }

        // Update form
        if (loginRoleInput) {
            loginRoleInput.value = role;
        }
        validationState.currentRole = role;

        // Update URL without page reload
        const newUrl = role === 'admin' ? '/auth/login?admin=true' : '/auth/login';
        window.history.pushState({role: role}, '', newUrl);

        // Update UI text with animation
        const formContainer = document.querySelector('.hm-login-3d__form');
        if (formContainer) {
            formContainer.style.opacity = '0';
            formContainer.style.transform = 'translateY(20px)';

            setTimeout(() => {
                if (role === 'admin') {
                    if (titleElement) titleElement.textContent = 'دخول الأدمن';
                    if (subtitleElement) subtitleElement.textContent = 'استخدم البريد وكلمة المرور';
                    switchToAdminMode();
                } else {
                    if (titleElement) titleElement.textContent = 'تسجيل الدخول';
                    if (subtitleElement) subtitleElement.textContent = 'أدخل اسمك الكامل للمتابعة';
                    switchToBuyerMode();
                }

                formContainer.style.opacity = '1';
                formContainer.style.transform = 'translateY(0)';
            }, 300);
        }
    };

    function switchToAdminMode() {
        // Clear all validation states
        clearAllValidation();

        // Get form container
        const formContainer = document.querySelector('.hm-login-3d__form');
        if (!formContainer) return;

        // Remove existing form groups
        const existingGroups = formContainer.querySelectorAll('.hm-login-3d__form-group');
        existingGroups.forEach(group => group.remove());

        // Create admin form fields
        const emailGroup = document.createElement('div');
        emailGroup.className = 'hm-login-3d__form-group';
        emailGroup.innerHTML = `
            <label class="hm-login-3d__form-label">
                <i class="fas fa-envelope"></i> البريد الإلكتروني
            </label>
            <input type="email" name="email" class="hm-login-3d__form-input" placeholder="admin@example.com" autocomplete="email" required>
            <div class="hm-login-3d__error-message" id="emailError"></div>
            <div class="hm-login-3d__success-message" id="emailSuccess"></div>
        `;

        const passwordGroup = document.createElement('div');
        passwordGroup.className = 'hm-login-3d__form-group';
        passwordGroup.innerHTML = `
            <label class="hm-login-3d__form-label">
                <i class="fas fa-lock"></i> كلمة المرور
            </label>
            <input type="password" name="password" class="hm-login-3d__form-input" placeholder="••••••••" autocomplete="current-password" required>
            <div class="hm-login-3d__error-message" id="adminPasswordError"></div>
            <div class="hm-login-3d__success-message" id="adminPasswordSuccess"></div>
        `;

        // Insert after role toggle
        const roleToggle = formContainer.querySelector('.hm-login-3d__role-toggle');
        if (roleToggle) {
            roleToggle.insertAdjacentElement('afterend', emailGroup);
            emailGroup.insertAdjacentElement('afterend', passwordGroup);
        }

        // Update submit button
        updateSubmitButton('admin');

        // Attach admin validation
        attachAdminValidation();
    }

    function switchToBuyerMode() {
        // Clear all validation states
        clearAllValidation();

        // Get form container
        const formContainer = document.querySelector('.hm-login-3d__form');
        if (!formContainer) return;

        // Remove existing form groups
        const existingGroups = formContainer.querySelectorAll('.hm-login-3d__form-group');
        existingGroups.forEach(group => group.remove());

        // Create buyer form fields
        const nameGroup = document.createElement('div');
        nameGroup.className = 'hm-login-3d__form-group';
        nameGroup.innerHTML = `
            <label class="hm-login-3d__form-label">
                <i class="fas fa-user"></i> الاسم الكامل
            </label>
            <input type="text" name="name" class="hm-login-3d__form-input" placeholder="الاسم الأول والاسم الثاني أو القب" autocomplete="name" required>
            <div class="hm-login-3d__error-message" id="nameError"></div>
            <div class="hm-login-3d__success-message" id="nameSuccess"></div>
        `;

        const passwordGroup = document.createElement('div');
        passwordGroup.className = 'hm-login-3d__form-group';
        passwordGroup.innerHTML = `
            <label class="hm-login-3d__form-label">
                <i class="fas fa-lock"></i> كلمة المرور
            </label>
            <input type="password" name="password" class="hm-login-3d__form-input" placeholder="6 أحرف/أرقام أو أكثر" autocomplete="current-password" required>
            <div class="hm-login-3d__error-message" id="passwordError"></div>
            <div class="hm-login-3d__success-message" id="passwordSuccess"></div>
        `;

        // Insert after role toggle
        const roleToggle = formContainer.querySelector('.hm-login-3d__role-toggle');
        if (roleToggle) {
            roleToggle.insertAdjacentElement('afterend', nameGroup);
            nameGroup.insertAdjacentElement('afterend', passwordGroup);
        }

        // Update submit button
        updateSubmitButton('buyer');

        // Attach buyer validation
        attachBuyerValidation();
    }

    function updateSubmitButton(role) {
        if (!submitBtn) return;

        const submitText = document.getElementById('submitText');
        const submitIcon = document.getElementById('submitIcon');

        if (role === 'admin') {
            if (submitText) submitText.textContent = 'دخول المدير';
            if (submitIcon) submitIcon.className = 'fas fa-user-shield';
            submitBtn.className = 'hm-login-3d__submit-btn admin-mode';
        } else {
            if (submitText) submitText.textContent = 'تسجيل الدخول';
            if (submitIcon) submitIcon.className = 'fas fa-sign-in-alt';
            submitBtn.className = 'hm-login-3d__submit-btn buyer-mode';
        }
    }

    function clearAllValidation() {
        // Clear all error and success messages
        const allMessages = document.querySelectorAll('.hm-login-3d__error-message, .hm-login-3d__success-message');
        allMessages.forEach(msg => {
            msg.textContent = '';
            msg.classList.remove('show');
        });

        // Clear all input classes
        const allInputs = document.querySelectorAll('.hm-login-3d__form-input');
        allInputs.forEach(input => {
            input.classList.remove('error', 'success');
        });
    }

    function attachBuyerValidation() {
        const nameInput = document.querySelector('input[name="name"]');
        const passwordInput = document.querySelector('input[name="password"]');

        if (nameInput) {
            nameInput.addEventListener('input', function() {
                validateBuyerName(this);
            });

            nameInput.addEventListener('blur', function() {
                validateBuyerName(this, true);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                validatePassword(this);
            });

            passwordInput.addEventListener('blur', function() {
                validatePassword(this, true);
            });
        }
    }

    function attachAdminValidation() {
        const emailInput = document.querySelector('input[name="email"]');
        const passwordInput = document.querySelector('input[name="password"]');

        if (emailInput) {
            emailInput.addEventListener('input', function() {
                validateEmail(this);
            });

            emailInput.addEventListener('blur', function() {
                validateEmail(this, true);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                validatePassword(this);
            });

            passwordInput.addEventListener('blur', function() {
                validatePassword(this, true);
            });
        }
    }

    function validateBuyerName(input, isBlur = false) {
        const name = input.value.trim();
        const errorElement = document.getElementById('nameError');
        const successElement = document.getElementById('nameSuccess');

        if (!errorElement || !successElement) return;

        if (name.length === 0) {
            if (isBlur) {
                showError(input, errorElement, 'الاسم مطلوب');
            } else {
                clearValidation(input);
            }
            return;
        }

        const nameParts = name.split(/\s+/);
        if (nameParts.length < 2 || nameParts.some(part => part.length < 2)) {
            showError(input, errorElement, 'يجب أن يحتوي الاسم على اسمين على الأقل، كل اسم حرفين على الأقل');
        } else {
            showSuccess(input, successElement, '✓ اسم صحيح');
        }
    }

    function validateEmail(input, isBlur = false) {
        const email = input.value.trim();
        const errorElement = document.getElementById('emailError');
        const successElement = document.getElementById('emailSuccess');

        if (!errorElement || !successElement) return;

        if (email.length === 0) {
            if (isBlur) {
                showError(input, errorElement, 'البريد الإلكتروني مطلوب');
            } else {
                clearValidation(input);
            }
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError(input, errorElement, 'يرجى إدخال بريد إلكتروني صحيح');
        } else {
            showSuccess(input, successElement, '✓ بريد إلكتروني صحيح');
        }
    }

    function validatePassword(input, isBlur = false) {
        const password = input.value;
        const errorElement = input.name === 'password' && validationState.currentRole === 'buyer'
            ? document.getElementById('passwordError')
            : document.getElementById('adminPasswordError');
        const successElement = input.name === 'password' && validationState.currentRole === 'buyer'
            ? document.getElementById('passwordSuccess')
            : document.getElementById('adminPasswordSuccess');

        if (!errorElement || !successElement) return;

        if (password.length === 0) {
            if (isBlur) {
                showError(input, errorElement, 'كلمة المرور مطلوبة');
            } else {
                clearValidation(input);
            }
            return;
        }

        if (password.length < 6) {
            showError(input, errorElement, 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل');
        } else {
            showSuccess(input, successElement, '✓ كلمة مرور قوية');
        }
    }

    function showError(input, errorElement, message) {
        input.classList.remove('success');
        input.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        
        // Hide success message if exists
        const successElement = input.parentElement.querySelector('.hm-login-3d__success-message');
        if (successElement) {
            successElement.classList.remove('show');
        }
    }

    function showSuccess(input, successElement, message) {
        input.classList.remove('error');
        input.classList.add('success');
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.add('show');
        }
        
        // Hide error message if exists
        const errorElement = input.parentElement.querySelector('.hm-login-3d__error-message');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    function clearValidation(input) {
        input.classList.remove('error', 'success');
        const errorElement = input.parentElement.querySelector('.hm-login-3d__error-message');
        const successElement = input.parentElement.querySelector('.hm-login-3d__success-message');
        if (errorElement) errorElement.classList.remove('show');
        if (successElement) successElement.classList.remove('show');
    }

    // Initialize on page load
    function initializeValidation() {
        const loginRoleInput = document.querySelector('input[name="loginRole"]');
        if (loginRoleInput) {
            const currentRole = loginRoleInput.value;
            validationState.currentRole = currentRole;

            if (currentRole === 'admin') {
                switchToAdminMode();
            } else {
                switchToBuyerMode();
            }
        }

        validationState.isInitialized = true;
    }

    // Add shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(style);

    // Initialize
    initializeValidation();
});
