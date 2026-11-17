// CholoBhairab — Admin & Dispatch Command Center
// Figma Plugin API Script for `use_figma` (follows figma-use & figma-generate-design rules)

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

function createText(content, size = 14, style = "Regular", colorHex = "#F8FAFC") {
  const t = figma.createText();
  t.fontName = { family: "Inter", style };
  t.fontSize = size;
  t.characters = String(content);
  t.fills = solidFill(colorHex);
  createdNodeIds.push(t.id);
  return t;
}

function createBadge(label, bgHex, textHex = "#FFFFFF", bgOpacity = 0.18) {
  const badge = figma.createAutoLayout("HORIZONTAL", {
    name: `Badge / ${label}`,
    itemSpacing: 6,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    cornerRadius: 999,
  });
  badge.primaryAxisAlignItems = "CENTER";
  badge.counterAxisAlignItems = "CENTER";
  badge.fills = solidFill(bgHex, bgOpacity);
  badge.strokes = solidFill(bgHex, 0.45);
  badge.strokeWeight = 1;
  const txt = createText(label, 11, "Semi Bold", textHex);
  badge.appendChild(txt);
  createdNodeIds.push(badge.id);
  return badge;
}

// Find clear canvas position away from (0,0)
let startX = 100;
for (const child of figma.currentPage.children) {
  startX = Math.max(startX, child.x + child.width + 120);
}

// ============================================================================
// 1. BRAND COLOR TOKENS FRAME
// ============================================================================
const tokensFrame = figma.createAutoLayout("VERTICAL", {
  name: "CholoBhairab — Brand Color Tokens",
  itemSpacing: 20,
  paddingLeft: 32,
  paddingRight: 32,
  paddingTop: 32,
  paddingBottom: 32,
  cornerRadius: 16,
});
tokensFrame.x = startX;
tokensFrame.y = 0;
tokensFrame.fills = solidFill("#0B131E");
tokensFrame.strokes = solidFill("#1E293B");
tokensFrame.strokeWeight = 1;
createdNodeIds.push(tokensFrame.id);

const tokenHeader = figma.createAutoLayout("VERTICAL", { name: "Header", itemSpacing: 6 });
tokenHeader.fills = [];
tokenHeader.appendChild(createText("CHOLOBHAIRAB DESIGN SYSTEM", 11, "Bold", "#10B981"));
tokenHeader.appendChild(createText("Brand Color Tokens & Dark Command Palette", 22, "Bold", "#F8FAFC"));
tokenHeader.appendChild(createText("High-contrast dark command center tokens for Bhairab Multi-Modal Ride-Sharing Platform", 13, "Regular", "#94A3B8"));
tokensFrame.appendChild(tokenHeader);
createdNodeIds.push(tokenHeader.id);

const swatchesRow = figma.createAutoLayout("HORIZONTAL", { name: "Token Swatches", itemSpacing: 16 });
swatchesRow.fills = [];
tokensFrame.appendChild(swatchesRow);
createdNodeIds.push(swatchesRow.id);

const tokenSpecs = [
  { name: "Bangladesh Emerald", hex: "#006A4E", role: "Primary Brand / Active Radar" },
  { name: "Deep Command Slate", hex: "#0B131E", role: "Primary Canvas Background" },
  { name: "Elevated Card", hex: "#111C2D", role: "Surface / KPI & Feed Cards" },
  { name: "bKash Magenta", hex: "#E2136E", role: "Prepaid Wallet / Top-Up CTA" },
  { name: "Bid Amber", hex: "#F59E0B", role: "InDrive Fare Negotiation" },
  { name: "SOS Crimson", hex: "#F42A41", role: "999 Emergency / Lockout Alert" },
];

