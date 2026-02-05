import cron from 'node-cron';
import rssFeedService from '../services/rssFeedService.js';

/**
 * Schedule RSS feed fetching
 * 
 * Cron schedule format: "minute hour day month dayOfWeek"
 * Examples:
 * - '0 * * * *'    = Every hour at minute 0
 * - '* /30 * * * *' = Every 30 minutes
 * - '0 * /6 * * *'  = Every 6 hours
 * - '0 9,15,21 * * *' = At 9am, 3pm, and 9pm
 */

class RSSCronJobs {
  constructor() {
    this.tasks = [];
  }

  /**
   * Start all scheduled tasks
   */
  start() {
    console.log('🕐 Starting RSS cron jobs...');

    // Fetch RSS feeds every hour
    const hourlyTask = cron.schedule('0 * * * *', async () => {
      console.log('\n⏰ Hourly RSS fetch triggered');
      try {
        const results = await rssFeedService.fetchAllBrandUpdates();
        console.log('✅ Hourly RSS fetch completed:', results.totalNewUpdates, 'new updates');
      } catch (error) {
        console.error('❌ Hourly RSS fetch failed:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/Los_Angeles" // Adjust to your timezone
    });

    this.tasks.push({ name: 'hourly-rss-fetch', task: hourlyTask });

    // Optional: More frequent check for priority brands (every 30 min)
    // Uncomment if needed:
    /*
    const priorityTask = cron.schedule('* /30 * * * *', async () => {
      console.log('\n⏰ Priority brands RSS fetch triggered');
      // Fetch only for specific high-priority brands
      const priorityBrands = await Brand.find({ 
        rssFetchEnabled: true, 
        priority: { $gte: 5 } 
      });
      for (const brand of priorityBrands) {
        await rssFeedService.fetchBrandUpdates(brand);
      }
    });
    this.tasks.push({ name: 'priority-rss-fetch', task: priorityTask });
    */

    console.log(`✅ ${this.tasks.length} cron job(s) started`);
    this.tasks.forEach(({ name }) => console.log(`   - ${name}`));
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    console.log('🛑 Stopping RSS cron jobs...');
    this.tasks.forEach(({ name, task }) => {
      task.stop();
      console.log(`   - Stopped: ${name}`);
    });
    this.tasks = [];
  }

  /**
   * Get status of all tasks
   */
  status() {
    return this.tasks.map(({ name, task }) => ({
      name,
      running: task.getStatus() === 'scheduled'
    }));
  }
}

export default new RSSCronJobs();

// Optional: Run fetch immediately on server start (useful for testing)
// Uncomment if you want initial fetch when server starts:
/*
setTimeout(async () => {
  console.log('🚀 Running initial RSS fetch...');
  try {
    await rssFeedService.fetchAllBrandUpdates();
    console.log('✅ Initial RSS fetch completed');
  } catch (error) {
    console.error('❌ Initial RSS fetch failed:', error);
  }
}, 5000); // Wait 5 seconds after server start
*/