// [[ARABIC_HEADER]] هذا الملف (public/js/theme-interactions.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// ======== Theme Toggle System ========
class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.createThemeToggle();
    this.setupSystemThemeListener();
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    this.currentTheme = theme;
    this.updateThemeIcon();
    this.dispatchThemeChange();
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
  }

  createThemeToggle() {
    const toggle = document.createElement('div');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = '<i class="fas fa-moon"></i>';
    toggle.addEventListener('click', () => this.toggleTheme());
    document.body.appendChild(toggle);
  }

  updateThemeIcon() {
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
      icon.className = this.currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  setupSystemThemeListener() {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addListener((e) => {
        if (!localStorage.getItem('theme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  dispatchThemeChange() {
    const event = new CustomEvent('themeChange', { detail: { theme: this.currentTheme } });
    document.dispatchEvent(event);
  }
}

// ======== Enhanced Interactions ========
class InteractionManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupCardInteractions();
    this.setupButtonInteractions();
    this.setupScrollAnimations();
    this.setupLoadingStates();
  }

  setupCardInteractions() {
    document.querySelectorAll('.card, .luxury-card').forEach(card => {
      card.classList.add('interactive-card', 'gpu-accelerated');
      
      card.addEventListener('mouseenter', () => {
        card.classList.add('will-change-transform');
      });
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('will-change-transform');
      });
    });
  }

  setupButtonInteractions() {
    document.querySelectorAll('button, .btn, .luxury-button').forEach(button => {
      button.classList.add('interactive-button');
      
      button.addEventListener('click', (e) => {
        this.createRippleEffect(e, button);
      });
    });
  }

  createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.35);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up, .slide-in-left, .slide-in-right').forEach(el => {
      observer.observe(el);
    });
  }

  setupLoadingStates() {
    // Add loading states for dynamic content
    this.showLoading = (element) => {
      element.classList.add('loading');
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      element.appendChild(spinner);
    };

    this.hideLoading = (element) => {
      element.classList.remove('loading');
      const spinner = element.querySelector('.loading-spinner');
      if (spinner) spinner.remove();
    };
  }
}

// ======== Notification System ========
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.container = this.createNotificationContainer();
  }

  createNotificationContainer() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  show(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${this.getIconForType(type)}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    this.addNotificationStyles(notification);
    this.container.appendChild(notification);
    this.setupNotificationEvents(notification, duration);
    
    return notification;
  }

  getIconForType(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  addNotificationStyles(notification) {
    notification.style.cssText = `
      background: var(--bg-card, #ffffff);
      border: 2px solid var(--border-gold, rgba(11, 31, 58, 0.18));
      border-radius: var(--radius-md, 12px);
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: var(--shadow-gold, 0 10px 30px rgba(11, 31, 58, 0.18));
      backdrop-filter: blur(10px);
      transform: translateX(100%);
      opacity: 0;
      transition: var(--transition-smooth, all 0.3s ease);
      pointer-events: all;
      max-width: 400px;
    `;

    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-primary, #0b1f3a);
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: var(--text-muted, rgba(11, 31, 58, 0.65));
      cursor: pointer;
      padding: 4px;
      margin-right: 8px;
    `;
  }

  setupNotificationEvents(notification, duration) {
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }, 100);

    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.remove(notification));

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.remove(notification), duration);
    }
  }

  remove(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 400);
  }
}

// ======== Initialize Everything ========
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
  window.interactionManager = new InteractionManager();
  window.notificationManager = new NotificationManager();
  
  // Add global notification helper
  window.showNotification = (message, type, duration) => {
    return window.notificationManager.show(message, type, duration);
  };
});

// ======== Add CSS for ripple effect ========
const rippleCSS = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.notification-container .notification:hover {
  transform: translateX(0) scale(1.02);
}

.animate-in {
  animation: fade-in-up 0.6s ease-out forwards;
}
`;

const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);
