const standardSpot = (title, description, minBid = 500) => ({ title, description, minBid, price: `$${minBid.toLocaleString("en-US")} minimum` });
const spots = {
  collar: standardSpot("Upper shirt code", "High signal placement on the upper shirt."),
  leftShoulder: standardSpot("Left shoulder", "A visible mark in every handshake.", 1000),
  rightShoulder: standardSpot("Right shoulder", "A conversation starter in motion.", 1000),
  leftChest: standardSpot("Left chest", "A close-range mark for builders."),
  chest: standardSpot("Center chest", "Front and center in the room.", 2000),
  rightChest: standardSpot("Right chest", "A compact mark with strong visibility."),
  leftSleeve: standardSpot("Left sleeve", "High-five visibility as the day moves."),
  rightSleeve: standardSpot("Right sleeve", "A mark that travels through conversations."),
  upperWaist: standardSpot("Upper waist", "A detail discovered up close."),
  centerWaist: standardSpot("Center waist", "A high-traffic placement."),
  lowerWaist: standardSpot("Lower waist", "A quiet flex below the first glance."),
  leftHem: standardSpot("Left hem", "Seen with every step."),
  centerHem: standardSpot("Center hem", "Low-key visibility with staying power."),
  rightHem: standardSpot("Right hem", "An end-of-day detail."),
  leftSide: standardSpot("Left side", "A moving edge placement."),
  rightSide: standardSpot("Right side", "Designed for side-angle discovery."),
  frontTag: standardSpot("Front tag", "A small, intentional signature."),
  neckline: standardSpot("Upper chest edge", "A close-up signal on the shirt body."),
  frontEdge: standardSpot("Front edge", "A detail revealed in motion."),
  back: {
    title: "Back statement · premium",
    description: "One company or brand owns the full back. The premium statement placement.",
    price: "$10,000",
  },
};

const modal = document.querySelector("#booking-modal");
const modalTitle = document.querySelector("#modal-title");
const modalDescription = document.querySelector("#modal-description");
const modalPrice = document.querySelector("#modal-price");
const bidAmount = document.querySelector("#bid-amount");
const paymentMethod = document.querySelector("#payment-method");
const paymentInstructions = document.querySelector("#payment-instructions");
const paymentOverlay = document.querySelector("#payment-overlay");
const paymentOverlayContent = document.querySelector("#payment-overlay-content");
const paymentOverlaySeconds = document.querySelector("#payment-overlay-seconds");
const onlineCount = document.querySelector("#online-count");
const visitorCount = document.querySelector("#visitor-count");
const spotsCount = document.querySelector("#spots-count");
const fundingProgressFill = document.querySelector(".funding-progress-fill");
const fundingNote = document.querySelector(".funding-note");
let activeSpotId = null;
bidAmount.addEventListener("input", () => bidAmount.setCustomValidity(""));
const paymentApiUrl = window.PAYMENT_API_URL || "http://localhost:8787";
const legalModal = document.querySelector("#legal-modal");
const legalTitle = document.querySelector("#legal-title");
const legalCopy = document.querySelector("#legal-copy");
let paymentOverlayTimer;
const publicBankDetails = {
  bankName: "State Bank of India",
  accountName: "Alex Junior Antwi",
  accountNumber: "45473946158",
  ifsc: "SBIN0010446",
};
const publicUpiId = "8796332176@upi";

document.querySelectorAll(".code-line").forEach((line, lineIndex) => {
  const text = line.dataset.text || "";
  let position = 0;
  window.setTimeout(() => {
    const typeNext = () => {
      line.textContent = text.slice(0, position);
      if (position < text.length) {
        position += 1;
        window.setTimeout(typeNext, 42);
      } else {
        line.classList.add("is-complete");
      }
    };
    typeNext();
  }, lineIndex * 520);
});

const policies = {
  terms: ["Terms of service", "Placements are subject to approval, availability, production timing, and applicable event rules. You confirm that you own or have permission to use uploaded brand assets. Payment and reservation are not final until confirmed in writing."],
  privacy: ["Privacy", "Contact details and logo files are used only to review, communicate about, and fulfil a placement. Delete requests can be sent through the contact channel provided by the campaign owner."],
  refunds: ["Refund policy", "If a paid placement cannot be delivered, the campaign owner will arrange a refund or an agreed replacement placement. Approved production costs, taxes, payment fees, or customer-requested changes may be non-refundable where permitted by law."],
  "content-policy": ["Content policy", "Logos and messages must be lawful, non-deceptive, non-hateful, non-sexual, and safe for a public developer event. We may reject or remove content that violates rights, event rules, or this policy."],
};

