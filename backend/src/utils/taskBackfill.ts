import Task from "../models/Task";
import Email from "../models/Email";
import EmailConnection from "../models/EmailConnection";
import mongoose from "mongoose";

/**
 * Backfill old tasks with email_id references
 * Matches tasks with their source emails by subject and date
 */
export const backfillTasksWithEmails = async (): Promise<{
  total: number;
  matched: number;
  skipped: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let matched = 0;
  let skipped = 0;

  try {
    // Get all tasks without email_id
    const tasksWithoutEmail = await Task.find({ email_id: { $exists: false } })
      .populate("assigner_id", "email")
      .populate("assignee_id", "email");

    console.log(`🔄 [BACKFILL] Starting backfill for ${tasksWithoutEmail.length} tasks...`);

    for (const task of tasksWithoutEmail) {
      try {
        // Get assignee's email connections
        const assigneeId = (task.assignee_id as any)._id;
        const connections = await EmailConnection.find({
          $or: [
            { owner_id: assigneeId },
            { authorized_employees: assigneeId },
          ],
        });

        if (!connections.length) {
          skipped++;
          continue;
        }

        const connectionIds = connections.map((c) => c._id);

        // Match email by subject within 24 hours of task creation
        const matchedEmail = await Email.findOne({
          email_connection_id: { $in: connectionIds },
          subject: task.title, // Task title = email subject
          received_at: {
            $gte: new Date(task.created_at.getTime() - 24 * 60 * 60 * 1000),
            $lte: new Date(task.created_at.getTime() + 24 * 60 * 60 * 1000),
          },
        }).sort({ received_at: -1 }); // Get most recent if multiple matches

        if (matchedEmail) {
          // Update task with email reference
          await Task.updateOne(
            { _id: task._id },
            { email_id: matchedEmail._id }
          );
          matched++;
          console.log(`✅ [BACKFILL] Matched task ${task._id} with email ${matchedEmail._id}`);
        } else {
          skipped++;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Task ${task._id}: ${errMsg}`);
        console.error(`❌ [BACKFILL] Error processing task ${task._id}:`, error);
      }
    }

    console.log(`✅ [BACKFILL] Complete: ${matched} matched, ${skipped} skipped, ${errors.length} errors`);

    return {
      total: tasksWithoutEmail.length,
      matched,
      skipped,
      errors,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ [BACKFILL] Fatal error:`, error);
    throw new Error(`Backfill failed: ${errMsg}`);
  }
};
