// CholoBhairab — Mobile App Suite (Passenger & Driver 390x844 Frames)
// Figma Plugin API Script for `use_figma` (targets fileKey: "JgztYNhQXk5PyeKDMG5lp5")
// Strictly follows `figma-use` & `figma-generate-design` rules:
// - Top-level `await` and `return` (no IIFE wrapper, no figma.closePlugin, no console.log)
// - Loads Inter Regular, Medium, Semi Bold, Bold before any text operations
// - 0..1 normalized RGB colors (no alpha in color object)
// - `appendChild` BEFORE setting `layoutSizingHorizontal = "FILL"`
// - `resize()` + `textAutoResize = "HEIGHT"` BEFORE `layoutSizingHorizontal = "FILL"` on wrapping text

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

function createMobileFrame(frameName, xPos, yPos) {
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
  statusBar.appendChild(createText("5G • GPS • 100%", 10, "Semi Bold", "#10B981"));
  frame.appendChild(statusBar);
  statusBar.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(statusBar.id);

  return frame;
}

// Align horizontally with the existing 1440x900 desktop dashboard frame and place at y = 1320
const existingDashboard = figma.currentPage.findOne(
  (n) => n.name === "CholoBhairab Live Dispatch & InDrive Bidding Center"
);
const baseX = existingDashboard ? existingDashboard.x : 100;
const baseY = 1320;
const frameGap = 40;

// ============================================================================
// FRAME 1 (390x844): "Passenger App — 1. Map & Fare Offer"
// ============================================================================
const frame1 = createMobileFrame("Passenger App — 1. Map & Fare Offer", baseX, baseY);

// 1A. Top Header (চলো ভৈরব • যাত্রী + 999 SOS pill)
const f1Header = figma.createAutoLayout("HORIZONTAL", {
  name: "Header / Passenger Brand & SOS",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f1Header.fills = solidFill("#111C2D");
f1Header.strokes = solidFill("#1E293B");
f1Header.strokeWeight = 1;
f1Header.primaryAxisAlignItems = "SPACE_BETWEEN";
f1Header.counterAxisAlignItems = "CENTER";

const f1BrandCol = figma.createAutoLayout("VERTICAL", { name: "Brand Title", itemSpacing: 2 });
f1BrandCol.fills = [];
f1BrandCol.appendChild(createText("চলো ভৈরব • যাত্রী", 15, "Bold", "#F8FAFC"));
f1BrandCol.appendChild(createText("CholoBhairab Passenger • Bhairab", 10, "Medium", "#10B981"));
f1Header.appendChild(f1BrandCol);
createdNodeIds.push(f1BrandCol.id);

f1Header.appendChild(createBadge("🚨 999 SOS", "#F42A41", "#FFFFFF", 0.9, 11));
frame1.appendChild(f1Header);
f1Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1Header.id);

// 1B. Stylized Bhairab Map Viewport (24.0487°N, 90.9852°E)
const f1Map = figma.createFrame();
f1Map.name = "Bhairab Map Viewport (24.0487°N, 90.9852°E)";
f1Map.resize(358, 196);
f1Map.cornerRadius = 14;
f1Map.fills = solidFill("#071019");
f1Map.strokes = solidFill("#006A4E", 0.65);
f1Map.strokeWeight = 1.5;
f1Map.clipsContent = true;
frame1.appendChild(f1Map);
f1Map.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1Map.id);

// Meghna River Band inside Map
const f1River = figma.createFrame();
f1River.name = "Meghna River Corridor";
f1River.resize(96, 196);
f1River.x = 262;
f1River.y = 0;
f1River.fills = solidFill("#0C243C", 0.8);
f1Map.appendChild(f1River);
createdNodeIds.push(f1River.id);

const f1CoordsChip = createBadge("24.0487°N, 90.9852°E • 1.89 km", "#0B131E", "#6EE7B7", 0.9, 10);
f1CoordsChip.x = 10;
f1CoordsChip.y = 10;
f1Map.appendChild(f1CoordsChip);

// Route Line connecting Pickup -> Dropoff
const f1RouteVector = figma.createRectangle();
f1RouteVector.name = "Route Line (1.89 km)";
f1RouteVector.resize(175, 4);
f1RouteVector.x = 75;
f1RouteVector.y = 102;
f1RouteVector.cornerRadius = 2;
f1RouteVector.fills = solidFill("#10B981");
f1Map.appendChild(f1RouteVector);
createdNodeIds.push(f1RouteVector.id);

// Pickup Map Pin Card
const f1PickupPin = figma.createAutoLayout("VERTICAL", {
  name: "Pin / Pickup",
  itemSpacing: 2,
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 6,
  paddingBottom: 6,
  cornerRadius: 8,
});
f1PickupPin.x = 10;
f1PickupPin.y = 52;
f1PickupPin.fills = solidFill("#111C2D", 0.95);
f1PickupPin.strokes = solidFill("#10B981", 0.9);
f1PickupPin.strokeWeight = 1;
f1PickupPin.appendChild(createText("🟢 PICKUP HUB", 9, "Bold", "#10B981"));
f1PickupPin.appendChild(createText("ভৈরব বাজার রেলওয়ে জংশন", 10, "Bold", "#F8FAFC"));
f1Map.appendChild(f1PickupPin);
createdNodeIds.push(f1PickupPin.id);

