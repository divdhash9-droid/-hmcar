// [[ARABIC_HEADER]] هذا الملف (public/js/countdown.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// public/js/countdown.js
(function() {
  // سكربت لعرض العد التنازلي لانتهاء المزادات
  // يعمل مع جميع العناصر التي تحتوي على class="countdown" و data-end

  function updateCountdowns() {
    const countdowns = document.querySelectorAll('.countdown');
    countdowns.forEach(el => {
      const ends = new Date(el.dataset.end);
      const timerEl = el.querySelector('.countdown-timer');

      if (!timerEl) return;

      const now = new Date();
      const diff = ends - now;

      if (diff <= 0) {
        timerEl.textContent = 'انتهى المزاد';
        el.classList.add('ended');
        return;
      }

      // تحويل الفرق (ms) إلى أيام/ساعات/دقائق/ثواني
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeString = '';
      if (days > 0) {
        timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      } else if (hours > 0) {
        timeString = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeString = `${minutes}m ${seconds}s`;
      } else {
        timeString = `${seconds}s`;
      }

      timerEl.textContent = timeString;
    });
  }

  // تحديث فوري
  updateCountdowns();

  // تحديث كل ثانية
  setInterval(updateCountdowns, 1000);
})();