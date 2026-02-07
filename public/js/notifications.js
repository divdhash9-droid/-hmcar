// [[ARABIC_HEADER]] هذا الملف (public/js/notifications.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// public/js/notifications.js
// Handle real-time notifications via WebSocket

document.addEventListener('DOMContentLoaded', function() {
  const socket = io();

  // Join user room if logged in
  <% if (currentUser) { %>
    socket.emit('join', { userId: '<%= currentUser._id %>' });
  <% } %>

  // Listen for notifications
  socket.on('notification', function(data) {
    showNotification(data);
  });

  function showNotification(data) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'alert alert-info alert-dismissible fade show position-fixed';
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
      <strong>${data.title}</strong><br>
      ${data.message}
      ${data.actionUrl ? `<br><a href="${data.actionUrl}" class="alert-link">${data.actionText}</a>` : ''}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);

    // Play sound if available
    try {
      const audio = new Audio('/public/sounds/notification.mp3');
      audio.play().catch(() => {}); // Ignore if sound fails
    } catch (e) {}
  }

  // Update notification badge
  socket.on('notification-count', function(count) {
    const badge = document.querySelector('[data-notification-badge]');
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
  });
});