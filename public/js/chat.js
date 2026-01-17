// [[ARABIC_HEADER]] هذا الملف (public/js/chat.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// public/js/chat.js - Chat functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;

    // Initialize chat functionality
    console.log('Chat system initialized');

    // Add event listeners for chat features
    const sendButton = document.querySelector('.send-message');
    const messageInput = document.querySelector('.message-input');

    if (sendButton && messageInput) {
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            // Send message logic here
            console.log('Sending message:', message);
            messageInput.value = '';
        }
    }
});

// Language switcher functionality
document.addEventListener('DOMContentLoaded', function() {
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const lang = this.getAttribute('href').split('lang=')[1];
            // Redirect with language parameter
            window.location.href = `${window.location.pathname}?lang=${lang}`;
        });
    });

    console.log('Language switcher initialized');
});