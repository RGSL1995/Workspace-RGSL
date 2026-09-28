import { Resend } from "resend";
import NotificationPreference, {
  INotificationPreference,
} from "../models/NotificationPreference";
import IPO, { IIPO } from "../models/IPO";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.NOTIFICATION_FROM_EMAIL || "noreply@rgslgroup.com";
const SINGLE_RECIPIENT_EMAIL = "1onlyteji@gmail.com"; // All emails sent to this address

interface NotificationContext {
  type: "ipo_new" | "ipo_status_change" | "ipo_gmp_update";
  ipo: IIPO;
  previousGMP?: number;
  previousStatus?: string;
}

export const getIPOEmailTemplate = (
  context: NotificationContext,
  userName?: string
): { subject: string; html: string } => {
  const { type, ipo, previousGMP, previousStatus } = context;
  const companyName = ipo.company_name;
  const listingDate = new Date(ipo.listing_date).toLocaleDateString();

  if (type === "ipo_new") {
    return {
      subject: `🚀 New IPO Alert: ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; border-radius: 8px;">
            <h1 style="margin: 0;">New IPO Listing Alert</h1>
          </div>

          <div style="padding: 20px; border: 1px solid #e0e0e0;">
            ${userName ? `<p>Hi ${userName},</p>` : ""}

            <h2 style="color: #333;">${companyName}</h2>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Listing Date:</strong> ${listingDate}</p>
              ${ipo.sector ? `<p><strong>Sector:</strong> ${ipo.sector}</p>` : ""}
              ${ipo.exchange ? `<p><strong>Exchange:</strong> ${ipo.exchange}</p>` : ""}
              ${ipo.price_band_min && ipo.price_band_max ? `<p><strong>Price Band:</strong> ₹${ipo.price_band_min} - ₹${ipo.price_band_max}</p>` : ""}
              ${ipo.lot_size ? `<p><strong>Lot Size:</strong> ${ipo.lot_size} shares</p>` : ""}
              ${ipo.issue_size ? `<p><strong>Issue Size:</strong> ${ipo.issue_size}</p>` : ""}
            </div>

            <p>A new IPO has been listed matching your notification preferences. Check the platform for more details and to apply if interested.</p>

            ${ipo.link ? `<p><a href="${ipo.link}" style="color: #667eea; text-decoration: none;">View on Moneycontrol →</a></p>` : ""}
          </div>

          <div style="padding: 15px; background: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
            <p>You're receiving this email because you subscribed to IPO notifications. You can manage your preferences in the settings.</p>
          </div>
        </div>
      `,
    };
  } else if (type === "ipo_status_change") {
    return {
      subject: `📊 IPO Status Update: ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; color: white; border-radius: 8px;">
            <h1 style="margin: 0;">IPO Status Changed</h1>
          </div>

          <div style="padding: 20px; border: 1px solid #e0e0e0;">
            ${userName ? `<p>Hi ${userName},</p>` : ""}

            <h2 style="color: #333;">${companyName}</h2>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Previous Status:</strong> <span style="text-transform: capitalize;">${previousStatus}</span></p>
              <p><strong>New Status:</strong> <span style="text-transform: capitalize; color: #f5576c; font-weight: bold;">${ipo.status}</span></p>
              <p><strong>Listing Date:</strong> ${listingDate}</p>
            </div>

            <p>The IPO status has been updated. Check the platform for more details.</p>
          </div>

          <div style="padding: 15px; background: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
            <p>You're receiving this email because you subscribed to IPO notifications.</p>
          </div>
        </div>
      `,
    };
  } else if (type === "ipo_gmp_update") {
    return {
      subject: `💰 GMP Update: ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; color: white; border-radius: 8px;">
            <h1 style="margin: 0;">Grey Market Premium (GMP) Updated</h1>
          </div>

          <div style="padding: 20px; border: 1px solid #e0e0e0;">
            ${userName ? `<p>Hi ${userName},</p>` : ""}

            <h2 style="color: #333;">${companyName}</h2>

            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              ${previousGMP !== undefined ? `<p><strong>Previous GMP:</strong> ₹${previousGMP}</p>` : ""}
              <p><strong>Current GMP:</strong> <span style="font-size: 18px; color: #4facfe; font-weight: bold;">₹${ipo.gmp}</span></p>
              <p><strong>Listing Date:</strong> ${listingDate}</p>
            </div>

            <p>The Grey Market Premium for this IPO has been updated. This indicates market sentiment about the listing price.</p>
          </div>

          <div style="padding: 15px; background: #f9f9f9; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
            <p>You're receiving this email because you subscribed to IPO notifications.</p>
          </div>
        </div>
      `,
    };
  }

  return { subject: "IPO Notification", html: "" };
};

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error(
        "❌ [NOTIFICATION] Resend API key not configured. Email not sent."
      );
      return false;
    }

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });

    if (response.error) {
      console.error(
        "❌ [NOTIFICATION] Failed to send email:",
        response.error
      );
      return false;
    }

    console.log(`✅ [NOTIFICATION] Email sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    console.error("[NOTIFICATION] Error sending email:", error);
    return false;
  }
};

export const shouldNotifyForIPO = (
  preference: INotificationPreference,
  ipo: IIPO
): boolean => {
  if (!preference.isActive) return false;

  // Check if sectors filter is applied
  if (!preference.ipoFilters.allSectors) {
    if (
      !ipo.sector ||
      !preference.ipoFilters.sectors?.includes(ipo.sector)
    ) {
      return false;
    }
  }

  // Check price filters
  if (preference.ipoFilters.minPrice && ipo.price_band_min) {
    if (ipo.price_band_min < preference.ipoFilters.minPrice) return false;
  }

  if (preference.ipoFilters.maxPrice && ipo.price_band_max) {
    if (ipo.price_band_max > preference.ipoFilters.maxPrice) return false;
  }

  return true;
};

export const notifyAllUsers = async (context: NotificationContext) => {
  try {
    // Generate email content
    const { subject, html } = getIPOEmailTemplate(context);

    // Send email to single recipient only
    const sent = await sendNotificationEmail(SINGLE_RECIPIENT_EMAIL, subject, html);

    if (sent) {
      console.log(
        `📧 [NOTIFICATION] Sent notification to ${SINGLE_RECIPIENT_EMAIL} for ${context.type}`
      );
      return 1;
    }

    return 0;
  } catch (error) {
    console.error("[NOTIFICATION] Error notifying user:", error);
    return 0;
  }
};
