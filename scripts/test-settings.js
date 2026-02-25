// [[ARABIC_HEADER]] هذا الملف (scripts/test-settings.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4001,
    path: '/api/v2/settings/public',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
    });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();
