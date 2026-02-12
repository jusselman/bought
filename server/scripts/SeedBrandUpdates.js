import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from '../models/Brand.js';
import BrandUpdate from '../models/BrandUpdate.js';

dotenv.config();

const testUpdates = [
  {
    title: "Spring/Summer 2026 Collection Revealed",
    description: "Our latest collection combines timeless elegance with modern innovation. Featuring sustainable materials and bold designs, this collection represents the future of luxury fashion.",
    updateType: "collection",
    imageUrl: "https://picsum.photos/seed/ss2026/800/600",
    sourceUrl: "https://www.vogue.com/fashion-shows",
  },
  {
    title: "Limited Edition Handbag Drop",
    description: "Introducing an exclusive handbag limited to just 300 pieces worldwide. Hand-crafted by master artisans, each piece is numbered and comes with a certificate of authenticity.",
    updateType: "product_launch",
    imageUrl: "https://picsum.photos/seed/handbag/800/600",
    sourceUrl: "https://www.businessoffashion.com/news/luxury",
  },
  {
    title: "New York Fashion Week Showcase",
    description: "Join us for an unforgettable runway experience at New York Fashion Week. Our show will feature never-before-seen pieces and special guest appearances.",
    updateType: "event",
    imageUrl: "https://picsum.photos/seed/nyfw/800/600",
    sourceUrl: "https://www.style.com/fashion-shows/spring-2026",
  },
  {
    title: "Collaboration with Street Artist",
    description: "We're excited to announce a groundbreaking collaboration merging high fashion with street art. This limited capsule collection drops next month.",
    updateType: "collaboration",
    imageUrl: "https://picsum.photos/seed/streetart/800/600",
    sourceUrl: "https://hypebeast.com/tags/collaboration",
  },
  {
    title: "Sustainability Commitment Announcement",
    description: "Today we pledge to achieve carbon neutrality by 2028. Our new sustainability initiative includes recycled materials, ethical sourcing, and transparent supply chains.",
    updateType: "press_release",
    imageUrl: "https://picsum.photos/seed/sustainability/800/600",
    sourceUrl: "https://www.voguebusiness.com/sustainability",
  }
];

async function seedBrandUpdates() {
  try {
    console.log('🌱 Starting brand updates seed...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ Connected to MongoDB\n');

    // Get all brands
    const brands = await Brand.find({ isVerified: true }).limit(5);
    
    if (brands.length === 0) {
      console.log('❌ No brands found in database!');
      console.log('Please create some brands first.');
      process.exit(1);
    }

    console.log(`📋 Found ${brands.length} brands\n`);

    let createdCount = 0;

    // Create updates for each brand
    for (const brand of brands) {
      console.log(`Creating updates for ${brand.name}...`);

      // Create 2-3 random updates per brand
      const numUpdates = Math.floor(Math.random() * 2) + 2; // 2-3 updates
      const selectedUpdates = testUpdates
        .sort(() => 0.5 - Math.random())
        .slice(0, numUpdates);

      for (const updateTemplate of selectedUpdates) {
        try {
          // Create random date within last 30 days
          const daysAgo = Math.floor(Math.random() * 30);
          const publishedDate = new Date();
          publishedDate.setDate(publishedDate.getDate() - daysAgo);

          const update = new BrandUpdate({
            brandId: brand._id,
            title: updateTemplate.title,
            description: updateTemplate.description,
            imageUrl: updateTemplate.imageUrl,
            sourceUrl: updateTemplate.sourceUrl,
            updateType: updateTemplate.updateType,
            publishedDate: publishedDate,
            source: 'manual',
            isActive: true
          });

          await update.save();
          createdCount++;
          console.log(`  ✅ Created: ${updateTemplate.title}`);

        } catch (error) {
          if (error.code === 11000) {
            console.log(`  ⏭️  Skipped duplicate`);
          } else {
            console.log(`  ❌ Error: ${error.message}`);
          }
        }
      }

      console.log('');
    }

    console.log(`\n🎉 Seed completed!`);
    console.log(`📊 Created ${createdCount} brand updates across ${brands.length} brands\n`);

    // Show sample of created updates
    const sampleUpdates = await BrandUpdate.find()
      .populate('brandId', 'name')
      .sort({ publishedDate: -1 })
      .limit(5)
      .lean();

    console.log('📰 Recent updates:');
    sampleUpdates.forEach((update, index) => {
      console.log(`${index + 1}. [${update.brandId.name}] ${update.title}`);
    });

    console.log('\n✨ You can now open the Releases screen in your app!\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seed
seedBrandUpdates();