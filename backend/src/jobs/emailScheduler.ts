import EmailConnection from "../models/EmailConnection";
import Email from "../models/Email";
import { syncEmailsFromConnection } from "../services/gmailService";
import { emitNewEmails } from "../services/socketService";

export const startEmailScheduler = () => {
  // Run every 10 seconds for instant updates
  setInterval(async () => {
    console.log("\n⏰ [SCHEDULER] Running email sync job...");

    try {
      const connections = await EmailConnection.find({
        "google_tokens.access_token": { $exists: true },
      }).populate("owner_id");

      for (const connection of connections) {
        try {
          const ownerId = (connection.owner_id as any)._id;

          // Count emails BEFORE sync
          const beforeCount = await Email.countDocuments({
            email_connection_id: connection._id,
          });

          console.log(`📧 [SCHEDULER] Syncing emails for ${connection.email}...`);

          // Sync emails from Gmail
          await syncEmailsFromConnection(connection._id.toString());

          // Count emails AFTER sync
          const afterCount = await Email.countDocuments({
            email_connection_id: connection._id,
          });

          const newEmailCount = afterCount - beforeCount;

          if (newEmailCount > 0) {
            console.log(`✨ [SCHEDULER] Found ${newEmailCount} new emails for ${connection.email}`);

            // Get the newly added emails (created in last 5 minutes)
            const newEmails = await Email.find({
              email_connection_id: connection._id,
              created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
            })
              .sort({ received_at: -1 })
              .limit(newEmailCount);

            // Emit to user via Socket.io
            emitNewEmails(ownerId.toString(), newEmails);
          } else {
            console.log(`📭 [SCHEDULER] No new emails for ${connection.email}`);
          }
        } catch (error) {
          console.error(
            `❌ [SCHEDULER] Error syncing ${connection.email}:`,
            error instanceof Error ? error.message : error
          );
        }
      }

      console.log("✅ [SCHEDULER] Email sync job completed\n");
    } catch (error) {
      console.error(
        "❌ [SCHEDULER] Scheduler error:",
        error instanceof Error ? error.message : error
      );
    }
  }, 10000); // Run every 10 seconds

  console.log("✅ [SCHEDULER] Email scheduler started (runs every 10 seconds)");
};
