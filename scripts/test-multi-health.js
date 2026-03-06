
async function testHealth() {
    const urls = [
        'https://car-auction-sand.vercel.app/api/v2/health',
        'https://hmcar.vercel.app/api/v2/health',
        'https://car-auction.vercel.app/api/v2/health'
    ];

    for (const url of urls) {
        console.log(`Checking health at ${url}...`);
        try {
            const response = await fetch(url);
            const data = await response.json().catch(() => ({ msg: 'No JSON' }));
            console.log('Health Result:', response.status, data);
        } catch (error) {
            console.log('Error:', error.message);
        }
        console.log('---');
    }
}
testHealth();
