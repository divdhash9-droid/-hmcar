const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const brandUrl = 'https://autospare.com.eg/brands/%D9%83%D9%8A%D8%A7';
  const { data } = await axios.get(brandUrl, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(data);
  console.log('title:', ($('title').text() || '').trim());
  console.log('model links a.brand-card-link:', $('a.brand-card-link').length);
  console.log('product cards div.card:', $('div.card').length);
  console.log('product links sample:', $('a.text-decoration-none').slice(0, 10).map((_, el) => $(el).attr('href')).get());
})();
