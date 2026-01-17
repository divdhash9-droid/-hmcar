// [[ARABIC_HEADER]] هذا الملف (routes/comparisons.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Comparison = require('../models/Comparison');
const Car = require('../models/Car');
const { requireAuth } = require('../middleware/auth');

// إنشاء مقارنة جديدة
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { carIds, name, tags = [] } = req.body;
    const userId = req.session.user._id;

    if (!carIds || carIds.length < 2) {
      return res.status(400).json({ error: 'يجب اختيار سيارتين على الأقل للمقارنة' });
    }

    if (carIds.length > 5) {
      return res.status(400).json({ error: 'لا يمكن مقارنة أكثر من 5 سيارات' });
    }

    // التحقق من وجود السيارات
    const cars = await Car.find({ _id: { $in: carIds } });
    if (cars.length !== carIds.length) {
      return res.status(404).json({ error: 'بعض السيارات غير موجودة' });
    }

    // إنشاء مقارنة جديدة
    const comparison = new Comparison({
      user: userId,
      cars: carIds.map(id => ({ car: id })),
      name: name || 'مقارنة جديدة',
      tags
    });

    await comparison.save();

    // جلب المقارنة مع تفاصيل السيارات
    const populatedComparison = await Comparison.findById(comparison._id)
      .populate({
        path: 'cars.car',
        populate: [
          { path: 'make', select: 'name logoUrl' },
          { path: 'model', select: 'name' },
          { path: 'category', select: 'name' }
        ]
      });

    res.json({ 
      success: true, 
      comparison: populatedComparison,
      message: 'تم إنشاء المقارنة بنجاح' 
    });
  } catch (error) {
    console.error('Error creating comparison:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء المقارنة' });
  }
});

// إضافة سيارة للمقارنة
router.post('/add-car/:comparisonId/:carId', requireAuth, async (req, res) => {
  try {
    const { comparisonId, carId } = req.params;
    const { notes = '' } = req.body;
    const userId = req.session.user._id;

    const comparison = await Comparison.findOne({ _id: comparisonId, user: userId });
    if (!comparison) {
      return res.status(404).json({ error: 'المقارنة غير موجودة' });
    }

    if (comparison.cars.length >= 5) {
      return res.status(400).json({ error: 'وصلت إلى الحد الأقصى لعدد السيارات في المقارنة' });
    }

    const existingCar = comparison.cars.find(c => c.car.toString() === carId);
    if (existingCar) {
      return res.status(400).json({ error: 'السيارة موجودة بالفعل في المقارنة' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'السيارة غير موجودة' });
    }

    await comparison.addCar(carId, notes);

    res.json({ 
      success: true, 
      message: 'تمت إضافة السيارة للمقارنة' 
    });
  } catch (error) {
    console.error('Error adding car to comparison:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة السيارة للمقارنة' });
  }
});

// إزالة سيارة من المقارنة
router.delete('/remove-car/:comparisonId/:carId', requireAuth, async (req, res) => {
  try {
    const { comparisonId, carId } = req.params;
    const userId = req.session.user._id;

    const comparison = await Comparison.findOne({ _id: comparisonId, user: userId });
    if (!comparison) {
      return res.status(404).json({ error: 'المقارنة غير موجودة' });
    }

    await comparison.removeCar(carId);

    res.json({ 
      success: true, 
      message: 'تمت إزالة السيارة من المقارنة' 
    });
  } catch (error) {
    console.error('Error removing car from comparison:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إزالة السيارة من المقارنة' });
  }
});

// عرض المقارنة الحالية
router.get('/current', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    const comparison = await Comparison.findOne({ user: userId, status: 'active' })
      .populate({
        path: 'cars.car',
        populate: [
          { path: 'make', select: 'name logoUrl' },
          { path: 'model', select: 'name' },
          { path: 'category', select: 'name' }
        ]
      })
      .sort({ updatedAt: -1 });

    if (!comparison) {
      return res.json({ comparison: null, message: 'لا توجد مقارنة نشطة' });
    }

    res.json({ comparison });
  } catch (error) {
    console.error('Error fetching current comparison:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقارنة' });
  }
});

