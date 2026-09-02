import mongoose, { Document, Schema } from "mongoose";

export interface IDepartment extends Document {
  name: "Finance" | "Trading" | "Lending" | "Compliance";
  description?: string;
  head_id?: mongoose.Types.ObjectId; // Department head reference
  employee_count: number;
  created_at: Date;
  updated_at: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      enum: ["Finance", "Trading", "Lending", "Compliance"],
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    head_id: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    employee_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model<IDepartment>("Department", DepartmentSchema);
