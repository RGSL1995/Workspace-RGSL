import { Request, Response } from "express";
import Employee from "../models/Employee";

export const googleAuthCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id, emails, displayName } = req.user as any;
    const email = emails[0]?.value;

    if (!email) {
      res.status(400).json({ error: "No email from Google" });
      return;
    }

    // Find or create employee
    let employee = await Employee.findOne({ email });

    if (!employee) {
      res.status(403).json({
        error: "Employee not found in RGSL system",
        email,
        message: "Please contact IT to register your account",
      });
      return;
    }

    // Update Google ID if not already set
    if (!employee.google_id) {
      employee.google_id = id;
      await employee.save();
    }

    // Set session user
    req.session.userId = employee._id.toString();
    req.session.userEmail = employee.email;
    req.session.userName = employee.name;

    // Redirect to dashboard
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/dashboard`);
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
    if (!req.session.userId) {
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
