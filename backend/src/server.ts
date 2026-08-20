import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";

import connectDatabase from "./config/database";
import passportConfig from "./config/passport";
import employeeRoutes from "./routes/employees";
import taskRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";
import emailConnectionRoutes from "./routes/emailConnections";
import aiRoutes from "./routes/ai";

dotenv.config();
const app = express();

// CORS with credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Middleware
app.use(express.json());

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Passport initialization
app.use(passportConfig.initialize());
app.use(passportConfig.session());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Task Management API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/email-connections", emailConnectionRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Google OAuth callback: http://localhost:${PORT}/api/auth/google/callback`);
  });
};

startServer();
