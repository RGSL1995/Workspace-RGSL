import express from "express";
import passport from "passport";
import { getCurrentUser, logout } from "../controllers/authController";

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/dashboard`);
  }
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
