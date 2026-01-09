import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ESM syntax)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to your JSON file
const filePath = path.join(__dirname, '../data/FashionBrands.json');

// Read the existing JSON
let brands;
try {
  const rawData = fs.readFileSync(filePath, 'utf8');
  brands = JSON.parse(rawData);
} catch (error) {
  console.error('❌ Error reading JSON file:', error.message);
  process.exit(1);
}

// Function to generate a clean seed from brand name
const getSeedFromName = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')     // remove non-alphanumeric chars
    .replace(/\s+/g, '');           // remove spaces
};

// Update each brand's brandImage field
const updatedBrands = brands.map(brand => {
  const seed = getSeedFromName(brand.name);
  const newImageUrl = `https://picsum.photos/seed/${seed}/800/600`;

  return {
    ...brand,
    brandImage: newImageUrl
  };
});

// Write the updated data back to the file
try {
  fs.writeFileSync(filePath, JSON.stringify(updatedBrands, null, 2), 'utf8');
  
  console.log('✅ Successfully updated brand images to Picsum.photos format');
  console.log('📝 Updated brands:');
  
  updatedBrands.forEach(brand => {
    console.log(` ${brand.name.padEnd(20)} → ${brand.brandImage}`);
  });
  
  console.log(`\nTotal brands updated: ${updatedBrands.length}`);
} catch (error) {
  console.error('❌ Error writing updated JSON file:', error.message);
  process.exit(1);
}