const axios = require('axios');

async function main() {
  let page = 1;
  let total = 0;
  let missing = 0;

  while (page <= 10) {
    const res = await axios.get(`https://car-auction-sand.vercel.app/api/v2/showroom/cars?page=${page}`, {
      timeout: 20000,
    });

    const cars = (res.data && res.data.data) || [];
    if (!cars.length) break;

    total += cars.length;
    missing += cars.filter((c) => !c.imageUrl).length;
    page += 1;
  }

  console.log({ total, missing });
}

main().catch((err) => {
  console.error(err.response?.status, err.response?.data || err.message);
  process.exit(1);
});
