import { Request, Response, NextFunction } from "express";
import Employee from "../models/Employee";
import { hasCapability } from "../utils/capabilities";

declare global {
  namespace Express {
    interface Session {
      userId?: string;
    }
  }
}

/**
 * Middleware to check if user has a specific capability
 */
export const requireCapability = (requiredCapability: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await Employee.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userCapabilities = user.capabilities || [];
      const userRole = user.role;

      // Check if user has the required capability
      if (!hasCapability(userRole, requiredCapability, userCapabilities)) {
        console.warn(
          `🚫 [CAPABILITY] User ${user.email} denied access to ${requiredCapability}`
        );
        return res.status(403).json({
          error: "Insufficient permissions",
          required: requiredCapability,
        });
      }

      console.log(
        `✅ [CAPABILITY] User ${user.email} granted access to ${requiredCapability}`
      );
      next();
    } catch (error) {
      console.error("Capability check error:", error);
      res.status(500).json({ error: "Failed to check capabilities" });
    }
  };
};

/**
 * Middleware to ensure user is admin (super_admin or it_admin)
 */
export const requireAdminRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await Employee.findById(req.session.userId);
    if (!user || (user.role !== "super_admin" && user.role !== "it_admin")) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Failed to verify admin status" });
  }
};
