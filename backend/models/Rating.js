import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    customerId: {
      type: String,
      default: null,
    },
    customerPhone: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      default: "",
      maxlength: 500,
    },
    itemRatings: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        itemName: String,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ratingSchema.index({ orderId: 1 });
ratingSchema.index({ rating: 1 });
ratingSchema.index({ createdAt: -1 });

export default mongoose.model("Rating", ratingSchema);
