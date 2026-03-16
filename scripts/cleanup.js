const crypto = require('crypto');
const fetch = require('node-fetch');

function base64url(s) { return Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
function createToken(payload, secret) { 
  const header = { alg: 'HS256', typ: 'JWT' }; 
  const encHeader = base64url(JSON.stringify(header)); 
  const encPayload = base64url(JSON.stringify(payload)); 
  const signature = crypto.createHmac('sha256', secret).update(encHeader + '.' + encPayload).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); 
  return encHeader + '.' + encPayload + '.' + signature; 
}

const secret = '5a7c12c08ba86c78b6fafda82c4bf621122a6c98aa331c6bedb0bd7b7d7cba22dcdd78d57ac6833b03b41918e3280117';
const token = createToken({ id: 'admin_id_here', role: 'super_admin' }, secret);
const API_URL = 'https://car-auction-sand.vercel.app';

async function run() {
    console.log("Fetching brands...");
    let res = await fetch(`${API_URL}/api/v2/brands?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
    let data = await res.json();
    for (let b of data.brands || []) {
        console.log(`Deleting brand: ${b.name}`);
        await fetch(`${API_URL}/api/v2/brands/${b._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    }

    console.log("Fetching parts...");
    res = await fetch(`${API_URL}/api/v2/parts?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
    data = await res.json();
    for (let p of data.parts || []) {
        console.log(`Deleting part: ${p.id}`);
        await fetch(`${API_URL}/api/v2/parts/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    }

    const koreanBrands = ['هيونداي / Hyundai', 'كيا / Kia', 'جينيسيس / Genesis'];
    for(let name of koreanBrands) {
        console.log(`Creating brand: ${name}`);
        await fetch(`${API_URL}/api/v2/brands`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name, category: 'both', targetShowroom: 'both', isActive: true })
        });
    }

    console.log("Cleanup complete!");
}

run().catch(console.error);