// Dropoff Map Pin Card
const f1DropoffPin = figma.createAutoLayout("VERTICAL", {
  name: "Pin / Dropoff",
  itemSpacing: 2,
  paddingLeft: 8,
  paddingRight: 8,
  paddingTop: 6,
  paddingBottom: 6,
  cornerRadius: 8,
});
f1DropoffPin.x = 118;
f1DropoffPin.y = 122;
f1DropoffPin.fills = solidFill("#111C2D", 0.95);
f1DropoffPin.strokes = solidFill("#F59E0B", 0.9);
f1DropoffPin.strokeWeight = 1;
f1DropoffPin.appendChild(createText("🟠 DROPOFF • 1.89 km", 9, "Bold", "#F59E0B"));
f1DropoffPin.appendChild(createText("সৈয়দ নজরুল ইসলাম সেতু / মেঘনা ব্রিজ", 10, "Bold", "#F8FAFC"));
f1Map.appendChild(f1DropoffPin);
createdNodeIds.push(f1DropoffPin.id);

// 1C. Route Corridor Details Card
const f1RouteCard = figma.createAutoLayout("VERTICAL", {
  name: "Route Summary Card",
  itemSpacing: 6,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f1RouteCard.fills = solidFill("#111C2D");
f1RouteCard.strokes = solidFill("#1E293B");
f1RouteCard.strokeWeight = 1;
appendWrappedText(f1RouteCard, "🟢 Pickup: ভৈরব বাজার রেলওয়ে জংশন (Railway Junction)", 330, 11, "Semi Bold", "#F8FAFC");
appendWrappedText(f1RouteCard, "🟠 Dropoff: সৈয়দ নজরুল ইসলাম সেতু / মেঘনা ব্রিজ • 1.89 km", 330, 11, "Semi Bold", "#FDE68A");
frame1.appendChild(f1RouteCard);
f1RouteCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1RouteCard.id);

// 1D. 4 Multi-Modal Vehicle Selector Cards (2x2 Grid)
const f1VehicleSection = figma.createAutoLayout("VERTICAL", {
  name: "Multi-Modal Vehicle Selector",
  itemSpacing: 8,
});
f1VehicleSection.fills = [];
f1VehicleSection.appendChild(createText("যানবাহন নির্বাচন করুন • Select Vehicle Tier", 11, "Bold", "#94A3B8"));
frame1.appendChild(f1VehicleSection);
f1VehicleSection.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1VehicleSection.id);

const vehicleTiers = [
  [
    { label: "ইজিবাইক ৳50", sub: "Easy-Bike • 1–4 Seats", selected: true, accent: "#10B981" },
    { label: "বাইক ৳70", sub: "Motorbike • Fast 1 Seat", selected: false, accent: "#3B82F6" },
  ],
  [
    { label: "সিএনজি ৳90", sub: "CNG Auto • 1–3 Seats", selected: false, accent: "#F59E0B" },
    { label: "ঢাকা মাইক্রোবাস ৳300", sub: "Microbus • Highway", selected: false, accent: "#8B5CF6" },
  ],
];

for (const rowSpecs of vehicleTiers) {
  const vRow = figma.createAutoLayout("HORIZONTAL", { name: "Vehicle Row", itemSpacing: 8 });
  vRow.fills = [];
  f1VehicleSection.appendChild(vRow);
  vRow.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(vRow.id);

  for (const v of rowSpecs) {
    const vCard = figma.createAutoLayout("VERTICAL", {
      name: `Vehicle Card / ${v.label}`,
      itemSpacing: 3,
      paddingLeft: 10,
      paddingRight: 10,
      paddingTop: 8,
      paddingBottom: 8,
      cornerRadius: 10,
    });
    if (v.selected) {
      vCard.fills = solidFill("#006A4E", 0.32);
      vCard.strokes = solidFill("#10B981", 0.9);
      vCard.strokeWeight = 1.5;
    } else {
      vCard.fills = solidFill("#111C2D");
      vCard.strokes = solidFill("#1E293B");
      vCard.strokeWeight = 1;
    }
    vCard.appendChild(createText(v.label, 12, "Bold", v.selected ? "#FFFFFF" : "#F8FAFC"));
    vCard.appendChild(createText(v.sub, 10, "Regular", v.selected ? "#6EE7B7" : "#94A3B8"));
    vRow.appendChild(vCard);
    vCard.layoutSizingHorizontal = "FILL";
    createdNodeIds.push(vCard.id);
  }
}

