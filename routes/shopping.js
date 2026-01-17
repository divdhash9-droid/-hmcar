// [[ARABIC_HEADER]] هذا الملف (routes/shopping.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();

// إضافة منتج للسلة
router.post('/cart/add', async (req, res) => {
  try {
    const { type, itemId, qty = 1 } = req.body;
    
    // التحقق من تسجيل دخول العميل
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    }
    
    // التحقق من نوع المنتج
    if (!['car', 'spare-part'].includes(type)) {
      return res.status(400).json({ error: 'نوع المنتج غير صالح' });
    }
    
    // إضافة للسلة (يمكن تخزينها في الجلسة أو قاعدة البيانات)
    if (!req.session.cart) {
      req.session.cart = [];
    }
    
    // التحقق إذا المنتج موجود بالفعل في السلة
    const existingItem = req.session.cart.find(item => 
      item.type === type && item.itemId === itemId
    );
    
    if (existingItem) {
      existingItem.qty += parseInt(qty);
    } else {
      req.session.cart.push({
        type,
        itemId,
        qty: parseInt(qty),
        addedAt: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      message: 'تمت إضافة المنتج للسلة بنجاح',
      cartCount: req.session.cart.length
    });
    
  } catch (error) {
    console.error('Cart add error:', error);
    res.status(500).json({ error: 'حدث خطأ في إضافة المنتج للسلة' });
  }
});

// الشراء المباشر
router.post('/purchase/buy-now', async (req, res) => {
  try {
    const { type, itemId } = req.body;
    
    // التحقق من تسجيل دخول العميل
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    }
    
    // جلب تفاصيل المنتج
    let product;
    if (type === 'car') {
      product = await Car.findById(itemId);
    } else if (type === 'spare-part') {
      product = await SparePart.findById(itemId);
    }
    
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    
    // إنشاء طلب شراء
    const order = {
      type,
      itemId,
      customerName: req.session.user.name || 'عميل',
      customerPhone: req.session.user.phone || 'غير محدد',
      price: product.price || product.priceSar,
      productName: product.title || product.name,
      createdAt: new Date()
    };
    
    // حفظ الطلب في قاعدة البيانات (يمكن إضافة نموذج Order)
    console.log('New order:', order);
    
    res.json({
      success: true,
      message: 'جاري معالجة طلب الشراء',
      order
    });
    
  } catch (error) {
    console.error('Buy now error:', error);
    res.status(500).json({ error: 'حدث خطأ في معالجة طلب الشراء' });
  }
});

// تبديل المفضلات
router.post('/favorites/toggle', async (req, res) => {
  try {
    const { type, itemId } = req.body;
    
    // التحقق من تسجيل دخول العميل
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    }
    
    // التحقق من نوع المنتج
    if (!['car', 'spare-part'].includes(type)) {
      return res.status(400).json({ error: 'نوع المنتج غير صالح' });
    }
    
    // إدارة المفضلات (يمكن تخزينها في قاعدة البيانات)
    if (!req.session.favorites) {
      req.session.favorites = [];
    }
    
    const favoriteIndex = req.session.favorites.findIndex(item => 
      item.type === type && item.itemId === itemId
    );
    
    if (favoriteIndex > -1) {
      // إزالة من المفضلات
      req.session.favorites.splice(favoriteIndex, 1);
      res.json({ success: true, favorited: false });
    } else {
      // إضافة للمفضلات
      req.session.favorites.push({
        type,
        itemId,
        addedAt: new Date()
      });
      res.json({ success: true, favorited: true });
    }
    
  } catch (error) {
    console.error('Favorites toggle error:', error);
    res.status(500).json({ error: 'حدث خطأ في تحديث المفضلات' });
  }
});

module.exports = router;
