// [[ARABIC_HEADER]] هذا الملف (scripts/test-auto-login.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const http = require('http');

const data = JSON.stringify({
    name: 'محمد احمد الجديد',
    password: 'wrongpassword'
});

const options = {
    hostname: 'localhost',
    port: 4001,
    path: '/api/v2/auth/auto-login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
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
req.write(data);
req.end();
