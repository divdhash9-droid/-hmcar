// [[ARABIC_HEADER]] هذا الملف (public/js/ios-interactions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// iOS Interactions - HM CAR
// تفاعلات iOS متقدمة للمشروع

class iOSInteractions {
  constructor() {
    this.init();
  }

  init() {
    this.setupHapticFeedback();
    this.setupButtonInteractions();
    this.setupScrollAnimations();
    this.setupGestures();
    this.setupMicroInteractions();
    this.setupLoadingStates();
    this.setupNotifications();
  }

  // ===== Haptic Feedback =====
  setupHapticFeedback() {
    // Simulate haptic feedback for touch devices
    document.addEventListener('touchstart', (e) => {
      const element = e.target.closest('.ios-haptic, .ios-btn, .ios-list-item');
      if (element) {
        this.triggerHaptic('light');
      }
    });

    // Mouse haptic simulation
    document.addEventListener('mousedown', (e) => {
      const element = e.target.closest('.ios-haptic, .ios-btn, .ios-list-item');
      if (element) {
        this.triggerHaptic('light');
      }
    });
  }

  triggerHaptic(type = 'light') {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate(30);
          break;
        case 'success':
          navigator.vibrate([10, 50, 10]);
          break;
        case 'error':
          navigator.vibrate([50, 30, 50, 30, 50]);
          break;
      }
    }
  }

  // ===== Button Interactions =====
  setupButtonInteractions() {
    // Enhanced button press effects
    document.addEventListener('mousedown', (e) => {
      const button = e.target.closest('.ios-btn');
      if (button) {
        this.animateButtonPress(button);
      }
    });

    document.addEventListener('mouseup', (e) => {
      const button = e.target.closest('.ios-btn');
      if (button) {
        this.animateButtonRelease(button);
      }
    });

    // Ripple effect for buttons
    document.addEventListener('click', (e) => {
      const button = e.target.closest('.ios-btn');
      if (button) {
        this.createRippleEffect(button, e);
      }
    });
  }

  animateButtonPress(button) {
    button.style.transform = 'scale(0.96)';
    button.style.transition = 'transform 0.1s ease-out';
  }

  animateButtonRelease(button) {
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 100);
  }

  createRippleEffect(button, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ios-ripple';
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // ===== Scroll Animations =====
  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.ios-animate-fade-in, .ios-slide-up, .ios-scale-in').forEach(el => {
      observer.observe(el);
    });
  }

  animateElement(element) {
    element.classList.add('ios-animate-active');
    
    // Stagger animation for multiple elements
    const parent = element.parentElement;
    if (parent && parent.classList.contains('ios-stagger-container')) {
      const siblings = parent.querySelectorAll('.ios-stagger-item');
      siblings.forEach((sibling, index) => {
        setTimeout(() => {
          sibling.classList.add('ios-animate-active');
        }, index * 100);
      });
    }
  }

  // ===== Gesture Support =====
  setupGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      this.handleSwipeGesture(touchStartX, touchStartY, touchEndX, touchEndY);
    });
  }

  handleSwipeGesture(startX, startY, endX, endY) {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          this.onSwipeRight();
        } else {
          this.onSwipeLeft();
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          this.onSwipeDown();
        } else {
          this.onSwipeUp();
        }
      }
    }
  }

  onSwipeLeft() {
    // Handle swipe left
    console.log('Swipe left detected');
  }

  onSwipeRight() {
    // Handle swipe right
    console.log('Swipe right detected');
  }

  onSwipeUp() {
    // Handle swipe up
    console.log('Swipe up detected');
  }

  onSwipeDown() {
    // Handle swipe down
    console.log('Swipe down detected');
  }

  // ===== Micro Interactions =====
  setupMicroInteractions() {
    // Input focus effects
    document.querySelectorAll('.ios-input').forEach(input => {
      input.addEventListener('focus', () => {
        this.animateInputFocus(input);
      });

      input.addEventListener('blur', () => {
        this.animateInputBlur(input);
      });
    });

    // Card hover effects
    document.querySelectorAll('.ios-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        this.animateCardHover(card, true);
      });

      card.addEventListener('mouseleave', () => {
        this.animateCardHover(card, false);
      });
    });

    // List item interactions
    document.querySelectorAll('.ios-list-item').forEach(item => {
      item.addEventListener('click', () => {
        this.animateListItemClick(item);
      });
    });
  }

  animateInputFocus(input) {
    input.parentElement.classList.add('ios-input-focused');
  }

  animateInputBlur(input) {
    input.parentElement.classList.remove('ios-input-focused');
  }

  animateCardHover(card, isHover) {
    if (isHover) {
      card.style.transform = 'translateY(-4px)';
      card.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
    } else {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
    }
  }

  animateListItemClick(item) {
    item.style.transform = 'scale(0.98)';
    setTimeout(() => {
      item.style.transform = 'scale(1)';
    }, 150);
  }

  // ===== Loading States =====
  setupLoadingStates() {
    // Auto-loading states for forms
    document.querySelectorAll('form').forEach(form => {
      form.addEventListener('submit', (e) => {
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
          this.setButtonLoading(submitButton, true);
        }
      });
    });
  }

  setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('ios-loading');
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.classList.remove('ios-loading');
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  // ===== Notifications =====
  setupNotifications() {
    // Auto-hide notifications
    document.querySelectorAll('.ios-notification').forEach(notification => {
      setTimeout(() => {
        this.hideNotification(notification);
      }, 5000);
    });

    // Close button for notifications
    document.querySelectorAll('.ios-notification-close').forEach(button => {
      button.addEventListener('click', () => {
        const notification = button.closest('.ios-notification');
        this.hideNotification(notification);
      });
    });
  }

  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `ios-notification ios-notification-${type} ios-notification-slide`;
    notification.innerHTML = `
      <div class="ios-notification-content">
        <div class="ios-notification-message">${message}</div>
        <button class="ios-notification-close">&times;</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-hide
    setTimeout(() => {
      this.hideNotification(notification);
    }, duration);

    // Close button
    notification.querySelector('.ios-notification-close').addEventListener('click', () => {
      this.hideNotification(notification);
    });

    return notification;
  }

  hideNotification(notification) {
    notification.style.animation = 'ios-notification-slide-out 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  // ===== Utility Methods =====
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ===== Page Transitions =====
  animatePageTransition(callback) {
    document.body.style.opacity = '0';
    document.body.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
      if (callback) callback();
      
      document.body.style.opacity = '1';
      document.body.style.transform = 'scale(1)';
    }, 300);
  }

  // ===== Smooth Scroll =====
  smoothScrollTo(element, offset = 0) {
    const targetPosition = element.offsetTop - offset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 500;
    let start = null;

    const animation = (currentTime) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  }

  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
}

// ===== Initialize iOS Interactions =====
document.addEventListener('DOMContentLoaded', () => {
  window.iOSInteractions = new iOSInteractions();
});

// ===== Global Functions =====
window.showiOSNotification = function(message, type, duration) {
  if (window.iOSInteractions) {
    return window.iOSInteractions.showNotification(message, type, duration);
  }
};

window.setiOSButtonLoading = function(button, isLoading) {
  if (window.iOSInteractions) {
    window.iOSInteractions.setButtonLoading(button, isLoading);
  }
};

window.smoothScrollTo = function(element, offset) {
  if (window.iOSInteractions) {
    window.iOSInteractions.smoothScrollTo(element, offset);
  }
};