for (const tok of tokenSpecs) {
  const card = figma.createAutoLayout("VERTICAL", {
    name: `Token / ${tok.name}`,
    itemSpacing: 10,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 14,
    paddingBottom: 14,
    cornerRadius: 12,
  });
  card.resize(205, 160);
  card.primaryAxisSizingMode = "AUTO";
  card.counterAxisSizingMode = "FIXED";
  card.fills = solidFill("#111C2D");
  card.strokes = solidFill("#1E293B");
  card.strokeWeight = 1;

  const colorBox = figma.createFrame();
  colorBox.name = `Swatch ${tok.hex}`;
  colorBox.resize(177, 68);
  colorBox.cornerRadius = 8;
  colorBox.fills = solidFill(tok.hex);
  colorBox.strokes = solidFill("#FFFFFF", 0.12);
  colorBox.strokeWeight = 1;
  card.appendChild(colorBox);
  createdNodeIds.push(colorBox.id);

  card.appendChild(createText(tok.name, 14, "Bold", "#F8FAFC"));
  card.appendChild(createText(tok.hex, 12, "Semi Bold", "#10B981"));
  card.appendChild(createText(tok.role, 11, "Regular", "#94A3B8"));

  swatchesRow.appendChild(card);
  createdNodeIds.push(card.id);
}

// ============================================================================
// 2. MAIN 1440x900 DESKTOP DASHBOARD FRAME
// ============================================================================
const dashboard = figma.createAutoLayout("HORIZONTAL", {
  name: "CholoBhairab Live Dispatch & InDrive Bidding Center",
  itemSpacing: 0,
});
dashboard.resize(1440, 900);
dashboard.primaryAxisSizingMode = "FIXED";
dashboard.counterAxisSizingMode = "FIXED";
dashboard.x = startX;
dashboard.y = 320;
dashboard.fills = solidFill("#0B131E");
dashboard.clipsContent = true;
createdNodeIds.push(dashboard.id);

// --- 2A. LEFT SIDEBAR NAVIGATION (260x900) ---
const sidebar = figma.createAutoLayout("VERTICAL", {
  name: "Left Sidebar Navigation",
  itemSpacing: 20,
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 24,
  paddingBottom: 24,
});
sidebar.resize(260, 900);
sidebar.primaryAxisSizingMode = "FIXED";
sidebar.counterAxisSizingMode = "FIXED";
sidebar.fills = solidFill("#080E17");
sidebar.strokes = solidFill("#1E293B");
sidebar.strokeWeight = 1;
dashboard.appendChild(sidebar);
createdNodeIds.push(sidebar.id);

// Brand Logo Header
const brandBox = figma.createAutoLayout("HORIZONTAL", {
  name: "Brand Identity",
  itemSpacing: 12,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 12,
});
brandBox.fills = solidFill("#006A4E", 0.22);
brandBox.strokes = solidFill("#006A4E", 0.6);
brandBox.strokeWeight = 1;
brandBox.counterAxisAlignItems = "CENTER";

const logoMark = figma.createAutoLayout("HORIZONTAL", {
  name: "Logo Mark",
  cornerRadius: 8,
  paddingLeft: 10,
  paddingRight: 10,
  paddingTop: 8,
  paddingBottom: 8,
});
logoMark.fills = solidFill("#006A4E");
logoMark.appendChild(createText("CB", 15, "Bold", "#FFFFFF"));
brandBox.appendChild(logoMark);
createdNodeIds.push(logoMark.id);

const brandTextCol = figma.createAutoLayout("VERTICAL", { name: "Brand Text", itemSpacing: 2 });
brandTextCol.fills = [];
brandTextCol.appendChild(createText("CholoBhairab", 16, "Bold", "#F8FAFC"));
brandTextCol.appendChild(createText("Bhairab Dispatch Ops", 11, "Medium", "#10B981"));
brandBox.appendChild(brandTextCol);
createdNodeIds.push(brandTextCol.id);

sidebar.appendChild(brandBox);
brandBox.layoutSizingHorizontal = "FILL";
createdNodeIds.push(brandBox.id);

// Navigation Menu Items
const navList = figma.createAutoLayout("VERTICAL", { name: "Nav Items", itemSpacing: 8 });
navList.fills = [];
sidebar.appendChild(navList);
navList.layoutSizingHorizontal = "FILL";
createdNodeIds.push(navList.id);

const navItems = [
  { label: "Live Dispatch Radar", sub: "6 Online • 1 Active Bid", active: true, accent: "#006A4E" },
  { label: "Driver KYC Verification", sub: "Ward Councilor & BRTA", active: false, accent: "#F59E0B" },
  { label: "bKash Wallet & 8% Ledger", sub: "Min 50 BDT Threshold", active: false, accent: "#E2136E" },
  { label: "Bhairab Landmarks", sub: "6 Pre-Indexed Hubs", active: false, accent: "#3B82F6" },
  { label: "999 SOS Center", sub: "Emergency Telemetry", active: false, accent: "#F42A41" },
];

