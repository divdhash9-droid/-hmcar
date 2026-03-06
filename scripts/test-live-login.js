
async function testLiveLogin() {
    const url = 'https://car-auction-sand.vercel.app/api/v2';
    console.log(`Testing API at ${url}...`);
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Result:', response.status, data);
    } catch (error) {
        console.log('Error:', error.message);
    }
}

// Test with 'admin' username
credentials.identifier = 'admin';
console.log(`\nTesting login with username 'admin'...`);
try {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const data = await response.json();
    console.log('Login Result:', response.status, data);
} catch (error) {
    console.log('Error:', error.message);
}
}

testLiveLogin();
