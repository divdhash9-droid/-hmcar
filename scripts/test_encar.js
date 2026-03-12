const https = require('https');

function convert(url) {
    let q = 'C.CarType.Y.';
    const sp = new URL(url).searchParams.get('search');

    if (sp) {
        try {
            if (sp.includes('{')) {
                const parsed = JSON.parse(decodeURIComponent(sp));
                if (parsed.action) q = parsed.action;
            } else {
                q = decodeURIComponent(sp);
            }
        } catch (e) {
            q = decodeURIComponent(sp);
        }
    }

    // Cleanup
    q = q.replace(/^\(And\./, '').replace(/\)$/, '');
    q = q.replace(/^\((.*)\)$/, '$1');

    // Add base query if missing
    if (!q.includes('C.CarType.Y.')) {
        q = `C.CarType.Y._.${q}`;
    }

    if (!q.trim()) q = 'C.CarType.Y.';

    return `(And.Hidden.N._.(${q}))`;
}

const finalQuery = convert('https://car.encar.com/list/car?page=1&search=');
const pUrl = `https://api.encar.com/search/car/list/mobile?count=true&q=${encodeURIComponent(finalQuery)}&sr=|MobileModifiedDate|0|20`;

console.log('Query:', pUrl);

https.get(pUrl, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json'
    }
}, res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
        try {
            const data = JSON.parse(d);
            console.log('Results length:', data.SearchResults ? data.SearchResults.length : 'No SearchResults');
            if (data.SearchResults && data.SearchResults.length > 0) {
                console.log('First result ID:', data.SearchResults[0].Id);
                console.log('First result title:', data.SearchResults[0].Manufacturer, data.SearchResults[0].Model);
            }
        } catch (e) {
            console.error('Error parsing JSON:', d.slice(0, 100));
        }
    });
}).on('error', console.error);
