const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Car = require('../models/Car');
const { requireAuthAPI } = require('../middleware/auth');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for review images
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all reviews for a car
router.get('/cars/:carId/reviews', async (req, res) => {
  try {
    const { carId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', rating } = req.query;

    // Build query
    const query = { car: carId, status: 'approved' };
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Sort options
    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
      helpful: { helpful: -1, createdAt: -1 }
    };

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .populate('response.author', 'name avatar')
      .sort(sortOptions[sort] || sortOptions.newest)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments(query);
    const stats = await Review.getAverageRating(carId);
    const distribution = await Review.getRatingDistribution(carId);

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      },
      stats,
      distribution
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a new review
router.post('/cars/:carId/reviews', requireAuthAPI, upload.array('images', 5), async (req, res) => {
  try {
    const { carId } = req.params;
    const { rating, title, content, pros, cons } = req.body;

    // Check if user has purchased the car (optional validation)
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({ car: carId, user: req.user._id });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this car' });
    }

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      // Here you would upload to cloud storage like Cloudinary
      // For now, we'll simulate uploaded URLs
      req.files.forEach((file, index) => {
        images.push(`/uploads/reviews/${uuidv4()}-${file.originalname}`);
      });
    }

    const review = new Review({
      user: req.user._id,
      car: carId,
      rating: parseInt(rating),
      title,
      content,
      pros: Array.isArray(pros) ? pros : [pros].filter(Boolean),
      cons: Array.isArray(cons) ? cons : [cons].filter(Boolean),
      images
    });

    await review.save();

    // Update car's average rating
    const stats = await Review.getAverageRating(carId);
    await Car.findByIdAndUpdate(carId, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews
    });

    // Send real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`admin_room`).emit('new_review', {
        reviewId: review._id,
        carId,
        rating,
        userName: req.user.name
      });
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Mark review as helpful
router.post('/reviews/:reviewId/helpful', requireAuthAPI, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await review.markHelpful(req.user._id);

    res.json({ helpful: review.helpful });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Add response to review (admin/dealer only)
router.post('/reviews/:reviewId/response', requireAuthAPI, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const review = await Review.findById(reviewId).populate('car');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is admin or the car's dealer
    const isAdmin = req.user.role === 'admin';
    const isDealer = review.car.dealer && review.car.dealer.toString() === req.user._id.toString();

    if (!isAdmin && !isDealer) {
      return res.status(403).json({ error: 'Not authorized to respond to this review' });
    }

    await review.addResponse(content, req.user._id);

    // Notify the review author
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${review.user}`).emit('review_response', {
        reviewId: review._id,
        response: review.response,
        responderName: req.user.name
      });
    }

    res.json(review);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
});

// Get user's reviews
router.get('/my-reviews', requireAuthAPI, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.user._id })
      .populate('car', 'title images price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Review.countDocuments({ user: req.user._id });

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Admin: Get pending reviews
router.get('/admin/reviews/pending', requireAuthAPI, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const reviews = await Review.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('car', 'title')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Admin: Approve/reject review
router.patch('/admin/reviews/:reviewId/status', requireAuthAPI, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { reviewId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status, verified: status === 'approved' },
      { new: true }
    ).populate('car');

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update car's rating stats
    const stats = await Review.getAverageRating(review.car._id);
    await Car.findByIdAndUpdate(review.car._id, {
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews
    });

    // Notify the user
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${review.user}`).emit('review_status_update', {
        reviewId: review._id,
        status,
        carTitle: review.car.title
      });
    }

    res.json(review);
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

module.exports = router;
