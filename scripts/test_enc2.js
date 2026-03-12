const axios = require('axios');

axios.get('https://api.encar.com/search/car/list/general', {
    params: {
        count: 'true',
        q: '(And.Hidden.N._.(C.CarType.Y.))',
        sr: '|ModifiedDate|0|20'
    },
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
}).then(res => {
    console.log('Status:', res.status);
    console.log('Results:', res.data.SearchResults ? res.data.SearchResults.length : 'none');
}).catch(err => {
    console.error('Error:', err.response ? err.response.status : err.message);
});
