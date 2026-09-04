import express from "express";
import passport from "passport";
import { getCurrentUser, logout, googleAuthCallback, setPin, verifyPinLogin, verifyPinOnly, googleAuthCallbackSharedMailbox } from "../controllers/authController";

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  (req, res, next) => {
    console.log("🔷 [AUTH ROUTE] /google endpoint called");
    next();
  },
  passport.authenticate("google", {
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    accessType: "offline",
    prompt: "consent",
  })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("\n🔷🔷🔷 [AUTH ROUTE] /google/callback CALLED 🔷🔷🔷");
    console.log(`   Code: ${req.query.code?.toString().substring(0, 20)}...`);
    next();
  },
  passport.authenticate("google", { failureRedirect: "/" }),
  googleAuthCallback
);

// Shared Mailbox OAuth - Custom handler (NOT using Passport to prevent session interference)
router.get("/google/shared-mailbox", (req, res) => {
  console.log("🔷 [CUSTOM AUTH] /google/shared-mailbox endpoint called");
  console.log(`   User authenticated: ${!!req.session.userId}`);

  if (!req.session?.userId) {
    console.error("❌ [SHARED MAILBOX] User must be logged in");
    return res.status(401).json({ error: "Must be logged in" });
  }

  // Store session info for callback
  const state = Buffer.from(JSON.stringify({ userId: req.session.userId, timestamp: Date.now() })).toString('base64');

  const googleOAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleOAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  googleOAuthUrl.searchParams.set("redirect_uri", `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/shared-mailbox/callback`);
  googleOAuthUrl.searchParams.set("response_type", "code");
  googleOAuthUrl.searchParams.set("scope", [
    "profile",
    "email",
    "https://www.googleapis.com/auth/gmail.modify",
  ].join(" "));
  googleOAuthUrl.searchParams.set("access_type", "offline");
  googleOAuthUrl.searchParams.set("prompt", "consent");
  googleOAuthUrl.searchParams.set("state", state);

  console.log(`🔷 [CUSTOM AUTH] Redirecting to Google OAuth`);
  res.redirect(googleOAuthUrl.toString());
});

router.get("/google/shared-mailbox/callback", async (req, res) => {
  console.log("\n================================");
  console.log("🔷 CUSTOM SHARED MAILBOX CALLBACK");
  console.log("================================");

  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error(`❌ [CUSTOM AUTH] Google error: ${error}`);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=Google auth failed`);
    }

    // Decode state to get original user ID
    let originalUserId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
      originalUserId = stateData.userId;
      console.log(`🔷 [CUSTOM AUTH] Original user ID: ${originalUserId}`);
    } catch (e) {
      console.error("❌ [CUSTOM AUTH] Invalid state parameter");
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=Invalid state`);
    }

    // Exchange code for tokens
    console.log(`🔷 [CUSTOM AUTH] Exchanging code for tokens...`);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/auth/google/shared-mailbox/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      console.error("❌ [CUSTOM AUTH] No access token from Google");
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=Failed to get tokens`);
    }

    console.log(`✅ [CUSTOM AUTH] Got tokens from Google`);

    // Get user profile
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileResponse.json();
    const sharedEmail = profile.email;

    console.log(`📬 [CUSTOM AUTH] Shared email: ${sharedEmail}`);

    // Now call the handler with the tokens and profile
    await googleAuthCallbackSharedMailbox(req, res, {
      userId: originalUserId,
      sharedEmail,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
    });
  } catch (error) {
    console.error("❌ [CUSTOM AUTH] Error:", error);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/?error=Authentication failed`);
  }
});

// Get current authenticated user
router.get("/me", (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}, getCurrentUser);

// Logout
router.post("/logout", logout);

// Check if authenticated
router.get("/status", (req, res) => {
  res.json({
    authenticated: !!req.session.userId,
    userId: req.session.userId,
    email: req.session.userEmail,
  });
});

// PIN Login routes
router.post("/set-pin", setPin);
router.post("/verify-pin", verifyPinLogin);
router.post("/verify-pin-only", verifyPinOnly);

export default router;
