const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const secret = process.env.JWT_SECRET || '5a7c12c08ba86c78b6fafda82c4bf621122a6c98aa331c6bedb0bd7b7d7cba22dcdd78d57ac6833b03b41918e3280117';
const token = jwt.sign({ 
    userId: '65f0a0e5b7c8a91b2c3d4e5f', 
    id: '65f0a0e5b7c8a91b2c3d4e5f',
    role: 'super_admin',
    name: 'HM Admin'
}, secret, { expiresIn: '1h' });

const API_URL = 'https://car-auction-sand.vercel.app';

async function run() {
    console.log("Triggering DB reset endpoint...");
    const res = await fetch(`${API_URL}/api/v2/brands/reset-default-hmcar`, { 
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } 
    });
    
    const data = await res.json();
    console.log(data);
}

run().catch(console.error);
