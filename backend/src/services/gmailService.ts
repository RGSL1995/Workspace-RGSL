import { google } from "googleapis";
import EmailConnection from "../models/EmailConnection";
import Email from "../models/Email";
import { classifyEmail } from "./claudeService";
import Employee from "../models/Employee";
import { ensureTokenFresh } from "../utils/tokenRefresh";

/**
 * Initialize Gmail API client
 */
const getGmailClient = (accessToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME;
  const BACKEND_URL = isProduction
    ? 'https://api.rgslgroup.com'
    : `http://localhost:${process.env.PORT || 5000}`;
  const CALLBACK_URL = `${BACKEND_URL}/api/auth/google/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    CALLBACK_URL
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
    console.log(`\n📧 [SYNC START] Connection ID: ${connectionId}`);
    console.log(`⏱️ [SYNC] Timestamp: ${new Date().toISOString()}`);

    const connection = await EmailConnection.findById(connectionId);
    if (!connection) {
      console.error(`❌ [SYNC ERROR] Email connection not found: ${connectionId}`);
      throw new Error("Email connection not found");
    }

    console.log(`✅ [SYNC] Found connection for: ${connection.email}`);
    console.log(`🔑 [SYNC] Access token exists: ${!!connection.google_tokens.access_token}`);

    // Refresh token if expired
    console.log(`🔄 [SYNC] Checking token freshness...`);
    const tokenFresh = await ensureTokenFresh(connectionId);
    if (!tokenFresh) {
      console.error(`❌ [SYNC ERROR] Failed to refresh token for ${connection.email}`);
      connection.sync_status = "error";
      await connection.save();
      throw new Error("Token refresh failed");
    }
    console.log(`✅ [SYNC] Token is fresh`);

    // Reload connection to get updated token
    const updatedConnection = await EmailConnection.findById(connectionId);
    if (!updatedConnection) throw new Error("Connection not found after refresh");

    // Update sync status
    updatedConnection.sync_status = "syncing";
    await updatedConnection.save();
    console.log(`⏳ [SYNC] Status set to: syncing`);

    const gmail = getGmailClient(updatedConnection.google_tokens.access_token);
    console.log(`🔐 [SYNC] Gmail client initialized`);

    // Get emails from last sync or from 30 days ago (for first sync to get all history)
    const lastSynced = updatedConnection.last_synced || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const query = `after:${Math.floor(lastSynced.getTime() / 1000)}`;
    console.log(`📅 [SYNC] Query: ${query} (lastSynced: ${lastSynced.toISOString()})`);

    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    });

    const messages = listResponse.data.messages || [];
    console.log(`📬 [SYNC] Found ${messages.length} messages to sync`);

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

      // Extract body (prefer text/plain, fall back to text/html)
      let body = "";
      if (msg.payload.parts) {
        // Try text/plain first
        let textPart = msg.payload.parts.find((p) => p.mimeType === "text/plain");
        // Fall back to text/html if no plain text
        if (!textPart) {
          textPart = msg.payload.parts.find((p) => p.mimeType === "text/html");
        }
        if (textPart?.body?.data) {
          try {
            body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
          } catch (e) {
            console.warn(`⚠️ [SYNC] Failed to decode body for message ${message.id}`);
          }
        }
      } else if (msg.payload.body?.data) {
        try {
          body = Buffer.from(msg.payload.body.data, "base64").toString("utf-8");
        } catch (e) {
          console.warn(`⚠️ [SYNC] Failed to decode body for message ${message.id}`);
        }
      }

      // Extract attachments metadata
      const attachments: any[] = [];
      if (msg.payload.parts) {
        for (const part of msg.payload.parts) {
          if (part.filename) {
            attachments.push({
              filename: part.filename,
              mimeType: part.mimeType,
              size: part.body?.size || 0,
              attachmentId: part.body?.attachmentId || "",
            });
            console.log(`📎 [SYNC] Found attachment: ${part.filename} (${part.mimeType})`);
          }
        }
      }

      // Get employee for classification context
      let employeeRole = "department_person";
      let employeeDepartments = [];

      if (updatedConnection.owner_id) {
        const employee = await Employee.findById(updatedConnection.owner_id);
        if (employee) {
          employeeRole = employee.role;
          employeeDepartments = employee.departments;
        }
      } else if (updatedConnection.authorized_employees.length > 0) {
        // For shared mailboxes, use first authorized employee
        const employee = await Employee.findById(updatedConnection.authorized_employees[0]);
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

      // Upsert email to avoid duplicate key errors in concurrent syncs
      await Email.updateOne(
        { gmail_id: message.id },
        {
          $setOnInsert: {
            gmail_id: message.id,
            email_connection_id: connectionId,
            from,
            to,
            subject,
            body: body.substring(0, 10000),
            attachments: attachments,
            thread_id: msg.threadId,
            received_at: new Date(date),
          },
          $set: {
            classification: classification.classification,
            confidence_score: classification.confidence_score,
            suggested_task: classification.suggested_task,
            is_read: msg.labelIds?.includes("UNREAD") ? false : true,
            is_starred: msg.labelIds?.includes("STARRED") ? true : false,
          },
        },
        { upsert: true }
      );
      console.log(`✅ [SYNC] Saved email: ${subject.substring(0, 50)}`);
    }

    // Update sync status
    updatedConnection.last_synced = new Date();
    updatedConnection.sync_status = "idle";
    updatedConnection.error_message = undefined;
    await updatedConnection.save();
    console.log(`✅ [SYNC COMPLETE] Synced ${messages.length} emails for ${updatedConnection.email}`);
  } catch (error) {
    console.error(`❌ [SYNC ERROR] ${error instanceof Error ? error.message : String(error)}`);

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
      .populate("assigned_to", "name email")
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
      .populate("assigned_to", "name email")
      .sort({ received_at: -1 })
      .limit(20);

    return importantEmails;
  } catch (error) {
    console.error("Get important emails error:", error);
    return [];
  }
};

/**
 * Send an email via Gmail
 */
export const sendEmail = async (
  connectionId: string,
  to: string[],
  subject: string,
  body: string,
  cc?: string[],
  bcc?: string[]
): Promise<{ messageId: string; threadId: string }> => {
  try {
    console.log(`📧 [SEND] Preparing to send email from connection: ${connectionId}`);

    const connection = await EmailConnection.findById(connectionId);
    if (!connection) {
      throw new Error("Email connection not found");
    }

    const gmail = getGmailClient(connection.google_tokens.access_token);

    // Create email message
    const emailLines = [
      `To: ${to.join(", ")}`,
      ...(cc ? [`Cc: ${cc.join(", ")}`] : []),
      ...(bcc ? [`Bcc: ${bcc.join(", ")}`] : []),
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      'Content-type: text/html; charset="UTF-8"',
      "",
      body,
    ];

    const email = emailLines.join("\n");
    const encodedEmail = Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
      },
    });

    console.log(`✅ [SEND] Email sent successfully. Message ID: ${response.data.id}`);

    return {
      messageId: response.data.id || "",
      threadId: response.data.threadId || "",
    };
  } catch (error) {
    console.error(`❌ [SEND] Email send failed:`, error);
    throw error;
  }
};
