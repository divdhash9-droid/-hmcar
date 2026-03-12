const axios = require('axios');

function convertEncarUrlToApi(encarUrl, page = 1) {
    const pageSize = 20;
    const offset = (page - 1) * pageSize;

    const defaultApiUrl = `https://api.encar.com/search/car/list/mobile?count=true&q=(And.Hidden.N._.(C.CarType.Y.))&sr=%7CMobileModifiedDate%7C${offset}%7C${pageSize}`;

    if (!encarUrl || typeof encarUrl !== 'string' || encarUrl.trim() === '') {
        return defaultApiUrl;
    }

    try {
        const url = new URL(encarUrl);
        const searchParam = url.searchParams.get('search');
        let query = 'C.CarType.Y.';

        if (searchParam) {
            try {
                if (searchParam.includes('{')) {
                    const decoded = decodeURIComponent(searchParam);
                    const parsed = JSON.parse(decoded);
                    if (parsed.action) query = parsed.action;
                } else {
                    query = decodeURIComponent(decodeURIComponent(searchParam));
                }
            } catch (pErr) {
                if (searchParam.includes('And.')) query = decodeURIComponent(searchParam);
            }
        }

        query = query.replace(/^\(And\./, '').replace(/\)$/, '');
        query = query.replace(/^\((.*)\)$/, '$1');

        if (!query.includes('C.CarType.Y.')) {
            query = `C.CarType.Y._.${query}`;
        }

        if (!query.trim()) query = 'C.CarType.Y.';

        const finalQuery = `(And.Hidden.N._.(${query}))`;

        return `https://api.encar.com/search/car/list/mobile?count=true&q=${finalQuery}&sr=%7CMobileModifiedDate%7C${offset}%7C${pageSize}`;
    } catch (err) {
        return defaultApiUrl;
    }
}

async function fetchExternal(url, redirectCount = 0) {
    if (redirectCount > 3) throw new Error('Too many redirects');

    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
                'Referer': 'https://car.encar.com/',
                'sec-ch-ua-platform': '"Windows"',
                'sec-ch-ua': '"Not-A.Brand";v="24", "Chromium";v="146"',
                'sec-ch-ua-mobile': '?0',
                'Cache-Control': 'no-cache',
            },
            timeout: 15000,
            maxRedirects: 3
        });
        return res.data;
    } catch (err) {
        throw new Error(`Failed external fetch: ${err.message}`);
    }
}

function translateCar(car) {
    const manufacturer = car.Manufacturer || '';
    const model = car.Model || '';
    const badge = car.Badge || '';
    const fuel = car.Fuel || '';
    const transmission = car.Transmission || '';
    const region = car.Region || '';

    const priceKrw = (car.Price || 0) * 10000;

    let imageUrl = null;
    if (typeof car.Photo === 'string' && car.Photo.length > 0) {
        imageUrl = car.Photo.startsWith('http') ? car.Photo : `https://ci.encar.com/carpicture${car.Photo}`;
    } else if (car.Photo?.매물사진?.[0]?.PicFileNo) {
        const photoId = car.Photo.매물사진[0].PicFileNo;
        imageUrl = `https://ci.encar.com/carpicture/carpicture${photoId.substring(0, 2)}/pic${photoId.substring(0, 4)}/${photoId}_001.jpg`;
    }

    return {
        id: car.Id?.toString() || '',
        manufacturer: manufacturer,
        model: model,
        badge: badge,
        title: `${manufacturer} ${model} ${badge}`.trim(),
        year: car.Year || 0,
        mileage: car.Mileage || 0,
        priceKrw: priceKrw,
        fuel: fuel,
        transmission: transmission,
        region: region,
        imageUrl: imageUrl,
        encarUrl: `https://car.encar.com/detail/car?carid=${car.Id}`,
        isInspected: !!(car.ServiceMark),
    };
}

(async () => {
    let totalCreated = 0;
    let totalUpdated = 0;
    let showroomUrl = 'https://car.encar.com/list/car?page=1&search=';

    for (let page = 1; page <= 3; page++) {
        const urlWithPage = showroomUrl.replace(/page=\d+/, `page=${page}`);
        const apiUrl = convertEncarUrlToApi(urlWithPage, page);
        console.log('Page', page, 'API:', apiUrl);

        let data;
        try {
            data = await fetchExternal(apiUrl);
            console.log('Got data! Length:', data.SearchResults ? data.SearchResults.length : 'null');
        } catch (err) {
            console.warn(`[Showroom Scrape] Failed on page ${page}: ${err.message}`);
            break;
        }

        const results = (data.SearchResults || []).map(translateCar);
        console.log('Translated results:', results.length);

        for (const item of results) {
            if (!item.encarUrl) {
                console.log('Missing encarUrl:', item.title);
                continue;
            }
            // mocking DB insert logic
            totalCreated++;
        }

        if (results.length < 20) break;
    }
    console.log(`Created ${totalCreated}, Updated ${totalUpdated}`);
})();
