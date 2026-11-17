// CholoBhairab Option C — Supabase Postgres 17 + bKash Tokenized Checkout (v1.2.0-beta)
// Figma Plugin API Script for `use_figma` (targets fileKey: "JgztYNhQXk5PyeKDMG5lp5")
// Strictly follows `figma-use` & `figma-generate-design` rules:
// - Top-level `await` and `return` (no IIFE wrapper, no figma.closePlugin, no console.log)
// - Loads Inter Regular, Medium, Semi Bold, Bold via Promise.all before any text operations
// - 0..1 normalized RGB colors (no alpha in color object; opacity at paint level)
// - `appendChild` BEFORE setting `layoutSizingHorizontal = "FILL"`
// - `resize()` + `textAutoResize = "HEIGHT"` BEFORE `layoutSizingHorizontal = "FILL"` on wrapped text

const createdNodeIds = [];

await Promise.all([
  figma.loadFontAsync({ family: "Inter", style: "Regular" }),
  figma.loadFontAsync({ family: "Inter", style: "Medium" }),
  figma.loadFontAsync({ family: "Inter", style: "Semi Bold" }),
  figma.loadFontAsync({ family: "Inter", style: "Bold" }),
]);

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

function solidFill(hex, opacity = 1) {
  const paint = { type: "SOLID", color: hexToRgb(hex) };
  if (opacity < 1) paint.opacity = opacity;
  return [paint];
}

function createText(content, size = 13, style = "Regular", colorHex = "#F8FAFC") {
  const t = figma.createText();
  t.fontName = { family: "Inter", style };
  t.fontSize = size;
  t.characters = String(content);
  t.fills = solidFill(colorHex);
  createdNodeIds.push(t.id);
  return t;
}

function appendWrappedText(parent, content, width = 320, size = 12, style = "Regular", colorHex = "#F8FAFC") {
  const t = figma.createText();
  t.fontName = { family: "Inter", style };
  t.fontSize = size;
  t.characters = String(content);
  t.fills = solidFill(colorHex);
  t.resize(width, 18);
  t.textAutoResize = "HEIGHT";
  parent.appendChild(t);
  t.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(t.id);
  return t;
}

function createBadge(label, bgHex, textHex = "#FFFFFF", bgOpacity = 0.2, fontSize = 10) {
  const badge = figma.createAutoLayout("HORIZONTAL", {
    name: `Pill / ${label}`,
    itemSpacing: 4,
    paddingLeft: 9,
    paddingRight: 9,
    paddingTop: 4,
    paddingBottom: 4,
    cornerRadius: 999,
  });
  badge.primaryAxisAlignItems = "CENTER";
  badge.counterAxisAlignItems = "CENTER";
  badge.fills = solidFill(bgHex, bgOpacity);
  badge.strokes = solidFill(bgHex, 0.55);
  badge.strokeWeight = 1;
  badge.appendChild(createText(label, fontSize, "Bold", textHex));
  createdNodeIds.push(badge.id);
  return badge;
}

function createMobileFrame(frameName, xPos, yPos, statusRightText = "5G • GPS • 100%", statusRightColor = "#10B981") {
  const frame = figma.createAutoLayout("VERTICAL", {
    name: frameName,
    itemSpacing: 10,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    paddingBottom: 12,
    cornerRadius: 28,
  });
  frame.resize(390, 844);
  frame.primaryAxisSizingMode = "FIXED";
  frame.counterAxisSizingMode = "FIXED";
  frame.x = xPos;
  frame.y = yPos;
  frame.fills = solidFill("#0B131E");
  frame.strokes = solidFill("#1E293B");
  frame.strokeWeight = 2;
  frame.clipsContent = true;
  createdNodeIds.push(frame.id);

  // Mobile OS Status Bar
  const statusBar = figma.createAutoLayout("HORIZONTAL", {
    name: "Status Bar",
    itemSpacing: 8,
    paddingLeft: 4,
    paddingRight: 4,
    paddingTop: 2,
    paddingBottom: 2,
  });
  statusBar.fills = [];
  statusBar.primaryAxisAlignItems = "SPACE_BETWEEN";
  statusBar.counterAxisAlignItems = "CENTER";
  statusBar.appendChild(createText("9:41", 11, "Bold", "#94A3B8"));
  statusBar.appendChild(createText(statusRightText, 10, "Semi Bold", statusRightColor));
  frame.appendChild(statusBar);
  statusBar.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(statusBar.id);

  return frame;
}

