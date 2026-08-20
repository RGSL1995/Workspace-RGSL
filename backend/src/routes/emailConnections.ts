import express, { Request, Response } from "express";
import EmailConnection from "../models/EmailConnection";
import Employee from "../models/Employee";
import { Types } from "mongoose";

const router = express.Router();

// GET all email connections for logged-in user
router.get("/", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get personal email connections (owned by user)
    const personalConnections = await EmailConnection.find({
      owner_id: req.session.userId,
      type: "personal",
    }).populate("authorized_employees", "name email");

    // Get shared email connections (user has access to)
    const sharedConnections = await EmailConnection.find({
      type: "shared",
      authorized_employees: req.session.userId,
    }).populate("authorized_employees", "name email");

    res.json({
      personal: personalConnections,
      shared: sharedConnections,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch email connections" });
  }
});

// GET single email connection
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    const connection = await EmailConnection.findById(id)
      .select("-google_tokens.refresh_token") // Don't expose refresh token in response
      .populate("owner_id", "name email")
      .populate("authorized_employees", "name email");

    if (!connection) {
      return res.status(404).json({ error: "Email connection not found" });
    }

    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch email connection" });
  }
});

// CREATE personal email connection
router.post("/personal", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { email, company, google_id, access_token, refresh_token, expires_at } = req.body;

    if (!email || !company || !google_id) {
      return res.status(400).json({
        error: "Email, company, and google_id are required",
      });
    }

    // Check if connection already exists
    const existingConnection = await EmailConnection.findOne({ email });
    if (existingConnection) {
      return res.status(409).json({ error: "Email connection already exists" });
    }

    const connection = new EmailConnection({
      email,
      type: "personal",
      company,
      owner_id: req.session.userId,
      authorized_employees: [req.session.userId],
      google_id,
      google_tokens: {
        access_token,
        refresh_token,
        expires_at,
      },
      created_by: req.session.userId,
      last_synced: new Date(),
    });

    await connection.save();
    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ error: "Failed to create email connection" });
  }
});

// CREATE shared email connection (Admin only)
router.post("/shared", async (req: Request, res: Response) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Verify user is admin
    const user = await Employee.findById(req.session.userId);
    if (!user || user.role !== "super_admin") {
      return res.status(403).json({ error: "Only admins can create shared mailboxes" });
    }

    const { email, company, google_id, access_token, refresh_token, expires_at, authorized_employee_ids } = req.body;

    if (!email || !company || !google_id || !authorized_employee_ids || authorized_employee_ids.length === 0) {
      return res.status(400).json({
        error: "Email, company, google_id, and authorized_employee_ids are required",
      });
    }

    // Validate authorized employees exist
    const employees = await Employee.find({
      _id: { $in: authorized_employee_ids },
    });

    if (employees.length !== authorized_employee_ids.length) {
      return res.status(400).json({ error: "Some employees not found" });
    }

    const connection = new EmailConnection({
      email,
      type: "shared",
      company,
      authorized_employees: authorized_employee_ids,
      google_id,
      google_tokens: {
        access_token,
        refresh_token,
        expires_at,
      },
      created_by: req.session.userId,
      last_synced: new Date(),
    });

    await connection.save();
    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ error: "Failed to create shared email connection" });
  }
});

// UPDATE email connection (refresh tokens, etc)
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    const { access_token, refresh_token, expires_at } = req.body;

    const connection = await EmailConnection.findByIdAndUpdate(
      id,
      {
        google_tokens: {
          access_token,
          refresh_token,
          expires_at,
        },
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ error: "Email connection not found" });
    }

    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: "Failed to update email connection" });
  }
});

// DELETE email connection
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const connection = await EmailConnection.findById(id);
    if (!connection) {
      return res.status(404).json({ error: "Email connection not found" });
    }

    // Only owner or admin can delete
    if (
      connection.owner_id?.toString() !== req.session.userId &&
      (await Employee.findById(req.session.userId)).role !== "super_admin"
    ) {
      return res.status(403).json({ error: "Not authorized to delete this connection" });
    }

    await EmailConnection.findByIdAndDelete(id);
    res.json({ message: "Email connection deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete email connection" });
  }
});

// UPDATE sync status
router.patch("/:id/sync", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, error_message, last_synced } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid connection ID" });
    }

    const connection = await EmailConnection.findByIdAndUpdate(
      id,
      {
        sync_status: status,
        error_message,
        ...(last_synced && { last_synced }),
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ error: "Email connection not found" });
    }

    res.json(connection);
  } catch (error) {
    res.status(500).json({ error: "Failed to update sync status" });
  }
});

export default router;
