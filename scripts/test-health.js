
async function testHealth() {
    const url = 'https://car-auction-sand.vercel.app/api/v2/health';
    console.log(`Checking health at ${url}...`);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Health Result:', response.status, data);
    } catch (error) {
        console.log('Error:', error.message);
    }
}
testHealth();
