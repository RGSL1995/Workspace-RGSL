import express, { Request, Response } from "express";
import AnchorFreeDate from "../models/AnchorFreeDate";
import {
  parseExcelFile,
  validateAnchorData,
  syncAnchorFreeDates,
  getUpcomingAnchorFreeDates,
  getAllAnchorFreeDates,
  getAnchorFreeDateByCompany,
  updateAnchorFreeeDateStatus,
} from "../services/anchorFreeeDateService";

const router = express.Router();

// Middleware: Check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

/**
 * GET all anchor free dates (no auth for testing)
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { status, upcoming_only } = req.query;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    const dates = upcoming_only
      ? await getUpcomingAnchorFreeDates(30)
      : status
        ? await AnchorFreeDate.find(query).sort({ free_date: 1 })
        : await getAllAnchorFreeDates();

    res.json({
      count: dates.length,
      dates,
    });
  } catch (error) {
    console.error("[ANCHOR API] Error fetching dates:", error);
    res.status(500).json({ error: "Failed to fetch anchor free dates" });
  }
});

/**
 * GET anchor free date by company
 */
router.get("/:company", requireAuth, async (req: Request, res: Response) => {
  try {
    const { company } = req.params;

    const date = await getAnchorFreeDateByCompany(company);

    if (!date) {
      return res.status(404).json({ error: "Anchor free date not found" });
    }

    res.json(date);
  } catch (error) {
    console.error("[ANCHOR API] Error fetching date:", error);
    res.status(500).json({ error: "Failed to fetch anchor free date" });
  }
});

/**
 * POST upload and sync Excel file
 * Expected format:
 * - Column 1: Company Name
 * - Column 2: Free Date (DD/MM/YYYY or MM/DD/YYYY or YYYY-MM-DD)
 * - Column 3: Notes (optional)
 */
router.post("/upload", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.body.file && !req.files) {
      return res.status(400).json({
        error: "No file provided. Send as base64 in 'file' field",
      });
    }

    let fileBuffer: Buffer;

    // Handle file upload (if using multipart form)
    if (req.files && (req.files as any).file) {
      fileBuffer = (req.files as any).file.data;
    } else if (req.body.file) {
      // Handle base64 file
      fileBuffer = Buffer.from(req.body.file, "base64");
    } else {
      return res.status(400).json({ error: "Invalid file format" });
    }

    console.log(`📁 [ANCHOR API] Processing Excel file (${fileBuffer.length} bytes)`);

    // Parse Excel
    const rawData = parseExcelFile(fileBuffer);

    // Validate data
    const validatedData = validateAnchorData(rawData);

    // Sync to database
    const count = await syncAnchorFreeDates(validatedData);

    res.json({
      success: true,
      message: `Successfully imported ${count} anchor free dates`,
      count,
    });
  } catch (error) {
    console.error("[ANCHOR API] Error uploading file:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to import file",
    });
  }
});

/**
 * POST manual sync (for testing - no auth)
 * Send array of anchor free dates directly
 */
router.post(
  "/sync",
  async (req: Request, res: Response) => {
    try {
      const { dates } = req.body;

      if (!Array.isArray(dates) || dates.length === 0) {
        return res.status(400).json({
          error: "Please provide an array of dates with company_name and free_date",
        });
      }

      // Validate dates
      const validatedData = validateAnchorData(dates);

      // Sync to database
      const count = await syncAnchorFreeDates(validatedData);

      res.json({
        success: true,
        message: `Successfully synced ${count} anchor free dates`,
        count,
      });
    } catch (error) {
      console.error("[ANCHOR API] Error syncing:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to sync dates",
      });
    }
  }
);

/**
 * GET upcoming anchor free dates
 */
router.get("/upcoming/30days", requireAuth, async (req: Request, res: Response) => {
  try {
    const dates = await getUpcomingAnchorFreeDates(30);

    res.json({
      count: dates.length,
      dates,
    });
  } catch (error) {
    console.error("[ANCHOR API] Error fetching upcoming dates:", error);
    res.status(500).json({ error: "Failed to fetch upcoming dates" });
  }
});

/**
 * PATCH update status for all dates
 */
router.patch("/status/update", requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await updateAnchorFreeeDateStatus();

    res.json({
      success: true,
      message: `Updated status for ${updated} anchor free dates`,
      updated,
    });
  } catch (error) {
    console.error("[ANCHOR API] Error updating status:", error);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/**
 * DELETE all anchor free dates
 */
router.delete("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await AnchorFreeDate.deleteMany({});

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} anchor free dates`,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("[ANCHOR API] Error deleting dates:", error);
    res.status(500).json({ error: "Failed to delete dates" });
  }
});

/**
 * GET statistics (no auth for testing)
 */
router.get("/stats/overview", async (req: Request, res: Response) => {
  try {
    const total = await AnchorFreeDate.countDocuments();
    const upcoming = await AnchorFreeDate.countDocuments({ status: "upcoming" });
    const active = await AnchorFreeDate.countDocuments({ status: "active" });
    const expired = await AnchorFreeDate.countDocuments({ status: "expired" });

    res.json({
      total,
      upcoming,
      active,
      expired,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("[ANCHOR API] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
