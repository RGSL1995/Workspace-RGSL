import express, { Request, Response } from "express";
import Employee from "../models/Employee";
import Task from "../models/Task";
import { askAI, generateEmployeeInsights, generateManagerInsights } from "../services/claudeService";
import { getUnreadEmailsForEmployee, getImportantEmailsForEmployee } from "../services/gmailService";

const router = express.Router();

// Middleware: Check authentication
const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

router.use(requireAuth);

// GET daily briefing/insights for employee
router.get("/briefing", async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.session.userId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get employee's tasks
    const tasks = await Task.find({ assignee_id: req.session.userId });
    const activeTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "closed");
    const overdueTasks = activeTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date());
    const upcomingDeadlines = activeTasks
      .filter((t) => t.deadline)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 3)
      .map((t) => `${t.title} (${new Date(t.deadline!).toDateString()})`);

    // Get important emails
    const importantEmails = await getImportantEmailsForEmployee(req.session.userId);
    const emailSummary = importantEmails.slice(0, 3).map((e) => e.subject);

    // Generate insights
    const insights = await generateEmployeeInsights(
      employee.name,
      employee.role,
      employee.departments,
      activeTasks.length,
      overdueTasks.length,
      upcomingDeadlines,
      emailSummary
    );

    res.json({
      employee_name: employee.name,
      active_tasks: activeTasks.length,
      overdue_tasks: overdueTasks.length,
      upcoming_deadlines: upcomingDeadlines,
      important_emails: emailSummary,
      briefing: insights,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate briefing" });
  }
});

// GET team insights (managers only)
router.get("/team-insights", async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.session.userId);
    if (!employee || (employee.role !== "department_head" && employee.role !== "super_admin")) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Get managed employees
    const managedEmployees = await Employee.find({
      manager_id: req.session.userId,
    });

    const managedIds = managedEmployees.map((e) => e._id);

    // Get team tasks
    const teamTasks = await Task.find({
      assignee_id: { $in: managedIds },
    });

    // Find overloaded employees
    const taskCounts = new Map();
    managedIds.forEach((id) => {
      const count = teamTasks.filter((t) => t.assignee_id.equals(id) && t.status !== "completed").length;
      if (count > 5) {
        taskCounts.set(id, count);
      }
    });

    const overloadedEmployees = await Employee.find({
      _id: { $in: Array.from(taskCounts.keys()) },
    }).then((emps) => emps.map((e) => `${e.name} (${taskCounts.get(e._id)} tasks)`));

    // Find blocked tasks
    const blockedTasks = teamTasks
      .filter((t) => t.status === "escalated")
      .map((t) => t.title);

    // Find deadline risks
    const upcomingTasks = teamTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && t.status !== "completed"
    );

    const deadlineRisks = upcomingTasks
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 3)
      .map((t) => `${t.title} (${new Date(t.deadline!).toDateString()})`);

    // Generate manager insights
    const insights = await generateManagerInsights(
      employee.name,
      managedEmployees.length,
      overloadedEmployees,
      blockedTasks,
      deadlineRisks
    );

    res.json({
      team_size: managedEmployees.length,
      active_tasks: teamTasks.filter((t) => t.status !== "completed").length,
      overloaded_employees: overloadedEmployees,
      blocked_tasks: blockedTasks,
      deadline_risks: deadlineRisks,
      insights,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate team insights" });
  }
});

// POST ask AI a question
router.post("/ask", async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const employee = await Employee.findById(req.session.userId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Get employee context
    const tasks = await Task.find({ assignee_id: req.session.userId });
    const activeTasks = tasks.filter((t) => t.status !== "completed");
    const overdueTasks = activeTasks.filter((t) => t.deadline && new Date(t.deadline) < new Date());

    const response = await askAI(question, {
      name: employee.name,
      role: employee.role,
      departments: employee.departments,
      activeTasks: activeTasks.length,
      overdueTasks: overdueTasks.length,
    });

    res.json({
      question,
      answer: response,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// GET unread emails
router.get("/unread-emails", async (req: Request, res: Response) => {
  try {
    const unreadEmails = await getUnreadEmailsForEmployee(req.session.userId);

    res.json({
      count: unreadEmails.length,
      emails: unreadEmails,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread emails" });
  }
});

// GET important emails
router.get("/important-emails", async (req: Request, res: Response) => {
  try {
    const importantEmails = await getImportantEmailsForEmployee(req.session.userId);

    res.json({
      count: importantEmails.length,
      emails: importantEmails,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch important emails" });
  }
});

export default router;