for (const item of navItems) {
  const navBtn = figma.createAutoLayout("VERTICAL", {
    name: `Nav / ${item.label}`,
    itemSpacing: 4,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 12,
    cornerRadius: 10,
  });
  if (item.active) {
    navBtn.fills = solidFill("#006A4E", 0.28);
    navBtn.strokes = solidFill("#10B981", 0.65);
    navBtn.strokeWeight = 1;
  } else {
    navBtn.fills = solidFill("#111C2D", 0.6);
  }
  navBtn.appendChild(createText(item.label, 13, item.active ? "Bold" : "Semi Bold", item.active ? "#FFFFFF" : "#CBD5E1"));
  navBtn.appendChild(createText(item.sub, 11, "Regular", item.active ? "#6EE7B7" : "#64748B"));
  navList.appendChild(navBtn);
  navBtn.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(navBtn.id);
}

// 1-Click Simulate Live Ride Trigger Card in Sidebar Footer
const simCard = figma.createAutoLayout("VERTICAL", {
  name: "Simulate Live Ride Trigger Card",
  itemSpacing: 10,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 14,
  paddingBottom: 14,
  cornerRadius: 12,
});
simCard.fills = solidFill("#111C2D");
simCard.strokes = solidFill("#F59E0B", 0.45);
simCard.strokeWeight = 1;
simCard.appendChild(createText("DEMO SIMULATION ENGINE", 10, "Bold", "#F59E0B"));
simCard.appendChild(createText("Inject real-time Bhairab ride request + AI driver counter-bids", 11, "Regular", "#94A3B8"));

const simBtn = figma.createAutoLayout("HORIZONTAL", {
  name: "Button / Simulate Live Ride",
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 10,
  paddingBottom: 10,
  cornerRadius: 8,
});
simBtn.primaryAxisAlignItems = "CENTER";
simBtn.counterAxisAlignItems = "CENTER";
simBtn.fills = solidFill("#006A4E");
simBtn.strokes = solidFill("#10B981");
simBtn.strokeWeight = 1;
simBtn.appendChild(createText("⚡ Simulate Live Ride", 12, "Bold", "#FFFFFF"));
simCard.appendChild(simBtn);
simBtn.layoutSizingHorizontal = "FILL";
createdNodeIds.push(simBtn.id);

sidebar.appendChild(simCard);
simCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(simCard.id);

// --- 2B. MAIN WORKSPACE COLUMN (1180x900) ---
const mainCol = figma.createAutoLayout("VERTICAL", {
  name: "Main Command Workspace",
  itemSpacing: 16,
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 20,
  paddingBottom: 20,
});
mainCol.resize(1180, 900);
mainCol.primaryAxisSizingMode = "FIXED";
mainCol.counterAxisSizingMode = "FIXED";
mainCol.fills = solidFill("#0B131E");
dashboard.appendChild(mainCol);
createdNodeIds.push(mainCol.id);

// Top Header Bar
const topBar = figma.createAutoLayout("HORIZONTAL", {
  name: "Top Command Header",
  itemSpacing: 16,
  paddingLeft: 18,
  paddingRight: 18,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 12,
});
topBar.fills = solidFill("#111C2D");
topBar.strokes = solidFill("#1E293B");
topBar.strokeWeight = 1;
topBar.primaryAxisAlignItems = "SPACE_BETWEEN";
topBar.counterAxisAlignItems = "CENTER";

const topTitleCol = figma.createAutoLayout("VERTICAL", { name: "Header Title", itemSpacing: 2 });
topTitleCol.fills = [];
topTitleCol.appendChild(createText("CholoBhairab Live Dispatch & InDrive Bidding Center", 18, "Bold", "#F8FAFC"));
topTitleCol.appendChild(createText("Bhairab Upazila Corridor (24.0487° N, 90.9852° E) • Socket.IO Real-Time Telemetry Connected", 12, "Regular", "#94A3B8"));
topBar.appendChild(topTitleCol);
createdNodeIds.push(topTitleCol.id);