// Clean up any prior nodes with the same names so retries are idempotent
const targetNames = new Set([
  "CHOLOBHAIRAB OPTION C — SUPABASE POSTGRES 17 + bKASH TOKENIZED CHECKOUT v1.2.0-beta",
  "bKash Flow — 1. Driver Low-Balance Lockout & Amount Select",
  "bKash Flow — 2. Official bKash Tokenized Checkout Gateway",
  "bKash Flow — 3. Server Execute Verified & Wallet Unlocked",
]);
for (const child of [...figma.currentPage.children]) {
  if (targetNames.has(child.name)) {
    child.remove();
  }
}

// Align horizontally with the existing desktop & mobile frames and place at y = 2280
const existingDashboard = figma.currentPage.findOne(
  (n) => n.name === "CholoBhairab Live Dispatch & InDrive Bidding Center"
);
const baseX = existingDashboard ? existingDashboard.x : 100;
const bannerY = 2200;
const baseY = 2280;
const frameGap = 40;

// ============================================================================
// SECTION HEADER BANNER (y = 2200, right above the 3 frames at y = 2280)
// ============================================================================
const sectionBanner = figma.createAutoLayout("HORIZONTAL", {
  name: "CHOLOBHAIRAB OPTION C — SUPABASE POSTGRES 17 + bKASH TOKENIZED CHECKOUT v1.2.0-beta",
  itemSpacing: 16,
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 14,
  paddingBottom: 14,
  cornerRadius: 16,
});
sectionBanner.resize(390 * 3 + frameGap * 2, 64);
sectionBanner.primaryAxisSizingMode = "FIXED";
sectionBanner.counterAxisSizingMode = "AUTO";
sectionBanner.x = baseX;
sectionBanner.y = bannerY;
sectionBanner.primaryAxisAlignItems = "SPACE_BETWEEN";
sectionBanner.counterAxisAlignItems = "CENTER";
sectionBanner.fills = solidFill("#111C2D");
sectionBanner.strokes = solidFill("#E2136E", 0.85);
sectionBanner.strokeWeight = 1.5;
createdNodeIds.push(sectionBanner.id);

const bannerLeftCol = figma.createAutoLayout("VERTICAL", {
  name: "Banner Title & Architecture",
  itemSpacing: 4,
});
bannerLeftCol.fills = [];
bannerLeftCol.appendChild(
  createText(
    "CHOLOBHAIRAB OPTION C — SUPABASE POSTGRES 17 + bKASH TOKENIZED CHECKOUT v1.2.0-beta",
    14,
    "Bold",
    "#F8FAFC"
  )
);
bannerLeftCol.appendChild(
  createText(
    "Supabase Project: fmhbugcullfemxtevpxw (PostgreSQL 17.6 • RLS Locked)  •  Tokenized Flow: grant → create → callback → execute  •  UNIQUE gateway_trx_id",
    11,
    "Medium",
    "#94A3B8"
  )
);
sectionBanner.appendChild(bannerLeftCol);
createdNodeIds.push(bannerLeftCol.id);

const bannerRightPills = figma.createAutoLayout("HORIZONTAL", {
  name: "Banner Status Pills",
  itemSpacing: 8,
});
bannerRightPills.fills = [];
bannerRightPills.counterAxisAlignItems = "CENTER";
bannerRightPills.appendChild(createBadge("🗄️ SUPABASE POSTGRES 17", "#10B981", "#6EE7B7", 0.22, 10));
bannerRightPills.appendChild(createBadge("💳 bKASH v1.2.0-beta", "#E2136E", "#FFFFFF", 0.9, 10));
bannerRightPills.appendChild(createBadge("🔒 REPLAY SAFE", "#F59E0B", "#FDE68A", 0.22, 10));
sectionBanner.appendChild(bannerRightPills);
createdNodeIds.push(bannerRightPills.id);

// ============================================================================
// FRAME 1 (390x844 at y = 2280): "bKash Flow — 1. Driver Low-Balance Lockout & Amount Select"
// ============================================================================
const bFrame1 = createMobileFrame(
  "bKash Flow — 1. Driver Low-Balance Lockout & Amount Select",
  baseX,
  baseY,
  "5G • WALLET LOCKED",
  "#F42A41"
);

