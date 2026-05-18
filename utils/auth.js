const crypto = require("crypto");

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      return resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function verifyPassword(password, passwordHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = String(passwordHash || "").split(":");
    if (!salt || !key) return resolve(false);

    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      return resolve(crypto.timingSafeEqual(Buffer.from(key, "hex"), derivedKey));
    });
  });
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

function otpExpiry(minutes = 5) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = { hashPassword, verifyPassword, generateOtp, otpExpiry };
