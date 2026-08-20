import mongoose, { Document, Schema } from "mongoose";

export interface IEmail extends Document {
  gmail_id: string; // Gmail message ID
  email_connection_id: mongoose.Types.ObjectId; // Reference to EmailConnection
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  html_body?: string;

  // AI Classification
  classification: "important" | "action_required" | "informational" | "low_priority";
  confidence_score: number; // 0-1
  suggested_task?: {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
  };

  // Status
  is_read: boolean;
  is_starred: boolean;
  thread_id?: string;

  // Metadata
  received_at: Date;
  created_at: Date;
  updated_at: Date;
}

const EmailSchema = new Schema<IEmail>(
  {
    gmail_id: {
      type: String,
      required: true,
      unique: true,
    },
    email_connection_id: {
      type: Schema.Types.ObjectId,
      ref: "EmailConnection",
      required: true,
    },
    from: {
      type: String,
      required: true,
      lowercase: true,
    },
    to: [
      {
        type: String,
        lowercase: true,
      },
    ],
    cc: [
      {
        type: String,
        lowercase: true,
      },
    ],
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    html_body: String,
    classification: {
      type: String,
      enum: ["important", "action_required", "informational", "low_priority"],
      default: "informational",
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5,
    },
    suggested_task: {
      title: String,
      description: String,
      priority: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
      },
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    is_starred: {
      type: Boolean,
      default: false,
    },
    thread_id: String,
    received_at: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes for fast queries
EmailSchema.index({ email_connection_id: 1, received_at: -1 });
EmailSchema.index({ classification: 1 });
EmailSchema.index({ gmail_id: 1 });
EmailSchema.index({ from: 1 });
EmailSchema.index({ received_at: -1 });
EmailSchema.index({ is_read: 1 });

export default mongoose.model<IEmail>("Email", EmailSchema);
