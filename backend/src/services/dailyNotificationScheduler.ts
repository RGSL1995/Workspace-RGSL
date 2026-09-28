import cron from 'node-cron';
import IPO from '../models/IPO';
import NotificationPreference from '../models/NotificationPreference';
import { sendNotificationEmail, getIPOEmailTemplate } from './notificationService';
import { getAnchorFreeDateEmailSection } from './anchorFreeeDateService';

let schedulerRunning = false;
const SINGLE_RECIPIENT_EMAIL = "1onlyteji@gmail.com"; // All emails sent to this address

/**
 * Start daily IPO listing notification scheduler
 * Runs at 8:45 AM every day
 */
export const startDailyNotificationScheduler = () => {
  if (schedulerRunning) {
    console.log('⚠️  [DAILY NOTIFIER] Scheduler already running');
    return;
  }

  // 8:45 AM every day (45 8 * * *)
  const schedulePattern = '45 8 * * *';

  console.log('\n⏰ [DAILY NOTIFIER] Starting daily IPO notification scheduler...');
  console.log(`   Pattern: ${schedulePattern} (8:45 AM every day)`);

  // Run the scheduler
  cron.schedule(schedulePattern, () => {
    sendDailyIPOUpdates();
  });

  schedulerRunning = true;
  console.log('✅ [DAILY NOTIFIER] Daily notification scheduler started successfully');
};

/**
 * Send IPO updates for the day
 */
export const sendDailyIPOUpdates = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('📧 [DAILY NOTIFIER] Sending daily IPO updates...');
  console.log('='.repeat(60));

  try {
    // Get all IPOs (open, upcoming, recently listed)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const ipos = await IPO.find({
      status: { $in: ['open', 'upcoming', 'closed'] },
    })
      .sort({ listing_date: 1 })
      .limit(50);

    if (ipos.length === 0) {
      console.log('⚠️  [DAILY NOTIFIER] No IPOs found to send');
      return;
    }

    console.log(`📊 Found ${ipos.length} IPOs to report`);
    console.log(`📧 Sending to ${SINGLE_RECIPIENT_EMAIL}`);

    // Generate email with all IPOs
    const subject = `📊 Daily IPO Update - ${new Date().toLocaleDateString()}`;
    const html = await generateDailyIPOEmail(ipos);

    // Send email to single recipient
    const sent = await sendNotificationEmail(SINGLE_RECIPIENT_EMAIL, subject, html);

    if (sent) {
      console.log(
        `✅ Email sent to ${SINGLE_RECIPIENT_EMAIL} (${ipos.length} IPOs)`
      );
    }

    console.log(
      `\n✅ [DAILY NOTIFIER] Daily update complete`
    );
    console.log('='.repeat(60));
  } catch (error) {
    console.error('[DAILY NOTIFIER] Error sending daily updates:', error);
    console.log('='.repeat(60));
  }
};

/**
 * Generate HTML email with daily IPO listings
 */
async function generateDailyIPOEmail(ipos: any[]): Promise<string> {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ipoRows = ipos
    .map(
      (ipo) => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; text-align: left;">
        <p style="margin: 0; font-weight: bold; color: #333;">${ipo.company_name}</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">${ipo.sector || 'N/A'}</p>
      </td>
      <td style="padding: 12px; text-align: center;">
        <span style="background: ${getStatusColor(ipo.status)}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold;">
          ${ipo.status.toUpperCase()}
        </span>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${
          ipo.price_band_min && ipo.price_band_max
            ? `₹${ipo.price_band_min} - ₹${ipo.price_band_max}`
            : 'TBD'
        }
      </td>
      <td style="padding: 12px; text-align: center;">
        ${
          ipo.gmp
            ? `<span style="color: ${ipo.gmp > 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">₹${ipo.gmp}</span>`
            : 'N/A'
        }
      </td>
      <td style="padding: 12px; text-align: center; font-size: 12px;">
        ${new Date(ipo.listing_date).toLocaleDateString()}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #333;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; color: white; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="margin: 0 0 5px 0; font-size: 28px;">📊 Daily IPO Update</h1>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">${currentDate}</p>
      </div>

      <!-- Summary Stats -->
      <div style="background: #f5f5f5; padding: 20px; display: flex; gap: 20px; justify-content: space-around; flex-wrap: wrap;">
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #667eea;">${ipos.length}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Total IPOs</p>
        </div>
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #10b981;">${ipos.filter((i) => i.status === 'open').length}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Open</p>
        </div>
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${ipos.filter((i) => i.status === 'upcoming').length}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Upcoming</p>
        </div>
        <div style="text-align: center;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #8b5cf6;">${ipos.filter((i) => i.status === 'closed').length}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Closed</p>
        </div>
      </div>

      <!-- IPO Table -->
      <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f9f9f9; border-bottom: 2px solid #667eea;">
              <th style="padding: 12px; text-align: left; font-weight: bold; color: #333;">Company</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; color: #333;">Status</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; color: #333;">Price Band</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; color: #333;">GMP</th>
              <th style="padding: 12px; text-align: center; font-weight: bold; color: #333;">Listing Date</th>
            </tr>
          </thead>
          <tbody>
            ${ipoRows}
          </tbody>
        </table>
      </div>

      ${await getAnchorFreeDateEmailSection()}

      <!-- Footer -->
      <div style="background: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">
          📍 For more details visit: <a href="https://www.moneycontrol.com/ipo/" style="color: #667eea; text-decoration: none;">Moneycontrol IPO</a>
        </p>
        <p style="margin: 0; font-size: 11px; color: #999;">
          You're receiving this email because you subscribed to daily IPO updates.
          <a href="#" style="color: #667eea; text-decoration: none;">Manage preferences</a>
        </p>
      </div>
    </div>
  `;
}

/**
 * Get color for IPO status
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: '#10b981', // Green
    upcoming: '#f59e0b', // Amber
    closed: '#ef4444', // Red
    listed: '#8b5cf6', // Purple
  };
  return colors[status] || '#6b7280'; // Gray default
}

/**
 * Stop the scheduler
 */
export const stopDailyNotificationScheduler = () => {
  if (!schedulerRunning) {
    console.log('⚠️  [DAILY NOTIFIER] Scheduler is not running');
    return;
  }

  schedulerRunning = false;
  console.log('⏹️  [DAILY NOTIFIER] Scheduler stopped');
};

/**
 * Get scheduler status
 */
export const getDailyNotificationSchedulerStatus = () => {
  return {
    running: schedulerRunning,
    schedule: '8:45 AM every day',
    lastRun: new Date(),
  };
};

/**
 * Manual trigger for testing
 */
export const triggerDailyNotificationNow = async () => {
  console.log('\n📧 [DAILY NOTIFIER] Manual trigger - sending updates now...');
  await sendDailyIPOUpdates();
};
