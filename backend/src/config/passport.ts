import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Employee from "../models/Employee";
import EmailConnection from "../models/EmailConnection";
import { syncEmailsFromConnection } from "../services/gmailService";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

console.log("🔍 Passport Config Debug:");
console.log("   GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID ? "✅ Loaded" : "❌ Missing");
console.log("   GOOGLE_CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "✅ Loaded" : "❌ Missing");

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error(
    `❌ Google OAuth credentials missing!\n` +
    `   Make sure your backend/.env file has:\n` +
    `   GOOGLE_CLIENT_ID=your_client_id\n` +
    `   GOOGLE_CLIENT_SECRET=your_client_secret`
  );
}

// Construct backend OAuth callback URL
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
const CALLBACK_URL = `${BACKEND_URL}/api/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:5000/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("\n================================");
      console.log("🔐🔐🔐 PASSPORT VERIFY CALLED 🔐🔐🔐");
      console.log("================================");

      try {
        console.log(`\n🔐 [PASSPORT STEP 1] OAuth callback received`);
        console.log(`   Profile ID: ${profile.id}`);

        const email = profile.emails?.[0]?.value;
        console.log(`🔐 [PASSPORT STEP 2] Extracted email: ${email}`);

        if (!email) {
          console.error(`❌ [PASSPORT] No email found in profile`);
          return done(new Error("No email from Google"));
        }

        console.log(`🔐 [PASSPORT STEP 3] Looking up employee in database`);
        // Find or create employee
        let employee = await Employee.findOne({ email });
        console.log(`🔐 [PASSPORT STEP 4] Employee lookup result: ${employee ? "FOUND" : "NOT FOUND"}`);

        if (!employee) {
          // Employee will be created in authController
          // Pass tokens in profile for later use
          const profileWithTokens = profile as any;
          profileWithTokens.accessToken = accessToken;
          profileWithTokens.refreshToken = refreshToken;
          return done(null, profile);
        }

        // Update Google ID and profile data
        if (!employee.google_id) {
          employee.google_id = profile.id;
        }

        // Store Google profile data
        const googleProfile = profile as any;
        employee.google_profile = {
          picture: profile.photos?.[0]?.value,
          phone: googleProfile.phoneNumbers?.[0]?.value,
          locale: profile._json?.locale,
          gender: googleProfile._json?.gender,
        };

        await employee.save();
        console.log(`✅ Updated employee Google profile: ${email}`);

        console.log(`🔐 [PASSPORT STEP 5] Checking for email connection`);
        // Auto-create or update email connection
        let emailConnection = await EmailConnection.findOne({
          email,
          owner_id: employee._id,
        });
        console.log(`🔐 [PASSPORT STEP 6] Email connection lookup: ${emailConnection ? "FOUND" : "NOT FOUND"}`);

        if (!emailConnection && accessToken) {
          console.log(`🔐 [PASSPORT STEP 7] Creating NEW email connection`);
          // Create new email connection
          emailConnection = new EmailConnection({
            email,
            type: "personal",
            company: employee.companies[0] || "RGSL",
            owner_id: employee._id,
            authorized_employees: [employee._id],
            google_id: profile.id,
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
          console.log(`✅ [PASSPORT STEP 8] Email connection CREATED: ${emailConnection._id}`);
        } else if (emailConnection && accessToken) {
          console.log(`🔐 [PASSPORT STEP 7] Updating EXISTING email connection`);
          // Update tokens for existing connection
          emailConnection.google_tokens = {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: Date.now() + 3600 * 1000,
          };
          // Reset last_synced to fetch historical emails (30 days)
          emailConnection.last_synced = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          await emailConnection.save();
          console.log(`✅ [PASSPORT STEP 8] Email connection UPDATED: ${emailConnection._id}`);
        } else {
          console.warn(`⚠️ [PASSPORT STEP 7] No access token or connection found`);
        }

        // Always trigger sync if connection exists
        if (emailConnection) {
          console.log(`🔐 [PASSPORT STEP 9] Email connection ready for sync`);
          console.log(`🔄 [PASSPORT STEP 10] Triggering email sync for: ${email}`);
          console.log(`   Connection ID: ${emailConnection._id}`);
          console.log(`   Has access token: ${!!emailConnection.google_tokens.access_token}`);

          syncEmailsFromConnection(emailConnection._id.toString())
            .then(() => console.log(`✅ [PASSPORT STEP 11] Email sync COMPLETED for ${email}`))
            .catch((error) => {
              console.error(`❌ [PASSPORT STEP 11] Email sync FAILED for ${email}`);
              console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
            });
        } else {
          console.warn(`⚠️ [PASSPORT STEP 10] No email connection to sync`);
        }

        // Pass tokens in profile for controller
        const profileWithTokens2 = profile as any;
        profileWithTokens2.accessToken = accessToken;
        profileWithTokens2.refreshToken = refreshToken;

        return done(null, profile);
      } catch (error) {
        console.error("Passport strategy error:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  done(null, { id });
});

export default passport;