const headerBadges = figma.createAutoLayout("HORIZONTAL", { name: "Header Actions", itemSpacing: 10 });
headerBadges.fills = [];
headerBadges.counterAxisAlignItems = "CENTER";
headerBadges.appendChild(createBadge("SOCKET: ONLINE", "#10B981", "#6EE7B7", 0.16));
headerBadges.appendChild(createBadge("bKash Webhook: ACTIVE", "#E2136E", "#F472B6", 0.18));
headerBadges.appendChild(createBadge("999 SOS: 0 ACTIVE", "#F42A41", "#FCA5A5", 0.16));
topBar.appendChild(headerBadges);
createdNodeIds.push(headerBadges.id);

mainCol.appendChild(topBar);
topBar.layoutSizingHorizontal = "FILL";
createdNodeIds.push(topBar.id);

// --- TOP KPI ROW (4 Metric Cards) ---
const kpiRow = figma.createAutoLayout("HORIZONTAL", {
  name: "Top KPI Row",
  itemSpacing: 16,
});
kpiRow.fills = [];
mainCol.appendChild(kpiRow);
kpiRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(kpiRow.id);

const kpis = [
  {
    title: "ONLINE FLEET",
    value: "6 Vehicles",
    sub: "2 Easy-Bike • 2 CNG • 1 Bike • 1 Micro",
    accent: "#10B981",
    badge: "100% GPS LOCK",
  },
  {
    title: "ACTIVE BIDDING TRIPS",
    value: "2 Live Rides",
    sub: "Avg Counter-Bid Response: 4.2s",
    accent: "#F59E0B",
    badge: "INDRIVE MODE",
  },
  {
    title: "TODAY'S 8% COMMISSION",
    value: "1,420 BDT",
    sub: "Gross GMV: 17,750 BDT • bKash Prepaid",
    accent: "#E2136E",
    badge: "+18.4% TODAY",
  },
  {
    title: "PENDING KYC & LOCKOUTS",
    value: "1 Low Wallet / 2 KYC",
    sub: "Anwar Mia (35 BDT < 50 BDT Min)",
    accent: "#F42A41",
    badge: "ACTION REQ",
  },
];

for (const k of kpis) {
  const card = figma.createAutoLayout("VERTICAL", {
    name: `KPI / ${k.title}`,
    itemSpacing: 8,
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 14,
    paddingBottom: 14,
    cornerRadius: 12,
  });
  card.fills = solidFill("#111C2D");
  card.strokes = solidFill("#1E293B");
  card.strokeWeight = 1;

  const topLine = figma.createAutoLayout("HORIZONTAL", { name: "KPI Header", itemSpacing: 8 });
  topLine.fills = [];
  topLine.primaryAxisAlignItems = "SPACE_BETWEEN";
  topLine.counterAxisAlignItems = "CENTER";
  topLine.appendChild(createText(k.title, 11, "Bold", "#94A3B8"));
  topLine.appendChild(createBadge(k.badge, k.accent, "#FFFFFF", 0.22));
  card.appendChild(topLine);
  topLine.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(topLine.id);

  card.appendChild(createText(k.value, 24, "Bold", "#F8FAFC"));
  card.appendChild(createText(k.sub, 11, "Regular", "#64748B"));

  kpiRow.appendChild(card);
  card.layoutSizingHorizontal = "FILL";
  createdNodeIds.push(card.id);
}

// --- MAIN CONTENT SPLIT: CENTER MAP AREA + RIGHT INDRIVE BIDDING FEED ---
const splitRow = figma.createAutoLayout("HORIZONTAL", {
  name: "Center Map & Right Bidding Split",
  itemSpacing: 16,
});
splitRow.resize(1140, 668);
splitRow.primaryAxisSizingMode = "FIXED";
splitRow.counterAxisSizingMode = "FIXED";
splitRow.fills = [];
mainCol.appendChild(splitRow);
splitRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(splitRow.id);

// --- CENTER INTERACTIVE MAP AREA (764x668) ---
const mapPanel = figma.createAutoLayout("VERTICAL", {
  name: "Center Interactive Map Area (Bhairab Corridor)",
  itemSpacing: 12,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 16,
  paddingBottom: 16,
  cornerRadius: 14,
});
mapPanel.resize(764, 668);
mapPanel.primaryAxisSizingMode = "FIXED";
mapPanel.counterAxisSizingMode = "FIXED";
mapPanel.fills = solidFill("#111C2D");
mapPanel.strokes = solidFill("#1E293B");
mapPanel.strokeWeight = 1;
splitRow.appendChild(mapPanel);
createdNodeIds.push(mapPanel.id);

