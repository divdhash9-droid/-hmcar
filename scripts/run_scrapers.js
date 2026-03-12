const jwt = require('jsonwebtoken');
const axios = require('axios');

async function main() {
    const jwtSecret = process.env.JWT_SECRET || '5a7c12c08ba86c78b6fafda82c4bf621122a6c98aa331c6bedb0bd7b7d7cba22dcdd78d57ac6833b03b41918e3280117';
    const baseUrl = 'https://car-auction-sand.vercel.app';

    // Generate an admin token valid for a long time
    const token = jwt.sign(
        { userId: '000000000000000000000000', role: 'super_admin' },
        jwtSecret,
        { expiresIn: '10y' } // 10 years
    );

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log('Setting Encar URL...');
    try {
        const res0 = await axios.put(`${baseUrl}/api/v2/showroom/settings`, {
            encarUrl: 'https://car.encar.com/list/car?page=1&search='
        }, { headers });
        console.log('Settings update:', res0.data);
    } catch (err) {
        console.error('Failed to set settings', err.message, err.response?.data);
    }

    console.log('Starting cars scrape...');
    try {
        const res1 = await axios.post(`${baseUrl}/api/v2/showroom/scrape`, {}, { headers });
        console.log('Cars scrape response:', res1.data);
    } catch (err) {
        console.error('Failed to scrape cars:', err.message, err.response?.data);
    }

    console.log('Starting parts scrape...');
    try {
        const res2 = await axios.post(`${baseUrl}/api/v2/parts/scrape`, {}, { headers });
        console.log('Parts scrape response:', res2.data);
    } catch (err) {
        console.error('Failed to scrape parts:', err.message, err.response?.data);
    }
}

main().catch(console.error);