// 1A. Top Header
const bf1Header = figma.createAutoLayout("HORIZONTAL", {
  name: "Header / Driver Low-Balance Lockout",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
bf1Header.fills = solidFill("#111C2D");
bf1Header.strokes = solidFill("#F42A41", 0.7);
bf1Header.strokeWeight = 1;
bf1Header.primaryAxisAlignItems = "SPACE_BETWEEN";
bf1Header.counterAxisAlignItems = "CENTER";

const bf1TitleCol = figma.createAutoLayout("VERTICAL", { name: "Header Title", itemSpacing: 2 });
bf1TitleCol.fills = [];
bf1TitleCol.appendChild(createText("চলো ভৈরব • চালক ওয়ালেট", 14, "Bold", "#F8FAFC"));
bf1TitleCol.appendChild(createText("Anwar Mia (driver_demo_4) • Easy-Bike #04", 10, "Medium", "#FCA5A5"));
bf1Header.appendChild(bf1TitleCol);
createdNodeIds.push(bf1TitleCol.id);

bf1Header.appendChild(createBadge("🔒 LOCKED < ৳50", "#F42A41", "#FFFFFF", 0.9, 10));
bFrame1.appendChild(bf1Header);
bf1Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1Header.id);

// 1B. Crimson Low-Balance Lockout Alert Card (Anwar Mia: ৳35.00 < ৳50.00 Minimum Threshold)
const bf1LockoutCard = figma.createAutoLayout("VERTICAL", {
  name: "Crimson Lockout Alert Card",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf1LockoutCard.fills = solidFill("#F42A41", 0.14);
bf1LockoutCard.strokes = solidFill("#F42A41", 0.95);
bf1LockoutCard.strokeWeight = 1.5;

const bf1LockoutTop = figma.createAutoLayout("HORIZONTAL", { name: "Lockout Header Row", itemSpacing: 8 });
bf1LockoutTop.fills = [];
bf1LockoutTop.primaryAxisAlignItems = "SPACE_BETWEEN";
bf1LockoutTop.counterAxisAlignItems = "CENTER";
bf1LockoutTop.appendChild(createBadge("DISPATCH BIDDING BLOCKED", "#F42A41", "#FFFFFF", 0.9, 9));
bf1LockoutTop.appendChild(createText("Anwar Mia • driver_demo_4", 10, "Bold", "#FCA5A5"));
bf1LockoutCard.appendChild(bf1LockoutTop);
bf1LockoutTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1LockoutTop.id);

bf1LockoutCard.appendChild(createText("৳35.00 < ৳50.00 Minimum Threshold", 17, "Bold", "#FFFFFF"));
appendWrappedText(
  bf1LockoutCard,
  "🔒 কম ব্যালেন্স! বিড করতে নূন্যতম ৫০ টাকা প্রয়োজন",
  326,
  13,
  "Bold",
  "#FCA5A5"
);
appendWrappedText(
  bf1LockoutCard,
  "Current balance is ৳35.00 BDT at Chandiber Hospital Hub. Recharge via bKash Tokenized Checkout to unlock live InDrive bidding.",
  326,
  10,
  "Regular",
  "#F8FAFC"
);
bFrame1.appendChild(bf1LockoutCard);
bf1LockoutCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1LockoutCard.id);

// 1C. Amount Preset Selector & Tokenized Checkout Card
const bf1SelectorCard = figma.createAutoLayout("VERTICAL", {
  name: "bKash Tokenized Amount Selector Card",
  itemSpacing: 10,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf1SelectorCard.fills = solidFill("#111C2D");
bf1SelectorCard.strokes = solidFill("#E2136E", 0.9);
bf1SelectorCard.strokeWeight = 1.5;

const bf1SelectTop = figma.createAutoLayout("HORIZONTAL", { name: "Selector Header", itemSpacing: 8 });
bf1SelectTop.fills = [];
bf1SelectTop.primaryAxisAlignItems = "SPACE_BETWEEN";
bf1SelectTop.counterAxisAlignItems = "CENTER";
bf1SelectTop.appendChild(createText("bKASH TOKENIZED RECHARGE", 10, "Bold", "#F472B6"));
bf1SelectTop.appendChild(createBadge("MIN TOP-UP: ৳20", "#E2136E", "#FFFFFF", 0.35, 9));
bf1SelectorCard.appendChild(bf1SelectTop);
bf1SelectTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1SelectTop.id);

bf1SelectorCard.appendChild(createText("রিচার্জের পরিমাণ নির্বাচন করুন • Select Top-Up Amount", 12, "Bold", "#F8FAFC"));

// Preset Selector Row (+৳100, +৳200 Selected, +৳500)
const bf1PresetRow = figma.createAutoLayout("HORIZONTAL", {
  name: "Amount Preset Selector Row",
  itemSpacing: 8,
});
bf1PresetRow.fills = [];
bf1SelectorCard.appendChild(bf1PresetRow);
bf1PresetRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1PresetRow.id);

const presetSpecs = [
  { label: "+৳100", sub: "New: ৳135", selected: false },
  { label: "+৳200 Selected", sub: "New: ৳235", selected: true },
  { label: "+৳500", sub: "New: ৳535", selected: false },
];

for (const p of presetSpecs) {
  const pill = figma.createAutoLayout("VERTICAL", {
    name: `Preset / ${p.label}`,
    itemSpacing: 2,
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 9,
    paddingBottom: 9,
    cornerRadius: 10,
  });
  pill.primaryAxisAlignItems = "CENTER";
  pill.counterAxisAlignItems = "CENTER";
  if (p.selected) {
    pill.fills = solidFill("#E2136E", 0.35);
    pill.strokes = solidFill("#E2136E");
    pill.strokeWeight = 1.5;
  } else {
    pill.fills = solidFill("#0B131E");
    pill.strokes = solidFill("#1E293B");
    pill.strokeWeight = 1;
  }
  pill.appendChild(createText(p.label, 11, "Bold", p.selected ? "#FFFFFF" : "#F8FAFC"));
  pill.appendChild(createText(p.sub, 9, "Medium", p.selected ? "#FBCFE8" : "#94A3B8"));
  bf1PresetRow.appendChild(pill);
  pill.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(pill.id);
}

// Balance Projection Strip
const bf1ProjRow = figma.createAutoLayout("HORIZONTAL", {
  name: "Post-Topup Balance Projection",
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 8,
  paddingBottom: 8,
  cornerRadius: 8,
});
bf1ProjRow.primaryAxisAlignItems = "SPACE_BETWEEN";
bf1ProjRow.counterAxisAlignItems = "CENTER";
bf1ProjRow.fills = solidFill("#0B131E");
bf1ProjRow.strokes = solidFill("#10B981", 0.6);
bf1ProjRow.strokeWeight = 1;
bf1ProjRow.appendChild(createText("৳35.00 + ৳200.00 → ৳235.00", 11, "Bold", "#6EE7B7"));
bf1ProjRow.appendChild(createText("🟢 Unlocks Bidding", 10, "Bold", "#10B981"));
bf1SelectorCard.appendChild(bf1ProjRow);
bf1ProjRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1ProjRow.id);