// Map Top Bar + Vehicle Type Badges
const mapTopBar = figma.createAutoLayout("HORIZONTAL", {
  name: "Map Filter Bar",
  itemSpacing: 12,
});
mapTopBar.fills = [];
mapTopBar.primaryAxisAlignItems = "SPACE_BETWEEN";
mapTopBar.counterAxisAlignItems = "CENTER";

const mapTitleBox = figma.createAutoLayout("VERTICAL", { name: "Map Title", itemSpacing: 2 });
mapTitleBox.fills = [];
mapTitleBox.appendChild(createText("Bhairab Multi-Modal Live Radar Map", 15, "Bold", "#F8FAFC"));
mapTitleBox.appendChild(createText("6 Pre-Indexed Landmarks • Haversine Corridor Routing", 11, "Regular", "#94A3B8"));
mapTopBar.appendChild(mapTitleBox);
createdNodeIds.push(mapTitleBox.id);

const vehicleBadges = figma.createAutoLayout("HORIZONTAL", { name: "Vehicle Filter Badges", itemSpacing: 8 });
vehicleBadges.fills = [];
vehicleBadges.appendChild(createBadge("Easy-Bike (2)", "#10B981", "#6EE7B7", 0.2));
vehicleBadges.appendChild(createBadge("CNG (2)", "#F59E0B", "#FDE68A", 0.2));
vehicleBadges.appendChild(createBadge("Bike (1)", "#3B82F6", "#93C5FD", 0.2));
vehicleBadges.appendChild(createBadge("Microbus (1)", "#8B5CF6", "#DDD6FE", 0.2));
mapTopBar.appendChild(vehicleBadges);
createdNodeIds.push(vehicleBadges.id);

mapPanel.appendChild(mapTopBar);
mapTopBar.layoutSizingHorizontal = "FILL";
createdNodeIds.push(mapTopBar.id);

// Map Canvas Container (Absolute-positioned Landmarks & Fleet Nodes inside dark radar frame)
const mapCanvas = figma.createFrame();
mapCanvas.name = "Bhairab Radar Map Canvas";
mapCanvas.resize(732, 580);
mapCanvas.cornerRadius = 12;
mapCanvas.fills = solidFill("#071019");
mapCanvas.strokes = solidFill("#006A4E", 0.45);
mapCanvas.strokeWeight = 1;
mapCanvas.clipsContent = true;
mapPanel.appendChild(mapCanvas);
createdNodeIds.push(mapCanvas.id);

// Meghna River Stylized Water Corridor Band
const riverBand = figma.createFrame();
riverBand.name = "Meghna River Waterway";
riverBand.resize(220, 580);
riverBand.x = 530;
riverBand.y = 0;
riverBand.fills = solidFill("#0C243C", 0.75);
mapCanvas.appendChild(riverBand);
createdNodeIds.push(riverBand.id);

const riverLabel = createText("MEGHNA RIVER CORRIDOR", 11, "Bold", "#38BDF8");
riverLabel.x = 555;
riverLabel.y = 24;
mapCanvas.appendChild(riverLabel);

// Route Line connecting Bhairab Railway Junction -> Syed Nazrul Islam Meghna Bridge
const routeLine = figma.createRectangle();
routeLine.name = "Active Bidding Route Vector";
routeLine.resize(340, 4);
routeLine.x = 210;
routeLine.y = 245;
routeLine.cornerRadius = 2;
routeLine.fills = solidFill("#F59E0B");
mapCanvas.appendChild(routeLine);
createdNodeIds.push(routeLine.id);