let visitors = 1284;
let online = 12;
let claimedSpots = 0;
let paidAmountUsd = 0;
const claimedSpotIds = new Set();
const campaignTargetUsd = 30000;
let auctionSeconds = 2 * 60 * 60 + 14 * 60 + 36;
const bidValues = Object.fromEntries(Object.entries(spots).map(([key, spot]) => [key, spot.minBid || (key === "back" ? 10000 : 500)]));

setInterval(() => {
  visitors += 1;
  online += 1;
  visitorCount.textContent = visitors.toLocaleString("en-IN");
  onlineCount.textContent = online;
}, 12000);

setInterval(() => {
  auctionSeconds = Math.max(0, auctionSeconds - 1);
  const hours = String(Math.floor(auctionSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((auctionSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(auctionSeconds % 60).padStart(2, "0");
  document.querySelector("#auction-countdown").textContent = `${hours}:${minutes}:${seconds}`;
}, 1000);

setInterval(() => {
  const keys = Object.keys(bidValues);
  const key = keys[Math.floor(Math.random() * keys.length)];
  bidValues[key] += 1000;
  const bid = document.querySelector(`[data-bid="${key}"]`);
  if (bid) bid.textContent = `$${bidValues[key].toLocaleString("en-US")}`;
}, 9000);

function openBooking(spotId) {
  const spot = spots[spotId];
  if (!spot) return;
  activeSpotId = spotId;
  modalTitle.textContent = spot.title;
  modalDescription.textContent = spot.description;
  const isPremium = spotId === "back";
  const minimumBid = isPremium ? 10000 : spot.minBid;
  modalPrice.innerHTML = isPremium ? "$10,000 <span>premium fixed bid</span>" : `$${minimumBid.toLocaleString("en-US")}+ <span>your opening bid</span>`;
  bidAmount.min = String(minimumBid);
  bidAmount.value = String(minimumBid);
  bidAmount.readOnly = isPremium;
  modal.showModal();
}

document.querySelectorAll("[data-spot]").forEach((trigger) => {
  trigger.addEventListener("click", () => openBooking(trigger.dataset.spot));
});

const placementImage = document.querySelector(".placement-image");
const placementStage = document.querySelector(".jacket-stage");
const viewLabel = document.querySelector(".view-label");
const viewCaption = document.querySelector(".view-caption");
const shirtZones = [
  ["collar", .35, .66], ["leftShoulder", .14, .68], ["rightShoulder", .86, .68],
  ["leftChest", .35, .74], ["chest", .50, .74], ["rightChest", .65, .74],
  ["leftSleeve", .14, .78], ["rightSleeve", .93, .60], ["upperWaist", .86, .78],
  ["centerWaist", .50, .82], ["lowerWaist", .70, .82], ["leftHem", .34, .91],
  ["centerHem", .50, .91], ["rightHem", .66, .91], ["leftSide", .30, .82],
  ["rightSide", .78, .76], ["frontTag", .78, .59], ["neckline", .50, .66],
  ["frontEdge", .65, .66],
].map(([id, x, y]) => ({ id, x, y }));

const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
menuToggle.addEventListener("click", () => {
  const isOpen = mobileMenu.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  mobileMenu.setAttribute("aria-hidden", String(!isOpen));
  menuToggle.textContent = isOpen ? "×" : "☰";
});
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuToggle.textContent = "☰";
  });
});

placementImage.addEventListener("click", (event) => {
  if (placementStage.classList.contains("is-back")) {
    openBooking("back");
    return;
  }
  const bounds = placementImage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;

  if (y < 0.55 || x < 0.12 || x > 0.86) {
    placementStage.classList.add("placement-hint");
    window.setTimeout(() => placementStage.classList.remove("placement-hint"), 1200);
    return;
  }

  const closestZone = shirtZones.reduce((closest, zone) => {
    const distance = Math.hypot(x - zone.x, y - zone.y);
    return distance < closest.distance ? { zone, distance } : closest;
  }, { zone: shirtZones[0], distance: Number.POSITIVE_INFINITY });

  openBooking(closestZone.zone.id);
});