// Primary CTA: "⚡ Create Tokenized Payment (POST /payments/bkash/create)"
const bf1CreateBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "CTA / Create Tokenized Payment",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 10,
});
bf1CreateBtn.primaryAxisAlignItems = "CENTER";
bf1CreateBtn.counterAxisAlignItems = "CENTER";
bf1CreateBtn.fills = solidFill("#E2136E");
bf1CreateBtn.strokes = solidFill("#F472B6");
bf1CreateBtn.strokeWeight = 1.5;
bf1CreateBtn.appendChild(
  createText("⚡ Create Tokenized Payment (POST /payments/bkash/create)", 11, "Bold", "#FFFFFF")
);
bf1SelectorCard.appendChild(bf1CreateBtn);
bf1CreateBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1CreateBtn.id);

bFrame1.appendChild(bf1SelectorCard);
bf1SelectorCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1SelectorCard.id);

// 1D. Tokenized API Lifecycle & Request Spec Card
const bf1ApiCard = figma.createAutoLayout("VERTICAL", {
  name: "Tokenized API Request Card",
  itemSpacing: 5,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
bf1ApiCard.fills = solidFill("#080E17");
bf1ApiCard.strokes = solidFill("#1E293B");
bf1ApiCard.strokeWeight = 1;
bf1ApiCard.appendChild(createText("STEP 1 SERVER CONTRACT • TOKENIZED CHECKOUT INIT", 9, "Bold", "#F59E0B"));
appendWrappedText(
  bf1ApiCard,
  '1. POST /tokenized/checkout/token/grant → id_token\n2. POST /payments/bkash/create { driverId: "driver_demo_4", amountBdt: 200 }\n3. Persists INITIATED row in public.bkash_payments (PaymentID: TR0011...)',
  330,
  10,
  "Regular",
  "#94A3B8"
);
bFrame1.appendChild(bf1ApiCard);
bf1ApiCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf1ApiCard.id);

// ============================================================================
// FRAME 2 (390x844 at y = 2280): "bKash Flow — 2. Official bKash Tokenized Checkout Gateway"
// ============================================================================
const bFrame2 = createMobileFrame(
  "bKash Flow — 2. Official bKash Tokenized Checkout Gateway",
  baseX + (390 + frameGap) * 1,
  baseY,
  "HTTPS • bKash v1.2.0-beta",
  "#F472B6"
);

// 2A. Official bKash Magenta Header Banner (#E2136E)
const bf2Header = figma.createAutoLayout("VERTICAL", {
  name: "bKash Official Gateway Header",
  itemSpacing: 4,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf2Header.fills = solidFill("#E2136E");
bf2Header.strokes = solidFill("#F472B6");
bf2Header.strokeWeight = 1.5;

const bf2HeaderTop = figma.createAutoLayout("HORIZONTAL", { name: "bKash Title Row", itemSpacing: 8 });
bf2HeaderTop.fills = [];
bf2HeaderTop.primaryAxisAlignItems = "SPACE_BETWEEN";
bf2HeaderTop.counterAxisAlignItems = "CENTER";
bf2HeaderTop.appendChild(createText("bKash Tokenized Checkout", 15, "Bold", "#FFFFFF"));
bf2HeaderTop.appendChild(createBadge("v1.2.0-beta", "#0B131E", "#FBCFE8", 0.65, 10));
bf2Header.appendChild(bf2HeaderTop);
bf2HeaderTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2HeaderTop.id);

bf2Header.appendChild(
  createText("বিকাশ পেমেন্ট গেটওয়ে • tokenized.sandbox.bka.sh", 10, "Semi Bold", "#FCE7F3")
);
bFrame2.appendChild(bf2Header);
bf2Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2Header.id);

// 2B. Merchant & Invoice Details Card (CholoBhairab, PaymentID: TR0011..., Invoice: INV-CB-..., Amount: ৳200.00)
const bf2MerchantCard = figma.createAutoLayout("VERTICAL", {
  name: "Merchant & Invoice Summary Card",
  itemSpacing: 6,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf2MerchantCard.fills = solidFill("#111C2D");
bf2MerchantCard.strokes = solidFill("#E2136E", 0.8);
bf2MerchantCard.strokeWeight = 1.5;

const bf2MerchantRow = figma.createAutoLayout("HORIZONTAL", { name: "Merchant Row", itemSpacing: 8 });
bf2MerchantRow.fills = [];
bf2MerchantRow.primaryAxisAlignItems = "SPACE_BETWEEN";
bf2MerchantRow.counterAxisAlignItems = "CENTER";

const bf2MerchantCol = figma.createAutoLayout("VERTICAL", { name: "Merchant Name", itemSpacing: 2 });
bf2MerchantCol.fills = [];
bf2MerchantCol.appendChild(createText("MERCHANT • মার্চেন্ট", 9, "Bold", "#F472B6"));
bf2MerchantCol.appendChild(createText("CholoBhairab (চলো ভৈরব)", 14, "Bold", "#F8FAFC"));
bf2MerchantRow.appendChild(bf2MerchantCol);
createdNodeIds.push(bf2MerchantCol.id);

const bf2AmountCol = figma.createAutoLayout("VERTICAL", { name: "Amount Box", itemSpacing: 2 });
bf2AmountCol.fills = [];
bf2AmountCol.counterAxisAlignItems = "MAX";
bf2AmountCol.appendChild(createText("AMOUNT", 9, "Bold", "#94A3B8"));
bf2AmountCol.appendChild(createText("৳200.00", 20, "Bold", "#10B981"));
bf2MerchantRow.appendChild(bf2AmountCol);
createdNodeIds.push(bf2AmountCol.id);

bf2MerchantCard.appendChild(bf2MerchantRow);
bf2MerchantRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2MerchantRow.id);

const bf2IdsStrip = figma.createAutoLayout("HORIZONTAL", {
  name: "PaymentID & Invoice Strip",
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 6,
  paddingBottom: 6,
  cornerRadius: 8,
});
bf2IdsStrip.primaryAxisAlignItems = "SPACE_BETWEEN";
bf2IdsStrip.counterAxisAlignItems = "CENTER";
bf2IdsStrip.fills = solidFill("#0B131E");
bf2IdsStrip.strokes = solidFill("#1E293B");
bf2IdsStrip.strokeWeight = 1;
bf2IdsStrip.appendChild(createText("PaymentID: TR0011...", 10, "Bold", "#FDE68A"));
bf2IdsStrip.appendChild(createText("Invoice: INV-CB-...", 10, "Bold", "#94A3B8"));
bf2MerchantCard.appendChild(bf2IdsStrip);
bf2IdsStrip.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2IdsStrip.id);

bFrame2.appendChild(bf2MerchantCard);
bf2MerchantCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2MerchantCard.id);

