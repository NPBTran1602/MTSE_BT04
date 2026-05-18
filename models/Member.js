const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    level: { type: String, default: "Silver" },
    points: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: "" },
    otpPurpose: { type: String, enum: ["", "register", "reset-password"], default: "" },
    otpExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Member", memberSchema);