// 4 Core Landmarks + 2 Secondary Landmarks on Map Canvas
const mapLandmarks = [
  {
    name: "Bhairab Railway Junction",
    coords: "24.0487°N, 90.9852°E",
    driver: "Rafiqul Islam • Easy-Bike (193 BDT)",
    badgeColor: "#10B981",
    x: 50,
    y: 195,
    tag: "PICKUP HUB • 80 BDT OFFER",
  },
  {
    name: "Syed Nazrul Islam Meghna Bridge",
    coords: "24.0418°N, 91.0022°E",
    driver: "Kamal Hossain • CNG (340 BDT)",
    badgeColor: "#F59E0B",
    x: 420,
    y: 215,
    tag: "DROPOFF • COUNTER 90 BDT",
  },
  {
    name: "Kachari Bus Stand",
    coords: "24.0535°N, 90.9811°E",
    driver: "Zahid Hasan • Bike (125 BDT)",
    badgeColor: "#3B82F6",
    x: 110,
    y: 55,
    tag: "INTERCITY CORRIDOR",
  },
  {
    name: "Old River Ghat (Launch Terminal)",
    coords: "24.0425°N, 90.9840°E",
    driver: "Sohel Rana • Microbus (850 BDT)",
    badgeColor: "#8B5CF6",
    x: 150,
    y: 395,
    tag: "RIVER GHAT HUB",
  },
  {
    name: "Chandiber General Hospital",
    coords: "24.0620°N, 90.9785°E",
    driver: "Anwar Mia • Easy-Bike (35 BDT LOCKED)",
    badgeColor: "#F42A41",
    x: 415,
    y: 65,
    tag: "LOW WALLET < 50 BDT",
  },
];

for (const lm of mapLandmarks) {
  const pinCard = figma.createAutoLayout("VERTICAL", {
    name: `Landmark Pin / ${lm.name}`,
    itemSpacing: 4,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 10,
    cornerRadius: 10,
  });
  pinCard.x = lm.x;
  pinCard.y = lm.y;
  pinCard.fills = solidFill("#111C2D", 0.94);
  pinCard.strokes = solidFill(lm.badgeColor, 0.85);
  pinCard.strokeWeight = 1.5;

  pinCard.appendChild(createBadge(lm.tag, lm.badgeColor, "#FFFFFF", 0.25));
  pinCard.appendChild(createText(lm.name, 13, "Bold", "#F8FAFC"));
  pinCard.appendChild(createText(lm.coords, 10, "Regular", "#94A3B8"));
  pinCard.appendChild(createText(lm.driver, 11, "Semi Bold", lm.badgeColor));

  mapCanvas.appendChild(pinCard);
  createdNodeIds.push(pinCard.id);
}

// --- RIGHT LIVE INDRIVE FARE NEGOTIATION FEED (360x668) ---
const bidFeed = figma.createAutoLayout("VERTICAL", {
  name: "Right Live InDrive Fare Negotiation Feed",
  itemSpacing: 12,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 16,
  paddingBottom: 16,
  cornerRadius: 14,
});
bidFeed.resize(360, 668);
bidFeed.primaryAxisSizingMode = "FIXED";
bidFeed.counterAxisSizingMode = "FIXED";
bidFeed.fills = solidFill("#111C2D");
bidFeed.strokes = solidFill("#1E293B");
bidFeed.strokeWeight = 1;
splitRow.appendChild(bidFeed);
createdNodeIds.push(bidFeed.id);

// Feed Header
const feedHeader = figma.createAutoLayout("VERTICAL", { name: "Feed Header", itemSpacing: 4 });
feedHeader.fills = [];
feedHeader.appendChild(createBadge("LIVE INDRIVE VOICE + BID STREAM", "#F59E0B", "#FDE68A", 0.2));
feedHeader.appendChild(createText("InDrive Fare Negotiation", 16, "Bold", "#F8FAFC"));
feedHeader.appendChild(createText("Real-time passenger offers & driver counter-bids", 11, "Regular", "#94A3B8"));
bidFeed.appendChild(feedHeader);
feedHeader.layoutSizingHorizontal = "FILL";
createdNodeIds.push(feedHeader.id);

// Active Trip Passenger Initial Offer Card (80 BDT)
const offerCard = figma.createAutoLayout("VERTICAL", {
  name: "Passenger Initial Offer Card (80 BDT)",
  itemSpacing: 8,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 10,
});
offerCard.fills = solidFill("#0B131E");
offerCard.strokes = solidFill("#006A4E", 0.8);
offerCard.strokeWeight = 1;

offerCard.appendChild(createText("PASSENGER INITIAL OFFER • TRIP #CB-904", 10, "Bold", "#10B981"));
offerCard.appendChild(createText("Bhairab Railway Junction → Meghna Bridge", 13, "Bold", "#F8FAFC"));
offerCard.appendChild(createText("Voice Broadcast: \"New trip from Railway Junction to Meghna Bridge, offer 80 Taka\"", 11, "Regular", "#94A3B8"));

