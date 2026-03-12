const axios = require('axios');
const cheerio = require('cheerio');

(async () => {
  const url = 'https://autospare.com.eg/brands';
  const { data } = await axios.get(url, {
    timeout: 30000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  const $ = cheerio.load(data);
  const selectors = [
    'a.brand-card-link',
    '.brand-card a',
    'a[href*="/brand/"]',
    'a[href*="/category/"]',
    '.brands a',
    '.swiper-slide a',
    '.container a'
  ];

  const counts = {};
  selectors.forEach((selector) => {
    counts[selector] = $(selector).length;
  });

  console.log('title:', ($('title').text() || '').trim());
  console.log('counts:', counts);

  const links = $('a')
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter(Boolean)
    .slice(0, 40);

  console.log('first links:', links);
})();