// عرض جميع المقارنات
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { status = 'active' } = req.query;
    
    const comparisons = await Comparison.find({ user: userId, status })
      .populate({
        path: 'cars.car',
        populate: [
          { path: 'make', select: 'name logoUrl' },
          { path: 'model', select: 'name' },
          { path: 'category', select: 'name' }
        ]
      })
      .sort({ updatedAt: -1 });

    res.json({ comparisons });
  } catch (error) {
    console.error('Error fetching comparisons:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقارنات' });
  }
});

// مشاركة المقارنة
router.post('/:comparisonId/share', requireAuth, async (req, res) => {
  try {
    const { comparisonId } = req.params;
    const { isPublic = false } = req.body;
    const userId = req.session.user._id;

    const comparison = await Comparison.findOne({ _id: comparisonId, user: userId });
    if (!comparison) {
      return res.status(404).json({ error: 'المقارنة غير موجودة' });
    }

    comparison.isPublic = isPublic;
    
    if (isPublic && !comparison.shareToken) {
      await comparison.generateShareToken();
    } else {
      await comparison.save();
    }

    res.json({ 
      success: true, 
      shareToken: comparison.shareToken,
      isPublic: comparison.isPublic,
      shareUrl: comparison.shareToken ? `${req.protocol}://${req.get('host')}/compare/shared/${comparison.shareToken}` : null
    });
  } catch (error) {
    console.error('Error sharing comparison:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء مشاركة المقارنة' });
  }
});

// عرض المقارنة المشاركة
router.get('/shared/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;

    const comparison = await Comparison.findByShareToken(shareToken);
    if (!comparison) {
      return res.status(404).json({ error: 'رابط المشاركة غير صالح' });
    }

    res.json({ comparison });
  } catch (error) {
    console.error('Error fetching shared comparison:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقارنة المشاركة' });
  }
});

// تحديث الفائز في المقارنة
router.post('/:comparisonId/winner', requireAuth, async (req, res) => {
  try {
    const { comparisonId } = req.params;
    const { carId } = req.body;
    const userId = req.session.user._id;

    const comparison = await Comparison.findOne({ _id: comparisonId, user: userId });
    if (!comparison) {
      return res.status(404).json({ error: 'المقارنة غير موجودة' });
    }

    // Verify car is in comparison
    const carInComparison = comparison.cars.find(c => c.car.toString() === carId);
    if (!carInComparison) {
      return res.status(400).json({ error: 'السيارة غير موجودة في المقارنة' });
    }

    await comparison.setWinner(carId);

    res.json({ 
      success: true, 
      message: 'تم تحديد الفائز بنجاح',
      winner: comparison.winner
    });
  } catch (error) {
    console.error('Error setting winner:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديد الفائز' });
  }
});

// إضافة ملاحظات لسيارة في المقارنة
router.put('/:comparisonId/car/:carId/notes', requireAuth, async (req, res) => {
  try {
    const { comparisonId, carId } = req.params;
    const { notes } = req.body;
    const userId = req.session.user._id;

    const comparison = await Comparison.findOne({ _id: comparisonId, user: userId });
    if (!comparison) {
      return res.status(404).json({ error: 'المقارنة غير موجودة' });
    }

    await comparison.addCar(carId, notes);

    res.json({ 
      success: true, 
      message: 'تم تحديث الملاحظات بنجاح' 
    });
  } catch (error) {
    console.error('Error updating notes:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث الملاحظات' });
  }
});

// عرض المقارنات العامة
router.get('/public', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const comparisons = await Comparison.findPublic(parseInt(limit));

    res.json({ comparisons });
  } catch (error) {
    console.error('Error fetching public comparisons:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المقارنات العامة' });
  }
});

module.exports = router;
