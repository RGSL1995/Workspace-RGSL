import IPO from "../models/IPO";
import Employee from "../models/Employee";

let socketServer: any = null;

// Initialize Socket.io server reference
export const setSocketServer = (server: any) => {
  socketServer = server;
  console.log("✅ [IPO NOTIFIER] Socket.io server initialized");
};

// Send in-app notification via Socket.io
export const sendSocketNotification = async (ipo: any) => {
  if (!socketServer) {
    console.warn("⚠️  [IPO NOTIFIER] Socket.io server not initialized");
    return;
  }

  console.log(`📲 [IPO NOTIFIER] Broadcasting IPO: ${ipo.company_name}`);

  socketServer.emit("ipo:new", {
    company_name: ipo.company_name,
    listing_date: ipo.listing_date,
    price_band_min: ipo.price_band_min,
    price_band_max: ipo.price_band_max,
    status: ipo.status,
    timestamp: new Date(),
  });

  console.log(`✅ [IPO NOTIFIER] Socket notification sent`);
};

// Send WhatsApp notification (using placeholder - integrate Twilio/webhook)
export const sendWhatsAppNotification = async (ipo: any, phoneNumbers: string[]) => {
  console.log(`💬 [IPO NOTIFIER] Preparing WhatsApp messages for ${ipo.company_name}`);

  const message = formatIPOMessage(ipo);

  for (const phone of phoneNumbers) {
    try {
      // TODO: Replace with actual WhatsApp API (Twilio, Baileys, etc.)
      console.log(`📤 [IPO NOTIFIER] WhatsApp: ${phone}`);
      console.log(`   Message: ${message}`);

      // Example with Twilio (when implemented):
      // await twilioClient.messages.create({
      //   from: process.env.TWILIO_WHATSAPP_NUMBER,
      //   to: `whatsapp:${phone}`,
      //   body: message,
      // });

      // For now, just log it
      console.log(`✅ [IPO NOTIFIER] WhatsApp queued for: ${phone}`);
    } catch (error) {
      console.error(`❌ [IPO NOTIFIER] WhatsApp error for ${phone}:`, error);
    }
  }
};

// Format IPO message
function formatIPOMessage(ipo: any): string {
  const dateStr = new Date(ipo.listing_date).toLocaleDateString("en-IN");
  const priceRange =
    ipo.price_band_min && ipo.price_band_max
      ? `₹${ipo.price_band_min} - ₹${ipo.price_band_max}`
      : "TBD";

  return `
🚀 *NEW IPO LISTING* 🚀

🏢 *Company:* ${ipo.company_name}
📅 *Listing Date:* ${dateStr}
💰 *Price Band:* ${priceRange}
📊 *Status:* ${ipo.status.toUpperCase()}

Visit: https://www.moneycontrol.com/ipo/ for details

*Stay updated with RGSL.HUB*
  `.trim();
}

// Notify all employees about new IPO
export const notifyAllEmployeesAboutIPO = async (ipo: any) => {
  console.log(`\n📢 [IPO NOTIFIER] Notifying all employees about: ${ipo.company_name}`);

  try {
    // Get all active employees
    const employees = await Employee.find({ is_active: true }).select(
      "name email notification_socket"
    );

    console.log(`   📧 Found ${employees.length} active employees`);

    // Send Socket.io notifications
    if (ipo && socketServer) {
      for (const emp of employees) {
        if (emp.notification_socket) {
          sendSocketNotification(ipo);
        }
      }
    }

    // Collect WhatsApp numbers (would need employee phone field)
    // For now, this is a placeholder
    const whatsappNumbers = []; // Would extract from employee DB when phone field added

    if (whatsappNumbers.length > 0) {
      await sendWhatsAppNotification(ipo, whatsappNumbers);
    }

    console.log(`✅ [IPO NOTIFIER] Notification process complete`);
  } catch (error) {
    console.error("[IPO NOTIFIER] Error notifying employees:", error);
  }
};

// Create IPO activity log
export const logIPOActivity = async (
  employeeId: string,
  action: string,
  ipoId: string,
  details?: any
) => {
  try {
    console.log(
      `📝 [IPO NOTIFIER] Logging activity: ${action} for IPO ${ipoId}`
    );
    // TODO: Create activity log collection if needed
    // For now, just log to console
  } catch (error) {
    console.error("[IPO NOTIFIER] Error logging activity:", error);
  }
};