const offerPriceRow = figma.createAutoLayout("HORIZONTAL", { name: "Offer Price Row", itemSpacing: 8 });
offerPriceRow.fills = [];
offerPriceRow.primaryAxisAlignItems = "SPACE_BETWEEN";
offerPriceRow.counterAxisAlignItems = "CENTER";
offerPriceRow.appendChild(createText("Passenger Offer: 80 BDT", 15, "Bold", "#10B981"));
offerPriceRow.appendChild(createBadge("Easy-Bike / CNG", "#006A4E", "#FFFFFF", 0.3));
offerCard.appendChild(offerPriceRow);
offerPriceRow.layoutSizingHorizontal = "FILL";
createdNodeIds.push(offerPriceRow.id);

bidFeed.appendChild(offerCard);
offerCard.layoutSizingHorizontal = "FILL";
createdNodeIds.push(offerCard.id);

// Driver Counter-Bid 1 (90 BDT)
const counterBid1 = figma.createAutoLayout("VERTICAL", {
  name: "Driver Counter-Bid 1 (90 BDT)",
  itemSpacing: 6,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 10,
});
counterBid1.fills = solidFill("#0B131E");
counterBid1.strokes = solidFill("#F59E0B", 0.85);
counterBid1.strokeWeight = 1;
counterBid1.appendChild(createText("DRIVER COUNTER-BID • ★ 4.9 RATING", 10, "Bold", "#F59E0B"));
counterBid1.appendChild(createText("Md. Rafiqul Islam (Easy-Bike)", 13, "Bold", "#F8FAFC"));
counterBid1.appendChild(createText("Counter-Offer: 90 BDT • ETA 2 mins (350m away)", 12, "Semi Bold", "#FDE68A"));
counterBid1.appendChild(createText("8% Platform Commission: 7.20 BDT (Wallet: 193 BDT)", 10, "Regular", "#94A3B8"));
bidFeed.appendChild(counterBid1);
counterBid1.layoutSizingHorizontal = "FILL";
createdNodeIds.push(counterBid1.id);

// Driver Counter-Bid 2 (95 BDT)
const counterBid2 = figma.createAutoLayout("VERTICAL", {
  name: "Driver Counter-Bid 2 (95 BDT)",
  itemSpacing: 6,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 10,
});
counterBid2.fills = solidFill("#0B131E");
counterBid2.strokes = solidFill("#1E293B");
counterBid2.strokeWeight = 1;
counterBid2.appendChild(createText("DRIVER COUNTER-BID • ★ 4.8 RATING", 10, "Bold", "#94A3B8"));
counterBid2.appendChild(createText("Kamal Hossain (CNG Auto)", 13, "Bold", "#F8FAFC"));
counterBid2.appendChild(createText("Counter-Offer: 95 BDT • ETA 3 mins (600m away)", 12, "Semi Bold", "#F59E0B"));
counterBid2.appendChild(createText("8% Platform Commission: 7.60 BDT (Wallet: 340 BDT)", 10, "Regular", "#64748B"));
bidFeed.appendChild(counterBid2);
counterBid2.layoutSizingHorizontal = "FILL";
createdNodeIds.push(counterBid2.id);

// 1-Click Simulate Live Ride CTA in Feed Footer
const feedSimCta = figma.createAutoLayout("HORIZONTAL", {
  name: "CTA / 1-Click Simulate Live Ride",
  itemSpacing: 8,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 12,
  paddingBottom: 12,
  cornerRadius: 10,
});
feedSimCta.primaryAxisAlignItems = "CENTER";
feedSimCta.counterAxisAlignItems = "CENTER";
feedSimCta.fills = solidFill("#E2136E");
feedSimCta.strokes = solidFill("#F472B6");
feedSimCta.strokeWeight = 1;
feedSimCta.appendChild(createText("⚡ Simulate Live Ride (80 BDT → 90 BDT)", 12, "Bold", "#FFFFFF"));
bidFeed.appendChild(feedSimCta);
feedSimCta.layoutSizingHorizontal = "FILL";
createdNodeIds.push(feedSimCta.id);

return {
  success: true,
  tokensFrameId: tokensFrame.id,
  dashboardFrameId: dashboard.id,
  createdCount: createdNodeIds.length,
  createdNodeIds,
};
