import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableId: {
      type: String,
      required: true,
      unique: true,
    },
    tableName: {
      type: String,
      required: true,
    },
    seats: {
      type: Number,
      default: 4,
    },
    qrCode: {
      type: String, // Base64 encoded QR code image or URL
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    location: {
      type: String, // e.g., "Ground Floor", "First Floor", "Outdoor"
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Table", tableSchema);
