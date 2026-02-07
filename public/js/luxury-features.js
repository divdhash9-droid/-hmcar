// [[ARABIC_HEADER]] هذا الملف (public/js/luxury-features.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.
// ميزات فاخرة وتفاعلية للموقع

class LuxuryFeatures {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupLuxuryFilters();
    }

    init() {
        console.log('🏆 Luxury Features initialized');
        
        // إضافة تأثيرات التحميل
        this.addLoadingEffects();
        
        // إعداد تأثيرات التمرير
        this.setupScrollEffects();
        
        // إعداد تأثيرات الماوس
        this.setupMouseEffects();
    }

    setupEventListeners() {
        // تأثيرات التمرير السلس
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // تأثيرات الأزرار الفاخرة
        document.querySelectorAll('.luxury-btn, .hm-btn').forEach(btn => {
            this.addButtonEffects(btn);
        });

        // تأثيرات البحث المباشر
        this.setupLiveSearch();
    }

    setupAnimations() {
        // تأثيرات الظهور عند التمرير
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('luxury-animate-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.luxury-card, .hm-card, .luxury-part-card').forEach(el => {
            observer.observe(el);
        });
    }

    setupLuxuryFilters() {
        // فلتر متقدم للسيارات
        this.setupCarFilters();
        
        // فلتر متقدم لقطع الغيار
        this.setupSparePartFilters();
        
        // فلتر حسب السعر
        this.setupPriceFilter();
    }

    setupCarFilters() {
        const carFilterContainer = document.querySelector('.luxury-car-filters');
        if (!carFilterContainer) return;

        const filterHTML = `
            <div class="luxury-filter-panel">
                <div class="luxury-filter-header">
                    <h3>البحث المتقدم</h3>
                    <button class="luxury-filter-toggle">
                        <i class="fas fa-sliders-h"></i>
                    </button>
                </div>
                
                <div class="luxury-filter-content">
                    <!-- فلتر الماركة -->
                    <div class="luxury-filter-group">
                        <label>الماركة</label>
                        <select class="luxury-filter-select" data-filter="make">
                            <option value="">جميع الماركات</option>
                            <!-- سيتم ملؤها ديناميكياً -->
                        </select>
                    </div>

                    <!-- فلتر الموديل -->
                    <div class="luxury-filter-group">
                        <label>الموديل</label>
                        <select class="luxury-filter-select" data-filter="model">
                            <option value="">جميع الموديلات</option>
                        </select>
                    </div>

                    <!-- فلتر سنة الصنع -->
                    <div class="luxury-filter-group">
                        <label>سنة الصنع</label>
                        <div class="luxury-range-container">
                            <input type="range" class="luxury-range" data-filter="year" min="2000" max="2024">
                            <div class="luxury-range-value">2024</div>
                        </div>
                    </div>

                    <!-- فلتر السعر -->
                    <div class="luxury-filter-group">
                        <label>السعر (ريال)</label>
                        <div class="luxury-price-range">
                            <input type="number" class="luxury-price-input" placeholder="من" data-filter="minPrice">
                            <span>-</span>
                            <input type="number" class="luxury-price-input" placeholder="إلى" data-filter="maxPrice">
                        </div>
                    </div>

                    <!-- فلتر المسافة -->
                    <div class="luxury-filter-group">
                        <label>المسافة (كم)</label>
                        <select class="luxury-filter-select" data-filter="mileage">
                            <option value="">أي مسافة</option>
                            <option value="10000">أقل من 10,000 كم</option>
                            <option value="50000">أقل من 50,000 كم</option>
                            <option value="100000">أقل من 100,000 كم</option>
                            <option value="200000">أكثر من 100,000 كم</option>
                        </select>
                    </div>

                    <!-- فلتر الحالة -->
                    <div class="luxury-filter-group">
                        <label>الحالة</label>
                        <div class="luxury-checkbox-group">
                            <label class="luxury-checkbox">
                                <input type="checkbox" value="excellent" data-filter="condition">
                                <span>ممتازة</span>
                            </label>
                            <label class="luxury-checkbox">
                                <input type="checkbox" value="good" data-filter="condition">
                                <span>جيدة</span>
                            </label>
                        </div>
                    </div>

                    <!-- أزرار التطبيق -->
                    <div class="luxury-filter-actions">
                        <button class="luxury-btn luxury-btn-primary" onclick="luxuryFeatures.applyFilters()">
                            <i class="fas fa-search"></i>
                            تطبيق الفلاتر
                        </button>
                        <button class="luxury-btn luxury-btn-outline" onclick="luxuryFeatures.resetFilters()">
                            <i class="fas fa-undo"></i>
                            إعادة تعيين
                        </button>
                    </div>
                </div>
            </div>
        `;

        carFilterContainer.innerHTML = filterHTML;
        this.populateFilterOptions();
    }

    setupSparePartFilters() {
        const sparePartFilterContainer = document.querySelector('.luxury-spare-filters');
        if (!sparePartFilterContainer) return;

        const filterHTML = `
            <div class="luxury-spare-filter-panel">
                <div class="luxury-spare-filter-group">
                    <label>نوع القطعة</label>
                    <div class="luxury-spare-type-grid">
                        <button class="luxury-spare-type-btn" data-type="engine">
                            <i class="fas fa-cogs"></i>
                            <span>محرك</span>
                        </button>
                        <button class="luxury-spare-type-btn" data-type="transmission">
                            <i class="fas fa-cog"></i>
                            <span>ناقل حركة</span>
                        </button>
                        <button class="luxury-spare-type-btn" data-type="brakes">
                            <i class="fas fa-compact-disc"></i>
                            <span>فرامل</span>
                        </button>
                        <button class="luxury-spare-type-btn" data-type="suspension">
                            <i class="fas fa-wrench"></i>
                            <span>تعليق</span>
                        </button>
                        <button class="luxury-spare-type-btn" data-type="electrical">
                            <i class="fas fa-bolt"></i>
                            <span>كهرباء</span>
                        </button>
                        <button class="luxury-spare-type-btn" data-type="other">
                            <i class="fas fa-tools"></i>
                            <span>أخرى</span>
                        </button>
                    </div>
                </div>

                <div class="luxury-spare-filter-group">
                    <label>توافق السيارة</label>
                    <input type="text" class="luxury-spare-compatibility-input" placeholder="ابحث عن ماركة أو موديل...">
                </div>

                <div class="luxury-spare-filter-group">
                    <label>السعر</label>
                    <div class="luxury-spare-price-slider">
                        <input type="range" min="0" max="10000" value="5000" class="luxury-spare-range">
                        <div class="luxury-spare-price-display">
                            <span class="min-price">0 ريال</span>
                            <span class="max-price">5000 ريال</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        sparePartFilterContainer.innerHTML = filterHTML;
        this.setupSpareFilterEvents();
    }

    setupPriceFilter() {
        const priceSliders = document.querySelectorAll('.luxury-range[data-filter="year"], .luxury-spare-range');
        priceSliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                const valueDisplay = e.target.parentElement.querySelector('.luxury-range-value, .max-price');
                if (valueDisplay) {
                    valueDisplay.textContent = value.includes('ريال') ? `${value} ريال` : value;
                }
            });
        });
    }

    addButtonEffects(btn) {
        btn.addEventListener('mouseenter', (e) => {
            this.createRippleEffect(e);
        });

        btn.addEventListener('click', (e) => {
            this.createClickEffect(e);
        });
    }

    createRippleEffect(e) {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        
        ripple.className = 'luxury-ripple';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.left = `${e.clientX - rect.left - 10}px`;
        ripple.style.top = `${e.clientY - rect.top - 10}px`;
        
        btn.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    createClickEffect(e) {
        const btn = e.currentTarget;
        btn.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 150);
    }

    setupLiveSearch() {
        const searchInputs = document.querySelectorAll('.luxury-search-input, .hm-search-input');
        
        searchInputs.forEach(input => {
            let searchTimeout;
            
            input.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    this.hideSearchResults();
                    return;
                }
                
                searchTimeout = setTimeout(() => {
                    this.performLiveSearch(query);
                }, 300);
            });
            
            input.addEventListener('focus', () => {
                if (input.value.trim().length >= 2) {
                    this.performLiveSearch(input.value.trim());
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!input.contains(e.target) && !e.target.closest('.luxury-search-results')) {
                    this.hideSearchResults();
                }
            });
        });
    }

    async performLiveSearch(query) {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    displaySearchResults(results) {
        let resultsContainer = document.querySelector('.luxury-search-results');
        
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'luxury-search-results';
            document.body.appendChild(resultsContainer);
        }
        
        const searchInput = document.querySelector('.luxury-search-input, .hm-search-input');
        const rect = searchInput.getBoundingClientRect();
        
        resultsContainer.style.top = `${rect.bottom + window.scrollY}px`;
        resultsContainer.style.left = `${rect.left + window.scrollX}px`;
        resultsContainer.style.width = `${rect.width}px`;
        
        if (results.cars && results.cars.length > 0) {
            const carsHTML = results.cars.slice(0, 5).map(car => `
                <div class="luxury-search-result-item" onclick="window.location.href='/cars/${car._id}'">
                    <img src="${car.images[0] || '/images/car-placeholder.jpg'}" alt="${car.title}">
                    <div class="luxury-search-result-info">
                        <h4>${car.title}</h4>
                        <p>${car.make} ${car.model} ${car.year}</p>
                        <span class="luxury-search-result-price">${car.priceSar || car.price || 'السعر عند الطلب'}</span>
                    </div>
                </div>
            `).join('');
            
            resultsContainer.innerHTML = `
                <div class="luxury-search-results-section">
                    <h5>السيارات</h5>
                    ${carsHTML}
                </div>
            `;
        }
        
        resultsContainer.classList.add('show');
    }

    hideSearchResults() {
        const resultsContainer = document.querySelector('.luxury-search-results');
        if (resultsContainer) {
            resultsContainer.classList.remove('show');
        }
    }

    applyFilters() {
        const filters = {};
        
        document.querySelectorAll('.luxury-filter-select, .luxury-price-input, .luxury-range').forEach(input => {
            const filterName = input.dataset.filter;
            const value = input.value;
            
            if (value && value !== '') {
                filters[filterName] = value;
            }
        });
        
        document.querySelectorAll('.luxury-checkbox input:checked').forEach(checkbox => {
            const filterName = checkbox.dataset.filter;
            if (!filters[filterName]) {
                filters[filterName] = [];
            }
            filters[filterName].push(checkbox.value);
        });
        
        this.filterItems(filters);
    }

    resetFilters() {
        document.querySelectorAll('.luxury-filter-select, .luxury-price-input, .luxury-range').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('.luxury-checkbox input').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        this.filterItems({});
    }

    filterItems(filters) {
        const items = document.querySelectorAll('.luxury-card-container, .luxury-part-card-container');
        
        items.forEach(item => {
            let visible = true;
            
            // تطبيق الفلاتر هنا
            Object.keys(filters).forEach(filterKey => {
                if (!this.itemMatchesFilter(item, filterKey, filters[filterKey])) {
                    visible = false;
                }
            });
            
            if (visible) {
                item.style.display = 'block';
                item.classList.add('luxury-filter-match');
            } else {
                item.style.display = 'none';
                item.classList.remove('luxury-filter-match');
            }
        });
        
        // إظهار رسالة إذا لم تكن هناك نتائج
        this.showFilterMessage(items);
    }

    itemMatchesFilter(item, filterKey, filterValue) {
        // منطق المطابقة للفلاتر
        // هذا يجب أن يتوافق مع بنية البيانات الخاصة بك
        return true; // مؤقتاً
    }

    showFilterMessage(items) {
        const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
        
        let messageContainer = document.querySelector('.luxury-filter-message');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.className = 'luxury-filter-message';
            document.querySelector('.luxury-cars-grid, .luxury-parts-grid').appendChild(messageContainer);
        }
        
        if (visibleItems.length === 0) {
            messageContainer.innerHTML = `
                <div class="luxury-no-results">
                    <i class="fas fa-search"></i>
                    <h3>لم يتم العثور على نتائج</h3>
                    <p>جرب تعديل الفلاتر أو البحث بكلمات مختلفة</p>
                </div>
            `;
            messageContainer.style.display = 'block';
        } else {
            messageContainer.style.display = 'none';
        }
    }

    addLoadingEffects() {
        // إضافة تأثيرات التحميل للصور
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', () => {
                img.classList.add('luxury-loaded');
            });
            
            img.addEventListener('error', () => {
                img.classList.add('luxury-error');
            });
        });
    }

    setupScrollEffects() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // تأثير الهيدر
            const header = document.querySelector('.luxury-header, .hm-header');
            if (header) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    header.classList.add('luxury-header-hidden');
                } else {
                    header.classList.remove('luxury-header-hidden');
                }
            }
            
            // تأثير العودة للأعلى
            const backToTop = document.querySelector('.luxury-back-to-top');
            if (backToTop) {
                if (scrollTop > 500) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            }
            
            lastScrollTop = scrollTop;
        });
    }

    setupMouseEffects() {
        // تأثيرات الماوس المتقدمة
        document.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.luxury-card, .luxury-part-card');
            
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                } else {
                    card.style.transform = '';
                }
            });
        });
    }

    populateFilterOptions() {
        // ملء خيارات الفلاتر ديناميكياً
        // هذا يجب أن يتصل بالخادم للحصول على البيانات
    }

    setupSpareFilterEvents() {
        // إعداد أحداث فلاتر قطع الغيار
        document.querySelectorAll('.luxury-spare-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.luxury-spare-type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const type = btn.dataset.type;
                this.filterSparePartsByType(type);
            });
        });
    }

    filterSparePartsByType(type) {
        const parts = document.querySelectorAll('.luxury-part-card-container');
        
        parts.forEach(part => {
            if (type === 'all' || part.dataset.type === type) {
                part.style.display = 'block';
            } else {
                part.style.display = 'none';
            }
        });
    }
}

// تهيئة الميزات الفاخرة
let luxuryFeatures;
document.addEventListener('DOMContentLoaded', () => {
    luxuryFeatures = new LuxuryFeatures();
});

// إضافة الأنماط الديناميكية
const luxuryStyles = `
<style>
.luxury-animate-in {
    animation: luxuryFadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes luxuryFadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.luxury-ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: luxuryRipple 0.6s linear;
    pointer-events: none;
}

@keyframes luxuryRipple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}