// 1E. InDrive Fare Negotiation Stepper (-৳5 | ৳80 প্রস্তাবিত ভাড়া | +৳5)
const f1StepperCard = figma.createAutoLayout("VERTICAL", {
  name: "InDrive Fare Negotiation Stepper",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f1StepperCard.fills = solidFill("#111C2D");
f1StepperCard.strokes = solidFill("#F59E0B", 0.75);
f1StepperCard.strokeWeight = 1.5;
f1StepperCard.appendChild(createText("INDRIVE FARE OFFER • আপনার প্রস্তাবিত ভাড়া নির্ধারণ করুন", 10, "Bold", "#F59E0B"));

const f1StepperRow = figma.createAutoLayout("HORIZONTAL", {
  name: "Stepper Controls",
  itemSpacing: 10,
});
f1StepperRow.fills = [];
f1StepperRow.primaryAxisAlignItems = "SPACE_BETWEEN";
f1StepperRow.counterAxisAlignItems = "CENTER";

const minusBtn = createBadge("-৳5", "#1E293B", "#F8FAFC", 0.9, 13);
minusBtn.paddingLeft = 14;
minusBtn.paddingRight = 14;
minusBtn.paddingTop = 8;
minusBtn.paddingBottom = 8;
f1StepperRow.appendChild(minusBtn);

const fareCenter = figma.createAutoLayout("VERTICAL", { name: "Proposed Fare Display", itemSpacing: 2 });
fareCenter.fills = [];
fareCenter.counterAxisAlignItems = "CENTER";
fareCenter.appendChild(createText("৳80 প্রস্তাবিত ভাড়া", 16, "Bold", "#10B981"));
fareCenter.appendChild(createText("Proposed Offer • Cash Only", 10, "Regular", "#94A3B8"));
f1StepperRow.appendChild(fareCenter);
createdNodeIds.push(fareCenter.id);

const plusBtn = createBadge("+৳5", "#F59E0B", "#0B131E", 0.95, 13);
plusBtn.paddingLeft = 14;
plusBtn.paddingRight = 14;
plusBtn.paddingTop = 8;
plusBtn.paddingBottom = 8;
f1StepperRow.appendChild(plusBtn);

f1StepperCard.appendChild(f1StepperRow);
f1StepperRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1StepperRow.id);

frame1.appendChild(f1StepperCard);
f1StepperCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1StepperCard.id);

// 1F. Emerald CTA Button (⚡ রাইড রিকোয়েস্ট পাঠান • Request Ride)
const f1CtaBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "CTA / Request Ride",
  itemSpacing: 8,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 14,
  paddingBottom: 14,
  cornerRadius: 12,
});
f1CtaBtn.primaryAxisAlignItems = "CENTER";
f1CtaBtn.counterAxisAlignItems = "CENTER";
f1CtaBtn.fills = solidFill("#006A4E");
f1CtaBtn.strokes = solidFill("#10B981");
f1CtaBtn.strokeWeight = 1.5;
f1CtaBtn.appendChild(createText("⚡ রাইড রিকোয়েস্ট পাঠান • Request Ride", 13, "Bold", "#FFFFFF"));
frame1.appendChild(f1CtaBtn);
f1CtaBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f1CtaBtn.id);

// ============================================================================
// FRAME 2 (390x844): "Passenger App — 2. Live InDrive Counter-Bids"
// ============================================================================
const frame2 = createMobileFrame(
  "Passenger App — 2. Live InDrive Counter-Bids",
  baseX + (390 + frameGap) * 1,
  baseY
);

