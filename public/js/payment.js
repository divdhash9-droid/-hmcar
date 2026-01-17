// [[ARABIC_HEADER]] هذا الملف (public/js/payment.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// public/js/payment.js - Payment processing
document.addEventListener('DOMContentLoaded', function() {
    const paymentForm = document.querySelector('.payment-form');
    if (!paymentForm) return;

    console.log('Payment system initialized');

    // Initialize payment form validation
    const cardNumber = document.querySelector('#card-number');
    const expiryDate = document.querySelector('#expiry-date');
    const cvv = document.querySelector('#cvv');
    const submitBtn = document.querySelector('.payment-submit');

    if (cardNumber) {
        cardNumber.addEventListener('input', formatCardNumber);
    }

    if (expiryDate) {
        expiryDate.addEventListener('input', formatExpiryDate);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', processPayment);
    }

    function formatCardNumber(e) {
        let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
    }

    function formatExpiryDate(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }

    function processPayment(e) {
        e.preventDefault();

        // Basic validation
        if (!cardNumber.value || !expiryDate.value || !cvv.value) {
            alert('يرجى ملء جميع الحقول');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري المعالجة...';

        // Simulate payment processing
        setTimeout(() => {
            alert('تمت المعالجة بنجاح!');
            submitBtn.disabled = false;
            submitBtn.textContent = 'دفع';
        }, 2000);
    }
});