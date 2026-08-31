import express, { Request, Response } from "express";
import Employee from "../models/Employee";
import Task from "../models/Task";
import Email from "../models/Email";
import EmailConnection from "../models/EmailConnection";
import { askAI, generateEmployeeInsights, generateManagerInsights } from "../services/claudeService";
import { getUnreadEmailsForEmployee, getImportantEmailsForEmployee, sendEmail } from "../services/gmailService";
import mongoose from "mongoose";

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

// GET unread emails with pagination
router.get("/unread-emails", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const unreadEmails = await getUnreadEmailsForEmployee(req.session.userId);
    const paginatedEmails = unreadEmails.slice(skip, skip + limit);

    res.json({
      count: unreadEmails.length,
      page,
      limit,
      emails: paginatedEmails,
      hasMore: skip + limit < unreadEmails.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch unread emails" });
  }
});

// GET all emails with pagination
router.get("/all-emails", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const personalConnections = await EmailConnection.find({
      owner_id: req.session.userId,
      type: "personal",
    });

    const sharedConnections = await EmailConnection.find({
      type: "shared",
      authorized_employees: req.session.userId,
    });

    const allConnections = [...personalConnections, ...sharedConnections];
    const connectionIds = allConnections.map((c) => c._id);

    // Get total count for pagination
    const totalCount = await Email.countDocuments({
      email_connection_id: { $in: connectionIds },
    });

    // Get paginated results
    const allEmails = await Email.find({
      email_connection_id: { $in: connectionIds },
    })
      .populate("email_connection_id", "email type")
      .sort({ received_at: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      count: totalCount,
      page,
      limit,
      emails: allEmails,
      hasMore: skip + limit < totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all emails" });
  }
});

// GET important emails with pagination
router.get("/important-emails", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const skip = (page - 1) * limit;

    const importantEmails = await getImportantEmailsForEmployee(req.session.userId);
    const paginatedEmails = importantEmails.slice(skip, skip + limit);

    res.json({
      count: importantEmails.length,
      page,
      limit,
      emails: paginatedEmails,
      hasMore: skip + limit < importantEmails.length,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch important emails" });
  }
});

// GET single email by ID with full details
router.get("/email/:emailId", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;

    const email = await Email.findById(emailId)
      .populate("email_connection_id", "email type");

    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Verify user has access to this email
    const connection = await EmailConnection.findById(email.email_connection_id);
    if (!connection) {
      return res.status(404).json({ error: "Email connection not found" });
    }

    // Check if user owns this connection or is an authorized employee
    const isOwner = connection.owner_id?.toString() === req.session.userId;
    const isAuthorized = connection.authorized_employees?.includes(req.session.userId as any);

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ error: "Not authorized to access this email" });
    }

    res.json({
      _id: email._id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      cc: email.cc,
      body: email.body,
      html_body: email.html_body,
      attachments: email.attachments || [],
      classification: email.classification,
      confidence_score: email.confidence_score,
      is_read: email.is_read,
      is_starred: email.is_starred,
      received_at: email.received_at,
      thread_id: email.thread_id,
      connection: email.email_connection_id,
    });
  } catch (error) {
    console.error("Get email error:", error);
    res.status(500).json({ error: "Failed to fetch email" });
  }
});

// GET download attachment
router.get("/attachment/:emailId/:attachmentId", async (req: Request, res: Response) => {
  try {
    const { emailId, attachmentId } = req.params;

    // Get email
    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Get email connection
    const connection = await EmailConnection.findById(email.email_connection_id);
    if (!connection) {
      return res.status(404).json({ error: "Email connection not found" });
    }

    // Verify user has access
    const isOwner = connection.owner_id?.toString() === req.session.userId;
    const isAuthorized = connection.authorized_employees?.includes(req.session.userId as any);

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ error: "Not authorized to download this attachment" });
    }

    // Get attachment metadata
    const attachment = email.attachments?.find((a: any) => a.attachmentId === attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found" });
    }

    // Initialize Gmail client
    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      access_token: connection.google_tokens.access_token,
      refresh_token: connection.google_tokens.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Fetch attachment from Gmail API
    console.log(`📥 [ATTACHMENT] Downloading: ${attachment.filename} (${attachmentId})`);
    const attachmentResponse = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: email.gmail_id,
      id: attachmentId,
    });

    const attachmentData = attachmentResponse.data.data;
    if (!attachmentData) {
      return res.status(404).json({ error: "Attachment data not found" });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(attachmentData, "base64");

    // Set response headers for download
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
    res.setHeader("Content-Length", buffer.length);

    console.log(`✅ [ATTACHMENT] Downloaded: ${attachment.filename}`);
    res.send(buffer);
  } catch (error) {
    console.error("Download attachment error:", error);
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

// PATCH mark email as read/unread
router.patch("/email/:emailId/read", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { isRead } = req.body;

    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Verify access
    const connection = await EmailConnection.findById(email.email_connection_id);
    const isOwner = connection?.owner_id?.toString() === req.session.userId;
    const isAuthorized = connection?.authorized_employees?.includes(req.session.userId as any);

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ error: "Not authorized" });
    }

    email.is_read = isRead;
    await email.save();

    console.log(`📧 [EMAIL] Marked email ${emailId} as ${isRead ? 'read' : 'unread'}`);
    res.json({ success: true, is_read: email.is_read });
  } catch (error) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Failed to update email" });
  }
});

