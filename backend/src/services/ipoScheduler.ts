import cron from "node-cron";
import { scrapeMoneycontrolIPOs, saveIPOs, getNewIPOs } from "./ipoScraper";
import { notifyAllEmployeesAboutIPO } from "./ipoNotifier";

let schedulerRunning = false;

/**
 * Start IPO scraping scheduler
 * Runs every 6 hours by default
 */
export const startIPOScheduler = (schedulePattern: string = "0 */6 * * *") => {
  if (schedulerRunning) {
    console.log("⚠️  [IPO SCHEDULER] Scheduler already running");
    return;
  }

  console.log("\n⏰ [IPO SCHEDULER] Starting IPO scheduler...");
  console.log(`   Pattern: ${schedulePattern}`);

  // Run immediately on startup
  runIPOSync();

  // Schedule recurring job
  cron.schedule(schedulePattern, () => {
    runIPOSync();
  });

  schedulerRunning = true;
  console.log("✅ [IPO SCHEDULER] Scheduler started successfully");
};

/**
 * Main sync function
 */
export const runIPOSync = async () => {
  console.log("\n" + "=".repeat(50));
  console.log("⏳ [IPO SCHEDULER] Running IPO sync job...");
  console.log("=".repeat(50));

  try {
    // Step 1: Scrape Moneycontrol
    console.log("\n📊 Step 1: Scraping Moneycontrol IPO data...");
    const ipos = await scrapeMoneycontrolIPOs();

    if (ipos.length === 0) {
      console.warn("⚠️  [IPO SCHEDULER] No IPOs scraped - skipping save");
      return;
    }

    // Step 2: Save to database
    console.log("\n💾 Step 2: Saving to MongoDB...");
    const newCount = await saveIPOs(ipos);

    // Step 3: Get newly added IPOs for notifications
    if (newCount > 0) {
      console.log("\n📢 Step 3: Sending notifications for new IPOs...");
      const newIPOs = await getNewIPOs(3600000); // Last 1 hour

      for (const ipo of newIPOs) {
        await notifyAllEmployeesAboutIPO(ipo);
      }

      console.log(
        `\n✅ [IPO SCHEDULER] Sync complete: ${newCount} new IPOs found and notified`
      );
    } else {
      console.log("\n✅ [IPO SCHEDULER] Sync complete: No new IPOs");
    }

    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ [IPO SCHEDULER] Sync error:", error);
    console.log("=".repeat(50));
  }
};

/**
 * Stop the scheduler
 */
export const stopIPOScheduler = () => {
  if (!schedulerRunning) {
    console.log("⚠️  [IPO SCHEDULER] Scheduler is not running");
    return;
  }

  schedulerRunning = false;
  console.log("⏹️  [IPO SCHEDULER] Scheduler stopped");
};

/**
 * Get scheduler status
 */
export const getSchedulerStatus = () => {
  return {
    running: schedulerRunning,
    lastRun: new Date(),
  };
};

// Cron schedule patterns:
// "0 * * * *"      → Every hour
// "0 /6 * * *"    → Every 6 hours (default)
// "0 0 * * *"      → Daily at midnight
// "0 0 * * 0"      → Weekly on Sunday
// "/30 * * * *"   → Every 30 minutes