// 2C. bKash Account, 6-Digit OTP Verification & 5-Digit PIN Form Card
const bf2AuthCard = figma.createAutoLayout("VERTICAL", {
  name: "bKash Account, OTP & PIN Verification Card",
  itemSpacing: 10,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf2AuthCard.fills = solidFill("#111C2D");
bf2AuthCard.strokes = solidFill("#E2136E", 0.55);
bf2AuthCard.strokeWeight = 1;

// Account Input Display (01811-223304)
bf2AuthCard.appendChild(createText("আপনার বিকাশ একাউন্ট নম্বর • bKash Account Number", 10, "Bold", "#F472B6"));
const bf2AcctField = figma.createAutoLayout("HORIZONTAL", {
  name: "Field / bKash Account 01811-223304",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 9,
  paddingBottom: 9,
  cornerRadius: 8,
});
bf2AcctField.primaryAxisAlignItems = "SPACE_BETWEEN";
bf2AcctField.counterAxisAlignItems = "CENTER";
bf2AcctField.fills = solidFill("#0B131E");
bf2AcctField.strokes = solidFill("#E2136E", 0.8);
bf2AcctField.strokeWeight = 1;
bf2AcctField.appendChild(createText("01811-223304", 14, "Bold", "#FFFFFF"));
bf2AcctField.appendChild(createBadge("VERIFIED WALLET", "#10B981", "#6EE7B7", 0.2, 9));
bf2AuthCard.appendChild(bf2AcctField);
bf2AcctField.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2AcctField.id);

// 6-Digit OTP Verification (1 2 3 4 5 6)
const bf2OtpHeader = figma.createAutoLayout("HORIZONTAL", { name: "OTP Label Row", itemSpacing: 8 });
bf2OtpHeader.fills = [];
bf2OtpHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
bf2OtpHeader.counterAxisAlignItems = "CENTER";
bf2OtpHeader.appendChild(createText("6-Digit OTP Verification • ওটিপি কোড", 10, "Bold", "#F8FAFC"));
bf2OtpHeader.appendChild(createText("1 2 3 4 5 6", 11, "Bold", "#FDE68A"));
bf2AuthCard.appendChild(bf2OtpHeader);
bf2OtpHeader.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2OtpHeader.id);

