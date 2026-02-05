import Parser from 'rss-parser';
import axios from 'axios';
import Brand from '../models/Brand.js';
import BrandUpdate from '../models/BrandUpdate.js';

class RSSFeedService {
  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['enclosure', 'enclosure']
        ]
      }
    });
  }

  /**
   * Fetch and parse updates for a single brand
   */
  async fetchBrandUpdates(brand) {
    if (!brand.rssFeedUrl || !brand.rssFetchEnabled) {
      console.log(`⏭️  Skipping ${brand.name} - RSS not configured`);
      return { success: false, reason: 'RSS not configured' };
    }

    try {
      console.log(`📡 Fetching RSS for ${brand.name}...`);
      const feed = await this.parser.parseURL(brand.rssFeedUrl);
      
      let newUpdates = 0;
      let skippedDuplicates = 0;

      for (const item of feed.items) {
        try {
          // Extract image from various RSS formats
          const imageUrl = this.extractImageUrl(item);
          
          // Create unique ID from RSS item
          const externalId = `rss_${brand._id}_${item.guid || item.link}`;

          // Check if already exists
          const existing = await BrandUpdate.findOne({ externalId });
          if (existing) {
            skippedDuplicates++;
            continue;
          }

          // Create new update
          const update = new BrandUpdate({
            brandId: brand._id,
            title: this.cleanText(item.title),
            description: this.cleanText(item.contentSnippet || item.content || item.description),
            imageUrl: imageUrl,
            sourceUrl: item.link,
            publishedDate: new Date(item.pubDate || item.isoDate || Date.now()),
            externalId: externalId,
            source: 'rss',
            updateType: this.categorizeUpdate(item.title, item.content)
          });

          await update.save();
          newUpdates++;
          console.log(`  ✅ Saved: ${item.title}`);

        } catch (itemError) {
          if (itemError.message === 'Duplicate update') {
            skippedDuplicates++;
          } else {
            console.error(`  ❌ Error processing item: ${itemError.message}`);
          }
        }
      }

      // Update last fetch time
      brand.lastRssFetch = new Date();
      await brand.save();

      console.log(`📊 ${brand.name}: ${newUpdates} new, ${skippedDuplicates} duplicates`);
      return { 
        success: true, 
        newUpdates, 
        skippedDuplicates,
        totalItems: feed.items.length 
      };

    } catch (error) {
      console.error(`❌ Error fetching RSS for ${brand.name}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch updates for all brands with RSS enabled
   */
  async fetchAllBrandUpdates() {
    console.log('🚀 Starting RSS fetch for all brands...\n');
    
    const brands = await Brand.find({ 
      rssFetchEnabled: true,
      rssFeedUrl: { $exists: true, $ne: null }
    });

    console.log(`📋 Found ${brands.length} brands with RSS enabled\n`);

    const results = {
      total: brands.length,
      successful: 0,
      failed: 0,
      totalNewUpdates: 0,
      brands: []
    };

    for (const brand of brands) {
      const result = await this.fetchBrandUpdates(brand);
      
      if (result.success) {
        results.successful++;
        results.totalNewUpdates += result.newUpdates || 0;
      } else {
        results.failed++;
      }

      results.brands.push({
        name: brand.name,
        ...result
      });

      // Rate limiting - wait 2 seconds between requests
      await this.sleep(2000);
    }

    console.log('\n✨ RSS Fetch Complete!');
    console.log(`📊 Summary: ${results.successful} successful, ${results.failed} failed`);
    console.log(`📰 Total new updates: ${results.totalNewUpdates}\n`);

    return results;
  }

  /**
   * Extract image URL from various RSS formats
   */
  extractImageUrl(item) {
    // Try media:content
    if (item.mediaContent?.$ && item.mediaContent.$.url) {
      return item.mediaContent.$.url;
    }

    // Try media:thumbnail
    if (item.mediaThumbnail?.$ && item.mediaThumbnail.$.url) {
      return item.mediaThumbnail.$.url;
    }

    // Try enclosure
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }

    // Try extracting from content
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) return imgMatch[1];
    }

    return null;
  }

  /**
   * Clean HTML and extra whitespace from text
   */
  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500); // Limit length
  }

  /**
   * Categorize update based on keywords
   */
  categorizeUpdate(title, content) {
    const text = `${title} ${content}`.toLowerCase();

    if (text.match(/launch|drop|release|debut|unveil/)) {
      return 'product_launch';
    }
    if (text.match(/collection|season|fall|spring|summer|winter|fw|ss/)) {
      return 'collection';
    }
    if (text.match(/collab|partnership|x |collaboration/)) {
      return 'collaboration';
    }
    if (text.match(/event|show|fashion week|runway|exhibition/)) {
      return 'event';
    }
    if (text.match(/press release|announces|statement/)) {
      return 'press_release';
    }

    return 'general';
  }

  /**
   * Sleep helper for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new RSSFeedService();