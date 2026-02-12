import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory (server root)
dotenv.config({ path: join(__dirname, '..', '.env') });

async function directSeed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected!\n');

    const db = mongoose.connection.db;

    // Get brands directly from collection
    const brandsCollection = db.collection('brands');
    const brands = await brandsCollection.find({}).limit(5).toArray();
    
    console.log(`📦 Found ${brands.length} brands in collection`);
    if (brands.length > 0) {
      console.log('\nFirst brand:');
      console.log('  Name:', brands[0].name);
      console.log('  ID:', brands[0]._id);
    }

    if (brands.length === 0) {
      console.log('❌ No brands found - cannot seed updates');
      process.exit(1);
    }

    // Create updates directly in collection
    const updatesCollection = db.collection('brandupdates');
    
    const testUpdates = [
      {
        title: "Spring/Summer 2026 Collection Revealed",
        description: "Our latest collection combines timeless elegance with modern innovation.",
        updateType: "collection",
        imageUrl: "https://picsum.photos/seed/ss2026/800/600",
        sourceUrl: "https://www.vogue.com/fashion-shows",
      },
      {
        title: "Limited Edition Handbag Drop",
        description: "Introducing an exclusive handbag limited to just 300 pieces worldwide.",
        updateType: "product_launch",
        imageUrl: "https://picsum.photos/seed/handbag/800/600",
        sourceUrl: "https://www.businessoffashion.com/news/luxury",
      },
      {
        title: "Collaboration Announcement",
        description: "We're excited to announce a groundbreaking collaboration.",
        updateType: "collaboration",
        imageUrl: "https://picsum.photos/seed/collab/800/600",
        sourceUrl: "https://hypebeast.com/tags/collaboration",
      }
    ];

    let created = 0;

    for (const brand of brands) {
      console.log(`\nCreating updates for ${brand.name}...`);
      
      for (const template of testUpdates) {
        const daysAgo = Math.floor(Math.random() * 30);
        const publishedDate = new Date();
        publishedDate.setDate(publishedDate.getDate() - daysAgo);

        const update = {
          brandId: brand._id,
          title: template.title,
          description: template.description,
          imageUrl: template.imageUrl,
          sourceUrl: template.sourceUrl,
          updateType: template.updateType,
          publishedDate: publishedDate,
          source: 'manual',
          isActive: true,
          viewCount: 0,
          likeCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await updatesCollection.insertOne(update);
        created++;
        console.log(`  ✅ ${template.title}`);
      }
    }

    console.log(`\n🎉 Created ${created} updates across ${brands.length} brands!`);

    // Verify
    const totalUpdates = await updatesCollection.countDocuments();
    console.log(`\n📊 Total updates in database: ${totalUpdates}`);

    console.log('\n✨ Now open the Releases screen and pull to refresh!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

directSeed();