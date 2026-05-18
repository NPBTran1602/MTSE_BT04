const fs = require("fs");
const path = require("path");
const http = require("http");
const { URL } = require("url");
const { loadEnv } = require("./utils/env");

loadEnv();

const { connectDB } = require("./config/db");
const Member = require("./models/Member");
const Product = require("./models/Product");
const { generateOtp, hashPassword, otpExpiry, verifyPassword } = require("./utils/auth");
const { assertEmailConfigured, sendOtpEmail } = require("./utils/mailer");

const port = process.env.PORT || 3000;
const publicRoot = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function cleanMember(member) {
  if (!member) return null;
  const data = member.toObject ? member.toObject() : member;
  const { password, passwordHash, otpCode, otpPurpose, otpExpiresAt, __v, _id, ...safeMember } = data;
  return { id: String(_id), ...safeMember };
}

function cleanProduct(product) {
  const data = product.toObject ? product.toObject() : product;
  const { _id, __v, ...safeProduct } = data;
  return { id: String(_id), ...safeProduct };
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body qua lon"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("JSON khong hop le"));
      }
    });
  });
}

function buildProductQuery(searchParams) {
  const keyword = String(searchParams.get("search") || "").trim();
  const category = String(searchParams.get("category") || "all");
  const topping = String(searchParams.get("topping") || "all");
  const stock = String(searchParams.get("stock") || "all");
  const min = Number(searchParams.get("priceMin") || 0);
  const max = Number(searchParams.get("priceMax") || 999999999);

  const query = { price: { $gte: min, $lte: max } };

  if (keyword) {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [
      { name: regex },
      { category: regex },
      { description: regex },
      { promotion: regex },
      { toppings: regex }
    ];
  }

  if (category !== "all") query.category = category;
  if (topping !== "all") query.toppings = topping;
  if (stock === "available") query.stock = { $gt: 10 };
  if (stock === "low") query.stock = { $gt: 0, $lte: 10 };
  if (stock === "soldout") query.stock = 0;

  return query;
}

function productSort(sort) {
  const sorters = {
    priceAsc: { price: 1 },
    priceDesc: { price: -1 },
    soldDesc: { sold: -1 },
    newest: { isNew: -1, createdAt: -1 },
    featured: { sold: -1, stock: -1 }
  };
  return sorters[sort] || sorters.featured;
}

