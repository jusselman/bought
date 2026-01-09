import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the existing JSON
const filePath = path.join(__dirname, '../data/FashionBrands.json');
const brands = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Generate new ObjectIds for each brand
const updatedBrands = brands.map(brand => ({
  ...brand,
  _id: new mongoose.Types.ObjectId().toString()
}));

// Write back to file
fs.writeFileSync(filePath, JSON.stringify(updatedBrands, null, 2));

console.log('✅ Successfully converted brand IDs to MongoDB ObjectIds');
console.log('📝 Updated brands:');
updatedBrands.forEach(brand => {
  console.log(`  ${brand.name}: ${brand._id}`);
});