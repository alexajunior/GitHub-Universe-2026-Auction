# Braveon AI — GitHub Universe 2026

A static, GitHub Pages-ready landing page for a wearable brand sponsorship concept.

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
python -m http.server 8000
```

## Payments

The site uses GitHub Pages for the frontend and a Node API for private payment instructions. Buyers pay manually using UPI or a bank transfer; there is no Razorpay or card checkout. UPI and bank details stay in backend environment variables, and instructions are emailed to the buyer.

1. Copy `.env.example` to `.env` in the backend host, set the frontend origin, add the bank details, and create a Gmail app password for `CAMPAIGN_EMAIL`.
2. Install and run the API:

   ```bash
   npm install
   npm start
   ```

3. For production, deploy `server.js` to Render, Railway, Fly.io, or another Node host. Set `FRONTEND_ORIGIN` to your GitHub Pages URL.
4. Before publishing, set `window.PAYMENT_API_URL` to the deployed API URL, or replace the default localhost URL in `script.js`.

The API calculates the INR amount, displays either UPI or bank-transfer instructions in the frontend, and automatically emails the same instructions to the submitted address when SMTP is configured. Confirm every manual payment before approving a placement. Never commit `.env` or the Gmail app password.
