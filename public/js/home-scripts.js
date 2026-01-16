// ============================================
// HM CAR Professional Homepage Scripts
// ============================================

// Language Toggle
let currentLanguage = 'ar';

function toggleLanguage() {
  currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
  updateLanguage();
  localStorage.setItem('preferredLanguage', currentLanguage);
}

function updateLanguage() {
  const elements = document.querySelectorAll('[data-ar][data-en]');
  const langBtn = document.getElementById('currentLang');
  const searchInput = document.querySelector('.hm-search-input-wrap input');
  
  elements.forEach(element => {
    const text = element.getAttribute(`data-${currentLanguage}`);
    element.textContent = text;
  });
  
  if (searchInput) {
    searchInput.placeholder = searchInput.getAttribute(`data-placeholder-${currentLanguage}`);
  }
  
  langBtn.textContent = currentLanguage === 'ar' ? 'EN' : 'عر';
  
  document.querySelector('.hm-pro-home').style.direction = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLanguage;
}

// Initialize language
document.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('preferredLanguage');
  if (savedLang && savedLang !== currentLanguage) {
    currentLanguage = savedLang;
    updateLanguage();
  }
  
  // Animate stats
  animateStats();
  
  // Smooth scroll
  document.documentElement.style.scrollBehavior = 'smooth';
});

// Mobile Menu Toggle
function toggleMobileMenu() {
  const menu = document.querySelector('.hm-navbar__menu');
  menu.classList.toggle('mobile-open');
}

// Scroll to Section
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

// Animate Statistics
function animateStats() {
  const statNumbers = document.querySelectorAll('.hm-stat-item__number');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const count = parseInt(target.getAttribute('data-count'));
        animateNumber(target, count);
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.5 });
  
  statNumbers.forEach(stat => observer.observe(stat));
}

function animateNumber(element, target) {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString();
    }
  }, 30);
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.hm-navbar');
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.style.boxShadow = '0 4px 30px rgba(0, 31, 63, 0.15)';
    } else {
      navbar.style.boxShadow = '0 2px 20px rgba(0, 31, 63, 0.1)';
    }
  }
});

// Featured Cars Slider
let currentSlide = 0;
function slideFeaturedCars(direction) {
  const slider = document.getElementById('featuredCarsSlider');
  if (!slider) return;
  
  const cards = slider.querySelectorAll('.hm-car-card');
  if (cards.length === 0) return;
  
  const cardWidth = cards[0].offsetWidth + 32; // card width + gap
  
  currentSlide += direction;
  if (currentSlide < 0) currentSlide = 0;
  if (currentSlide >= cards.length - 2) currentSlide = cards.length - 3;
  
  slider.style.transform = `translateX(-${currentSlide * cardWidth}px)`;
  slider.style.transition = 'transform 0.5s ease';
}
