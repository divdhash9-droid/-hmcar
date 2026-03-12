const axios = require('axios');

async function testRateLimit() {
  const url = 'http://localhost:3000/api/v2/auth/login';
  const payload = {
    identifier: 'test@example.com',
    password: 'password123'
  };

  console.log('🚀 Starting Rate Limit Test (5 attempts allowed per 15m)...');

  for (let i = 1; i <= 7; i++) {
    try {
      console.log(`Attempt ${i}...`);
      const response = await axios.post(url, payload);
      console.log(`✅ Success (HTTP ${response.status})`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ Failed (HTTP ${error.response.status}):`, error.response.data);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
  }
}

testRateLimit();