// 2A. Header (লাইভ ড্রাইভার বিডিং • 2 Drivers Bidding)
const f2Header = figma.createAutoLayout("VERTICAL", {
  name: "Header / Live Driver Bidding",
  itemSpacing: 4,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f2Header.fills = solidFill("#111C2D");
f2Header.strokes = solidFill("#F59E0B", 0.65);
f2Header.strokeWeight = 1;
f2Header.appendChild(createBadge("REAL-TIME INDRIVE NEGOTIATION", "#F59E0B", "#FDE68A", 0.2, 9));
f2Header.appendChild(createText("লাইভ ড্রাইভার বিডিং • 2 Drivers Bidding", 14, "Bold", "#F8FAFC"));
f2Header.appendChild(createText("আপনার প্রস্তাব: ৳80 • ভৈরব রেলওয়ে জংশন → মেঘনা ব্রিজ", 11, "Medium", "#10B981"));
frame2.appendChild(f2Header);
f2Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f2Header.id);

// Helper to build Incoming Counter-Bid Cards
function createCounterBidCard(cardName, badgeText, badgeHex, driverSpecLine, subDetailLine, acceptLabel, priceLabel) {
  const card = figma.createAutoLayout("VERTICAL", {
    name: cardName,
    itemSpacing: 8,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
    cornerRadius: 14,
  });
  card.fills = solidFill("#111C2D");
  card.strokes = solidFill(badgeHex, 0.85);
  card.strokeWeight = 1.5;

  const topRow = figma.createAutoLayout("HORIZONTAL", { name: "Bid Badge & Price", itemSpacing: 8 });
  topRow.fills = [];
  topRow.primaryAxisAlignItems = "SPACE_BETWEEN";
  topRow.counterAxisAlignItems = "CENTER";
  topRow.appendChild(createBadge(badgeText, badgeHex, "#FFFFFF", 0.25, 10));
  topRow.appendChild(createText(priceLabel, 18, "Bold", "#FDE68A"));
  card.appendChild(topRow);
  topRow.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(topRow.id);

  appendWrappedText(card, driverSpecLine, 330, 12, "Bold", "#F8FAFC");
  appendWrappedText(card, subDetailLine, 330, 10, "Regular", "#94A3B8");

  const acceptBtn = figma.createAutoLayout("HORIZONTAL", {
    name: `Button / ${acceptLabel}`,
    itemSpacing: 6,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 10,
    paddingBottom: 10,
    cornerRadius: 10,
  });
  acceptBtn.primaryAxisAlignItems = "CENTER";
  acceptBtn.counterAxisAlignItems = "CENTER";
  acceptBtn.fills = solidFill("#006A4E");
  acceptBtn.strokes = solidFill("#10B981");
  acceptBtn.strokeWeight = 1;
  acceptBtn.appendChild(createText(acceptLabel, 12, "Bold", "#FFFFFF"));
  card.appendChild(acceptBtn);
  acceptBtn.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(acceptBtn.id);

  createdNodeIds.push(card.id);
  return card;
}

// 2B. Incoming Counter-Bid Card 1 (৳90)
const f2Bid1 = createCounterBidCard(
  "Incoming Counter-Bid Card 1 (৳90)",
  "COUNTER-BID #1 • NEAREST EASY-BIKE",
  "#10B981",
  "মোঃ রফিকুল ইসলাম • ভৈরব ইজিবাইক #১২ • ★ 4.9 • ২ মিনিট দূরে • ৳90",
  "Md. Rafiqul Islam • 350m away • পৌরসভা ওয়ার্ড কাউন্সিলর যাচাইকৃত",
  "✓ গ্রহণ করুন (Accept ৳90)",
  "৳90"
);
frame2.appendChild(f2Bid1);
f2Bid1.layoutSizingHorizontal = "FILL";

// 2C. Incoming Counter-Bid Card 2 (৳95)
const f2Bid2 = createCounterBidCard(
  "Incoming Counter-Bid Card 2 (৳95)",
  "COUNTER-BID #2 • FAST CNG AUTO",
  "#F59E0B",
  "কামাল হোসেন • সিএনজি অটো #০৮ • ★ 4.8 • ৩ মিনিট দূরে • ৳95",
  "Kamal Hossain • 600m away • পৌরসভা ওয়ার্ড কাউন্সিলর যাচাইকৃত",
  "✓ গ্রহণ করুন (Accept ৳95)",
  "৳95"
);
frame2.appendChild(f2Bid2);
f2Bid2.layoutSizingHorizontal = "FILL";

// 2D. Active Trip Protection Info Box
const f2TrustBox = figma.createAutoLayout("VERTICAL", {
  name: "Cash & Telemetry Info",
  itemSpacing: 4,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f2TrustBox.fills = solidFill("#080E17");
f2TrustBox.strokes = solidFill("#1E293B");
f2TrustBox.strokeWeight = 1;
f2TrustBox.appendChild(createText("💵 ১০০% নগদ পেমেন্ট • ট্রিপ শেষে চালককে সরাসরি পরিশোধ করুন", 11, "Semi Bold", "#6EE7B7"));
f2TrustBox.appendChild(createText("Live GPS telemetry shared with Bhairab Dispatch Command Center", 10, "Regular", "#94A3B8"));
frame2.appendChild(f2TrustBox);
f2TrustBox.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f2TrustBox.id);

// 2E. Bottom Safety Bar (WhatsApp Live Tracking + 999 SOS)
const f2SafetyBar = figma.createAutoLayout("VERTICAL", {
  name: "Bottom Safety Bar",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 14,
});
f2SafetyBar.fills = solidFill("#111C2D");
f2SafetyBar.strokes = solidFill("#F42A41", 0.55);
f2SafetyBar.strokeWeight = 1;
f2SafetyBar.appendChild(createText("PASSENGER SAFETY & EMERGENCY DISPATCH", 10, "Bold", "#FCA5A5"));

const whatsappBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "Button / WhatsApp Share",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 9,
  paddingBottom: 9,
  cornerRadius: 8,
});
whatsappBtn.primaryAxisAlignItems = "CENTER";
whatsappBtn.counterAxisAlignItems = "CENTER";
whatsappBtn.fills = solidFill("#006A4E", 0.35);
whatsappBtn.strokes = solidFill("#10B981");
whatsappBtn.strokeWeight = 1;
whatsappBtn.appendChild(createText("🔗 WhatsApp লাইভ ট্র্যাকিং শেয়ার", 11, "Bold", "#FFFFFF"));
f2SafetyBar.appendChild(whatsappBtn);
whatsappBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(whatsappBtn.id);

const sosBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "Button / 999 Emergency SOS",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 9,
  paddingBottom: 9,
  cornerRadius: 8,
});
sosBtn.primaryAxisAlignItems = "CENTER";
sosBtn.counterAxisAlignItems = "CENTER";
sosBtn.fills = solidFill("#F42A41");
sosBtn.strokes = solidFill("#FCA5A5");
sosBtn.strokeWeight = 1;
sosBtn.appendChild(createText("🚨 জরুরী ৯৯৯ SOS", 12, "Bold", "#FFFFFF"));
f2SafetyBar.appendChild(sosBtn);
sosBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(sosBtn.id);

