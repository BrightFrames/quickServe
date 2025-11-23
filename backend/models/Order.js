import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    tableId: {
      type: String,
      required: true,
    },
    tableNumber: {
      type: Number,
      required: true,
    },
    customerPhone: {
      type: String,
    },
    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        name: String,
        quantity: Number,
        price: Number,
        specialInstructions: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "preparing", "prepared", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    transactionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);
