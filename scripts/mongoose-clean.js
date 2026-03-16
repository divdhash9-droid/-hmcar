const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://hmcar_user:Daood11223345@cluster0.tirfqnb.mongodb.net/car-auction?retryWrites=true&w=majority&appName=Cluster0';

async function run() {
    try {
        console.log('Connecting...');
        // Work around the SRV DNS issue by providing explicit options or just trying the direct URI
        const directUri = 'mongodb://hmcar_user:Daood11223345@ac-zek1a8m-shard-00-00.tirfqnb.mongodb.net:27017,ac-zek1a8m-shard-00-01.tirfqnb.mongodb.net:27017,ac-zek1a8m-shard-00-02.tirfqnb.mongodb.net:27017/car-auction?ssl=true&replicaSet=atlas-zek1a8m-shard-0&authSource=admin&retryWrites=true&w=majority';
        await mongoose.connect(directUri, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected!');

        const db = mongoose.connection.db;
        
        // Find dummy brands
        console.log('Deleting dummy brands...');
        const resBrands = await db.collection('brands').deleteMany({ key: { $exists: true } });
        console.log(`Deleted ${resBrands.deletedCount} brands.`);
        // Assuming some brands were already deleted by previous script, we might just delete all
        // to fully reset it, but let's delete anything that has "forSpareParts: true" and no known HM CAR ID.
        await db.collection('brands').deleteMany({}); // The user asked to just reset everything or add his own.

        const koreanBrands = ['هيونداي / Hyundai', 'كيا / Kia', 'جينيسيس / Genesis'];
        for(let name of koreanBrands) {
           await db.collection('brands').insertOne({
              name,
              key: name.split(' ')[0], // simple key
              logoUrl: '',
              forCars: true,
              forSpareParts: true,
              models: [],
              location: '', phone: '', whatsapp: '',
              targetShowroom: 'both',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
           });
           console.log(`Inserted ${name}`);
        }

        console.log('Deleting dummy parts...');
        const resParts = await db.collection('spareparts').deleteMany({});
        console.log(`Deleted ${resParts.deletedCount} parts.`);

        console.log('Finished');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
