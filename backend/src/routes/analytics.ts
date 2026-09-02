import express, { Request, Response } from "express";
import Task from "../models/Task";
import Email from "../models/Email";
import Employee from "../models/Employee";
import EmailConnection from "../models/EmailConnection";

const router = express.Router();

// GET system-wide analytics (Super Admin Only)
router.get("/system", async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.session.userId);
    if (!employee || employee.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can access this" });
    }

    console.log(`📊 [ANALYTICS] Fetching system-wide analytics`);

    // Task statistics
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const departmentStats = await Task.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
          avgPriority: { $avg: { $switch: { branches: [{ case: { $eq: ["$priority", "critical"] }, then: 4 }, { case: { $eq: ["$priority", "high"] }, then: 3 }, { case: { $eq: ["$priority", "medium"] }, then: 2 }, { case: { $eq: ["$priority", "low"] }, then: 1 }], default: 2 } } },
        },
      },
    ]);

    // Email statistics
    const emailStats = await Email.aggregate([
      {
        $group: {
          _id: "$classification",
          count: { $sum: 1 },
        },
      },
    ]);

    const emailSyncStatus = await EmailConnection.find({}).select("email sync_status last_synced error_message");

    // Employee statistics
    const totalEmployees = await Employee.countDocuments();
    const employeeByRole = await Employee.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]);

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: "completed" },
    });

    const analytics = {
      timestamp: new Date(),
      tasks: {
        byStatus: taskStats,
        byPriority: priorityStats,
        byDepartment: departmentStats,
        overdue: overdueTasks,
        total: await Task.countDocuments(),
      },
      emails: {
        byClassification: emailStats,
        total: await Email.countDocuments(),
        syncStatus: emailSyncStatus,
      },
      employees: {
        total: totalEmployees,
        byRole: employeeByRole,
      },
    };

    console.log(`✅ [ANALYTICS] System analytics fetched`);
    res.json(analytics);
  } catch (error) {
    console.error("❌ [ANALYTICS] Error fetching system analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET department analytics (Department Head can see their dept, Super Admin sees all)
router.get("/department/:deptName", async (req: Request, res: Response) => {
  try {
    const { deptName } = req.params;
    const currentUser = await Employee.findById(req.session.userId);

    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Check permissions: only super admin or department head can see dept analytics
    const isDeptHead = currentUser.role === "department_head" && currentUser.departments.includes(deptName);
    const isSuperAdmin = currentUser.role === "super_admin";

    if (!isDeptHead && !isSuperAdmin) {
      return res.status(403).json({ error: "Not authorized to view this department" });
    }

    console.log(`📊 [ANALYTICS] Fetching analytics for department: ${deptName}`);

    // Task statistics for this department
    const taskStats = await Task.aggregate([
      { $match: { department: deptName } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { department: deptName } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Employee workload in this department
    const employeeWorkload = await Task.aggregate([
      { $match: { department: deptName } },
      {
        $group: {
          _id: "$assignee_id",
          taskCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: 0,
          employeeId: "$employee._id",
          employeeName: "$employee.name",
          taskCount: 1,
          completedCount: 1,
          completionRate: {
            $cond: [{ $eq: ["$taskCount", 0] }, 0, { $multiply: [{ $divide: ["$completedCount", "$taskCount"] }, 100] }],
          },
        },
      },
    ]);

    // Overdue tasks in this department
    const overdueTasks = await Task.countDocuments({
      department: deptName,
      deadline: { $lt: new Date() },
      status: { $ne: "completed" },
    });

    const analytics = {
      timestamp: new Date(),
      department: deptName,
      tasks: {
        byStatus: taskStats,
        byPriority: priorityStats,
        overdue: overdueTasks,
        total: await Task.countDocuments({ department: deptName }),
      },
      employees: employeeWorkload,
      employees_total: await Employee.countDocuments({ departments: deptName }),
    };

    console.log(`✅ [ANALYTICS] Department analytics fetched for ${deptName}`);
    res.json(analytics);
  } catch (error) {
    console.error("❌ [ANALYTICS] Error fetching department analytics:", error);
    res.status(500).json({ error: "Failed to fetch department analytics" });
  }
});

// GET personal analytics
router.get("/personal", async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    const user = await Employee.findById(userId);

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    console.log(`📊 [ANALYTICS] Fetching personal analytics for ${user.email}`);

    // Tasks assigned to me
    const myTasks = await Task.aggregate([
      { $match: { assignee_id: user._id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const myPriority = await Task.aggregate([
      { $match: { assignee_id: user._id } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const overdueMine = await Task.countDocuments({
      assignee_id: user._id,
      deadline: { $lt: new Date() },
      status: { $ne: "completed" },
    });

    const analytics = {
      timestamp: new Date(),
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        departments: user.departments,
      },
      tasks: {
        byStatus: myTasks,
        byPriority: myPriority,
        overdue: overdueMine,
        total: await Task.countDocuments({ assignee_id: user._id }),
      },
    };

    console.log(`✅ [ANALYTICS] Personal analytics fetched`);
    res.json(analytics);
  } catch (error) {
    console.error("❌ [ANALYTICS] Error fetching personal analytics:", error);
    res.status(500).json({ error: "Failed to fetch personal analytics" });
  }
});

export default router;
