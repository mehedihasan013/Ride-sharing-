#!/usr/bin/env node
/**
 * CholoBhairab - Initial INFRASTRUCTURE cost (no promotion / marketing / driver incentives)
 * Scope = master plan Phases 1-4 (12 weeks): backend, passenger app, driver app, admin/KYC web,
 * hosting, third-party services, test devices, and the legal registrations needed to go live.
 *
 * Every line has: low / likely / high (BDT) + source/basis.  Run: node finance/infra_cost.js
 */
const fs = require('fs');
const path = require('path');

const FX = 124.75;          // Bangladesh Bank interbank USD/BDT, mid-Nov 2026
const VAT = 0.15;           // VAT on foreign digital services (bank-applied) & govt fees where applicable
const usd = (d, vat = true) => Math.round(d * FX * (vat ? 1 + VAT : 1));
const CONTINGENCY = 0.15;

// ---------------------------------------------------------------- 1. development (12 weeks)
// Salary bands: bdtechjobs.com 2025 survey (local agency/startup tier = low, product/fintech tier = high)
const dev = [
  //  role,                                         months, low,    likely,  high
  ['Backend dev, mid-senior (NestJS, WebSocket, Redis GEO, PostGIS, bKash/Nagad)', 3, 90000, 110000, 140000],
  ['Flutter dev #1 (passenger app)',                3, 55000, 70000, 100000],
  ['Flutter dev #2 (driver app, background GPS, Bangla audio)', 3, 55000, 70000, 100000],
  ['Frontend dev (admin + KYC web, Next.js), weeks 3-10', 2, 40000, 50000, 70000],
  ['UI/UX designer (Bangla UI, both apps), weeks 1-8', 2, 40000, 50000, 70000],
  ['QA tester (manual + device testing), weeks 5-12', 2, 25000, 35000, 50000],
].map(([item, m, lo, li, hi]) => ({ item: `${item} - ${m} mo`, lo: lo * m, li: li * m, hi: hi * m,
  src: 'bdtechjobs.com salary bands 2025' }));

// ---------------------------------------------------------------- 2. hosting during build
// Local BDIX VPS (Dhaka DC): 2vCPU/4GB ~৳1,600-2,700/mo; 8GB ~2x  (datahostbd, serverbd, snbdhost, techsavvy)
const local = { staging: 2400, app8gb: 4800, db8gb: 4800, backup: 1500 };
const withVat = (x) => Math.round(x * (1 + VAT));
const prodMonthly = withVat(local.app8gb + local.db8gb + local.backup);
const hostingBuild = [
  { item: 'Staging server 2vCPU/4GB (BD data centre) - 3 mo', lo: withVat(1600) * 3, li: withVat(local.staging) * 3, hi: withVat(3100) * 3,
    src: 'BD BDIX VPS price lists (৳1,597-3,100/mo) + 15% VAT' },
  { item: 'Production stack live for pilot field test (weeks 9-12) - 1 mo', lo: withVat(3200 + 3200 + 1000), li: prodMonthly, hi: withVat(6200 + 6200 + 2000),
    src: 'App+Redis 8GB, PostgreSQL/PostGIS 8GB, backup/doc-storage VPS' },
];

// ---------------------------------------------------------------- 3. accounts, tools, services
const tools = [
  { item: 'Apple Developer Program ($99/yr)', lo: usd(99, false), li: usd(99), hi: usd(99) + 500, src: 'apple.com; bank adds 15% VAT on foreign digital services' },
  { item: 'Google Play Console ($25 one-time)', lo: usd(25, false), li: usd(25), hi: usd(25) + 200, src: 'play.google.com' },
  { item: 'Domain .com, 1 yr (SSL free via Cloudflare)', lo: 1300, li: 1500, hi: 2000, src: 'Cloudflare Registrar at-cost ~$10.5' },
  { item: 'Figma Professional, 1 editor x 2 mo', lo: 0, li: usd(20 * 2), hi: usd(20 * 2 * 2), src: 'figma.com pricing (free Starter plan possible)' },
  { item: 'Codemagic iOS builds (no Mac needed)', lo: 0, li: 0, hi: 0, src: 'Free tier: 500 macOS M2 min/mo' },
  { item: 'GitHub, Sentry, Firebase FCM, Cloudflare', lo: 0, li: 0, hi: 0, src: 'Free tiers sufficient for pilot' },
  { item: 'Barikoi API during build', lo: 0, li: 0, hi: 0, src: 'Free developer tier' },
  { item: 'Map tiles: self-hosted Bangladesh OSM extract (PMTiles) on backup VPS', lo: 0, li: 0, hi: 0, src: 'OpenStreetMap, no licence fee' },
  { item: 'bKash + Nagad direct merchant PGW onboarding', lo: 0, li: 0, hi: 20000, src: 'No setup fee direct; ৳10-25k only if via aggregator' },
  { item: 'SMS masking sender ID "CholoBhairab" approval', lo: 500, li: 500, hi: 2000, src: 'bulksmsbd.com / provider' },
  { item: 'First OTP SMS pack, 10,000 masking SMS', lo: 4000, li: 5000, hi: 5500, src: '৳0.40-0.55/SMS masking (mimsms, bulksmsbd)' },
];

// ---------------------------------------------------------------- 4. test devices
const devices = [
  { item: 'Low-end Android (Samsung Galaxy A06 4/64): what drivers actually use', lo: 13999, li: 13999, hi: 14399, src: 'mobiledokan / gsmarena.com.bd official price' },
  { item: 'Entry Android (Redmi A-series)', lo: 11000, li: 12500, hi: 17000, src: 'startech.com.bd' },
  { item: 'iPhone for iOS testing (use a team member\'s phone)', lo: 0, li: 0, hi: 30000, src: 'Used iPhone if no one has one' },
];

