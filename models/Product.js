const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
    isNew: { type: Boolean, default: false },
    promotion: { type: String, default: "" },
    toppings: [{ type: String, trim: true }],
    description: { type: String, required: true },
    images: [{ type: String, required: true }]
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

productSchema.index({ name: "text", category: "text", description: "text", promotion: "text", toppings: "text" });

module.exports = mongoose.model("Product", productSchema);
