import express, { Request, Response } from "express";
import Department from "../models/Department";
import Employee from "../models/Employee";

const router = express.Router();

// Middleware: Check if super admin
const isSuperAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    const employee = await Employee.findById(req.session.userId);
    if (!employee || employee.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admins can access this" });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Authorization check failed" });
  }
};

// GET all departments
router.get("/", async (req: Request, res: Response) => {
  try {
    console.log(`📊 [DEPT] Fetching all departments`);
    const departments = await Department.find()
      .populate("head_id", "name email")
      .sort({ name: 1 });

    console.log(`✅ [DEPT] Found ${departments.length} departments`);
    res.json(departments);
  } catch (error) {
    console.error("❌ [DEPT] Error fetching departments:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// GET single department with employees
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📊 [DEPT] Fetching department: ${id}`);

    const department = await Department.findById(id)
      .populate("head_id", "name email");

    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Get employees in this department
    const employees = await Employee.find({
      departments: department.name,
    }).select("name email role departments manager_id");

    console.log(`✅ [DEPT] Found department with ${employees.length} employees`);
    res.json({
      ...department.toObject(),
      employees,
    });
  } catch (error) {
    console.error("❌ [DEPT] Error fetching department:", error);
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

// CREATE department (Super Admin Only)
router.post("/", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, description, head_id } = req.body;

    if (!name || !["Finance", "Trading", "Lending", "Compliance"].includes(name)) {
      return res.status(400).json({ error: "Invalid department name" });
    }

    console.log(`📊 [DEPT] Creating department: ${name}`);

    // Check if department already exists
    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(409).json({ error: "Department already exists" });
    }

    // Verify head exists if provided
    if (head_id) {
      const head = await Employee.findById(head_id);
      if (!head) {
        return res.status(404).json({ error: "Department head not found" });
      }
    }

    const department = new Department({
      name,
      description: description || "",
      head_id: head_id || null,
    });

    await department.save();
    console.log(`✅ [DEPT] Department created: ${name}`);

    res.status(201).json(department);
  } catch (error) {
    console.error("❌ [DEPT] Error creating department:", error);
    res.status(500).json({ error: "Failed to create department" });
  }
});

// UPDATE department (Super Admin Only)
router.put("/:id", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, head_id } = req.body;

    console.log(`📊 [DEPT] Updating department: ${id}`);

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Verify head exists if provided
    if (head_id) {
      const head = await Employee.findById(head_id);
      if (!head) {
        return res.status(404).json({ error: "Department head not found" });
      }
      department.head_id = head_id;
    }

    if (description !== undefined) {
      department.description = description;
    }

    await department.save();
    console.log(`✅ [DEPT] Department updated: ${id}`);

    res.json(department);
  } catch (error) {
    console.error("❌ [DEPT] Error updating department:", error);
    res.status(500).json({ error: "Failed to update department" });
  }
});

// DELETE department (Super Admin Only)
router.delete("/:id", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`📊 [DEPT] Deleting department: ${id}`);

    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    // Check if any employees belong to this department
    const employeeCount = await Employee.countDocuments({
      departments: department.name,
    });

    if (employeeCount > 0) {
      return res.status(409).json({
        error: `Cannot delete department with ${employeeCount} employees. Remove them first.`,
      });
    }

    await Department.findByIdAndDelete(id);
    console.log(`✅ [DEPT] Department deleted: ${id}`);

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("❌ [DEPT] Error deleting department:", error);
    res.status(500).json({ error: "Failed to delete department" });
  }
});

// ASSIGN employee to department (Super Admin Only)
router.put("/:deptId/assign-employee/:empId", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { deptId, empId } = req.params;
    console.log(`📊 [DEPT] Assigning employee ${empId} to department ${deptId}`);

    const department = await Department.findById(deptId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const employee = await Employee.findById(empId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Add department if not already assigned
    if (!employee.departments.includes(department.name)) {
      employee.departments.push(department.name);
      await employee.save();

      // Update employee count
      department.employee_count = await Employee.countDocuments({
        departments: department.name,
      });
      await department.save();

      console.log(`✅ [DEPT] Employee assigned to ${department.name}`);
    }

    res.json({ message: "Employee assigned to department", employee });
  } catch (error) {
    console.error("❌ [DEPT] Error assigning employee:", error);
    res.status(500).json({ error: "Failed to assign employee" });
  }
});

// REMOVE employee from department (Super Admin Only)
router.put("/:deptId/remove-employee/:empId", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { deptId, empId } = req.params;
    console.log(`📊 [DEPT] Removing employee ${empId} from department ${deptId}`);

    const department = await Department.findById(deptId);
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }

    const employee = await Employee.findById(empId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Remove department
    employee.departments = employee.departments.filter((d) => d !== department.name);
    await employee.save();

    // Update employee count
    department.employee_count = await Employee.countDocuments({
      departments: department.name,
    });
    await department.save();

    console.log(`✅ [DEPT] Employee removed from ${department.name}`);
    res.json({ message: "Employee removed from department", employee });
  } catch (error) {
    console.error("❌ [DEPT] Error removing employee:", error);
    res.status(500).json({ error: "Failed to remove employee" });
  }
});

export default router;
