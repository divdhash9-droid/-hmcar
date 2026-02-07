// [[ARABIC_HEADER]] هذا الملف (public/js/advanced-animations.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

class AdvancedAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupParallaxEffects();
    this.setupMicroInteractions();
    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupLoadingAnimations();
  }

  // Intersection Observer for scroll animations
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll, .stagger-animation > *').forEach(el => {
      observer.observe(el);
    });
  }

  animateElement(element) {
    const animationType = element.dataset.animation || 'slide-in-up';
    const duration = element.dataset.duration || '0.6s';
    const delay = element.dataset.delay || '0s';

    element.style.animation = `${animationType} ${duration} cubic-bezier(0.4, 0, 0.2, 1) ${delay} forwards`;
  }

  // Parallax scrolling effects
  setupParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.parallax-element');
    
    if (parallaxElements.length === 0) return;

    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const windowHeight = window.innerHeight;

      parallaxElements.forEach(element => {
        const speed = element.dataset.speed || 0.5;
        const yPos = -(scrolled * speed);
        
        element.style.transform = `translateY(${yPos}px)`;
      });

      ticking = false;
    };

    const requestTick = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestTick);
  }

  // Micro-interactions
  setupMicroInteractions() {
    // Button press effects
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-animated')) {
        this.createRipple(e.target, e);
      }
    });

    // Card hover effects
    document.querySelectorAll('.card-hover').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.cardHoverEffect(e.target, true);
      });

      card.addEventListener('mouseleave', (e) => {
        this.cardHoverEffect(e.target, false);
      });
    });

    // Form interactions
    document.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('focus', (e) => {
        e.target.parentElement.classList.add('input-focused');
      });

      input.addEventListener('blur', (e) => {
        e.target.parentElement.classList.remove('input-focused');
      });
    });
  }

  createRipple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  cardHoverEffect(card, isHovering) {
    if (isHovering) {
      card.style.transform = 'translateY(-10px) scale(1.02)';
      card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
      
      // Add glow effect
      if (card.classList.contains('glow-effect')) {
        card.style.boxShadow = '0 20px 40px rgba(11, 31, 58, 0.25)';
      }
    } else {
      card.style.transform = 'translateY(0) scale(1)';
      card.style.boxShadow = '';
    }
  }

  // Scroll animations
  setupScrollAnimations() {
    let lastScrollTop = 0;
    let scrollDirection = 'down';

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      if (scrollTop > lastScrollTop) {
        scrollDirection = 'down';
      } else {
        scrollDirection = 'up';
      }

      lastScrollTop = scrollTop;

      // Hide/show header on scroll
      this.handleHeaderScroll(scrollDirection, scrollTop);

      // Progress bar
      this.updateScrollProgress(scrollTop);
    });
  }

  handleHeaderScroll(direction, scrollTop) {
    const header = document.querySelector('header');
    if (!header) return;

    if (direction === 'down' && scrollTop > 100) {
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.transform = 'translateY(0)';
    }
  }

  updateScrollProgress(scrollTop) {
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    progressBar.style.width = scrolled + '%';
  }

  // Hover effects
  setupHoverEffects() {
    // Image zoom on hover
    document.querySelectorAll('.image-zoom').forEach(img => {
      img.addEventListener('mouseenter', (e) => {
        e.target.style.transform = 'scale(1.1)';
      });

      img.addEventListener('mouseleave', (e) => {
        e.target.style.transform = 'scale(1)';
      });
    });

    // Text effects
    document.querySelectorAll('.text-hover').forEach(text => {
      text.addEventListener('mouseenter', (e) => {
        e.target.style.color = 'var(--primary-color)';
        e.target.style.transform = 'translateX(5px)';
      });

      text.addEventListener('mouseleave', (e) => {
        e.target.style.color = '';
        e.target.style.transform = 'translateX(0)';
      });
    });
  }

  // Loading animations
  setupLoadingAnimations() {
    // Show loading state
    window.showLoading = (target) => {
      const loader = document.createElement('div');
      loader.className = 'loading-spinner';
      loader.innerHTML = '<div class="spinner"></div>';
      
      if (target) {
        target.appendChild(loader);
      } else {
        document.body.appendChild(loader);
      }
      
      return loader;
    };

    // Hide loading state
    window.hideLoading = (loader) => {
      if (loader) {
        loader.remove();
      }
    };

    // Skeleton loading
    window.showSkeleton = (target, count = 3) => {
      const skeleton = document.createElement('div');
      skeleton.className = 'skeleton-container';
      
      for (let i = 0; i < count; i++) {
        const item = document.createElement('div');
        item.className = 'skeleton-item';
        skeleton.appendChild(item);
      }
      
      target.appendChild(skeleton);
      return skeleton;
    };
  }

  // Staggered animations for lists
  staggerAnimation(elements, delay = 100) {
    elements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-in');
      }, index * delay);
    });
  }

  // Page transitions
  pageTransition(direction = 'forward') {
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);

    return new Promise(resolve => {
      setTimeout(() => {
        overlay.classList.remove('active');
        setTimeout(() => {
          overlay.remove();
          resolve();
        }, 300);
      }, 300);
    });
  }

  // Notification animations
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto hide
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  // Performance monitoring
  measurePerformance(element, animationName) {
    const startTime = performance.now();
    
    element.addEventListener('animationend', () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`${animationName} animation took ${duration.toFixed(2)}ms`);
    });
  }

  // Reduce motion for accessibility
  respectReducedMotion() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.add('reduced-motion');
    }
  }
}

// Initialize advanced animations
document.addEventListener('DOMContentLoaded', () => {
  window.advancedAnimations = new AdvancedAnimations();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedAnimations;
}