const bf2OtpBoxesRow = figma.createAutoLayout("HORIZONTAL", {
  name: "OTP 6-Digit Boxes",
  itemSpacing: 6,
});
bf2OtpBoxesRow.fills = [];
bf2AuthCard.appendChild(bf2OtpBoxesRow);
bf2OtpBoxesRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2OtpBoxesRow.id);

for (const digit of ["1", "2", "3", "4", "5", "6"]) {
  const dBox = figma.createAutoLayout("HORIZONTAL", {
    name: `OTP Digit / ${digit}`,
    paddingTop: 8,
    paddingBottom: 8,
    cornerRadius: 8,
  });
  dBox.primaryAxisAlignItems = "CENTER";
  dBox.counterAxisAlignItems = "CENTER";
  dBox.fills = solidFill("#0B131E");
  dBox.strokes = solidFill("#E2136E", 0.9);
  dBox.strokeWeight = 1.5;
  dBox.appendChild(createText(digit, 14, "Bold", "#FFFFFF"));
  bf2OtpBoxesRow.appendChild(dBox);
  dBox.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(dBox.id);
}

// 5-Digit PIN (• • • • •)
const bf2PinHeader = figma.createAutoLayout("HORIZONTAL", { name: "PIN Label Row", itemSpacing: 8 });
bf2PinHeader.fills = [];
bf2PinHeader.primaryAxisAlignItems = "SPACE_BETWEEN";
bf2PinHeader.counterAxisAlignItems = "CENTER";
bf2PinHeader.appendChild(createText("5-Digit bKash PIN • আপনার বিকাশ পিন", 10, "Bold", "#F8FAFC"));
bf2PinHeader.appendChild(createText("• • • • •", 13, "Bold", "#F472B6"));
bf2AuthCard.appendChild(bf2PinHeader);
bf2PinHeader.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2PinHeader.id);

const bf2PinField = figma.createAutoLayout("HORIZONTAL", {
  name: "Field / 5-Digit PIN",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 9,
  paddingBottom: 9,
  cornerRadius: 8,
});
bf2PinField.primaryAxisAlignItems = "CENTER";
bf2PinField.counterAxisAlignItems = "CENTER";
bf2PinField.fills = solidFill("#0B131E");
bf2PinField.strokes = solidFill("#E2136E", 0.8);
bf2PinField.strokeWeight = 1;
bf2PinField.appendChild(createText("•   •   •   •   •", 16, "Bold", "#FFFFFF"));
bf2AuthCard.appendChild(bf2PinField);
bf2PinField.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2PinField.id);

