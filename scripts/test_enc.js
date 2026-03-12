const axios = require('axios');

axios.get('https://api.encar.com/search/car/list/mobile?count=true&q=(And.Hidden.N._.CarType.A.)&sr=%7CMobileModifiedDate%7C0%7C200&inav=%7CMetadata%7CSort&cursor=', {
    headers: {
        'sec-ch-ua-platform': '"Windows"',
        'referer': 'https://car.encar.com/',
        'accept-language': 'ar',
        'accept': 'application/json, text/plain, */*',
        'sec-ch-ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/146.0.0.0 Safari/537.36',
        'sec-ch-ua-mobile': '?0'
    }
}).then(res => {
    console.log(res.status, res.data.SearchResults ? res.data.SearchResults.length : 'none');
}).catch(e => {
    console.log(e.response ? e.response.status : e.message);
});
