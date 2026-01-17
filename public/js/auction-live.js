// [[ARABIC_HEADER]] هذا الملف (public/js/auction-live.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

// public/js/auction-live.js
(function() {
  // سكربت التحديث اللحظي للمزاد:
  // يستقبل أحداث bid:placed عبر socket.io لتحديث السعر الحالي وقائمة المزايدات بدون إعادة تحميل الصفحة
  if (typeof io === 'undefined') return; // socket.io client not available
  // يتم حقن window.__auctionId من صفحة المزاد (views/auctions/detail.ejs)
  const auctionId = window.__auctionId;
  if (!auctionId) return;
  const socket = io();
  // الانضمام لغرفة المزاد حتى تصلنا أحداث هذا المزاد فقط
  socket.emit('joinAuction', auctionId);

  socket.on('bid:placed', (data) => {
    try {
      if (!data || String(data.auctionId) !== String(auctionId)) return;
      // update current price
      const cp = document.getElementById('currentPrice');
      if (cp) cp.textContent = `${Number(data.amount).toLocaleString('en-US')} ${data.currency || ''}`;

      // prepend to bids list
      const bidsList = document.getElementById('bidsList');
      if (bidsList) {
        // إضافة عنصر جديد أعلى القائمة لعرض آخر مزايدة
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between';
        const name = document.createElement('span');
        name.textContent = data.bidder?.name || 'مستخدم';
        const amt = document.createElement('strong');
        amt.textContent = `${Number(data.amount).toLocaleString('en-US')} ${data.currency || ''}`;
        li.appendChild(name);
        li.appendChild(amt);
        bidsList.insertBefore(li, bidsList.firstChild);
      }
    } catch (e) {
      console.error('auction-live error', e);
    }
  });
})();
