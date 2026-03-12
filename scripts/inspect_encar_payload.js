const axios = require('axios');
(async () => {
  const url = 'https://api.encar.com/search/car/list/mobile?count=true&q=(And.Hidden.N._.CarType.A.)&sr=%7CMobileModifiedDate%7C0%7C20&inav=%7CMetadata%7CSort&cursor=';
  const res = await axios.get(url, {
    headers: {
      'sec-ch-ua-platform': '"Windows"',
      'referer': 'https://car.encar.com/',
      'accept-language': 'ar',
      'accept': 'application/json, text/plain, */*',
      'sec-ch-ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36',
      'sec-ch-ua-mobile': '?0'
    },
    timeout: 20000
  });
  const first = (res.data && res.data.SearchResults && res.data.SearchResults[0]) || {};
  console.log('count', (res.data && res.data.SearchResults && res.data.SearchResults.length) || 0);
  console.log('keys', Object.keys(first).slice(0, 60));
  console.log('photoType', typeof first.Photo);
  console.log('photoValue', first.Photo);
  console.log('photosType', typeof first.Photos);
  console.log('mainCandidates', first.MainImg, first.MainPhoto, first.ImgUrl, first.ImageUrl);
})();
