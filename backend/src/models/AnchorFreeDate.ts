import mongoose, { Document, Schema } from "mongoose";

export interface IAnchorFreeDate extends Document {
  company_name: string; // IPO company name
  ipo_id?: string; // Reference to IPO document
  free_date: Date; // Date when anchor investors can freely sell
  status: "upcoming" | "active" | "expired";
  notes?: string;
  updated_at: Date;
  created_at: Date;
}

const AnchorFreeDateSchema = new Schema<IAnchorFreeDate>(
  {
    company_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    ipo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IPO",
      default: null,
    },
    free_date: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "active", "expired"],
      default: "upcoming",
    },
    notes: {
      type: String,
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

// Update status based on dates
AnchorFreeDateSchema.pre("save", function (next) {
  const now = new Date();
  const freeDate = new Date(this.free_date);

  if (freeDate > now) {
    this.status = "upcoming";
  } else if (freeDate.toDateString() === now.toDateString()) {
    this.status = "active";
  } else {
    this.status = "expired";
  }

  next();
});

export default mongoose.model<IAnchorFreeDate>(
  "AnchorFreeDate",
  AnchorFreeDateSchema
);
