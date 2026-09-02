import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import connectDatabase from "./config/database";
import passportConfig from "./config/passport";
import employeeRoutes from "./routes/employees";
import taskRoutes from "./routes/tasks";
import authRoutes from "./routes/auth";
import emailConnectionRoutes from "./routes/emailConnections";
import aiRoutes from "./routes/ai";
import { startEmailScheduler } from "./jobs/emailScheduler";

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
const cookieConfig: any = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// In production, set domain to allow cross-subdomain sharing
if (process.env.NODE_ENV === "production") {
  cookieConfig.domain = "rgslgroup.com"; // Without leading dot for explicit domain
}

console.log(`🔐 [SESSION CONFIG] Cookie domain:`, cookieConfig.domain || "default");
console.log(`🔐 [SESSION CONFIG] Secure:`, cookieConfig.secure);
console.log(`🔐 [SESSION CONFIG] SameSite:`, cookieConfig.sameSite);
console.log(`🔐 [SESSION CONFIG] Using MongoDB for session storage`);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret_key",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/task-management",
      touchAfter: 24 * 3600, // Lazy session update (in seconds)
    }),
    cookie: cookieConfig,
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

// Create HTTP server for Socket.io
const httpServer = createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  },
});

// Store connected users: userId -> socketId
const connectedUsers = new Map<string, string>();

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`🔗 [SOCKET] User connected: ${socket.id}`);

  // When user authenticates, store their userId-socketId mapping
  socket.on("auth", (userId: string) => {
    connectedUsers.set(userId, socket.id);
    console.log(`👤 [SOCKET] User authenticated: ${userId}`);
  });

  socket.on("disconnect", () => {
    // Find and remove user
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`🔌 [SOCKET] User disconnected: ${userId}`);
        break;
      }
    }
  });
});

// Export io and connectedUsers for use in other files
export { io, connectedUsers };

const startServer = async (): Promise<void> => {
  await connectDatabase();

  // Start email scheduler for real-time updates
  startEmailScheduler();

  httpServer.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    console.log(`Google OAuth callback: http://localhost:${PORT}/api/auth/google/callback`);
    console.log(`🔄 Socket.io server is initialized`);
  });
};

startServer();