frame2.appendChild(f2SafetyBar);
f2SafetyBar.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f2SafetyBar.id);

// ============================================================================
// FRAME 3 (390x844): "Driver App — 1. Online Radar & Bangla Voice Bid"
// ============================================================================
const frame3 = createMobileFrame(
  "Driver App — 1. Online Radar & Bangla Voice Bid",
  baseX + (390 + frameGap) * 2,
  baseY
);

// 3A. Driver Header (চলো ভৈরব • চালক, Online toggle 🟢 আপনি অনলাইন আছেন, Wallet pill ৳193)
const f3Header = figma.createAutoLayout("VERTICAL", {
  name: "Header / Driver Online & Wallet",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f3Header.fills = solidFill("#111C2D");
f3Header.strokes = solidFill("#1E293B");
f3Header.strokeWeight = 1;

const f3TopRow = figma.createAutoLayout("HORIZONTAL", { name: "Driver Title & Wallet", itemSpacing: 8 });
f3TopRow.fills = [];
f3TopRow.primaryAxisAlignItems = "SPACE_BETWEEN";
f3TopRow.counterAxisAlignItems = "CENTER";
f3TopRow.appendChild(createText("চলো ভৈরব • চালক", 15, "Bold", "#F8FAFC"));
f3TopRow.appendChild(createBadge("৳193", "#E2136E", "#FFFFFF", 0.9, 12));
f3Header.appendChild(f3TopRow);
f3TopRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3TopRow.id);

const f3OnlineBar = figma.createAutoLayout("HORIZONTAL", {
  name: "Online Status Toggle",
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 6,
  paddingBottom: 6,
  cornerRadius: 8,
});
f3OnlineBar.primaryAxisAlignItems = "SPACE_BETWEEN";
f3OnlineBar.counterAxisAlignItems = "CENTER";
f3OnlineBar.fills = solidFill("#006A4E", 0.28);
f3OnlineBar.strokes = solidFill("#10B981", 0.7);
f3OnlineBar.strokeWeight = 1;
f3OnlineBar.appendChild(createText("🟢 আপনি অনলাইন আছেন", 12, "Bold", "#6EE7B7"));
f3OnlineBar.appendChild(createText("ইজিবাইক #১২", 11, "Semi Bold", "#FFFFFF"));
f3Header.appendChild(f3OnlineBar);
f3OnlineBar.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3OnlineBar.id);

frame3.appendChild(f3Header);
f3Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3Header.id);

// 3B. Bhairab Hotspot Radar Card (ভৈরব রেলওয়ে স্টেশন জোন • High Demand)
const f3RadarCard = figma.createAutoLayout("VERTICAL", {
  name: "Bhairab Hotspot Radar Card",
  itemSpacing: 6,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
f3RadarCard.fills = solidFill("#071019");
f3RadarCard.strokes = solidFill("#006A4E", 0.8);
f3RadarCard.strokeWeight = 1.5;
f3RadarCard.appendChild(createBadge("LIVE BHAIRAB HOTSPOT RADAR", "#10B981", "#6EE7B7", 0.2, 10));
f3RadarCard.appendChild(createText("ভৈরব রেলওয়ে স্টেশন জোন • High Demand", 13, "Bold", "#F8FAFC"));
f3RadarCard.appendChild(createText("24.0487°N, 90.9852°E • 4 Active Ride Requests within 1.5 km", 10, "Regular", "#94A3B8"));
frame3.appendChild(f3RadarCard);
f3RadarCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3RadarCard.id);

// 3C. Incoming Ride Opportunity Modal with Amber Border (#F59E0B)
const f3Modal = figma.createAutoLayout("VERTICAL", {
  name: "Incoming Ride Opportunity Modal",
  itemSpacing: 10,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 14,
  paddingBottom: 14,
  cornerRadius: 16,
});
f3Modal.fills = solidFill("#111C2D");
f3Modal.strokes = solidFill("#F59E0B");
f3Modal.strokeWeight = 2;

const f3ModalTop = figma.createAutoLayout("HORIZONTAL", { name: "Modal Header", itemSpacing: 8 });
f3ModalTop.fills = [];
f3ModalTop.primaryAxisAlignItems = "SPACE_BETWEEN";
f3ModalTop.counterAxisAlignItems = "CENTER";
f3ModalTop.appendChild(createBadge("⚡ NEW RIDE OPPORTUNITY", "#F59E0B", "#0B131E", 0.95, 10));
f3ModalTop.appendChild(createText("1.89 km • 8% Fee: ৳6.40", 10, "Semi Bold", "#FDE68A"));
f3Modal.appendChild(f3ModalTop);
f3ModalTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3ModalTop.id);

