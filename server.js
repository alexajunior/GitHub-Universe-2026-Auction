import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const port = Number(process.env.PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:8000";
const campaignEmail = process.env.CAMPAIGN_EMAIL || "alexjuniorantwi1@gmail.com";
const smtpTransport = process.env.SMTP_APP_PASSWORD && !process.env.SMTP_APP_PASSWORD.startsWith("replace_")
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: campaignEmail, pass: process.env.SMTP_APP_PASSWORD },
    })
  : null;
const verificationCodes = new Map();
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "100kb" }));

app.post("/api/email-verification/request", async (request, response) => {
  const { email } = request.body || {};
  if (typeof email !== "string" || !email.includes("@")) {
    return response.status(400).json({ error: "Enter a valid email address." });
  }
  if (!smtpTransport) {
    return response.status(503).json({ error: "Email verification is not configured yet." });
  }
  const code = String(crypto.randomInt(100000, 1000000));
  verificationCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000, attempts: 0 });
  try {
    await smtpTransport.sendMail({
      from: campaignEmail,
      to: email,
      subject: "Verify your email · GitHub Universe 2026",
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
    });
    return response.json({ sent: true });
  } catch (error) {
    verificationCodes.delete(email.toLowerCase());
    console.error("Verification email failed:", error);
    return response.status(502).json({ error: "Unable to send the verification code." });
  }
});

app.post("/api/email-verification/verify", (request, response) => {
  const { email, code } = request.body || {};
  const key = typeof email === "string" ? email.toLowerCase() : "";
  const record = verificationCodes.get(key);
  if (!record || Date.now() > record.expiresAt || record.attempts >= 5) {
    verificationCodes.delete(key);
    return response.status(400).json({ error: "That verification code is invalid or expired." });
  }
  record.attempts += 1;
  if (record.code !== String(code || "").trim()) {
    return response.status(400).json({ error: "That verification code is incorrect." });
  }
  verificationCodes.delete(key);
  return response.json({ verified: true });
});

function getUsdInrRate() {
  return 100;
}

app.get("/api/exchange-rate", async (_request, response) => {
  try {
    const rate = await getUsdInrRate();
    response.json({ base: "USD", quote: "INR", rate, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error(error);
    response.status(502).json({ error: "Unable to fetch the live USD/INR rate." });
  }
});

app.post("/api/payment-instructions", async (request, response) => {
  try {
    const { spotId, bidUsd, name, brand, email, paymentMethod } = request.body || {};
    const amountUsd = Number(bidUsd);
    if (!spotId || !name || !brand || !email || !Number.isFinite(amountUsd) || !["upi", "bank"].includes(paymentMethod)) {
      return response.status(400).json({ error: "Name, brand, email, placement, bid, and payment method are required." });
    }
    const rate = await getUsdInrRate();
    const amountInr = Math.round(amountUsd * rate);
    const paymentDetails = paymentMethod === "upi"
      ? `UPI ID: ${process.env.UPI_ID || "not configured"}`
      : `Bank: ${process.env.BANK_NAME || "not configured"}\nAccount holder: ${process.env.BANK_ACCOUNT_NAME || "not configured"}\nAccount number: ${process.env.BANK_ACCOUNT_NUMBER || "not configured"}\nIFSC: ${process.env.BANK_IFSC || "not configured"}`;
    let sent = false;
    let emailError;
    if (smtpTransport) {
      try {
        await smtpTransport.sendMail({
          from: campaignEmail,
          to: email,
          subject: `Payment instructions · ${brand} · ${spotId}`,
          text: `Hello ${name},\n\nYour placement request for ${brand} is recorded.\nPlacement: ${spotId}\nBid: $${amountUsd.toLocaleString("en-US")}\nAmount due: ₹${amountInr.toLocaleString("en-IN")}\n\n${paymentDetails}\n\nPlease send your payment confirmation and logo details after transfer. Your placement is not confirmed until payment is reviewed.\n\nAlex Junior Antwi / Braveon AI`,
        });
        sent = true;
      } catch (error) {
        console.error("Payment instruction email failed:", error);
        emailError = "Email delivery failed, but the instructions are shown below.";
      }
    }
    return response.json({
      sent,
      emailError,
      amountUsd,
      amountInr,
      upiId: paymentMethod === "upi" ? process.env.UPI_ID : undefined,
      bankDetails: paymentMethod === "bank" ? {
       bankName: process.env.BANK_NAME || "not configured",
       accountName: process.env.BANK_ACCOUNT_NAME || "not configured",
       accountNumber: process.env.BANK_ACCOUNT_NUMBER || "not configured",
       ifsc: process.env.BANK_IFSC || "not configured",
      } : undefined,
    });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: "Unable to send payment instructions." });
  }
});

app.listen(port, () => console.log(`Payment API listening on http://localhost:${port}`));
