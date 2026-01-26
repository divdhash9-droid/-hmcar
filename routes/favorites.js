// [[ARABIC_HEADER]] هذا الملف (routes/favorites.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Car = require('../models/Car');
const { requireAuth } = require('../middleware/auth');

// إضافة سيارة للمفضلة
router.post('/add/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    const userId = req.session.user._id;

    // التحقق من وجود السيارة
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'السيارة غير موجودة' });
    }

    // التحقق من عدم وجودها في المفضلة مسبقاً
    const existingFavorite = await Favorite.findOne({ user: userId, car: carId });
    if (existingFavorite) {
      return res.status(400).json({ error: 'السيارة موجودة بالفعل في المفضلة' });
    }

    // إضافة السيارة للمفضلة
    const favorite = new Favorite({ user: userId, car: carId });
    await favorite.save();

    res.json({ 
      success: true, 
      message: 'تمت إضافة السيارة للمفضلة',
      favoriteId: favorite._id 
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة السيارة للمفضلة' });
  }
});

// إزالة سيارة من المفضلة
router.delete('/remove/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    const userId = req.session.user._id;

    const result = await Favorite.findOneAndDelete({ user: userId, car: carId });
    
    if (!result) {
      return res.status(404).json({ error: 'السيارة غير موجودة في المفضلة' });
    }

    res.json({ 
      success: true, 
      message: 'تمت إزالة السيارة من المفضلة' 
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إزالة السيارة من المفضلة' });
  }
});

// عرض صفحة المفضلات للمستخدم
router.get('/page', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'car',
        populate: [
          { path: 'make', select: 'name logoUrl' },
          { path: 'model', select: 'name' },
          { path: 'category', select: 'name' }
        ]
      })
      .sort({ addedAt: -1 });

    res.render('client/favorites', { 
      favorites,
      user: req.session.user,
      title: 'المفضلة - HM CAR'
    });
  } catch (error) {
    console.error('Error fetching favorites page:', error);
    res.status(500).render('errors/500', { error: 'حدث خطأ أثناء تحميل صفحة المفضلات' });
  }
});

// عرض جميع المفضلات للمستخدم
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    const favorites = await Favorite.find({ user: userId })
      .populate({
        path: 'car',
        populate: [
          { path: 'make', select: 'name logoUrl' },
          { path: 'model', select: 'name' },
          { path: 'category', select: 'name' }
        ]
      })
      .sort({ addedAt: -1 });

    res.json({ favorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المفضلات' });
  }
});

// التحقق مما إذا كانت السيارة في المفضلة
router.get('/check/:carId', requireAuth, async (req, res) => {
  try {
    const carId = req.params.carId;
    const userId = req.session.user._id;

    const favorite = await Favorite.findOne({ user: userId, car: carId });
    
    res.json({ 
      isFavorite: !!favorite,
      favoriteId: favorite ? favorite._id : null
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء التحقق من المفضلة' });
  }
});

module.exports = router;
