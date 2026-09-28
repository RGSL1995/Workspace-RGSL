import mongoose, { Document, Schema } from "mongoose";

export interface INotificationPreference extends Document {
  userId: string;
  email: string;
  notificationTypes: {
    ipo_new: boolean; // New IPO listed
    ipo_status_change: boolean; // IPO status changed (e.g., upcoming -> open)
    ipo_gmp_update: boolean; // GMP (Grey Market Premium) updated
  };
  ipoFilters: {
    sectors?: string[]; // Only notify for specific sectors
    minPrice?: number; // Only notify for IPOs with min price >= this value
    maxPrice?: number; // Only notify for IPOs with max price <= this value
    allSectors: boolean; // If true, notify for all sectors
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    notificationTypes: {
      ipo_new: {
        type: Boolean,
        default: true,
      },
      ipo_status_change: {
        type: Boolean,
        default: true,
      },
      ipo_gmp_update: {
        type: Boolean,
        default: true,
      },
    },
    ipoFilters: {
      sectors: {
        type: [String],
        default: [],
      },
      minPrice: {
        type: Number,
        default: null,
      },
      maxPrice: {
        type: Number,
        default: null,
      },
      allSectors: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

export default mongoose.model<INotificationPreference>(
  "NotificationPreference",
  NotificationPreferenceSchema
);
