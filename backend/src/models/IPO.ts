import mongoose, { Document, Schema } from "mongoose";

export interface IIPO extends Document {
  company_name: string; // Company name
  listing_date: Date; // IPO listing date
  price_band_min?: number; // Minimum price
  price_band_max?: number; // Maximum price
  lot_size?: number; // Shares per lot
  issue_size?: number; // Total issue size
  gmp?: number; // Grey Market Premium
  status: "upcoming" | "open" | "closed" | "listed"; // IPO status
  exchange?: string; // Stock exchange
  sector?: string; // Industry sector
  link?: string; // Moneycontrol link
  issue_dates?: string; // e.g. "10-15 Sept"
  est_listing?: string; // e.g. "₹158 (12.86%)"
  trend?: string; // e.g. "up", "down", "neutral"
  last_synced: Date; // Last scrape time
  created_at: Date;
  updated_at: Date;
}

const IPOSchema = new Schema<IIPO>(
  {
    company_name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    listing_date: {
      type: Date,
      required: true,
    },
    price_band_min: {
      type: Number,
      default: null,
    },
    price_band_max: {
      type: Number,
      default: null,
    },
    lot_size: {
      type: Number,
      default: null,
    },
    issue_size: {
      type: Number,
      default: null,
    },
    gmp: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["upcoming", "open", "closed", "listed"],
      default: "upcoming",
    },
    exchange: {
      type: String,
      default: "NSE/BSE",
    },
    sector: {
      type: String,
      default: null,
    },
    link: {
      type: String,
      default: null,
    },
    issue_dates: {
      type: String,
      default: null,
    },
    est_listing: {
      type: String,
      default: null,
    },
    trend: {
      type: String,
      default: null,
    },
    last_synced: {
      type: Date,
      default: new Date(),
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Index for faster queries
IPOSchema.index({ status: 1, listing_date: 1 });

export default mongoose.model<IIPO>("IPO", IPOSchema);
