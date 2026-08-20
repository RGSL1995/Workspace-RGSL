import express, { Request, Response } from "express";
import Task from "../models/Task";
import Employee from "../models/Employee";
import { Types } from "mongoose";

const router = express.Router();

// GET all tasks (filtered by role/department)
router.get("/", async (req: Request, res: Response) => {
  try {
    const { assignee_id, status, department, priority } = req.query;

    const filter: any = {};
    if (assignee_id) filter.assignee_id = assignee_id;
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate("assigner_id", "name email")
      .populate("assignee_id", "name email")
      .populate("escalated_to_id", "name email")
      .sort({ deadline: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// GET single task
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const task = await Task.findById(id)
      .populate("assigner_id", "name email")
      .populate("assignee_id", "name email")
      .populate("escalated_to_id", "name email");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// GET tasks for current user (assigned to them)
router.get("/user/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const tasks = await Task.find({
      $or: [{ assignee_id: userId }, { assigner_id: userId }],
    })
      .populate("assigner_id", "name email")
      .populate("assignee_id", "name email")
      .sort({ deadline: 1, priority: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user tasks" });
  }
});

// CREATE task (Any employee can assign to any other employee)
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      assigner_id,
      assignee_id,
      department,
      priority,
      deadline,
    } = req.body;

    if (!title || !assigner_id || !assignee_id || !department) {
      return res.status(400).json({
        error: "Title, assigner_id, assignee_id, and department are required",
      });
    }

    // Verify both employees exist
    const [assigner, assignee] = await Promise.all([
      Employee.findById(assigner_id),
      Employee.findById(assignee_id),
    ]);

    if (!assigner || !assignee) {
      return res.status(404).json({ error: "Assigner or assignee not found" });
    }

    const task = new Task({
      title,
      description,
      assigner_id,
      assignee_id,
      department,
      priority: priority || "medium",
      deadline: deadline || null,
      escalation_level: 0,
    });

    await task.save();
    await task.populate("assigner_id", "name email");
    await task.populate("assignee_id", "name email");

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

// UPDATE task status
router.put("/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    if (!["open", "in_progress", "completed", "escalated", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData: any = { status };
    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    const task = await Task.findByIdAndUpdate(id, updateData, { new: true })
      .populate("assigner_id", "name email")
      .populate("assignee_id", "name email");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// ESCALATE task (Move up hierarchy)
router.put("/:id/escalate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { escalated_by_id } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Get escalator to find their manager
    const escalator = await Employee.findById(escalated_by_id);
    if (!escalator) {
      return res.status(404).json({ error: "Escalator not found" });
    }

    // Determine next escalation level
    let nextLevel = task.escalation_level + 1;
    let escalatedToId = null;

    if (nextLevel === 1) {
      // Escalate to department head
      escalatedToId = escalator.manager_id;
    } else if (nextLevel === 2) {
      // Escalate to super admin - find super admin
      const superAdmin = await Employee.findOne({ role: "super_admin" });
      escalatedToId = superAdmin?._id;
      nextLevel = 2; // Cap at level 2
    }

    if (!escalatedToId) {
      return res.status(400).json({ error: "Cannot escalate further" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      {
        escalation_level: nextLevel,
        escalated_to_id: escalatedToId,
        escalated_at: new Date(),
        status: "escalated",
      },
      { new: true }
    )
      .populate("assigner_id", "name email")
      .populate("assignee_id", "name email")
      .populate("escalated_to_id", "name email");

    res.json({ message: "Task escalated", task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: "Failed to escalate task" });
  }
});

// UPDATE task details
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const { title, description, priority, deadline, department } = req.body;

    const task = await Task.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(description && { description }),
        ...(priority && { priority }),
        ...(deadline && { deadline }),
        ...(department && { department }),
      },
      { new: true }
    )
      .populate("assigner_id", "name email")
      .populate("assignee_id", "name email");

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE task
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid task ID" });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted", task });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
