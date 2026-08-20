import express, { Request, Response } from "express";
import Employee from "../models/Employee";
import { Types } from "mongoose";

const router = express.Router();

// GET all employees (Super Admin only)
router.get("/", async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find()
      .select("-google_tokens")
      .populate("manager_id", "name email");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// GET employees by department
router.get("/department/:dept", async (req: Request, res: Response) => {
  try {
    const { dept } = req.params;
    const employees = await Employee.find({ departments: dept })
      .select("-google_tokens")
      .populate("manager_id", "name email");
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// GET single employee
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await Employee.findById(id)
      .select("-google_tokens")
      .populate("manager_id", "name email")
      .populate("managed_employees", "name email role");

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// CREATE employee (Admin only)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, name, role, departments, manager_id } = req.body;

    if (!email || !name || !departments || departments.length === 0) {
      return res.status(400).json({
        error: "Email, name, and at least one department are required",
      });
    }

    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(409).json({ error: "Employee with this email exists" });
    }

    const employee = new Employee({
      email,
      name,
      role: role || "department_person",
      departments,
      manager_id: manager_id || null,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// UPDATE employee
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const { name, departments, role, manager_id, is_active } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        ...(name && { name }),
        ...(departments && { departments }),
        ...(role && { role }),
        ...(manager_id !== undefined && { manager_id }),
        ...(is_active !== undefined && { is_active }),
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// DELETE employee (Soft delete: set is_active to false)
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Employee deactivated", employee });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// UPDATE Gmail connection status
router.patch("/:id/gmail", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { gmail_connected, google_id, google_tokens } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid employee ID" });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        gmail_connected,
        ...(google_id && { google_id }),
        ...(google_tokens && { google_tokens }),
      },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json({ message: "Gmail connection updated", employee });
  } catch (error) {
    res.status(500).json({ error: "Failed to update Gmail connection" });
  }
});

export default router;
