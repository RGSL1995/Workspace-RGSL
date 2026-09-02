import { Request, Response } from "express";
import Employee from "../models/Employee";
import EmailConnection from "../models/EmailConnection";
import { syncEmailsFromConnection } from "../services/gmailService";
import { hashPin, verifyPin, validatePinFormat } from "../utils/pinUtil";

export const googleAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("\n================================");
  console.log("🔓🔓🔓 AUTH CALLBACK STARTED 🔓🔓🔓");
  console.log("================================");

  try {
    console.log(`\n🔓 [AUTH CALLBACK STEP 1] Callback handler started`);

    const userObj = req.user as any;
    const email = userObj?.email || userObj?.emails?.[0]?.value;

    console.log(`🔓 [AUTH CALLBACK STEP 2] Email extracted: ${email}`);

    if (!email) {
      console.error(`❌ [AUTH CALLBACK] No email found`);
      res.status(400).json({ error: "No email from Google" });
      return;
    }

    console.log(`🔓 [AUTH CALLBACK STEP 3] Looking up employee`);
    let employee = userObj?._id ? userObj : await Employee.findOne({ email });
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
        google_id: googleProfile.id || googleProfile.google_id,
        google_profile: {
          picture: googleProfile.photos?.[0]?.value || googleProfile.google_profile?.picture,
          phone: googleProfile.phoneNumbers?.[0]?.value || googleProfile.google_profile?.phone,
          locale: googleProfile._json?.locale || googleProfile.google_profile?.locale,
          gender: googleProfile._json?.gender || googleProfile.google_profile?.gender,
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
            google_id: googleProfile.id || googleProfile.google_id,
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
      if (!employee.google_id && userObj.id) {
        employee.google_id = userObj.id;
        await employee.save();
      }
    }

    console.log(`🔓 [AUTH CALLBACK STEP 8] Establishing Passport session`);

    // Use Passport's req.login() to properly establish session
    req.login(employee, (err) => {
      if (err) {
        console.error(`❌ [AUTH CALLBACK] req.login() failed:`, err);
        return res.status(500).json({ error: "Session establishment failed" });
      }

      console.log(`🔓 [AUTH CALLBACK STEP 9] Passport session established`);
      console.log(`🔓 [AUTH CALLBACK] Session ID: ${req.sessionID}`);
      console.log(`🔓 [AUTH CALLBACK] req.user: ${(req.user as any)?._id}`);

      // Also set custom session properties
      req.session.userId = employee._id.toString();
      req.session.userEmail = employee.email;
      req.session.userName = employee.name;
      console.log(`✅ [AUTH CALLBACK] Custom session properties set for: ${employee.email}`);

      // Save session to MongoDB before continuing
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error(`❌ [AUTH CALLBACK] Session save failed:`, saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }

        console.log(`✅ [AUTH CALLBACK STEP 9.5] Session saved to MongoDB`);
        completeCallback().catch((err) => {
          console.error(`❌ [AUTH CALLBACK] Callback error:`, err);
          res.status(500).json({ error: "Authentication callback failed" });
        });
      });
    });

    async function completeCallback() {
      // Auto-sync emails if email connection exists
      console.log(`🔓 [AUTH CALLBACK STEP 10] Checking for email connections to sync`);
      try {
        const emailConnection = await EmailConnection.findOne({
          owner_id: employee._id,
        });

        console.log(`🔓 [AUTH CALLBACK STEP 11] Email connection check: ${emailConnection ? "FOUND" : "NOT FOUND"}`);

        if (emailConnection) {
          console.log(`🔓 [AUTH CALLBACK STEP 12] Email connection exists: ${emailConnection._id}`);
          // Trigger email sync in background (don't wait)
          syncEmailsFromConnection(emailConnection._id.toString())
            .then(() => console.log(`✅ [AUTH CALLBACK] Email sync completed`))
            .catch((error) => console.error(`❌ [AUTH CALLBACK] Email sync error:`, error));
          console.log(`✅ [AUTH CALLBACK STEP 13] Email sync INITIATED`);
        }
      } catch (syncError) {
        console.error(`❌ [AUTH CALLBACK] Error with email sync:`, syncError);
      }

      console.log(`🔓 [AUTH CALLBACK STEP 14] Redirecting to dashboard`);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      console.log(`🔓 [AUTH CALLBACK STEP 15] Redirect URL: ${frontendUrl}/dashboard`);
      res.redirect(`${frontendUrl}/dashboard`);
    }
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
    console.log(`🔍 [AUTH ME] Passport req.user:`, req.user ? "EXISTS" : "MISSING");
    console.log(`🔍 [AUTH ME] Session ID: ${req.sessionID}`);
    console.log(`🔍 [AUTH ME] Session userId: ${req.session.userId}`);

    // Use Passport's req.user first, fall back to session.userId
    const userId = (req.user as any)?._id || req.session.userId;

    if (!userId) {
      console.log(`❌ [AUTH ME] No user found in session or passport`);
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    console.log(`✅ [AUTH ME] User ID found: ${userId}`);
    const employee = await Employee.findById(userId)
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

/**
 * Set PIN during first login (after OAuth)
 */
export const setPin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pin } = req.body;
    const userId = (req.user as any)?._id || req.session.userId;

    if (!userId) {
      console.log(`❌ [PIN] Not authenticated`);
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!pin || typeof pin !== 'string') {
      res.status(400).json({ error: "PIN is required" });
      return;
    }

    if (!validatePinFormat(pin)) {
      res.status(400).json({ error: "PIN must be 4-6 digits" });
      return;
    }

    const employee = await Employee.findById(userId);
    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    console.log(`🔐 [PIN] Setting PIN for ${employee.email}`);
    employee.pin_hash = await hashPin(pin);
    employee.pin_created_at = new Date();
    await employee.save();

    console.log(`✅ [PIN] PIN set successfully for ${employee.email}`);
    res.json({ message: "PIN set successfully" });
  } catch (error) {
    console.error("❌ [PIN] Set PIN error:", error);
    res.status(500).json({ error: "Failed to set PIN" });
  }
};