document.querySelectorAll(".view-button").forEach((button) => {
  button.addEventListener("click", () => {
    const isBack = button.dataset.view === "back";
    placementStage.classList.remove("is-folding");
    void placementStage.offsetWidth;
    placementStage.classList.add("is-folding");
    placementStage.classList.toggle("is-back", isBack);
    placementImage.src = isBack ? placementImage.dataset.backImage : placementImage.dataset.frontImage;
    placementImage.alt = "Tap a shirt area to add your logo";
    viewLabel.textContent = isBack ? "back view" : "front view";
    viewCaption.textContent = isBack ? "back view · tap the shirt" : "front view · tap the shirt";
    document.querySelectorAll(".view-button").forEach((item) => item.classList.toggle("is-active", item === button));
    window.setTimeout(() => placementStage.classList.remove("is-folding"), 700);
  });
});

document.querySelector(".modal-close").addEventListener("click", () => modal.close());
modal.addEventListener("click", (event) => {
  if (event.target === modal) modal.close();
});

document.querySelectorAll("[data-policy]").forEach((button) => {
  button.addEventListener("click", () => {
    const policy = policies[button.dataset.policy];
    if (!policy) return;
    legalTitle.textContent = policy[0];
    legalCopy.textContent = policy[1];
    legalModal.showModal();
  });
});
document.querySelector(".legal-close").addEventListener("click", () => legalModal.close());
legalModal.addEventListener("click", (event) => {
  if (event.target === legalModal) legalModal.close();
});
document.querySelector(".payment-overlay-close").addEventListener("click", () => paymentOverlay.close());
paymentOverlay.addEventListener("click", (event) => {
  if (event.target === paymentOverlay) paymentOverlay.close();
});