// Bangla Voice Alert Banner
const f3VoiceBanner = figma.createAutoLayout("VERTICAL", {
  name: "Bangla Voice Alert Banner",
  itemSpacing: 6,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 10,
});
f3VoiceBanner.fills = solidFill("#0B131E");
f3VoiceBanner.strokes = solidFill("#F59E0B", 0.7);
f3VoiceBanner.strokeWeight = 1;
f3VoiceBanner.appendChild(createText("BANGLA VOICE DISPATCH ALERT (TTS)", 9, "Bold", "#F59E0B"));
appendWrappedText(
  f3VoiceBanner,
  '🔊 "নতুন ট্রিপ রিকোয়েস্ট: ভৈরব বাজার রেলওয়ে জংশন থেকে মেঘনা ব্রিজ, প্রস্তাবিত ভাড়া ৮০ টাকা"',
  304,
  12,
  "Bold",
  "#F8FAFC"
);
appendWrappedText(
  f3VoiceBanner,
  "Pickup: ভৈরব বাজার রেলওয়ে জংশন → Dropoff: মেঘনা ব্রিজ (Proposed: ৳80)",
  304,
  10,
  "Regular",
  "#94A3B8"
);
f3Modal.appendChild(f3VoiceBanner);
f3VoiceBanner.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3VoiceBanner.id);

// Emerald Accept Button: ✓ ৮০ টাকায় গ্রহণ করুন (Accept 80 BDT)
const f3AcceptBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "Button / Accept 80 BDT",
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 10,
});
f3AcceptBtn.primaryAxisAlignItems = "CENTER";
f3AcceptBtn.counterAxisAlignItems = "CENTER";
f3AcceptBtn.fills = solidFill("#006A4E");
f3AcceptBtn.strokes = solidFill("#10B981");
f3AcceptBtn.strokeWeight = 1.5;
f3AcceptBtn.appendChild(createText("✓ ৮০ টাকায় গ্রহণ করুন (Accept 80 BDT)", 13, "Bold", "#FFFFFF"));
f3Modal.appendChild(f3AcceptBtn);
f3AcceptBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3AcceptBtn.id);

// Counter-Bid Quick Pills Row: +১০ (৳90), +২০ (৳100), +৩০ (৳110)
f3Modal.appendChild(createText("পাল্টা ভাড়া প্রস্তাব করুন • Send Counter-Bid:", 11, "Bold", "#FDE68A"));

const f3CounterRow = figma.createAutoLayout("HORIZONTAL", {
  name: "Counter-Bid Quick Pills Row",
  itemSpacing: 8,
});
f3CounterRow.fills = [];
f3Modal.appendChild(f3CounterRow);
f3CounterRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3CounterRow.id);

const quickBids = ["+১০ (৳90)", "+২০ (৳100)", "+৩০ (৳110)"];
for (const qb of quickBids) {
  const pill = figma.createAutoLayout("HORIZONTAL", {
    name: `Counter Pill / ${qb}`,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 10,
    paddingBottom: 10,
    cornerRadius: 10,
  });
  pill.primaryAxisAlignItems = "CENTER";
  pill.counterAxisAlignItems = "CENTER";
  pill.fills = solidFill("#F59E0B", 0.22);
  pill.strokes = solidFill("#F59E0B", 0.9);
  pill.strokeWeight = 1.5;
  pill.appendChild(createText(qb, 12, "Bold", "#FDE68A"));
  f3CounterRow.appendChild(pill);
  pill.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(pill.id);
}

frame3.appendChild(f3Modal);
f3Modal.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3Modal.id);

// 3D. Driver Bottom Status Note
const f3Footer = figma.createAutoLayout("HORIZONTAL", {
  name: "Driver Footer Note",
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 8,
  paddingBottom: 8,
  cornerRadius: 10,
});
f3Footer.primaryAxisAlignItems = "CENTER";
f3Footer.counterAxisAlignItems = "CENTER";
f3Footer.fills = solidFill("#080E17");
f3Footer.strokes = solidFill("#1E293B");
f3Footer.strokeWeight = 1;
f3Footer.appendChild(createText("🔊 হাত না লাগিয়ে বাংলা ভয়েস অ্যালার্ট ও ১-ট্যাপ বিডিং সচল", 10, "Medium", "#94A3B8"));
frame3.appendChild(f3Footer);
f3Footer.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f3Footer.id);

// ============================================================================
// FRAME 4 (390x844): "Driver App — 2. bKash Prepaid Wallet & Tiered KYC"
// ============================================================================
const frame4 = createMobileFrame(
  "Driver App — 2. bKash Prepaid Wallet & Tiered KYC",
  baseX + (390 + frameGap) * 3,
  baseY
);

// 4.0 Header (চলো ভৈরব • চালক ওয়ালেট ও KYC)
const f4Header = figma.createAutoLayout("HORIZONTAL", {
  name: "Header / Driver Wallet & KYC",
  itemSpacing: 8,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 12,
});
f4Header.fills = solidFill("#111C2D");
f4Header.strokes = solidFill("#1E293B");
f4Header.strokeWeight = 1;
f4Header.primaryAxisAlignItems = "SPACE_BETWEEN";
f4Header.counterAxisAlignItems = "CENTER";

