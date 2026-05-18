function assertEmailConfigured() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("Chua cau hinh EMAIL_USER va EMAIL_PASS de gui OTP qua Gmail.");
  }
}

function createTransporter() {
  assertEmailConfigured();

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const allowInvalidTls = process.env.EMAIL_ALLOW_INVALID_TLS === "true" || process.env.NODE_ENV !== "production";
  const nodemailer = require("nodemailer");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      servername: "smtp.gmail.com",
      rejectUnauthorized: !allowInvalidTls
    }
  });
}

async function sendOtpEmail(to, otp, purpose) {
  const transporter = createTransporter();
  const title = purpose === "reset-password" ? "Ma OTP dat lai mat khau" : "Ma OTP xac thuc dang ky";

  await transporter.sendMail({
    from: `"Milktea House" <${process.env.EMAIL_USER}>`,
    to,
    subject: title,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="color:#0f766e">Milktea House</h2>
        <p>${title} cua ban la:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
        <p>Ma co hieu luc trong 5 phut. Neu ban khong yeu cau, hay bo qua email nay.</p>
      </div>
    `
  });
}

module.exports = { assertEmailConfigured, sendOtpEmail };
