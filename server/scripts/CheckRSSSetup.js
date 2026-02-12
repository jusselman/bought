import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Brand from '../models/Brand.js';
import BrandUpdate from '../models/BrandUpdate.js';
import User from '../models/User.js';

dotenv.config();

async function checkSetup() {
  try {
    console.log('🔍 Checking RSS Feed System Setup...\n');

    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB Connected\n');

    // Check 1: Brands in database
    const totalBrands = await Brand.countDocuments();
    const brandsWithRSS = await Brand.countDocuments({ 
      rssFeedUrl: { $exists: true, $ne: null } 
    });
    const rssEnabled = await Brand.countDocuments({ rssFetchEnabled: true });

    console.log('📊 BRANDS:');
    console.log(`   Total brands: ${totalBrands}`);
    console.log(`   Brands with RSS URL: ${brandsWithRSS}`);
    console.log(`   RSS fetch enabled: ${rssEnabled}`);
    
    if (rssEnabled > 0) {
      const enabledBrands = await Brand.find({ rssFetchEnabled: true })
        .select('name rssFeedUrl lastRssFetch')
        .limit(5);
      console.log('\n   Enabled brands:');
      enabledBrands.forEach(b => {
        const lastFetch = b.lastRssFetch 
          ? new Date(b.lastRssFetch).toLocaleString() 
          : 'Never';
        console.log(`   - ${b.name} (Last fetch: ${lastFetch})`);
      });
    }

    // Check 2: Brand Updates
    console.log('\n📰 BRAND UPDATES:');
    const totalUpdates = await BrandUpdate.countDocuments();
    const activeUpdates = await BrandUpdate.countDocuments({ isActive: true });
    const rssUpdates = await BrandUpdate.countDocuments({ source: 'rss' });
    const manualUpdates = await BrandUpdate.countDocuments({ source: 'manual' });

    console.log(`   Total updates: ${totalUpdates}`);
    console.log(`   Active updates: ${activeUpdates}`);
    console.log(`   From RSS: ${rssUpdates}`);
    console.log(`   Manual: ${manualUpdates}`);

    if (totalUpdates > 0) {
      const recentUpdates = await BrandUpdate.find()
        .populate('brandId', 'name')
        .sort({ publishedDate: -1 })
        .limit(5)
        .lean();
      
      console.log('\n   Recent updates:');
      recentUpdates.forEach((u, i) => {
        const date = new Date(u.publishedDate).toLocaleDateString();
        console.log(`   ${i + 1}. [${u.brandId.name}] ${u.title.substring(0, 50)}... (${date})`);
      });
    }

    // Check 3: Users with followed brands
    console.log('\n👥 USERS:');
    const totalUsers = await User.countDocuments();
    const usersWithFollows = await User.countDocuments({ 
      followedBrands: { $exists: true, $ne: [] } 
    });

    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users following brands: ${usersWithFollows}`);

    if (usersWithFollows > 0) {
      const sampleUsers = await User.find({ 
        followedBrands: { $exists: true, $ne: [] } 
      })
        .select('name followedBrands')
        .limit(3)
        .populate('followedBrands', 'name');

      console.log('\n   Sample users:');
      sampleUsers.forEach(u => {
        const brandNames = u.followedBrands.map(b => b.name).join(', ');
        console.log(`   - ${u.name} follows: ${brandNames}`);
      });
    }

    // Check 4: What would a user see?
    console.log('\n🎯 FEED TEST:');
    const testUser = await User.findOne({ 
      followedBrands: { $exists: true, $ne: [] } 
    });

    if (testUser) {
      const feedUpdates = await BrandUpdate.find({
        brandId: { $in: testUser.followedBrands },
        isActive: true
      })
        .populate('brandId', 'name')
        .sort({ publishedDate: -1 })
        .limit(5)
        .lean();

      console.log(`   User "${testUser.name}" would see ${feedUpdates.length} updates:`);
      feedUpdates.forEach((u, i) => {
        console.log(`   ${i + 1}. [${u.brandId.name}] ${u.title.substring(0, 40)}...`);
      });
    } else {
      console.log('   ⚠️  No users following brands - they will see empty feed');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY:');
    console.log('='.repeat(60));

    if (totalUpdates === 0) {
      console.log('❌ NO UPDATES FOUND');
      console.log('\n💡 Next steps:');
      console.log('   1. Run: node seedBrandUpdates.js');
      console.log('   2. Or set up RSS feeds on brands');
      console.log('   3. Or manually trigger RSS fetch');
    } else if (usersWithFollows === 0) {
      console.log('⚠️  UPDATES EXIST BUT NO USERS FOLLOWING BRANDS');
      console.log('\n💡 Next step:');
      console.log('   Follow some brands in the app\'s Discover screen');
    } else {
      console.log('✅ EVERYTHING LOOKS GOOD!');
      console.log('\n💡 The Releases screen should show updates now!');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkSetup();