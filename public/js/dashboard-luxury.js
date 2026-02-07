// [[ARABIC_HEADER]] هذا الملف (public/js/dashboard-luxury.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

/**
 * public/js/dashboard-luxury.js
 * تفاعلات لوحة التحكم الفخمة
 * 
 * الوظائف:
 * - initAdminShell: تفعيل القائمة الجانبية للأدمن (فتح/إغلاق)
 * - initEmbeds: تفعيل عرض المحتوى المضمن (iframe) في البطاقات
 */
(function(){
  // دالة مساعدة: اختيار عنصر واحد
  function qs(sel, root){ return (root||document).querySelector(sel); }
  // دالة مساعدة: اختيار عدة عناصر
  function qsa(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

  /**
   * تهيئة القائمة الجانبية للأدمن
   * - فتح/إغلاق القائمة على الموبايل
   * - إغلاق بالضغط على الخلفية أو زر ESC
   */
  function initAdminShell(){
    const shell = qs('[data-admin-shell]');
    if(!shell) return;

    const toggle = qs('[data-admin-sidebar-toggle]', shell);
    const backdrop = qs('[data-admin-sidebar-backdrop]');

    function open(){
      shell.classList.add('is-sidebar-open');
      if (backdrop) backdrop.hidden = false;
      document.documentElement.classList.add('hm-admin-lock');
      document.body.classList.add('hm-admin-lock');
    }

    function close(){
      shell.classList.remove('is-sidebar-open');
      if (backdrop) backdrop.hidden = true;
      document.documentElement.classList.remove('hm-admin-lock');
      document.body.classList.remove('hm-admin-lock');
    }

    if (toggle) {
      toggle.addEventListener('click', () => {
        if (shell.classList.contains('is-sidebar-open')) close();
        else open();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', close);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  function initEmbeds(){
    const embed = qs('.hm-embed');
    const frame = qs('.hm-embed__frame');
    const closeBtn = qs('.hm-embed__close');
    const cards = qsa('[data-embed-src]');

    if(!embed || !frame || !cards.length) return;

    function open(src){
      embed.classList.add('is-open');
      frame.src = src;
      embed.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function close(){
      frame.src = 'about:blank';
      embed.classList.remove('is-open');
    }

    function activate(el){
      const src = el.getAttribute('data-embed-src');
      if(src) open(src);
    }

    cards.forEach((el)=>{
      el.addEventListener('click', ()=> activate(el));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(el);
        }
      });
    });

    if(closeBtn) closeBtn.addEventListener('click', close);
  }

  function initTilt(){
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (reduceMotion || coarsePointer) return;

    const items = qsa('.hm-kpi, .hm-card, .hm-hero');
    if (!items.length) return;

    const maxTilt = 12;
    const lift = -10;

    items.forEach((el) => {
      let raf = 0;
      let lastX = 0;
      let lastY = 0;
      let rect = null;

      function setVars(xRatio, yRatio){
        const tiltY = (xRatio - 0.5) * maxTilt;
        const tiltX = (0.5 - yRatio) * maxTilt;
        el.style.setProperty('--hm-tilt-x', tiltX.toFixed(2) + 'deg');
        el.style.setProperty('--hm-tilt-y', tiltY.toFixed(2) + 'deg');
        el.style.setProperty('--hm-mx', (xRatio * 100).toFixed(2) + '%');
        el.style.setProperty('--hm-my', (yRatio * 100).toFixed(2) + '%');
        el.style.setProperty('--hm-lift', lift + 'px');
      }

      function onMove(e){
        if (!rect) rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        lastX = Math.max(0, Math.min(1, x / rect.width));
        lastY = Math.max(0, Math.min(1, y / rect.height));
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          setVars(lastX, lastY);
        });
      }

      function onEnter(){
        rect = el.getBoundingClientRect();
      }

      function onLeave(){
        rect = null;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        el.style.removeProperty('--hm-tilt-x');
        el.style.removeProperty('--hm-tilt-y');
        el.style.removeProperty('--hm-mx');
        el.style.removeProperty('--hm-my');
        el.style.removeProperty('--hm-lift');
      }

      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
    });
  }

  // تشغيل التهيئة عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', ()=>{
    initEmbeds();      // تفعيل المحتوى المضمن
    initAdminShell();  // تفعيل القائمة الجانبية
    initTilt();
  });
})();
