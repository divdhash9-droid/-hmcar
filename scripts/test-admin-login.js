// [[ARABIC_HEADER]] هذا الملف (scripts/test-admin-login.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.


const axios = require('axios');

async function testAdminLogin() {
    const API_URL = "http://localhost:4002/api/v2";

    try {
        console.log("Testing Admin Login...");
        console.log("Email: admin@hmcar.com");
        console.log("Password: admin123");

        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@hmcar.com",
            password: "admin123",
            role: 'admin',
            deviceId: 'test-device-admin'
        });

        console.log("✅ Admin Login successful!");
        console.log("Token:", loginRes.data.token ? "Valid" : "Missing");
        console.log("User Role:", loginRes.data.user?.role);

    } catch (error) {
        console.error("❌ Admin Login Failed:", error.message);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testAdminLogin();
