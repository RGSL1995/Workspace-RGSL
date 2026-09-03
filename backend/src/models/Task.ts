import mongoose, { Document, Schema } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;

  // Assignment
  assigner_id: mongoose.Types.ObjectId; // Who created/assigned
  assignee_id: mongoose.Types.ObjectId; // Who it's assigned to

  // Classification
  department: "Finance" | "Trading" | "Lending" | "Compliance";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "completed" | "escalated" | "closed";

  // Source Email (if task was created from email assignment)
  email_id?: mongoose.Types.ObjectId; // Reference to source email

  // Deadlines & Escalation
  deadline?: Date;
  escalation_level: 0 | 1 | 2; // 0=person, 1=dept_head, 2=super_admin
  escalated_to_id?: mongoose.Types.ObjectId; // Who escalated to
  escalated_at?: Date;

  // Metadata
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    email_id: {
      type: Schema.Types.ObjectId,
      ref: "Email",
      default: null,
    },
    assigner_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    assignee_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    department: {
      type: String,
      enum: ["Finance", "Trading", "Lending", "Compliance"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "escalated", "closed"],
      default: "open",
    },
    deadline: {
      type: Date,
      default: null,
    },
    escalation_level: {
      type: Number,
      enum: [0, 1, 2],
      default: 0,
    },
    escalated_to_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    escalated_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes for faster queries
TaskSchema.index({ assignee_id: 1, status: 1 });
TaskSchema.index({ assigner_id: 1 });
TaskSchema.index({ department: 1 });
TaskSchema.index({ priority: 1, deadline: 1 });
TaskSchema.index({ escalation_level: 1 });
TaskSchema.index({ status: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);