bFrame2.appendChild(bf2AuthCard);
bf2AuthCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2AuthCard.id);

// 2D. Execute Payment CTA Button ("✓ পেমেন্ট নিশ্চিত করুন (Execute Payment)")
const bf2ExecBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "CTA / Execute Payment",
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 13,
  paddingBottom: 13,
  cornerRadius: 12,
});
bf2ExecBtn.primaryAxisAlignItems = "CENTER";
bf2ExecBtn.counterAxisAlignItems = "CENTER";
bf2ExecBtn.fills = solidFill("#E2136E");
bf2ExecBtn.strokes = solidFill("#FBCFE8");
bf2ExecBtn.strokeWeight = 1.5;
bf2ExecBtn.appendChild(createText("✓ পেমেন্ট নিশ্চিত করুন (Execute Payment)", 12, "Bold", "#FFFFFF"));
bFrame2.appendChild(bf2ExecBtn);
bf2ExecBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2ExecBtn.id);

// 2E. Gateway Footer Note
const bf2Footer = figma.createAutoLayout("VERTICAL", {
  name: "Gateway Security Footer",
  itemSpacing: 2,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 8,
  paddingBottom: 8,
  cornerRadius: 10,
});
bf2Footer.fills = solidFill("#080E17");
bf2Footer.strokes = solidFill("#1E293B");
bf2Footer.strokeWeight = 1;
appendWrappedText(
  bf2Footer,
  "🔒 Callback: GET /payments/bkash/callback?paymentID=TR0011...&status=success → Server POST /payments/bkash/execute",
  330,
  9,
  "Medium",
  "#94A3B8"
);
bFrame2.appendChild(bf2Footer);
bf2Footer.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf2Footer.id);

// ============================================================================
// FRAME 3 (390x844 at y = 2280): "bKash Flow — 3. Server Execute Verified & Wallet Unlocked"
// ============================================================================
const bFrame3 = createMobileFrame(
  "bKash Flow — 3. Server Execute Verified & Wallet Unlocked",
  baseX + (390 + frameGap) * 2,
  baseY,
  "5G • WALLET UNLOCKED",
  "#10B981"
);

