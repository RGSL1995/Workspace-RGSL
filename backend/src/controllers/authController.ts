import { Request, Response } from "express";
import Employee from "../models/Employee";
import EmailConnection from "../models/EmailConnection";
import { syncEmailsFromConnection } from "../services/gmailService";

export const googleAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("\n================================");
  console.log("🔓🔓🔓 AUTH CALLBACK STARTED 🔓🔓🔓");
  console.log("================================");

  try {
    console.log(`\n🔓 [AUTH CALLBACK STEP 1] Callback handler started`);

    const { id, emails, displayName, name } = req.user as any;
    const email = emails[0]?.value;

    console.log(`🔓 [AUTH CALLBACK STEP 2] Email extracted: ${email}`);

    if (!email) {
      console.error(`❌ [AUTH CALLBACK] No email found`);
      res.status(400).json({ error: "No email from Google" });
      return;
    }

    console.log(`🔓 [AUTH CALLBACK STEP 3] Looking up employee`);
    // Find or create employee
    let employee = await Employee.findOne({ email });
    let isNewEmployee = false;
    console.log(`🔓 [AUTH CALLBACK STEP 4] Employee lookup: ${employee ? "FOUND" : "NOT FOUND"}`);

    if (!employee) {
      // Extract Google profile data
      const googleProfile = req.user as any;

      // Auto-create employee from Google data
      employee = new Employee({
        email,
        name: googleProfile.name?.displayName || googleProfile.displayName || email.split("@")[0],
        role: "department_person",
        companies: ["RGSL"],
        departments: ["Finance"],
        google_id: id,
        google_profile: {
          picture: googleProfile.photos?.[0]?.value,
          phone: googleProfile.phoneNumbers?.[0]?.value,
          locale: googleProfile._json?.locale,
          gender: googleProfile._json?.gender,
        },
        is_active: true,
        notification_email: true,
        notification_socket: true,
        managed_employees: [],
      });
      await employee.save();
      isNewEmployee = true;
      console.log(`✅ Auto-created employee: ${email}`);
      console.log(`   📸 Profile picture: ${employee.google_profile?.picture ? "✅" : "❌"}`);
      console.log(`   📱 Phone: ${employee.google_profile?.phone ? "✅" : "❌"}`);
      console.log(`   🗺️ Locale: ${employee.google_profile?.locale || "N/A"}`);

      // Auto-create email connection for new employee
      const accessToken = (req.user as any)?.accessToken;
      const refreshToken = (req.user as any)?.refreshToken;

      if (accessToken) {
        try {
          const emailConnection = new EmailConnection({
            email,
            type: "personal",
            company: "RGSL",
            owner_id: employee._id,
            authorized_employees: [employee._id],
            google_id: id,
            google_tokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: Date.now() + 3600 * 1000,
            },
            created_by: employee._id,
            last_synced: new Date(),
            sync_status: "idle",
          });

          await emailConnection.save();
          console.log(`✅ Auto-created email connection for ${email}`);
        } catch (connError) {
          console.error("Error creating email connection:", connError);
        }
      }
    } else {
      // Update Google ID if not already set
      if (!employee.google_id) {
        employee.google_id = id;
        await employee.save();
      }
    }

    console.log(`🔓 [AUTH CALLBACK STEP 8] Setting session`);
    // Set session user
    req.session.userId = employee._id.toString();
    req.session.userEmail = employee.email;
    req.session.userName = employee.name;
    console.log(`🔓 [AUTH CALLBACK STEP 9] Session set for: ${employee.email}`);
    console.log(`   Session ID: ${req.session.userId}`);

    // Auto-sync emails if email connection exists and hasn't been synced recently
    console.log(`🔓 [AUTH CALLBACK STEP 10] Checking for email connections to sync`);
    try {
      const emailConnection = await EmailConnection.findOne({
        owner_id: employee._id,
      });

      console.log(`🔓 [AUTH CALLBACK STEP 11] Email connection check: ${emailConnection ? "FOUND" : "NOT FOUND"}`);

      if (emailConnection) {
        console.log(`🔓 [AUTH CALLBACK STEP 12] Email connection exists: ${emailConnection._id}`);
        // Only sync if hasn't been synced in last hour
        const lastSyncTime = emailConnection.last_synced ? new Date(emailConnection.last_synced).getTime() : 0;
        const hourAgo = Date.now() - 60 * 60 * 1000;

        console.log(`🔓 [AUTH CALLBACK STEP 13] Last sync check - lastSyncTime: ${lastSyncTime}, hourAgo: ${hourAgo}`);

        if (lastSyncTime < hourAgo) {
          console.log(`🔓 [AUTH CALLBACK STEP 14] Triggering email sync`);
          // Trigger email sync in background (don't wait for it)
          syncEmailsFromConnection(emailConnection._id.toString())
            .then(() => console.log(`✅ [AUTH CALLBACK] Email sync completed for ${email}`))
            .catch((error) => console.error(`❌ [AUTH CALLBACK] Email sync error:`, error));
          console.log(`✅ [AUTH CALLBACK STEP 15] Email sync INITIATED for ${email}`);
        } else {
          console.log(`⏭️ [AUTH CALLBACK STEP 14] Skipping sync - synced recently`);
        }
      } else {
        console.log(`⚠️ [AUTH CALLBACK STEP 12] No email connection found`);
      }
    } catch (syncError) {
      console.error(`❌ [AUTH CALLBACK] Error initiating email sync:`, syncError);
      // Don't fail auth if sync fails
    }

    console.log(`🔓 [AUTH CALLBACK STEP 16] Saving session before redirect`);
    console.log(`🔓 [AUTH CALLBACK] Session ID: ${req.sessionID}`);
    console.log(`🔓 [AUTH CALLBACK] Session userId: ${req.session.userId}`);

    req.session.save((err) => {
      if (err) {
        console.error(`❌ [AUTH CALLBACK] Session save failed:`, err);
        return res.status(500).json({ error: "Session save failed" });
      }

      console.log(`🔓 [AUTH CALLBACK STEP 17] Session saved successfully`);
      console.log(`🔓 [AUTH CALLBACK] Response headers:`, res.getHeaders());

      // Redirect to dashboard
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      console.log(`🔓 [AUTH CALLBACK STEP 18] Redirect URL: ${frontendUrl}/dashboard`);
      res.redirect(`${frontendUrl}/dashboard`);
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log(`🔍 [AUTH ME] Session ID: ${req.sessionID}`);
    console.log(`🔍 [AUTH ME] Session userId: ${req.session.userId}`);
    console.log(`🔍 [AUTH ME] Session data:`, req.session);

    if (!req.session.userId) {
      console.log(`❌ [AUTH ME] No userId in session`);
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const employee = await Employee.findById(req.session.userId)
      .select("-google_tokens")
      .populate("manager_id", "name email")
      .populate("managed_employees", "name email");

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch current user" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Failed to logout" });
        return;
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    res.status(500).json({ error: "Logout failed" });
  }
};