/**
 * Login with email and PIN
 */
export const verifyPinLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      res.status(400).json({ error: "Email and PIN are required" });
      return;
    }

    if (!validatePinFormat(pin)) {
      res.status(400).json({ error: "Invalid PIN format" });
      return;
    }

    console.log(`🔐 [PIN LOGIN] Attempting login for ${email}`);
    const employee = await Employee.findOne({ email: email.toLowerCase() });

    if (!employee) {
      console.log(`❌ [PIN LOGIN] Employee not found: ${email}`);
      res.status(401).json({ error: "Invalid email or PIN" });
      return;
    }

    if (!employee.pin_hash) {
      console.log(`❌ [PIN LOGIN] No PIN set for ${email}`);
      res.status(401).json({ error: "PIN not configured for this account" });
      return;
    }

    const isValidPin = await verifyPin(pin, employee.pin_hash);
    if (!isValidPin) {
      console.log(`❌ [PIN LOGIN] Invalid PIN for ${email}`);
      res.status(401).json({ error: "Invalid email or PIN" });
      return;
    }

    console.log(`✅ [PIN LOGIN] PIN verified for ${email}, establishing session`);

    // Establish session
    req.login(employee, (err) => {
      if (err) {
        console.error(`❌ [PIN LOGIN] Login failed:`, err);
        return res.status(500).json({ error: "Login failed" });
      }

      req.session.userId = employee._id.toString();
      req.session.userEmail = employee.email;
      req.session.userName = employee.name;

      console.log(`✅ [PIN LOGIN] Session established for ${employee.email}`);

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error(`❌ [PIN LOGIN] Session save failed:`, saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }

        console.log(`✅ [PIN LOGIN] PIN login successful for ${email}`);
        res.json({
          message: "Login successful",
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
          }
        });
      });
    });
  } catch (error) {
    console.error("❌ [PIN LOGIN] Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

/**
 * Login with PIN only (no email required)
 */
export const verifyPinOnly = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pin } = req.body;

    console.log(`\n🔐🔐🔐 [PIN-ONLY LOGIN] START 🔐🔐🔐`);
    console.log(`PIN received: ${pin ? pin.length + ' digits' : 'MISSING'}`);

    if (!pin) {
      console.log(`❌ [PIN-ONLY LOGIN STEP 1] PIN is missing`);
      res.status(400).json({ error: "PIN is required" });
      return;
    }

    if (!validatePinFormat(pin)) {
      console.log(`❌ [PIN-ONLY LOGIN STEP 2] PIN format invalid: ${pin}`);
      res.status(400).json({ error: "Invalid PIN format" });
      return;
    }

    console.log(`✅ [PIN-ONLY LOGIN STEP 1] PIN format valid`);
    console.log(`🔐 [PIN-ONLY LOGIN STEP 2] Searching for matching PIN`);

    // Find employee by PIN hash - this requires iterating and comparing
    const employees = await Employee.find({ pin_hash: { $exists: true } });
    console.log(`🔐 [PIN-ONLY LOGIN STEP 3] Found ${employees.length} employees with PIN set`);

    let employee = null;
    for (const emp of employees) {
      const isMatch = await verifyPin(pin, emp.pin_hash);
      if (isMatch) {
        console.log(`✅ [PIN-ONLY LOGIN STEP 4] PIN matched for ${emp.email}`);
        employee = emp;
        break;
      }
    }

    if (!employee) {
      console.log(`❌ [PIN-ONLY LOGIN STEP 4] No employee found with matching PIN`);
      res.status(401).json({ error: "Invalid PIN" });
      return;
    }

    console.log(`✅ [PIN-ONLY LOGIN STEP 5] PIN verified for ${employee.email}, establishing session`);

    // Establish session
    req.login(employee, (err) => {
      if (err) {
        console.error(`❌ [PIN-ONLY LOGIN STEP 6] req.login failed:`, err);
        return res.status(500).json({ error: "Login failed" });
      }

      console.log(`✅ [PIN-ONLY LOGIN STEP 6] Passport session established`);

      req.session.userId = employee._id.toString();
      req.session.userEmail = employee.email;
      req.session.userName = employee.name;

      console.log(`✅ [PIN-ONLY LOGIN STEP 7] Custom session properties set`);
      console.log(`   Session ID: ${req.sessionID}`);
      console.log(`   User ID: ${req.session.userId}`);

      req.session.save((saveErr) => {
        if (saveErr) {
          console.error(`❌ [PIN-ONLY LOGIN STEP 8] Session save failed:`, saveErr);
          return res.status(500).json({ error: "Session save failed" });
        }

        console.log(`✅ [PIN-ONLY LOGIN STEP 8] Session saved to MongoDB`);
        console.log(`✅ [PIN-ONLY LOGIN STEP 9] Triggering email sync in background`);

        // Trigger email sync in background (don't wait for it)
        EmailConnection.findOne({ owner_id: employee._id })
          .then((emailConnection) => {
            if (emailConnection) {
              console.log(`📧 [PIN-ONLY LOGIN] Starting email sync for ${employee.email}`);
              syncEmailsFromConnection(emailConnection._id.toString())
                .then(() => console.log(`✅ [PIN-ONLY LOGIN] Email sync completed for ${employee.email}`))
                .catch((error) => console.error(`❌ [PIN-ONLY LOGIN] Email sync error:`, error));
            }
          })
          .catch((error) => console.error(`❌ [PIN-ONLY LOGIN] Error finding email connection:`, error));

        console.log(`✅ [PIN-ONLY LOGIN] SUCCESS - Sending response to client`);

        res.json({
          message: "Login successful",
          employee: {
            _id: employee._id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
          }
        });
      });
    });
  } catch (error) {
    console.error("❌ [PIN-ONLY LOGIN] Exception:", error);
    res.status(500).json({ error: "Login failed" });
  }
};
