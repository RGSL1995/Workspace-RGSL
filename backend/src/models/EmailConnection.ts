import mongoose, { Document, Schema } from "mongoose";

export interface IEmailConnection extends Document {
  email: string;
  type: "personal" | "shared";
  company: "RGSL" | "LRSD";

  // Owner (if personal, this is the employee who owns it)
  owner_id?: mongoose.Types.ObjectId;

  // Shared access (if shared, these employees can access it)
  authorized_employees: mongoose.Types.ObjectId[];

  // Google OAuth
  google_id: string;
  google_tokens: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };

  // Sync tracking
  last_synced: Date;
  sync_status: "idle" | "syncing" | "error";
  error_message?: string;

  // Metadata
  created_by: mongoose.Types.ObjectId; // Admin who created it
  created_at: Date;
  updated_at: Date;
}

const EmailConnectionSchema = new Schema<IEmailConnection>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["personal", "shared"],
      default: "personal",
    },
    company: {
      type: String,
      enum: ["RGSL", "LRSD"],
      required: true,
    },
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    authorized_employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    google_id: {
      type: String,
      required: true,
      unique: true,
    },
    google_tokens: {
      access_token: String,
      refresh_token: String,
      expires_at: Number,
    },
    last_synced: {
      type: Date,
      default: null,
    },
    sync_status: {
      type: String,
      enum: ["idle", "syncing", "error"],
      default: "idle",
    },
    error_message: String,
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
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

// Indexes
EmailConnectionSchema.index({ email: 1 });
EmailConnectionSchema.index({ type: 1, company: 1 });
EmailConnectionSchema.index({ owner_id: 1 });
EmailConnectionSchema.index({ authorized_employees: 1 });
EmailConnectionSchema.index({ google_id: 1 });

export default mongoose.model<IEmailConnection>(
  "EmailConnection",
  EmailConnectionSchema
);
