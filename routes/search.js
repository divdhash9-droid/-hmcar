// [[ARABIC_HEADER]] هذا الملف (routes/search.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const SparePart = require('../models/SparePart');
const Auction = require('../models/Auction');
const SearchHistory = require('../models/SearchHistory');
const { requireAuth } = require('../middleware/auth');

function toInt(value, fallback) {
  const n = parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toFloat(value, fallback) {
  const n = parseFloat(String(value ?? '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function escapeRegExp(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

// Advanced search with smart filtering
router.get('/', async (req, res) => {
  try {
    const {
      q,
      type,
      brand,
      make,
      minPrice,
      maxPrice,
      year,
      minYear,
      maxYear,
      condition,
      fuel,
      transmission,
      location,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    const pageNum = Math.max(1, toInt(page, 1));
    const limitNum = Math.min(50, Math.max(1, toInt(limit, 20)));
    const searchTypes = type ? normalizeArray(type) : ['car', 'sparepart', 'auction'];

    const text = String(q || '').trim();
    const textRe = text ? new RegExp(escapeRegExp(text), 'i') : null;

    const makeValues = normalizeArray(make || brand).map(v => String(v).trim()).filter(Boolean);
    const makeRegexes = makeValues.map(v => new RegExp(escapeRegExp(v), 'i'));

    const minPriceNum = minPrice !== undefined ? toFloat(minPrice, null) : null;
    const maxPriceNum = maxPrice !== undefined ? toFloat(maxPrice, null) : null;

    const yearEq = year !== undefined ? toInt(year, null) : null;
    const minYearNum = minYear !== undefined ? toInt(minYear, null) : null;
    const maxYearNum = maxYear !== undefined ? toInt(maxYear, null) : null;

    const now = new Date();
    const maxFetch = Math.min(200, limitNum * pageNum);

    const results = [];

    // Sorting per-type
    const carSort = {};
    const spareSort = {};
    const auctionSort = {};
    switch (sortBy) {
      case 'price_low':
        carSort.price = 1;
        spareSort.price = 1;
        auctionSort.currentPrice = 1;
        break;
      case 'price_high':
        carSort.price = -1;
        spareSort.price = -1;
        auctionSort.currentPrice = -1;
        break;
      case 'year_new':
        carSort.year = -1;
        break;
      case 'year_old':
        carSort.year = 1;
        break;
      case 'recent':
      default:
        carSort.createdAt = -1;
        spareSort.createdAt = -1;
        auctionSort.endsAt = 1;
        break;
    }

    if (searchTypes.includes('car')) {
      const carQuery = { isActive: true, isSold: { $ne: true } };

      if (textRe) {
        carQuery.$or = [
          { title: textRe },
          { description: textRe },
          { make: textRe },
          { model: textRe }
        ];
      }

      if (makeRegexes.length) {
        carQuery.$and = (carQuery.$and || []).concat([{ $or: makeRegexes.map(re => ({ make: re })) }]);
      }

      if (minPriceNum !== null || maxPriceNum !== null) {
        carQuery.price = {};
        if (minPriceNum !== null) carQuery.price.$gte = minPriceNum;
        if (maxPriceNum !== null) carQuery.price.$lte = maxPriceNum;
      }

      if (yearEq !== null || minYearNum !== null || maxYearNum !== null) {
        carQuery.year = {};
        if (yearEq !== null) carQuery.year.$eq = yearEq;
        if (minYearNum !== null) carQuery.year.$gte = minYearNum;
        if (maxYearNum !== null) carQuery.year.$lte = maxYearNum;
      }

      if (condition) {
        carQuery.condition = String(condition);
      }

      const cars = await Car.find(carQuery)
        .sort(carSort)
        .limit(maxFetch)
        .lean();

      results.push(...cars.map(car => ({ ...car, resultType: 'car' })));
    }

    if (searchTypes.includes('sparepart')) {
      const partQuery = { inStock: true };

      if (textRe) {
        partQuery.$or = [
          { name: textRe },
          { description: textRe },
          { partType: textRe },
          { carMake: textRe },
          { carModel: textRe }
        ];
      }

      if (makeRegexes.length) {
        partQuery.$and = (partQuery.$and || []).concat([{ $or: makeRegexes.map(re => ({ carMake: re })) }]);
      }

      if (minPriceNum !== null || maxPriceNum !== null) {
        partQuery.price = {};
        if (minPriceNum !== null) partQuery.price.$gte = minPriceNum;
        if (maxPriceNum !== null) partQuery.price.$lte = maxPriceNum;
      }

      if (yearEq !== null || minYearNum !== null || maxYearNum !== null) {
        partQuery.carYear = {};
        if (yearEq !== null) partQuery.carYear.$eq = yearEq;
        if (minYearNum !== null) partQuery.carYear.$gte = minYearNum;
        if (maxYearNum !== null) partQuery.carYear.$lte = maxYearNum;
      }

      const parts = await SparePart.find(partQuery)
        .sort(spareSort)
        .limit(maxFetch)
        .lean();

      results.push(...parts.map(part => ({
        ...part,
        title: part.name,
        resultType: 'sparepart'
      })));
    }

    if (searchTypes.includes('auction')) {
      // Filter auctions by matching cars first (q/make/year), then apply auction price/time/status.
      const carMatch = { listingType: 'auction', isSold: { $ne: true } };

      if (textRe) {
        carMatch.$or = [
          { title: textRe },
          { description: textRe },
          { make: textRe },
          { model: textRe }
        ];
      }

      if (makeRegexes.length) {
        carMatch.$and = (carMatch.$and || []).concat([{ $or: makeRegexes.map(re => ({ make: re })) }]);
      }

      if (yearEq !== null || minYearNum !== null || maxYearNum !== null) {
        carMatch.year = {};
        if (yearEq !== null) carMatch.year.$eq = yearEq;
        if (minYearNum !== null) carMatch.year.$gte = minYearNum;
        if (maxYearNum !== null) carMatch.year.$lte = maxYearNum;
      }

      const carIds = await Car.find(carMatch).select('_id').limit(1000).lean();
      const idList = carIds.map(c => c._id);

      const auctionQuery = {
        car: { $in: idList },
        status: 'running',
        endsAt: { $gt: now }
      };

      if (minPriceNum !== null || maxPriceNum !== null) {
        const priceClauses = [];
        if (minPriceNum !== null) {
          priceClauses.push({ currentPrice: { $gte: minPriceNum } });
          priceClauses.push({ startingPrice: { $gte: minPriceNum } });
        }
        if (maxPriceNum !== null) {
          priceClauses.push({ currentPrice: { $lte: maxPriceNum } });
          priceClauses.push({ startingPrice: { $lte: maxPriceNum } });
        }
        if (priceClauses.length) {
          auctionQuery.$and = (auctionQuery.$and || []).concat([{ $or: priceClauses }]);
        }
      }

      const auctions = await Auction.find(auctionQuery)
        .populate('car')
        .sort(auctionSort)
        .limit(maxFetch)
        .lean();

      results.push(...auctions.map(auction => ({
        ...auction,
        title: (auction.car && auction.car.title) ? auction.car.title : 'مزاد',
        resultType: 'auction'
      })));
    }

    // Cross-type sorting by relevance if requested.
    let ordered = results;
    if (sortBy === 'relevance' && text) {
      ordered = results
        .map(item => ({ item, score: calculateRelevanceScore(item, text) }))
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
    }

    const total = ordered.length;
    const start = (pageNum - 1) * limitNum;
    const end = start + limitNum;
    const pageResults = ordered.slice(start, end);

    // Filter metadata (build make options from existing data)
    const [carMakes, partMakes] = await Promise.all([
      Car.distinct('make', { isActive: true }),
      SparePart.distinct('carMake', { inStock: true })
    ]);
    const makes = Array.from(new Set([...carMakes, ...partMakes].map(v => String(v || '').trim()).filter(Boolean))).sort();

    const suggestions = await getSearchSuggestions(text);

    // Save search history for authenticated users
    if (req.session && req.session.user && text) {
      try {
        const searchHistory = new SearchHistory({
          user: req.session.user._id,
          query: text,
          filters: {
            priceMin: minPriceNum !== null ? minPriceNum : undefined,
            priceMax: maxPriceNum !== null ? maxPriceNum : undefined,
            yearMin: minYearNum !== null ? minYearNum : undefined,
            yearMax: maxYearNum !== null ? maxYearNum : undefined,
            make: makeValues.length ? makeValues : undefined,
            fuelType: fuel ? String(fuel) : undefined,
            transmission: transmission ? String(transmission) : undefined,
            location: location ? String(location) : undefined
          },
          resultsCount: total
        });
        await searchHistory.save();
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    }

    const payload = {
      results: pageResults,
      total,
      page: pageNum,
      limit: limitNum,
      filters: {
        makes,
        // Backwards compatibility for older UI naming
        brands: makes,
        conditions: ['excellent', 'good', 'fair', 'needs work'],
        fuels: [],
        transmissions: [],
        sortOptions: [
          { value: 'recent', label: 'الأحدث' },
          { value: 'price_low', label: 'الأقل سعراً' },
          { value: 'price_high', label: 'الأعلى سعراً' },
          { value: 'year_new', label: 'الأحدث سنة' },
          { value: 'year_old', label: 'الأقدم سنة' },
          { value: 'relevance', label: 'الأكثر صلة' }
        ]
      },
      suggestions
    };

    const wantsJson = String(req.query.format || '').toLowerCase() === 'json' || req.accepts(['html', 'json']) === 'json';
    if (!wantsJson) {
      return res.render('search/results', {
        q: text,
        results: pageResults,
        total,
        page: pageNum,
        limit: limitNum,
        makes,
        query: req.query
      });
    }

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const suggestions = await getSearchSuggestions(q);
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    // This would typically come from analytics or search history
    const popularSearches = [
      'تويوتا كامري',
      'هونداي اكسنت',
      'كيا سبورتاج',
      'نيسان صني',
      'سيارات مستعملة',
      'قطع غيار تويوتا',
      'مزادات سيارات'
    ];

    res.json({ popularSearches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function calculateRelevanceScore(item, query) {
  let score = 0;
  const queryLower = query.toLowerCase();

  const title = String(item.title || (item.car && item.car.title) || item.name || '').toLowerCase();
  const make = String(item.make || (item.car && item.car.make) || item.carMake || '').toLowerCase();
  const model = String(item.model || (item.car && item.car.model) || item.carModel || '').toLowerCase();
  const description = String(item.description || '').toLowerCase();
  
  // Exact title match
  if (title && title.includes(queryLower)) {
    score += 10;
  }
  
  // Partial title match
  if (title) {
    const words = queryLower.split(' ');
    words.forEach(word => {
      if (word && title.includes(word)) {
        score += 5;
      }
    });
  }
  
  // Make match
  if (make && make.includes(queryLower)) score += 8;
  
  // Model match
  if (model && model.includes(queryLower)) score += 7;
  
  // Description match
  if (description && description.includes(queryLower)) score += 3;
  
  // Boost for recent items
  if (item.createdAt) {
    const daysOld = (Date.now() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24);
    if (daysOld < 7) score += 2;
  }
  
  return score;
}

async function getSearchSuggestions(query) {
  if (!query || query.length < 2) return [];

  const searchRegex = new RegExp(query, 'i');
  const suggestions = [];

  try {
    // Make suggestions (from cars)
    const makes = await Car.find({ make: searchRegex }).limit(5).select('make').lean();
    makes.forEach(row => {
      const m = String(row.make || '').trim();
      if (!m) return;
      suggestions.push({ type: 'make', text: m, value: m, icon: 'car' });
    });

    // Model suggestions
    const cars = await Car.find({ model: searchRegex }).limit(5).select('model').lean();
    cars.forEach(row => {
      const m = String(row.model || '').trim();
      if (!m) return;
      suggestions.push({ type: 'model', text: m, value: m, icon: 'car' });
    });

    // Spare part suggestions
    const parts = await SparePart.find({ name: searchRegex }).limit(5).select('name').lean();
    parts.forEach(row => {
      const n = String(row.name || '').trim();
      if (!n) return;
      suggestions.push({ type: 'sparepart', text: n, value: n, icon: 'sparepart' });
    });

    // Remove duplicates and limit
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
      index === self.findIndex((t) => t.text === suggestion.text)
    ).slice(0, 10);

    return uniqueSuggestions;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

// Advanced search endpoint
router.post('/advanced', async (req, res) => {
  try {
    const { query, filters } = req.body;

    const text = String(query || '').trim();
    const textRe = text ? new RegExp(escapeRegExp(text), 'i') : null;

    const carQuery = { isActive: true, isSold: { $ne: true } };
    if (textRe) {
      carQuery.$or = [
        { title: textRe },
        { description: textRe },
        { make: textRe },
        { model: textRe }
      ];
    }

    if (filters && typeof filters === 'object') {
      if (filters.make) {
        carQuery.make = new RegExp(escapeRegExp(String(filters.make)), 'i');
      }
      if (filters.model) {
        carQuery.model = new RegExp(escapeRegExp(String(filters.model)), 'i');
      }
      if (filters.year) {
        carQuery.year = toInt(filters.year, undefined);
      }
      if (filters.price && (filters.price.min !== undefined || filters.price.max !== undefined)) {
        carQuery.price = {};
        const min = toFloat(filters.price.min, null);
        const max = toFloat(filters.price.max, null);
        if (min !== null) carQuery.price.$gte = min;
        if (max !== null) carQuery.price.$lte = max;
      }
    }

    const cars = await Car.find(carQuery).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ results: cars.map(car => ({ ...car, resultType: 'car' })) });
  } catch (error) {
    console.error('Error in advanced search:', error);
    res.status(500).json({ error: 'حدث خطأ في البحث المتقدم' });
  }
});

// Get search history for authenticated users
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { limit = 10 } = req.query;
    
    const history = await SearchHistory.find({ user: userId })
      .sort({ searchedAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ history });
  } catch (error) {
    console.error('Error fetching search history:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب سجل البحث' });
  }
});

// Clear search history
router.delete('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user._id;
    await SearchHistory.deleteMany({ user: userId });
    
    res.json({ success: true, message: 'تم مسح سجل البحث بنجاح' });
  } catch (error) {
    console.error('Error clearing search history:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء مسح سجل البحث' });
  }
});

// Voice search endpoint
router.post('/voice', requireAuth, async (req, res) => {
  try {
    const { audioData } = req.body;
    
    // This would integrate with a speech-to-text service
    // For now, we'll return a placeholder
    res.json({ 
      success: true, 
      message: 'البحث الصوتي قيد التطوير',
      transcribedText: 'سيارة تويوتا 2022'
    });
  } catch (error) {
    console.error('Error in voice search:', error);
    res.status(500).json({ error: 'حدث خطأ في البحث الصوتي' });
  }
});

module.exports = router;
