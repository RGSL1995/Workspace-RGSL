import express, { Request, Response } from "express";
import NotificationPreference from "../models/NotificationPreference";
import Employee from "../models/Employee";

const router = express.Router();

const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// GET user's notification preferences
router.get("/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;

    let preference = await NotificationPreference.findOne({ userId });

    // If no preference exists, return default
    if (!preference) {
      return res.json({
        userId,
        email: "",
        notificationTypes: {
          ipo_new: true,
          ipo_status_change: true,
          ipo_gmp_update: true,
        },
        ipoFilters: {
          allSectors: true,
          sectors: [],
          minPrice: null,
          maxPrice: null,
        },
        isActive: true,
      });
    }

    res.json(preference);
  } catch (error) {
    console.error("[NOTIFICATION] Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// UPDATE user's notification preferences
router.patch("/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const { email, notificationTypes, ipoFilters, isActive } = req.body;

    // Validate email
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    let preference = await NotificationPreference.findOne({ userId });

    if (!preference) {
      // Create new preference
      const user = await Employee.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      preference = new NotificationPreference({
        userId,
        email: email || user.email,
        notificationTypes: notificationTypes || {
          ipo_new: true,
          ipo_status_change: true,
          ipo_gmp_update: true,
        },
        ipoFilters: ipoFilters || {
          allSectors: true,
          sectors: [],
          minPrice: null,
          maxPrice: null,
        },
        isActive: isActive ?? true,
      });
    } else {
      // Update existing preference
      if (email) preference.email = email;
      if (notificationTypes)
        preference.notificationTypes = {
          ...preference.notificationTypes,
          ...notificationTypes,
        };
      if (ipoFilters)
        preference.ipoFilters = {
          ...preference.ipoFilters,
          ...ipoFilters,
        };
      if (isActive !== undefined) preference.isActive = isActive;
    }

    await preference.save();

    console.log(
      `✅ [NOTIFICATION] Updated preferences for user ${userId}`
    );
    res.json(preference);
  } catch (error) {
    console.error("[NOTIFICATION] Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// GET all available sectors (for filter options)
router.get("/sectors", requireAuth, async (req: Request, res: Response) => {
  try {
    // For now, return hardcoded sectors - you can extend this to fetch from IPO model
    const sectors = [
      "IT & Software",
      "Manufacturing",
      "Finance & Insurance",
      "Retail & FMCG",
      "Pharma & Healthcare",
      "Energy & Power",
      "Real Estate",
      "Logistics",
      "Media & Entertainment",
      "Telecom",
      "Metals & Mining",
      "Chemical & Materials",
      "Infrastructure",
      "Automotive",
      "Education",
    ];

    res.json({ sectors });
  } catch (error) {
    console.error("[NOTIFICATION] Error fetching sectors:", error);
    res.status(500).json({ error: "Failed to fetch sectors" });
  }
});

// DELETE notification preference (unsubscribe)
router.delete("/preferences", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;

    await NotificationPreference.deleteOne({ userId });

    console.log(`✅ [NOTIFICATION] Deleted preferences for user ${userId}`);
    res.json({ success: true, message: "Unsubscribed from notifications" });
  } catch (error) {
    console.error("[NOTIFICATION] Error deleting preferences:", error);
    res.status(500).json({ error: "Failed to delete preferences" });
  }
});

// ADMIN: Get all notification preferences
router.get("/admin/all", requireAuth, async (req: Request, res: Response) => {
  try {
    // Check if user is admin (you may need to implement admin check)
    const preferences = await NotificationPreference.find();
    const total = preferences.length;
    const active = preferences.filter((p) => p.isActive).length;

    res.json({
      total,
      active,
      preferences,
    });
  } catch (error) {
    console.error("[NOTIFICATION] Error fetching all preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// TEST: Send test email (no auth required for testing)
router.post("/test-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { sendNotificationEmail, getIPOEmailTemplate } = await import(
      "../services/notificationService"
    );

    const mockIPO = {
      company_name: "Test Company Ltd.",
      listing_date: new Date(),
      price_band_min: 150,
      price_band_max: 200,
      lot_size: 50,
      sector: "IT & Software",
      exchange: "NSE",
      gmp: 30,
    };

    const { subject, html } = getIPOEmailTemplate({
      type: "ipo_new",
      ipo: mockIPO as any,
    });

    const sent = await sendNotificationEmail(email, subject, html);

    if (sent) {
      res.json({ success: true, message: `Test email sent to ${email}` });
    } else {
      res.status(500).json({ error: "Failed to send test email" });
    }
  } catch (error) {
    console.error("[NOTIFICATION] Error sending test email:", error);
    res.status(500).json({ error: "Failed to send test email" });
  }
});

// ADMIN: Trigger daily IPO notification manually (no auth for testing)
router.post("/admin/trigger-daily-update", async (req: Request, res: Response) => {
  try {
    console.log("[NOTIFICATION] Manual daily update triggered by:", req.session?.userId);

    const { triggerDailyNotificationNow } = await import(
      "../services/dailyNotificationScheduler"
    );

    await triggerDailyNotificationNow();

    res.json({
      success: true,
      message: "Daily IPO notification sent to all subscribed users",
    });
  } catch (error) {
    console.error("[NOTIFICATION] Error triggering daily update:", error);
    res.status(500).json({ error: "Failed to trigger daily update" });
  }
});

// ADMIN: Get daily scheduler status (no auth for testing)
router.get("/admin/scheduler-status", async (req: Request, res: Response) => {
  try {
    const { getDailyNotificationSchedulerStatus } = await import(
      "../services/dailyNotificationScheduler"
    );

    const status = getDailyNotificationSchedulerStatus();

    res.json({
      ...status,
      scheduledTime: "8:45 AM",
      timezone: "IST (Indian Standard Time)",
      description: "Daily IPO listing updates sent at 8:45 AM",
    });
  } catch (error) {
    console.error("[NOTIFICATION] Error getting scheduler status:", error);
    res.status(500).json({ error: "Failed to get scheduler status" });
  }
});

export default router;
