// [[ARABIC_HEADER]] هذا الملف (scripts/test-login.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.


const axios = require('axios');

async function testClientLogin() {
    const email = `client.${Date.now()}@test.com`;
    const name = "Test Client";
    const password = "password123";
    const API_URL = "http://localhost:4002/api/v2";

    try {
        console.log(`Testing with: Name='${name}', Email='${email}'`);

        // 1. Register
        console.log(`\n1. Registering...`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            name,
            email,
            password
        });
        console.log("✅ Registration successful. ID:", regRes.data.user.id);

        // 2. Login with Email
        console.log("\n2. Logging in with Email...");
        const loginRes1 = await axios.post(`${API_URL}/auth/login`, {
            email: email,
            password,
            role: 'buyer'
        });
        const token = loginRes1.data.token;
        console.log("✅ Login with Email successful.");

        // 2b. Inspect Profile
        console.log("\n2b. Inspecting Profile...");
        const profileRes = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("User Profile Data:", JSON.stringify(profileRes.data.data, null, 2));

        const dbName = profileRes.data.data.name;
        console.log(`DB Name: '${dbName}' (Length: ${dbName.length})`);
        console.log(`Expected: '${name}' (Length: ${name.length})`);

        if (dbName !== name) {
            console.error("Mismatch detected!");
        }

        // 3. Login with Name
        console.log(`\n3. Logging in with Name '${name}'...`);
        const loginRes2 = await axios.post(`${API_URL}/auth/login`, {
            email: name, // Frontend sends name in email field
            password,
            role: 'buyer'
        });
        console.log("✅ Login with Name successful.");

    } catch (error) {
        console.error("❌ Test Failed:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testClientLogin();