.luxury-header-hidden {
    transform: translateY(-100%);
}

.luxury-back-to-top {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s ease;
    z-index: 1000;
}

.luxury-back-to-top.show {
    opacity: 1;
    transform: translateY(0);
}

.luxury-back-to-top:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.4);
}

.luxury-search-results {
    position: absolute;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    border: 1px solid #eee;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

.luxury-search-results.show {
    opacity: 1;
    transform: translateY(0);
}

.luxury-search-result-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background 0.2s ease;
}

.luxury-search-result-item:hover {
    background: #f8f9fa;
}

.luxury-search-result-item img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    border-radius: 8px;
    margin-left: 12px;
}

.luxury-search-result-info h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
}

.luxury-search-result-info p {
    margin: 0 0 4px 0;
    font-size: 12px;
    color: #666;
}

.luxury-search-result-price {
    font-size: 13px;
    font-weight: 600;
    color: #d4af37;
}

.luxury-loaded {
    animation: luxuryImageLoad 0.5s ease;
}

@keyframes luxuryImageLoad {
    from {
        opacity: 0;
        filter: blur(5px);
    }
    to {
        opacity: 1;
        filter: blur(0);
    }
}

.luxury-error {
    filter: grayscale(100%);
    opacity: 0.7;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', luxuryStyles);