document.querySelector("#booking-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const bid = Number(bidAmount.value);
  const minimum = activeSpotId === "back" ? 10000 : spots[activeSpotId].minBid;
  if (!Number.isFinite(bid) || bid < minimum) {
    bidAmount.setCustomValidity(`Enter at least $${minimum.toLocaleString("en-US")}.`);
    bidAmount.reportValidity();
    return;
  }
  bidAmount.setCustomValidity("");
  const button = event.currentTarget.querySelector("button[type='submit']");
  const form = event.currentTarget;
  button.textContent = "Preparing payment instructions…";
  button.disabled = true;
  try {
    const formData = new FormData(form);
    if (paymentMethod.value === "bank") {
      const localQuote = { amountInr: Math.round(bid * 100), bankDetails: publicBankDetails };
      const localInstructions = `<div class="payment-rate">Amount due: ₹${localQuote.amountInr.toLocaleString("en-IN")}</div><div class="bank-payment"><div class="sbi-brand"><span class="sbi-logo" aria-hidden="true">SBI</span><div><strong>State Bank of India</strong><small>Bank transfer</small></div></div><p>Send <b>₹${localQuote.amountInr.toLocaleString("en-IN")}</b> using these details:</p><dl><div><dt>Bank</dt><dd>${localQuote.bankDetails.bankName}</dd></div><div><dt>Account holder</dt><dd>${localQuote.bankDetails.accountName}</dd></div><div><dt>Account number</dt><dd>${localQuote.bankDetails.accountNumber}</dd></div><div><dt>IFSC</dt><dd>${localQuote.bankDetails.ifsc}</dd></div></dl></div>`;
      paymentInstructions.innerHTML = localInstructions;
      paymentInstructions.hidden = false;
      showPaymentOverlay(localInstructions);
      claimSpot(activeSpotId, bid);
      fetch(`${paymentApiUrl}/api/payment-instructions`, {
        body: JSON.stringify({
          spotId: activeSpotId,
          bidUsd: bid,
          name: formData.get("name"),
          brand: formData.get("brand"),
          email: formData.get("email"),
          paymentMethod: "bank",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(10000),
      }).catch((error) => console.error("Payment instruction email request failed:", error));
      return;
    }
    if (paymentMethod.value === "upi") {
      const localQuote = { amountInr: Math.round(bid * 100), upiId: publicUpiId };
      const localInstructions = `<div class="payment-rate">Amount due: ₹${localQuote.amountInr.toLocaleString("en-IN")}</div><div class="upi-payment"><img src="upi-qr.png" alt="Scan this QR code to pay by UPI" /><div><strong>Pay by UPI</strong><p>Scan or save this QR code, or send <b>₹${localQuote.amountInr.toLocaleString("en-IN")}</b> to <b>${localQuote.upiId}</b>.</p></div></div>`;
      paymentInstructions.innerHTML = localInstructions;
      paymentInstructions.hidden = false;
      showPaymentOverlay(localInstructions);
      claimSpot(activeSpotId, bid);
      fetch(`${paymentApiUrl}/api/payment-instructions`, {
        body: JSON.stringify({
          spotId: activeSpotId,
          bidUsd: bid,
          name: formData.get("name"),
          brand: formData.get("brand"),
          email: formData.get("email"),
          paymentMethod: "upi",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: AbortSignal.timeout(10000),
      }).catch((error) => console.error("Payment instruction email request failed:", error));
      return;
    }
    const response = await fetch(`${paymentApiUrl}/api/payment-instructions`, {
      body: JSON.stringify({
        spotId: activeSpotId,
        bidUsd: bid,
        name: formData.get("name"),
        brand: formData.get("brand"),
        email: formData.get("email"),
        paymentMethod: paymentMethod.value,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(10000),
    });
    const quote = await response.json();
    if (!response.ok) throw new Error(quote.error || "Unable to email payment instructions.");
    const emailStatus = quote.sent ? "<p>Payment instructions were emailed securely.</p>" : "";
    const upiDetails = paymentMethod.value === "upi"
      ? `<div class="upi-payment"><img src="upi-qr.png" alt="Scan this QR code to pay by UPI" /><div><strong>Pay by UPI</strong><p>Scan or save this QR code, or send <b>₹${quote.amountInr.toLocaleString("en-IN")}</b> to <b>${quote.upiId}</b>.</p></div></div>`
      : "";
    const bank = quote.bankDetails || {};
    const bankDetails = paymentMethod.value === "bank"
      ? `<div class="bank-payment"><div class="sbi-brand"><span class="sbi-logo" aria-hidden="true">SBI</span><div><strong>State Bank of India</strong><small>Bank transfer</small></div></div><p>Send <b>₹${quote.amountInr.toLocaleString("en-IN")}</b> using these details:</p><dl><div><dt>Bank</dt><dd>${bank.bankName || "State Bank of India"}</dd></div><div><dt>Account holder</dt><dd>${bank.accountName || "Alex Junior Antwi"}</dd></div><div><dt>Account number</dt><dd>${bank.accountNumber || "Contact campaign owner"}</dd></div><div><dt>IFSC</dt><dd>${bank.ifsc || "Contact campaign owner"}</dd></div></dl></div>`
      : "";
    const renderedInstructions = `${emailStatus}<div class="payment-rate">Amount due: ₹${quote.amountInr.toLocaleString("en-IN")}</div>${upiDetails || bankDetails}`;
    paymentInstructions.innerHTML = renderedInstructions;
    paymentInstructions.hidden = false;
    showPaymentOverlay(renderedInstructions);
    claimSpot(activeSpotId, bid);
  } catch (error) {
    paymentInstructions.innerHTML = `<div class="payment-rate">Instructions unavailable</div><p>${error.name === "TimeoutError" ? "The payment backend took too long to respond." : error.message}</p><p>Try again after the payment backend is configured.</p>`;
    paymentInstructions.hidden = false;
  } finally {
    button.textContent = "Show payment instructions ↗";
    button.disabled = false;
  }
});

function showPaymentOverlay(instructions) {
  window.clearInterval(paymentOverlayTimer);
  paymentOverlayContent.innerHTML = instructions;
  let seconds = 59;
  paymentOverlaySeconds.textContent = seconds;
  paymentOverlay.showModal();
  paymentOverlayTimer = window.setInterval(() => {
    seconds -= 1;
    paymentOverlaySeconds.textContent = seconds;
    if (seconds <= 0) {
      window.clearInterval(paymentOverlayTimer);
      paymentOverlay.close();
    }
  }, 1000);
}

function claimSpot(spotId, amountUsd) {
  if (!claimedSpotIds.has(spotId)) {
    claimedSpotIds.add(spotId);
    claimedSpots += 1;
    paidAmountUsd += amountUsd;
    spotsCount.textContent = claimedSpots;
    const progress = Math.min(100, (paidAmountUsd / campaignTargetUsd) * 100);
    fundingProgressFill.style.width = `${progress}%`;
    fundingProgressFill.parentElement.setAttribute("aria-valuenow", progress.toFixed(1));
    fundingNote.textContent = `${progress.toFixed(1)}% paid · confirmed payments only`;
  }
}