// 3A. Top Header
const bf3Header = figma.createAutoLayout("HORIZONTAL", {
  name: "Header / Server Execute Verified",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
bf3Header.fills = solidFill("#111C2D");
bf3Header.strokes = solidFill("#10B981", 0.75);
bf3Header.strokeWeight = 1;
bf3Header.primaryAxisAlignItems = "SPACE_BETWEEN";
bf3Header.counterAxisAlignItems = "CENTER";

const bf3TitleCol = figma.createAutoLayout("VERTICAL", { name: "Header Title", itemSpacing: 2 });
bf3TitleCol.fills = [];
bf3TitleCol.appendChild(createText("চলো ভৈরব • পেমেন্ট যাচাইকৃত", 14, "Bold", "#F8FAFC"));
bf3TitleCol.appendChild(createText("Server Execute Verified • Bidding Unlocked", 10, "Medium", "#6EE7B7"));
bf3Header.appendChild(bf3TitleCol);
createdNodeIds.push(bf3TitleCol.id);

bf3Header.appendChild(createBadge("🟢 ৳235 ACTIVE", "#10B981", "#FFFFFF", 0.3, 10));
bFrame3.appendChild(bf3Header);
bf3Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3Header.id);

// 3B. Emerald Verification Card ("✓ বিকাশ পেমেন্ট সফল • TrxID: BKH948201M")
const bf3VerifyCard = figma.createAutoLayout("VERTICAL", {
  name: "Emerald Verification Card",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf3VerifyCard.fills = solidFill("#006A4E", 0.28);
bf3VerifyCard.strokes = solidFill("#10B981");
bf3VerifyCard.strokeWeight = 1.5;

const bf3VerifyTop = figma.createAutoLayout("HORIZONTAL", { name: "Verify Top Row", itemSpacing: 8 });
bf3VerifyTop.fills = [];
bf3VerifyTop.primaryAxisAlignItems = "SPACE_BETWEEN";
bf3VerifyTop.counterAxisAlignItems = "CENTER";
bf3VerifyTop.appendChild(createBadge("EXECUTE COMPLETED • 200 OK", "#10B981", "#0B131E", 0.95, 9));
bf3VerifyTop.appendChild(createText("+৳200.00 BDT", 13, "Bold", "#6EE7B7"));
bf3VerifyCard.appendChild(bf3VerifyTop);
bf3VerifyTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3VerifyTop.id);

appendWrappedText(
  bf3VerifyCard,
  "✓ বিকাশ পেমেন্ট সফল • TrxID: BKH948201M",
  326,
  14,
  "Bold",
  "#FFFFFF"
);
appendWrappedText(
  bf3VerifyCard,
  "PaymentID: TR0011948201 • Invoice: INV-CB-20261117 • Payer: 01811-223304",
  326,
  10,
  "Medium",
  "#A7F3D0"
);
bFrame3.appendChild(bf3VerifyCard);
bf3VerifyCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3VerifyCard.id);

// 3C. Updated Wallet Balance Card ("৳35.00 → ৳235.00 • 🟢 বিডিং আনলকড!")
const bf3WalletCard = figma.createAutoLayout("VERTICAL", {
  name: "Updated Wallet Balance Card",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf3WalletCard.fills = solidFill("#111C2D");
bf3WalletCard.strokes = solidFill("#10B981", 0.85);
bf3WalletCard.strokeWeight = 1.5;

bf3WalletCard.appendChild(createText("DRIVER WALLET STATE • আনোয়ার মিয়া (driver_demo_4)", 10, "Bold", "#10B981"));
appendWrappedText(
  bf3WalletCard,
  "৳35.00 → ৳235.00 • 🟢 বিডিং আনলকড!",
  326,
  16,
  "Bold",
  "#F8FAFC"
);
appendWrappedText(
  bf3WalletCard,
  "Balance exceeds ৳50.00 minimum threshold. Driver is immediately unlocked for live InDrive ride counter-bidding (8% auto-commission).",
  326,
  10,
  "Regular",
  "#94A3B8"
);
bFrame3.appendChild(bf3WalletCard);
bf3WalletCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3WalletCard.id);

// 3D. Supabase PostgreSQL (fmhbugcullfemxtevpxw) Persistence Confirmation Card
const bf3SupabaseCard = figma.createAutoLayout("VERTICAL", {
  name: "Supabase PostgreSQL Persistence Badge Card",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
bf3SupabaseCard.fills = solidFill("#111C2D");
bf3SupabaseCard.strokes = solidFill("#3B82F6", 0.85);
bf3SupabaseCard.strokeWeight = 1.5;

const bf3SupaTop = figma.createAutoLayout("HORIZONTAL", { name: "Supabase Project Row", itemSpacing: 8 });
bf3SupaTop.fills = [];
bf3SupaTop.primaryAxisAlignItems = "SPACE_BETWEEN";
bf3SupaTop.counterAxisAlignItems = "CENTER";
bf3SupaTop.appendChild(createBadge("🗄️ SUPABASE POSTGRESQL 17", "#3B82F6", "#FFFFFF", 0.3, 9));
bf3SupaTop.appendChild(createText("fmhbugcullfemxtevpxw", 10, "Bold", "#93C5FD"));
bf3SupabaseCard.appendChild(bf3SupaTop);
bf3SupaTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3SupaTop.id);

appendWrappedText(
  bf3SupabaseCard,
  "Persisted in public.bkash_payments & public.wallet_transactions with UNIQUE gateway_trx_id",
  326,
  11,
  "Bold",
  "#F8FAFC"
);
appendWrappedText(
  bf3SupabaseCard,
  "Replay / Double-Callback Guard: Re-calling /payments/bkash/execute returns { alreadyCompleted: true } and keeps wallet at ৳235.00 across server restarts.",
  326,
  10,
  "Regular",
  "#94A3B8"
);
bFrame3.appendChild(bf3SupabaseCard);
bf3SupabaseCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3SupabaseCard.id);

// 3E. Return to Live Radar CTA Button
const bf3RadarBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "CTA / Return to Live Bidding",
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 12,
});
bf3RadarBtn.primaryAxisAlignItems = "CENTER";
bf3RadarBtn.counterAxisAlignItems = "CENTER";
bf3RadarBtn.fills = solidFill("#006A4E");
bf3RadarBtn.strokes = solidFill("#10B981");
bf3RadarBtn.strokeWeight = 1.5;
bf3RadarBtn.appendChild(createText("⚡ লাইভ রাইডে বিড করুন • Start Bidding Now", 12, "Bold", "#FFFFFF"));
bFrame3.appendChild(bf3RadarBtn);
bf3RadarBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bf3RadarBtn.id);

const bkashFrames = [bFrame1, bFrame2, bFrame3].map((f) => ({
  id: f.id,
  name: f.name,
  x: f.x,
  y: f.y,
  width: f.width,
  height: f.height,
}));

return {
  success: true,
  sectionBannerId: sectionBanner.id,
  bkashFrames,
  createdCount: createdNodeIds.length,
  createdNodeIds,
};
