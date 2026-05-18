const mongoose = require("mongoose");
const { connectDB } = require("../config/db");
const Member = require("../models/Member");
const Product = require("../models/Product");
const { memberDemo, products } = require("../data/store");
const { hashPassword } = require("../utils/auth");

async function seed() {
  await connectDB();

  await Member.deleteMany({});
  await Product.deleteMany({});

  const passwordHash = await hashPassword(memberDemo.password);
  await Member.create({
    name: memberDemo.name,
    email: memberDemo.email,
    passwordHash,
    role: memberDemo.role,
    level: memberDemo.level,
    points: memberDemo.points,
    isVerified: true
  });
  await Product.insertMany(products.map(({ id, ...product }) => ({ _id: id, ...product })));

  console.log(`Da seed 1 thanh vien va ${products.length} san pham.`);
  console.log("Tai khoan demo: thanhvien@milktea.vn / 123456");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});
