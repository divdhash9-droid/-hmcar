
async function test() {
    const baseUrl = 'https://car-auction-sand.vercel.app';
    const endpoints = ['/api/v2', '/api/v2/auth/login', '/v2', '/v2/auth/login'];

    for (const ep of endpoints) {
        const url = `${baseUrl}${ep}`;
        console.log(`Checking ${url}...`);
        try {
            const response = await fetch(url, {
                method: ep.includes('login') ? 'POST' : 'GET',
                headers: { 'Content-Type': 'application/json' },
                body: ep.includes('login') ? JSON.stringify({ identifier: 'test', password: 'test', role: 'admin' }) : undefined
            });
            const data = await response.json().catch(() => ({ msg: 'No JSON' }));
            console.log(`Result ${response.status}:`, data);
        } catch (err) {
            console.log(`Error:`, err.message);
        }
        console.log('---');
    }
}

test();