// ---------------------------------------------------------------- 5. legal (mandatory to go live)
const legal = [
  { item: 'RJSC Pvt Ltd incorporation, govt fees (authorised capital ৳10 lakh)', lo: 16003, li: 16003, hi: 16003, src: 'vatax.bd RJSC calculator: name 575 + filing 1,380 + stamps 12,000 + copies ~2,048' },
  { item: 'RJSC lawyer / consultant fee', lo: 8000, li: 12000, hi: 20000, src: 'Market rate' },
  { item: 'e-TIN + BIN (VAT) registration', lo: 0, li: 3000, hi: 5000, src: 'Free online at NBR; consultant optional' },
  { item: 'Trade licence, Bhairab Pourashava (paid-up ≤ ৳5 lakh)', lo: 2500, li: 5000, hi: 7000, src: 'Pourashava model tax schedule ৳3,000 + 15% VAT + form + signboard tax' },
  { item: 'BRTA ride-sharing company enlistment certificate', lo: 100000, li: 100000, hi: 115000, src: 'Ride-sharing Service Guidelines 2017 (rthd.gov.bd); high case = if 15% VAT applied' },
  { item: 'ICT Division clearance for the app (Guideline art. 3(10))', lo: 0, li: 0, hi: 10000, src: 'No published fee - confirm' },
];

// ---------------------------------------------------------------- monthly running (after launch)
const monthly = [
  { item: 'Production servers (App+Redis, PostgreSQL/PostGIS, backup) + staging, BD data centre', lo: withVat(7400 + 1600), li: prodMonthly + withVat(local.staging), hi: withVat(14400 + 3100) },
  { item: 'Barikoi API (after free tier, ~৳0.50/call; landmarks cached in own DB)', lo: 2000, li: 5000, hi: 15000 },
  { item: 'OTP SMS (new sign-ups; JWT 30-day sessions keep this low)', lo: 1000, li: 2000, hi: 4000 },
  { item: '24/7 helpline number: hosted IP-PBX (required by guideline)', lo: 800, li: 1500, hi: 3000 },
];

// ---------------------------------------------------------------- report
const sections = [
  ['1. Development team (12 weeks)', dev],
  ['2. Hosting during build', hostingBuild],
  ['3. Accounts, tools & third-party setup', tools],
  ['4. Test devices', devices],
  ['5. Legal registrations required to launch', legal],
];
const tot = (rows, k) => rows.reduce((s, r) => s + r[k], 0);
const f = (n) => '৳' + Math.round(n).toLocaleString('en-IN');

let md = `# CholoBhairab: Initial Infrastructure Cost (no promotion)\n\n_FX 1 USD = ৳${FX} (Bangladesh Bank, Nov 2026) · contingency ${CONTINGENCY * 100}% · generated by finance/infra_cost.js_\n\n`;
const T = { lo: 0, li: 0, hi: 0 };
for (const [title, rows] of sections) {
  md += `## ${title}\n\n| Item | Low | **Likely** | High | Basis |\n|---|---:|---:|---:|---|\n`;
  rows.forEach((r) => (md += `| ${r.item} | ${f(r.lo)} | **${f(r.li)}** | ${f(r.hi)} | ${r.src} |\n`));
  const s = { lo: tot(rows, 'lo'), li: tot(rows, 'li'), hi: tot(rows, 'hi') };
  md += `| **Subtotal** | ${f(s.lo)} | **${f(s.li)}** | ${f(s.hi)} | |\n\n`;
  for (const k in T) T[k] += s[k];
}
const M = { lo: tot(monthly, 'lo'), li: tot(monthly, 'li'), hi: tot(monthly, 'hi') };
md += `## 6. Monthly running cost after launch\n\n| Item | Low | **Likely** | High |\n|---|---:|---:|---:|\n`;
monthly.forEach((r) => (md += `| ${r.item} | ${f(r.lo)} | **${f(r.li)}** | ${f(r.hi)} |\n`));
md += `| **Per month** | ${f(M.lo)} | **${f(M.li)}** | ${f(M.hi)} |\n\n`;

const C = {}, G = {};
for (const k in T) { C[k] = T[k] * CONTINGENCY; G[k] = T[k] + C[k] + M[k] * 3; }
md += `## Summary\n\n| | Low | **Likely** | High |\n|---|---:|---:|---:|\n`;
md += `| Build to launch day (sections 1-5) | ${f(T.lo)} | **${f(T.li)}** | ${f(T.hi)} |\n`;
md += `| Contingency ${CONTINGENCY * 100}% | ${f(C.lo)} | **${f(C.li)}** | ${f(C.hi)} |\n`;
md += `| First 3 months of running infra | ${f(M.lo * 3)} | **${f(M.li * 3)}** | ${f(M.hi * 3)} |\n`;
md += `| **TOTAL INITIAL INFRASTRUCTURE** | **${f(G.lo)}** | **${f(G.li)}** | **${f(G.hi)}** |\n`;
md += `| in USD | $${Math.round(G.lo / FX).toLocaleString()} | **$${Math.round(G.li / FX).toLocaleString()}** | $${Math.round(G.hi / FX).toLocaleString()} |\n`;
const slip = dev.filter((d) => /Backend|Flutter/.test(d.item)).reduce((s, d) => s + d.li / 3, 0) + 35000;
md += `\nEach extra month of development (backend + 2 Flutter + QA) costs ${f(slip)}.\n`;

fs.mkdirSync(path.join(__dirname, 'output'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'output', 'infra_cost.md'), md);
console.log(md);
