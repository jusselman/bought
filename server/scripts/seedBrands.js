import mongoose from 'mongoose';
import Brand from '../models/Brand.js';  
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const seedBrands = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected');

    // Read brands from JSON
    const brandsPath = path.join(__dirname, '../data/FashionBrands.json');
    const brandsData = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'));
    console.log(`Loaded ${brandsData.length} brands from JSON`);

    // Clear existing
    await Brand.deleteMany({});
    console.log('🗑️ Cleared existing brands');

    // ── MAP JSON → Schema fields ──
    const mappedBrands = brandsData.map(brand => ({
      // Required / core fields (adjust if your schema has more)
      _id: brand._id,
      name: brand.name,
      websiteUrl: brand.linkToWebsite || '',           // ← map from JSON
      logoPath: brand.brandImage || '',                // ← picsum URL or local path
      description: brand.about || '',                  // ← map from JSON
    }));

    // Insert the mapped data
    await Brand.insertMany(mappedBrands);
    console.log('✅ Inserted ${mappedBrands.length} brands successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding brands:', error);
    process.exit(1);
  }
};

seedBrands();