const f4HeaderCol = figma.createAutoLayout("VERTICAL", { name: "Header Title", itemSpacing: 2 });
f4HeaderCol.fills = [];
f4HeaderCol.appendChild(createText("চলো ভৈরব • ওয়ালেট ও KYC", 14, "Bold", "#F8FAFC"));
f4HeaderCol.appendChild(createText("bKash / Nagad Prepaid • Municipal KYC", 10, "Medium", "#F472B6"));
f4Header.appendChild(f4HeaderCol);
createdNodeIds.push(f4HeaderCol.id);

f4Header.appendChild(createBadge("ACTIVE ≥ ৳50", "#10B981", "#6EE7B7", 0.22, 10));
frame4.appendChild(f4Header);
f4Header.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4Header.id);

// 4A. Prepaid Wallet Card
const f4WalletCard = figma.createAutoLayout("VERTICAL", {
  name: "Prepaid Wallet Card",
  itemSpacing: 6,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
f4WalletCard.fills = solidFill("#111C2D");
f4WalletCard.strokes = solidFill("#10B981", 0.8);
f4WalletCard.strokeWeight = 1.5;

const f4WalletTop = figma.createAutoLayout("HORIZONTAL", { name: "Wallet Header", itemSpacing: 8 });
f4WalletTop.fills = [];
f4WalletTop.primaryAxisAlignItems = "SPACE_BETWEEN";
f4WalletTop.counterAxisAlignItems = "CENTER";
f4WalletTop.appendChild(createText("DRIVER PREPAID WALLET", 10, "Bold", "#10B981"));
f4WalletTop.appendChild(createBadge("8% স্বয়ংক্রিয় কমিশন", "#006A4E", "#6EE7B7", 0.35, 10));
f4WalletCard.appendChild(f4WalletTop);
f4WalletTop.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4WalletTop.id);

f4WalletCard.appendChild(createText("বর্তমান ব্যালেন্স: ৳ 193.00", 20, "Bold", "#F8FAFC"));
f4WalletCard.appendChild(createText("নূন্যতম ৫০ টাকা ব্যালেন্স বজায় রাখুন (Min 50 BDT Threshold)", 11, "Semi Bold", "#FDE68A"));
frame4.appendChild(f4WalletCard);
f4WalletCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4WalletCard.id);

// 4B. bKash (#E2136E) & Nagad (#F7941D) Instant Recharge Section
const f4RechargeCard = figma.createAutoLayout("VERTICAL", {
  name: "bKash & Nagad Instant Recharge Section",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
f4RechargeCard.fills = solidFill("#111C2D");
f4RechargeCard.strokes = solidFill("#E2136E", 0.8);
f4RechargeCard.strokeWeight = 1.5;
f4RechargeCard.appendChild(createText("INSTANT RECHARGE • বিকাশ ও নগদ ওয়ালেট টপ-আপ", 10, "Bold", "#F472B6"));

// Provider Pills (bKash #E2136E & Nagad #F7941D)
const f4ProvidersRow = figma.createAutoLayout("HORIZONTAL", { name: "Payment Providers", itemSpacing: 8 });
f4ProvidersRow.fills = [];
f4RechargeCard.appendChild(f4ProvidersRow);
f4ProvidersRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4ProvidersRow.id);

const bkashPill = figma.createAutoLayout("HORIZONTAL", {
  name: "Provider / bKash",
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 7,
  paddingBottom: 7,
  cornerRadius: 8,
});
bkashPill.primaryAxisAlignItems = "CENTER";
bkashPill.counterAxisAlignItems = "CENTER";
bkashPill.fills = solidFill("#E2136E", 0.28);
bkashPill.strokes = solidFill("#E2136E");
bkashPill.strokeWeight = 1.5;
bkashPill.appendChild(createText("● bKash (#E2136E)", 11, "Bold", "#FFFFFF"));
f4ProvidersRow.appendChild(bkashPill);
bkashPill.layoutSizingHorizontal = "FILL";
createdNodeIds.push(bkashPill.id);

const nagadPill = figma.createAutoLayout("HORIZONTAL", {
  name: "Provider / Nagad",
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 7,
  paddingBottom: 7,
  cornerRadius: 8,
});
nagadPill.primaryAxisAlignItems = "CENTER";
nagadPill.counterAxisAlignItems = "CENTER";
nagadPill.fills = solidFill("#F7941D", 0.22);
nagadPill.strokes = solidFill("#F7941D");
nagadPill.strokeWeight = 1.5;
nagadPill.appendChild(createText("○ Nagad নগদ (#F7941D)", 11, "Bold", "#FDE68A"));
f4ProvidersRow.appendChild(nagadPill);
nagadPill.layoutSizingHorizontal = "FILL";
createdNodeIds.push(nagadPill.id);

// Amount Quick Pills (+৳100, +৳200, +৳500)
const f4AmountsRow = figma.createAutoLayout("HORIZONTAL", { name: "Top-Up Amounts", itemSpacing: 8 });
f4AmountsRow.fills = [];
f4RechargeCard.appendChild(f4AmountsRow);
f4AmountsRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4AmountsRow.id);