// PATCH star/unstar email
router.patch("/email/:emailId/star", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { isStarred } = req.body;

    const email = await Email.findById(emailId);
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Verify access
    const connection = await EmailConnection.findById(email.email_connection_id);
    const isOwner = connection?.owner_id?.toString() === req.session.userId;
    const isAuthorized = connection?.authorized_employees?.includes(req.session.userId as any);

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ error: "Not authorized" });
    }

    email.is_starred = isStarred;
    await email.save();

    console.log(`⭐ [EMAIL] Marked email ${emailId} as ${isStarred ? 'starred' : 'unstarred'}`);
    res.json({ success: true, is_starred: email.is_starred });
  } catch (error) {
    console.error("Star error:", error);
    res.status(500).json({ error: "Failed to update email" });
  }
});

// POST search emails
router.post("/emails/search", async (req: Request, res: Response) => {
  try {
    const { query, page } = req.body;
    const pageNum = page || 1;
    const limit = 50;
    const skip = (pageNum - 1) * limit;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const personalConnections = await EmailConnection.find({
      owner_id: req.session.userId,
      type: "personal",
    });

    const sharedConnections = await EmailConnection.find({
      type: "shared",
      authorized_employees: req.session.userId,
    });

    const allConnections = [...personalConnections, ...sharedConnections];
    const connectionIds = allConnections.map((c) => c._id);

    const searchRegex = new RegExp(query, "i");

    // Get total count for pagination
    const totalCount = await Email.countDocuments({
      email_connection_id: { $in: connectionIds },
      $or: [
        { subject: searchRegex },
        { from: searchRegex },
        { body: searchRegex },
      ],
    });

    // Get paginated results
    const emails = await Email.find({
      email_connection_id: { $in: connectionIds },
      $or: [
        { subject: searchRegex },
        { from: searchRegex },
        { body: searchRegex },
      ],
    })
      .populate("email_connection_id", "email type")
      .sort({ received_at: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`🔍 [SEARCH] Found ${totalCount} emails matching: ${query} (page ${pageNum})`);
    res.json({
      count: totalCount,
      page: pageNum,
      limit,
      emails: emails,
      query: query,
      hasMore: skip + limit < totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search emails" });
  }
});

// PATCH assign email to person and create task
router.patch("/email/:emailId/assign", async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { assignedToId } = req.body;

    if (!assignedToId) {
      return res.status(400).json({ error: "assignedToId is required" });
    }

    // Get email
    const email = await Email.findById(emailId).populate("email_connection_id");
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Verify access
    const connection = email.email_connection_id as any;
    const isOwner = connection.owner_id?.toString() === req.session.userId;
    const isAuthorized = connection.authorized_employees?.includes(req.session.userId as any);

    if (!isOwner && !isAuthorized) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Verify assigned person exists
    const assignedEmployee = await Employee.findById(assignedToId);
    if (!assignedEmployee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Create task from email
    const task = new Task({
      title: email.subject,
      description: `Email from: ${email.from}\n\n${email.body.substring(0, 500)}...`,
      assignee_id: new mongoose.Types.ObjectId(assignedToId),
      status: "open",
      priority: email.classification === "important" ? "high" : "medium",
      created_by: new mongoose.Types.ObjectId(req.session.userId),
      tags: [email.classification],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    await task.save();

    // Update email with assignment and task reference
    email.assigned_to = new mongoose.Types.ObjectId(assignedToId);
    email.created_task_id = task._id;
    email.assigned_at = new Date();
    await email.save();

    console.log(`📌 [EMAIL] Assigned email ${emailId} to ${assignedEmployee.name}`);
    console.log(`✅ [TASK] Created task from email: ${task._id}`);

    res.json({
      success: true,
      email: {
        _id: email._id,
        assigned_to: email.assigned_to,
        assigned_at: email.assigned_at,
      },
      task: {
        _id: task._id,
        title: task.title,
        assignee_id: task.assignee_id,
      },
    });
  } catch (error) {
    console.error("Assign email error:", error);
    res.status(500).json({ error: "Failed to assign email" });
  }
});

// POST send email
router.post("/send-email", async (req: Request, res: Response) => {
  try {
    const { connectionId, to, subject, body, cc, bcc } = req.body;

    if (!connectionId || !to || !subject || !body) {
      return res.status(400).json({
        error: "connectionId, to, subject, and body are required",
      });
    }

    // Verify the connection belongs to the user
    const connection = await EmailConnection.findById(connectionId);
    if (!connection || connection.owner_id?.toString() !== req.session.userId) {
      return res.status(403).json({ error: "Not authorized to use this email connection" });
    }

    // Send email
    const result = await sendEmail(connectionId, to, subject, body, cc, bcc);

    res.json({
      success: true,
      messageId: result.messageId,
      threadId: result.threadId,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Send email error:", error);
    res.status(500).json({
      error: "Failed to send email",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
