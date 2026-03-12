const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
    const jwtSecret = process.env.JWT_SECRET;
    const baseUrl = process.env.BASE_URL || 'https://car-auction-sand.vercel.app';

    if (!jwtSecret) {
        throw new Error('Missing JWT_SECRET environment variable.');
    }

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
