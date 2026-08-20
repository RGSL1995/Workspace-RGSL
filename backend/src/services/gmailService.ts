import { google } from "googleapis";
import EmailConnection from "../models/EmailConnection";
import Email from "../models/Email";
import { classifyEmail } from "./claudeService";
import Employee from "../models/Employee";

/**
 * Initialize Gmail API client
 */
const getGmailClient = (accessToken: string) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return google.gmail({ version: "v1", auth: oauth2Client });
};

/**
 * Sync emails from a connected Gmail account
 */
export const syncEmailsFromConnection = async (
  connectionId: string
): Promise<void> => {
  try {
    const connection = await EmailConnection.findById(connectionId);
    if (!connection) {
      throw new Error("Email connection not found");
    }

    // Update sync status
    connection.sync_status = "syncing";
    await connection.save();

    const gmail = getGmailClient(connection.google_tokens.access_token);

    // Get emails from last sync or from 7 days ago
    const lastSynced = connection.last_synced || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const query = `after:${Math.floor(lastSynced.getTime() / 1000)}`;

    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    });

    const messages = listResponse.data.messages || [];

    // Process each message
    for (const message of messages) {
      if (!message.id) continue;

      // Get full message details
      const msgResponse = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "full",
      });

      const msg = msgResponse.data;
      if (!msg.payload) continue;

      // Extract email details
      const headers = msg.payload.headers || [];
      const from = headers.find((h) => h.name === "From")?.value || "";
      const to = (headers.find((h) => h.name === "To")?.value || "").split(",").map((e) => e.trim());
      const subject = headers.find((h) => h.name === "Subject")?.value || "(No subject)";
      const date = headers.find((h) => h.name === "Date")?.value || new Date().toISOString();

      // Extract body
      let body = "";
      if (msg.payload.parts) {
        const textPart = msg.payload.parts.find((p) => p.mimeType === "text/plain");
        if (textPart?.body?.data) {
          body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
        }
      } else if (msg.payload.body?.data) {
        body = Buffer.from(msg.payload.body.data, "base64").toString("utf-8");
      }

      // Check if email already exists
      const existingEmail = await Email.findOne({ gmail_id: message.id });
      if (existingEmail) continue;

      // Get employee for classification context
      let employeeRole = "department_person";
      let employeeDepartments = [];

      if (connection.owner_id) {
        const employee = await Employee.findById(connection.owner_id);
        if (employee) {
          employeeRole = employee.role;
          employeeDepartments = employee.departments;
        }
      } else if (connection.authorized_employees.length > 0) {
        // For shared mailboxes, use first authorized employee
        const employee = await Employee.findById(connection.authorized_employees[0]);
        if (employee) {
          employeeRole = employee.role;
          employeeDepartments = employee.departments;
        }
      }

      // Classify email using Claude
      const classification = await classifyEmail(
        from,
        subject,
        body.substring(0, 2000), // Limit body for classification
        employeeRole,
        employeeDepartments
      );

      // Save email to database
      const email = new Email({
        gmail_id: message.id,
        email_connection_id: connectionId,
        from,
        to,
        subject,
        body: body.substring(0, 10000), // Limit stored body
        classification: classification.classification,
        confidence_score: classification.confidence_score,
        suggested_task: classification.suggested_task,
        is_read: msg.labelIds?.includes("UNREAD") ? false : true,
        is_starred: msg.labelIds?.includes("STARRED") ? true : false,
        thread_id: msg.threadId,
        received_at: new Date(date),
      });

      await email.save();
    }

    // Update sync status
    connection.last_synced = new Date();
    connection.sync_status = "idle";
    connection.error_message = undefined;
    await connection.save();
  } catch (error) {
    console.error("Email sync error:", error);

    // Update error status
    const connection = await EmailConnection.findById(connectionId);
    if (connection) {
      connection.sync_status = "error";
      connection.error_message = error instanceof Error ? error.message : "Unknown error";
      await connection.save();
    }

    throw error;
  }
};

/**
 * Sync all active email connections
 */
export const syncAllEmails = async (): Promise<void> => {
  try {
    const connections = await EmailConnection.find({
      "google_tokens.access_token": { $exists: true },
    });

    for (const connection of connections) {
      try {
        await syncEmailsFromConnection(connection._id.toString());
      } catch (error) {
        console.error(`Failed to sync connection ${connection._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Batch sync error:", error);
    throw error;
  }
};

/**
 * Get unread emails for an employee
 */
export const getUnreadEmailsForEmployee = async (
  employeeId: string
): Promise<any[]> => {
  try {
    // Get all email connections for this employee
    const personalConnections = await EmailConnection.find({
      owner_id: employeeId,
      type: "personal",
    });

    const sharedConnections = await EmailConnection.find({
      type: "shared",
      authorized_employees: employeeId,
    });

    const allConnections = [...personalConnections, ...sharedConnections];
    const connectionIds = allConnections.map((c) => c._id);

    // Get unread emails from all connections
    const unreadEmails = await Email.find({
      email_connection_id: { $in: connectionIds },
      is_read: false,
    })
      .populate("email_connection_id", "email type")
      .sort({ received_at: -1 })
      .limit(50);

    return unreadEmails;
  } catch (error) {
    console.error("Get unread emails error:", error);
    return [];
  }
};

/**
 * Get important emails for an employee
 */
export const getImportantEmailsForEmployee = async (
  employeeId: string
): Promise<any[]> => {
  try {
    const personalConnections = await EmailConnection.find({
      owner_id: employeeId,
      type: "personal",
    });

    const sharedConnections = await EmailConnection.find({
      type: "shared",
      authorized_employees: employeeId,
    });

    const allConnections = [...personalConnections, ...sharedConnections];
    const connectionIds = allConnections.map((c) => c._id);

    const importantEmails = await Email.find({
      email_connection_id: { $in: connectionIds },
      classification: "important",
      received_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
    })
      .populate("email_connection_id", "email type")
      .sort({ received_at: -1 })
      .limit(20);

    return importantEmails;
  } catch (error) {
    console.error("Get important emails error:", error);
    return [];
  }
};
