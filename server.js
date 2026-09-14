import "dotenv/config";
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
app.use(cors({ origin: frontendOrigin }));
app.use(express.json({ limit: "100kb" }));

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
    if (smtpTransport) {
      await smtpTransport.sendMail({
        from: campaignEmail,
        to: email,
        subject: `Payment instructions · ${brand} · ${spotId}`,
        text: `Hello ${name},\n\nYour placement request for ${brand} is recorded.\nPlacement: ${spotId}\nBid: $${amountUsd.toLocaleString("en-US")}\nAmount due: ₹${amountInr.toLocaleString("en-IN")}\nRate: ₹${rate.toFixed(2)} / USD\n\n${paymentDetails}\n\nPlease send your payment confirmation and logo details after transfer. Your placement is not confirmed until payment is reviewed.\n\nAlex Junior Antwi / Braveon AI`,
      });
    } else if (paymentMethod === "bank") {
      return response.status(503).json({ error: "Bank-transfer email delivery is not configured yet." });
    }
    return response.json({ sent: Boolean(smtpTransport), amountUsd, amountInr, rate, upiId: paymentMethod === "upi" ? process.env.UPI_ID : undefined });
  } catch (error) {
    console.error(error);
    return response.status(502).json({ error: "Unable to send payment instructions." });
  }
});

app.listen(port, () => console.log(`Payment API listening on http://localhost:${port}`));
