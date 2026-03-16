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
    console.log("Fetching brands...");
    let res = await fetch(`${API_URL}/api/v2/brands?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
    let data = await res.json();
    for (let b of data.brands || []) {
        console.log(`Deleting brand: ${b.name}`);
        const r = await fetch(`${API_URL}/api/v2/brands/${b._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        console.log(await r.json());
    }

    console.log("Fetching parts...");
    res = await fetch(`${API_URL}/api/v2/parts?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
    data = await res.json();
    for (let p of data.parts || []) {
        console.log(`Deleting part: ${p.id} (${p.name})`);
        const r = await fetch(`${API_URL}/api/v2/parts/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        console.log(await r.json());
    }

    const koreanBrands = ['هيونداي / Hyundai', 'كيا / Kia', 'جينيسيس / Genesis'];
    for(let name of koreanBrands) {
        console.log(`Creating brand: ${name}`);
        const r = await fetch(`${API_URL}/api/v2/brands`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, category: 'both', targetShowroom: 'both', isActive: true })
        });
        console.log(await r.json());
    }

    console.log("Cleanup complete!");
}

run().catch(console.error);
