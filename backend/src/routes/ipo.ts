
import express, { Request, Response } from "express";
import IPO from "../models/IPO";
import { runIPOSync } from "../services/ipoScheduler";
import { getSchedulerStatus } from "../services/ipoScheduler";

const router = express.Router();

// Middleware: Check if user is authenticated
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

// GET all IPOs
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { status, search, limit = "1000" } = req.query;

    const filter: any = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      const q = String(search);
      filter.$or = [
        { company_name: new RegExp(q, "i") },
        { sector: new RegExp(q, "i") },
      ];
    }

    const ipos = await IPO.find(filter)
      .sort({ listing_date: -1, created_at: -1 })
      .limit(Number(limit) || 1000);

    // Sort order in response: 'open' -> 'upcoming' -> 'closed' -> 'listed'
    const statusOrder: Record<string, number> = {
      open: 1,
      upcoming: 2,
      closed: 3,
      listed: 4,
    };

    ipos.sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;
      // Within same status, sort by listing_date
      return new Date(b.listing_date).getTime() - new Date(a.listing_date).getTime();
    });

    res.json({
      count: ipos.length,
      ipos,
    });
  } catch (error) {
    console.error("[IPO API] Error fetching IPOs:", error);
    res.status(500).json({ error: "Failed to fetch IPOs" });
  }
});

// GET IPO by ID
router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`🔍 [IPO API] Fetching IPO: ${id}`);

    const ipo = await IPO.findById(id);

    if (!ipo) {
      return res.status(404).json({ error: "IPO not found" });
    }

    res.json(ipo);
  } catch (error) {
    console.error("[IPO API] Error fetching IPO:", error);
    res.status(500).json({ error: "Failed to fetch IPO" });
  }
});

// GET upcoming IPOs
router.get("/status/upcoming", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log(`🔍 [IPO API] Fetching upcoming IPOs`);

    const upcomingIPOs = await IPO.find({
      status: "upcoming",
      listing_date: { $gte: new Date() },
    })
      .sort({ listing_date: 1 })
      .limit(20);

    console.log(`✅ [IPO API] Found ${upcomingIPOs.length} upcoming IPOs`);

    res.json({
      count: upcomingIPOs.length,
      ipos: upcomingIPOs,
    });
  } catch (error) {
    console.error("[IPO API] Error fetching upcoming IPOs:", error);
    res.status(500).json({ error: "Failed to fetch upcoming IPOs" });
  }
});

// GET open IPOs
router.get("/status/open", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log(`🔍 [IPO API] Fetching open IPOs`);

    const openIPOs = await IPO.find({ status: "open" }).sort({
      listing_date: -1,
    });

    console.log(`✅ [IPO API] Found ${openIPOs.length} open IPOs`);

    res.json({
      count: openIPOs.length,
      ipos: openIPOs,
    });
  } catch (error) {
    console.error("[IPO API] Error fetching open IPOs:", error);
    res.status(500).json({ error: "Failed to fetch open IPOs" });
  }
});

// GET IPO statistics
router.get("/stats/overview", requireAuth, async (req: Request, res: Response) => {
  try {
    console.log(`📊 [IPO API] Fetching IPO statistics`);

    const stats = await IPO.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalIPOs = await IPO.countDocuments();
    const upcomingCount =
      stats.find((s) => s._id === "upcoming")?.count || 0;
    const openCount = stats.find((s) => s._id === "open")?.count || 0;
    const closedCount = stats.find((s) => s._id === "closed")?.count || 0;
    const listedCount = stats.find((s) => s._id === "listed")?.count || 0;

    console.log(`✅ [IPO API] Stats: Total=${totalIPOs}, Open=${openCount}`);

    res.json({
      total: totalIPOs,
      upcoming: upcomingCount,
      open: openCount,
      closed: closedCount,
      listed: listedCount,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("[IPO API] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// ADMIN: Trigger manual sync (Super admin only)
router.post("/admin/sync", async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`🔄 [IPO API] Manual sync triggered`);

    await runIPOSync();

    res.json({
      success: true,
      message: "IPO sync completed successfully",
    });
  } catch (error) {
    console.error("[IPO API] Error during manual sync:", error);
    res.status(500).json({ error: "Sync failed" });
  }
});

// ADMIN: Get scheduler status
router.get("/admin/scheduler-status", async (req: Request, res: Response) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const status = getSchedulerStatus();

    res.json(status);
  } catch (error) {
    console.error("[IPO API] Error getting scheduler status:", error);
    res.status(500).json({ error: "Failed to get scheduler status" });
  }
});

// Search IPOs
router.get("/search/:query", requireAuth, async (req: Request, res: Response) => {
  try {
    const { query } = req.params;

    const queryStr = String(query);
    const results = await IPO.find({
      $or: [
        { company_name: new RegExp(queryStr, "i") },
        { sector: new RegExp(queryStr, "i") },
      ],
    }).limit(20);

    console.log(`✅ [IPO API] Found ${results.length} results`);

    res.json({
      query,
      count: results.length,
      ipos: results,
    });
  } catch (error) {
    console.error("[IPO API] Error searching IPOs:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