for (const amt of ["+৳100", "+৳200", "+৳500"]) {
  const amtBtn = figma.createAutoLayout("HORIZONTAL", {
    name: `Amount / ${amt}`,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    cornerRadius: 8,
  });
  amtBtn.primaryAxisAlignItems = "CENTER";
  amtBtn.counterAxisAlignItems = "CENTER";
  const isDefault = amt === "+৳200";
  amtBtn.fills = solidFill(isDefault ? "#E2136E" : "#0B131E", isDefault ? 0.35 : 1);
  amtBtn.strokes = solidFill(isDefault ? "#E2136E" : "#1E293B");
  amtBtn.strokeWeight = 1;
  amtBtn.appendChild(createText(amt, 12, "Bold", "#F8FAFC"));
  f4AmountsRow.appendChild(amtBtn);
  amtBtn.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(amtBtn.id);
}

// bKash Recharge CTA (৳ বিকাশ রিচার্জ করুন)
const f4BkashCta = figma.createAutoLayout("HORIZONTAL", {
  name: "CTA / bKash Recharge",
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 11,
  paddingBottom: 11,
  cornerRadius: 10,
});
f4BkashCta.primaryAxisAlignItems = "CENTER";
f4BkashCta.counterAxisAlignItems = "CENTER";
f4BkashCta.fills = solidFill("#E2136E");
f4BkashCta.strokes = solidFill("#F472B6");
f4BkashCta.strokeWeight = 1;
f4BkashCta.appendChild(createText("৳ বিকাশ রিচার্জ করুন", 13, "Bold", "#FFFFFF"));
f4RechargeCard.appendChild(f4BkashCta);
f4BkashCta.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4BkashCta.id);

frame4.appendChild(f4RechargeCard);
f4RechargeCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4RechargeCard.id);

// 4C. Tiered KYC Status Card
const f4KycCard = figma.createAutoLayout("VERTICAL", {
  name: "Tiered KYC Status Card",
  itemSpacing: 6,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
f4KycCard.fills = solidFill("#111C2D");
f4KycCard.strokes = solidFill("#006A4E", 0.85);
f4KycCard.strokeWeight = 1.5;
f4KycCard.appendChild(createBadge("TIERED MUNICIPAL KYC VERIFIED", "#006A4E", "#6EE7B7", 0.3, 10));
appendWrappedText(
  f4KycCard,
  "✓ অনুমোদিত চালক • ভৈরব পৌরসভা ওয়ার্ড কাউন্সিলর প্রত্যয়নপত্র ও NID যাচাইকৃত",
  330,
  12,
  "Bold",
  "#F8FAFC"
);
appendWrappedText(
  f4KycCard,
  "Easy-Bike / CNG Tier • Ward 04 Councilor Certificate + Smart NID Verified",
  330,
  10,
  "Regular",
  "#94A3B8"
);
frame4.appendChild(f4KycCard);
f4KycCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4KycCard.id);

// 4D. Recent Ledger Rows (-৳7.00 ট্রিপ কমিশন (৮%), +৳200.00 বিকাশ রিচার্জ)
const f4LedgerCard = figma.createAutoLayout("VERTICAL", {
  name: "Recent Wallet Ledger Card",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 14,
});
f4LedgerCard.fills = solidFill("#111C2D");
f4LedgerCard.strokes = solidFill("#1E293B");
f4LedgerCard.strokeWeight = 1;
f4LedgerCard.appendChild(createText("RECENT LEDGER • সাম্প্রতিক ওয়ালেট লেনদেন", 10, "Bold", "#94A3B8"));

const ledgerItems = [
  {
    title: "-৳7.00 ট্রিপ কমিশন (৮%)",
    sub: "Trip #CB-904 (Fare ৳90) • Auto-Deducted",
    color: "#F59E0B",
  },
  {
    title: "+৳200.00 বিকাশ রিচার্জ",
    sub: "bKash Webhook TrxID: BKH98241M • Instant Credit",
    color: "#10B981",
  },
];

for (const item of ledgerItems) {
  const row = figma.createAutoLayout("VERTICAL", {
    name: `Ledger Row / ${item.title}`,
    itemSpacing: 2,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    cornerRadius: 8,
  });
  row.fills = solidFill("#0B131E");
  row.strokes = solidFill("#1E293B");
  row.strokeWeight = 1;
  row.appendChild(createText(item.title, 12, "Bold", item.color));
  row.appendChild(createText(item.sub, 10, "Regular", "#94A3B8"));
  f4LedgerCard.appendChild(row);
  row.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(row.id);
}

frame4.appendChild(f4LedgerCard);
f4LedgerCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(f4LedgerCard.id);

const mobileFrames = [frame1, frame2, frame3, frame4].map((f) => ({
  id: f.id,
  name: f.name,
  x: f.x,
  y: f.y,
  width: f.width,
  height: f.height,
}));

return {
  success: true,
  mobileFrames,
  createdCount: createdNodeIds.length,
  createdNodeIds,
};