async function handleApi(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/login") {
    const { email, password } = await readRequestBody(req);
    const member = await Member.findOne({ email: String(email || "").toLowerCase().trim() });

    if (member && await verifyPassword(password || "", member.passwordHash)) {
      if (!member.isVerified) {
        return sendJson(res, 403, { message: "Tai khoan chua xac thuc OTP. Vui long kiem tra Gmail." });
      }
      return sendJson(res, 200, {
        message: "Dang nhap thanh cong",
        token: `member-${member._id}`,
        member: cleanMember(member)
      });
    }
    return sendJson(res, 401, { message: "Email hoac mat khau khong dung" });
  }

  if (req.method === "POST" && url.pathname === "/api/register") {
    const { name, email, password } = await readRequestBody(req);
    const cleanEmail = String(email || "").toLowerCase().trim();
    const cleanName = String(name || "").trim();

    if (!cleanName || !cleanEmail || !password) {
      return sendJson(res, 400, { message: "Vui long nhap day du ho ten, email va mat khau." });
    }
    if (String(password).length < 6) {
      return sendJson(res, 400, { message: "Mat khau phai co it nhat 6 ky tu." });
    }
    const existed = await Member.findOne({ email: cleanEmail });
    if (existed && existed.isVerified) {
      return sendJson(res, 409, { message: "Email nay da duoc dang ky." });
    }
        const otpCode = generateOtp();
    const passwordHash = await hashPassword(password);
    const member = existed || new Member({ email: cleanEmail });
    member.name = cleanName;
    member.passwordHash = passwordHash;
    member.role = "member";
    member.level = member.level || "Silver";
    member.points = member.points || 0;
    member.isVerified = false;
    member.otpCode = otpCode;
    member.otpPurpose = "register";
    member.otpExpiresAt = otpExpiry();
    await member.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendOtpEmail(cleanEmail, otpCode, "register");
      return sendJson(res, 201, { message: "Da gui ma OTP dang ky ve Gmail cua ban." });
    }
    return sendJson(res, 201, { message: `Ma OTP cua ban la: ${otpCode}` });
  }

  if (req.method === "POST" && url.pathname === "/api/verify-register") {
    const { email, otp } = await readRequestBody(req);
    const member = await Member.findOne({ email: String(email || "").toLowerCase().trim() });
    if (!member || member.otpPurpose !== "register") {
      return sendJson(res, 400, { message: "Khong tim thay yeu cau dang ky can xac thuc." });
    }
    if (member.otpCode !== String(otp || "").trim() || !member.otpExpiresAt || member.otpExpiresAt < new Date()) {
      return sendJson(res, 400, { message: "Ma OTP khong dung hoac da het han." });
    }

    member.isVerified = true;
    member.otpCode = "";
    member.otpPurpose = "";
    member.otpExpiresAt = null;
    await member.save();

    return sendJson(res, 200, { message: "Dang ky thanh cong. Vui long dang nhap tai khoan vua tao." });
  }

  if (req.method === "POST" && url.pathname === "/api/forgot-password") {
    const { email } = await readRequestBody(req);
    const cleanEmail = String(email || "").toLowerCase().trim();
    const member = await Member.findOne({ email: cleanEmail, isVerified: true });
    if (!member) {
      return sendJson(res, 404, { message: "Khong tim thay tai khoan voi email nay." });
    }
        const otpCode = generateOtp();
    member.otpCode = otpCode;
    member.otpPurpose = "reset-password";
    member.otpExpiresAt = otpExpiry();
    await member.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendOtpEmail(cleanEmail, otpCode, "reset-password");
      return sendJson(res, 200, { message: "Da gui ma OTP dat lai mat khau ve Gmail cua ban." });
    }
    return sendJson(res, 200, { message: `Ma OTP cua ban la: ${otpCode}` });
  }

  if (req.method === "POST" && url.pathname === "/api/resend-otp") {
    const { email, purpose } = await readRequestBody(req);
    const cleanEmail = String(email || "").toLowerCase().trim();
    const cleanPurpose = String(purpose || "").trim();

    if (!["register", "reset-password"].includes(cleanPurpose)) {
      return sendJson(res, 400, { message: "Loai OTP khong hop le." });
    }

    const memberQuery = cleanPurpose === "register"
      ? { email: cleanEmail, isVerified: false, otpPurpose: "register" }
      : { email: cleanEmail, isVerified: true, otpPurpose: "reset-password" };
    const member = await Member.findOne(memberQuery);

    if (!member) {
      const message = cleanPurpose === "register"
        ? "Khong tim thay yeu cau dang ky can xac thuc."
        : "Khong tim thay yeu cau dat lai mat khau.";
      return sendJson(res, 404, { message });
    }

        const otpCode = generateOtp();
    member.otpCode = otpCode;
    member.otpExpiresAt = otpExpiry();
    await member.save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendOtpEmail(cleanEmail, otpCode, cleanPurpose);
      return sendJson(res, 200, { message: "Da gui lai ma OTP moi. Ma co hieu luc trong 5 phut." });
    }
    return sendJson(res, 200, { message: `Ma OTP moi cua ban la: ${otpCode}` });
  }

  if (req.method === "POST" && url.pathname === "/api/verify-reset-otp") {
    const { email, otp } = await readRequestBody(req);
    const member = await Member.findOne({ email: String(email || "").toLowerCase().trim(), isVerified: true });

    if (!member || member.otpPurpose !== "reset-password") {
      return sendJson(res, 400, { message: "Khong tim thay yeu cau dat lai mat khau." });
    }
    if (member.otpCode !== String(otp || "").trim() || !member.otpExpiresAt || member.otpExpiresAt < new Date()) {
      return sendJson(res, 400, { message: "Ma OTP khong dung hoac da het han." });
    }

    return sendJson(res, 200, { message: "OTP hop le. Vui long nhap mat khau moi." });
  }

  if (req.method === "POST" && url.pathname === "/api/reset-password") {
    const { email, otp, password } = await readRequestBody(req);
    const member = await Member.findOne({ email: String(email || "").toLowerCase().trim(), isVerified: true });

    if (!member || member.otpPurpose !== "reset-password") {
      return sendJson(res, 400, { message: "Khong tim thay yeu cau dat lai mat khau." });
    }
    if (String(password || "").length < 6) {
      return sendJson(res, 400, { message: "Mat khau moi phai co it nhat 6 ky tu." });
    }
    if (member.otpCode !== String(otp || "").trim() || !member.otpExpiresAt || member.otpExpiresAt < new Date()) {
      return sendJson(res, 400, { message: "Ma OTP khong dung hoac da het han." });
    }

    member.passwordHash = await hashPassword(password);
    member.otpCode = "";
    member.otpPurpose = "";
    member.otpExpiresAt = null;
    await member.save();

    return sendJson(res, 200, { message: "Da cap nhat mat khau moi. Ban co the dang nhap lai." });
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const member = await Member.findOne({ role: "member" });
    return sendJson(res, 200, { member: cleanMember(member) });
  }

  if (req.method === "GET" && url.pathname === "/api/meta") {
    const [categories, toppings] = await Promise.all([
      Product.distinct("category"),
      Product.distinct("toppings")
    ]);
    return sendJson(res, 200, { categories, toppings });
  }

    if (req.method === "GET" && url.pathname === "/api/home") {
    const [promotions, newest, bestSellers, topSellers, mostViewed] = await Promise.all([
      Product.find({}).limit(3),
      Product.find({ isNew: true }).limit(4),
      Product.find({}).sort({ sold: -1 }).limit(4),
      Product.find({}).sort({ sold: -1 }).limit(10),
      Product.find({}).sort({ views: -1 }).limit(10)
    ]);
    return sendJson(res, 200, {
      promotions: promotions.map(cleanProduct),
      newest: newest.map(cleanProduct),
      bestSellers: bestSellers.map(cleanProduct),
      topSellers: topSellers.map(cleanProduct),
      mostViewed: mostViewed.map(cleanProduct)
    });
  }

    if (req.method === "GET" && url.pathname === "/api/products") {
    const sort = String(url.searchParams.get("sort") || "featured");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "8", 10)));
    const skip = (page - 1) * limit;
    const query = buildProductQuery(url.searchParams);
    const [total, data] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query).sort(productSort(sort)).skip(skip).limit(limit)
    ]);
    const totalPages = Math.ceil(total / limit);
    return sendJson(res, 200, {
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
      products: data.map(cleanProduct)
    });
  }

  const productMatch = url.pathname.match(/^\/api\/products\/([^/]+)(\/related)?$/);
  if (req.method === "GET" && productMatch) {
    const product = await Product.findById(productMatch[1]);
    if (!product) return sendJson(res, 404, { message: "Khong tim thay san pham" });

    if (productMatch[2]) {
      const sameCategory = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(4);
      const fillMore = sameCategory.length < 4
        ? await Product.find({ category: { $ne: product.category } }).limit(4 - sameCategory.length)
        : [];
      return sendJson(res, 200, { products: sameCategory.concat(fillMore).map(cleanProduct) });
    }

    await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });
    return sendJson(res, 200, { product: cleanProduct(product) });  }

  return sendJson(res, 404, { message: "API khong ton tai" });
}

function serveStatic(req, res, url) {
  const authPages = new Set(["/", "/login", "/register", "/forgot-password", "/verify-otp"]);
  const pathname = authPages.has(url.pathname) ? "/login.html" : url.pathname;
  const safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicRoot, safePath);

  if (!filePath.startsWith(publicRoot)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Khong tim thay trang");
    }
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    return res.end(content);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { message: error.message || "Loi server" });
  }
});

async function start() {
  await connectDB();
  server.listen(port, () => {
    console.log(`Milktea House dang chay tai http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(`Khong the khoi dong server: ${error.message}`);
  process.exit(1);
});
