const puppeteer = require('puppeteer');
(async () => {
    const b = await puppeteer.launch();
    const p = await b.newPage();
    p.on('request', r => {
        if (r.url().includes('api.encar')) {
            console.log(r.url(), r.headers());
        }
    });
    await p.goto('https://car.encar.com/list/car', { waitUntil: 'networkidle2' });
    await b.close();
})();
