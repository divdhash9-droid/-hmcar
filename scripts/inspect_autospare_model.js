const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const modelUrl = 'https://autospare.com.eg/brands/%D9%83%D9%8A%D8%A7/%D8%B3%D9%8A%D8%B1%D8%A7%D8%AA%D9%88';
  const { data } = await axios.get(modelUrl, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  console.log('title:', ($('title').text() || '').trim());
  console.log('cards div.card:', $('div.card').length);
  console.log('cards .product-card:', $('.product-card').length);
  console.log('links with /products/:', $('a.text-decoration-none[href*="/products/"]').length);
  console.log('img count:', $('img').length);
  const sample = $('a.text-decoration-none').slice(0, 5).map((_, el) => ({
    href: $(el).attr('href'),
    text: $(el).text().trim().slice(0, 80)
  })).get();
  console.log('sample links:', sample);

  const firstProduct = $('a.text-decoration-none[href*="/products/"]').first();
  if (firstProduct.length) {
    const card = firstProduct.closest('div.col-md-4, div.col-6, div.col, div.product, div.card, li, article');
    console.log('first product href:', firstProduct.attr('href'));
    console.log('first product text:', firstProduct.text().trim());
    console.log('closest card class:', card.attr('class'));
    if (card.length) {
      const img = card.find('img').first().attr('src') || card.find('img').first().attr('data-src');
      const cardText = card.text().replace(/\s+/g, ' ').trim();
      console.log('closest card first image:', img);
      console.log('closest card text:', cardText.slice(0, 260));
    }
  }
})();
