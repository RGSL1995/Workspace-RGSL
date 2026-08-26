import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import Employee from "../models/Employee";

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

const CALLBACK_URL = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL.replace("http", "")}/auth/google/callback`
  : "http://localhost:3000/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:5000/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error("No email from Google"));
        }

        // Find employee by email
        let employee = await Employee.findOne({ email });

        if (!employee) {
          // Employee doesn't exist - will be handled in controller
          return done(null, profile);
        }

        // Update Google ID if not set
        if (!employee.google_id) {
          employee.google_id = profile.id;
          await employee.save();
        }

        return done(null, profile);
      } catch (error) {
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
