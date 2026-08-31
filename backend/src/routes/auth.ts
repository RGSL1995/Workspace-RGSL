import express from "express";
import passport from "passport";
import { getCurrentUser, logout, googleAuthCallback } from "../controllers/authController";

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

export default router;
