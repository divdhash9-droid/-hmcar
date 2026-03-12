function convert(url) {
    let q = '(C.CarType.Y.)';
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

    // clean up query
    q = q.replace(/^\(And\./, '').replace(/\)$/, '');

    // just wrap correctly 
    // And.Hidden.N._. plus whatever q is
    // Wait, Encar usually likes (And.Hidden.N._.(C.CarType.Y.))
    // So if q doesn't start with (, we wrap it
    q = q.replace(/^\((.*)\)$/, '$1'); // unwrap any surrounding parens first

    if (!q.includes('C.CarType.Y.')) {
        q = `C.CarType.Y._.${q}`;
    }

    const finalQuery = `(And.Hidden.N._.(${q}))`;
    return finalQuery;
}

console.log('1:', convert('https://car.encar.com/list/car?page=1&search='));
console.log('2:', convert('https://car.encar.com/list/car?page=1&search=(And.Company.%ED%98%84%EB%8C%80.)'));
console.log('3:', convert('https://car.encar.com/list/car?page=1&search=%7B%22action%22%3A%22(And.Company.%ED%98%84%EB%8C%80.)%22%7D'));
