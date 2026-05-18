const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/milktea_house";

async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log(`Da ket noi MongoDB: ${mongoUri}`);
}

module.exports = { connectDB, mongoUri };
