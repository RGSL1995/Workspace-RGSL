import mongoose, { Document, Schema } from "mongoose";

export interface IEmployee extends Document {
  email: string; // Primary company email
  name: string;
  role: "super_admin" | "department_head" | "department_person";

  // Company & Department
  companies: ("RGSL" | "LRSD")[]; // Can belong to multiple companies
  departments: string[]; // Can belong to multiple: ["Finance", "Trading"]

  // Hierarchy
  manager_id?: mongoose.Types.ObjectId; // Their dept head (if dept person)
  managed_employees: mongoose.Types.ObjectId[]; // Employees under them (if dept head)

  // OAuth
  google_id?: string;

  // Email Connections (moved to separate model)
  // Use EmailConnection model instead of storing here

  // Preferences
  notification_email: boolean;
  notification_socket: boolean;

  // Metadata
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "department_head", "department_person"],
      default: "department_person",
      required: true,
    },
    companies: {
      type: [String],
      enum: ["RGSL", "LRSD"],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Employee must belong to at least one company",
      },
    },
    departments: {
      type: [String],
      enum: ["Finance", "Trading", "Lending", "Compliance"],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Employee must belong to at least one department",
      },
    },
    manager_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    managed_employees: [
      {
        type: Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    google_id: {
      type: String,
      sparse: true,
    },
    notification_email: {
      type: Boolean,
      default: true,
    },
    notification_socket: {
      type: Boolean,
      default: true,
    },
    is_active: {
      type: Boolean,
      default: true,
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
EmployeeSchema.index({ email: 1 });
EmployeeSchema.index({ role: 1 });
EmployeeSchema.index({ companies: 1 });
EmployeeSchema.index({ departments: 1 });
EmployeeSchema.index({ manager_id: 1 });

export default mongoose.model<IEmployee>("Employee", EmployeeSchema);
