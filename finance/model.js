#!/usr/bin/env node
/**
 * CholoBhairab - Infrastructure & Funding Model
 * ---------------------------------------------
 * Monthly cash-flow simulation: build phase -> launch -> 24-month operations.
 * Answers: how much do we spend before launch, what is the deepest cash hole
 * (= money we must raise), and when do we break even?
 *
 * Usage:  node finance/model.js            (all scenarios, writes finance/output/)
 *         node finance/model.js base       (single scenario to console)
 */
const fs = require('fs');
const path = require('path');

const A = JSON.parse(fs.readFileSync(path.join(__dirname, 'assumptions.json'), 'utf8'));
const G = A.global;
const D = A.demandShared;
const OUT = path.join(__dirname, 'output');

const sum = (arr, f = (x) => x) => arr.reduce((s, x) => s + f(x), 0);
const usd = (v) => v * G.usdToBdt;
const logistic = (m, mid, k) => 1 / (1 + Math.exp(-k * (m - mid)));

const avgIntraFare = sum(D.intraMix, (v) => v.share * v.avgFare) / sum(D.intraMix, (v) => v.share);

function cloudUsdFor(sc, tripsPerDay) {
  return sc.cloud.tiers.find((t) => tripsPerDay <= t.upToTripsPerDay).usd;
}

/** Simulate one scenario. `over` lets sensitivity runs tweak demand/commission. */
function simulate(sc, over = {}) {
  const demandMult = over.demandMult ?? 1;
  const commissionPct = over.commissionPct ?? sc.revenue.commissionPct;
  const collectionRate = over.collectionRate ?? sc.revenue.collectionRate;
  const rampDelay = over.rampDelay ?? 0;

  const months = [];
  let cash = 0;
  let prevActiveUsers = 0;
  const total = sc.buildMonths + G.horizonMonths;

  for (let t = 1; t <= total; t++) {
    const isBuild = t <= sc.buildMonths;
    const mLaunch = t - sc.buildMonths; // 1 = launch month
    const row = { month: t, phase: isBuild ? 'BUILD' : mLaunch === 1 ? 'LAUNCH' : 'OPERATE' };

    // ---------- demand ----------
    let intraPerDay = 0, interPerDay = 0;
    if (!isBuild) {
      const f = logistic(mLaunch, sc.ramp.midpointMonth + rampDelay, sc.ramp.k);
      intraPerDay = sc.demand.intraTripsPerDayAtMaturity * f * demandMult;
      interPerDay = sc.demand.intercityBookingsPerDayAtMaturity * f * demandMult;
    }
    const intraTrips = intraPerDay * G.daysPerMonth;
    const interTrips = interPerDay * G.daysPerMonth;
    const trips = intraTrips + interTrips;
    const gmv = intraTrips * avgIntraFare + interTrips * D.avgIntercityBooking;
    const activeUsers = trips / D.tripsPerActiveUserPerMonth;
    const newUsers = Math.max(0, activeUsers - prevActiveUsers * (1 - D.monthlyUserChurnPct / 100));
    prevActiveUsers = activeUsers;

    // ---------- revenue ----------
    const commissionGross = gmv * (commissionPct / 100) * collectionRate;
    const vat = commissionGross * (G.vatOnCommissionPct / (100 + G.vatOnCommissionPct));
    const gatewayFees = commissionGross * (G.gatewayMdrPct / 100);
    const inLaunchWindow = mLaunch >= 1 && mLaunch <= sc.marketing.launchMonths;
    const incentives = isBuild ? 0 : gmv * ((inLaunchWindow ? sc.incentives.launchPctOfGmv : sc.incentives.ongoingPctOfGmv) / 100);
    const netRevenue = commissionGross - vat - gatewayFees - incentives;

    // ---------- costs ----------
    const c = {};
    c.team = sum(isBuild ? sc.buildTeam : sc.postLaunchTeam, (r) => r.monthly);
    c.office = isBuild && sc.buildMonths > 0 && t < sc.buildMonths ? 0 : sc.officeMonthly; // office from last build month
    c.cloud = usd(isBuild ? sc.cloud.buildUsd : cloudUsdFor(sc, intraPerDay + interPerDay));
    c.saas = usd(sc.saasMonthlyUsd);
    c.maps = Math.max(0, trips * sc.barikoi.callsPerTrip - sc.barikoi.freeCallsPerMonth) * sc.barikoi.pricePerCall;
    c.sms = (activeUsers * D.otpSmsPerActiveUserPerMonth + newUsers * D.otpSmsPerNewUser) * sc.smsPrice
      + (isBuild ? 500 : 0); // test SMS during build
    c.marketing = isBuild ? 0 : inLaunchWindow ? sc.marketing.adsLaunchMonthly : sc.marketing.adsOngoingMonthly;

    // one-time & yearly
    c.oneTime = 0;
    if (t === 1) c.oneTime += sum(sc.oneTime.legal, (x) => x.amount) + sum(sc.oneTime.setup, (x) => x.amount)
      + usd(G.googlePlayOneTimeUsd) + G.domainYearly + (sc.iosLaunch ? usd(G.appleDevYearlyUsd) : 0);
    if (t === sc.buildMonths) c.oneTime += G.brtaEnlistmentFee; // licence before launch
    if (mLaunch === 1) c.oneTime += sum(sc.oneTime.launch, (x) => x.amount);
    if (t > 1 && (t - 1) % 12 === 0) c.oneTime += G.domainYearly + (sc.iosLaunch ? usd(G.appleDevYearlyUsd) : 0);
    if (t > sc.buildMonths && (t - sc.buildMonths) % 12 === 0) c.oneTime += G.brtaAnnualRenewal;

    const totalCost = sum(Object.values(c));
    const net = netRevenue - totalCost;
    cash += net;

    Object.assign(row, {
      intraPerDay, interPerDay, trips, gmv, activeUsers, newUsers,
      commissionGross, vat, gatewayFees, incentives, netRevenue,
      ...Object.fromEntries(Object.entries(c).map(([k, v]) => ['cost_' + k, v])),
      totalCost, net, cash,
    });
    months.push(row);
  }

  const buildRows = months.filter((r) => r.phase === 'BUILD');
  const buildCost = -buildRows[buildRows.length - 1].cash;
  const launchRow = months.find((r) => r.phase === 'LAUNCH');
  const launchCostOneTime = sum(sc.oneTime.launch, (x) => x.amount);
  const trough = Math.min(...months.map((r) => r.cash));
  const troughMonth = months.find((r) => r.cash === trough).month;
  const firstProfit = months.find((r) => r.phase !== 'BUILD' && r.net > 0);
  const cashPositive = months.find((r, i) => i > 0 && r.cash >= 0 && r.phase !== 'BUILD');
  const funding = -trough * (1 + G.contingencyPct / 100);
  const last = months[months.length - 1];
  const row12 = months.find((r) => r.month === sc.buildMonths + 12);
  const runway12 = -Math.min(...months.filter((r) => r.month <= row12.month).map((r) => r.cash)) * (1 + G.contingencyPct / 100);

  return {
    months, buildCost, launchRow, launchCostOneTime, trough, troughMonth,
    breakEvenMonth: firstProfit ? firstProfit.month : null,
    paybackMonth: cashPositive ? cashPositive.month : null,
    funding, runway12, last,
    stillFalling: troughMonth === months[months.length - 1].month,
  };
}

/** Binary-search the demand multiplier at which the final (mature) month nets exactly zero. */
function breakEvenVolume(sc) {
  let lo = 0, hi = 50;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (simulate(sc, { demandMult: mid }).last.net >= 0) hi = mid; else lo = mid;
  }
  const r = simulate(sc, { demandMult: hi }).last;
  // Alternative lever: keep intra at plan, grow intercity only
  let lo2 = 0, hi2 = 5000;
  const base = simulate(sc).last;
  for (let i = 0; i < 60; i++) {
    const mid = (lo2 + hi2) / 2;
    const scx = { ...sc, demand: { ...sc.demand, intercityBookingsPerDayAtMaturity: mid } };
    if (simulate(scx).last.net >= 0) hi2 = mid; else lo2 = mid;
  }
  return {
    mult: hi,
    intraPerDay: r.intraPerDay, interPerDay: r.interPerDay,
    intercityOnlyPerDay: hi2, planIntraPerDay: base.intraPerDay,
  };
}

// ------------------------------------------------------------------ reporting
const fmt = (n) => Math.round(n).toLocaleString('en-IN');
const lakh = (n) => (n / 100000).toFixed(1) + ' lakh';
const toUsd = (n) => '$' + Math.round(n / G.usdToBdt).toLocaleString('en-US');
const mo = (sc, m) => (m == null ? `not within ${G.horizonMonths} mo` : `month ${m} (launch +${m - sc.buildMonths})`);

function unitEconomics(sc) {
  const c = sc.revenue.commissionPct / 100 * sc.revenue.collectionRate;
  const keep = 1 - G.vatOnCommissionPct / (100 + G.vatOnCommissionPct) - G.gatewayMdrPct / 100;
  return {
    intra: avgIntraFare * c * keep,
    inter: D.avgIntercityBooking * c * keep,
  };
}

function buildReport(results) {
  let md = `# CholoBhairab — Funding Model Output\n\n_Generated ${new Date().toISOString().slice(0, 10)} · 1 USD = ${G.usdToBdt} BDT · contingency ${G.contingencyPct}% · horizon = build + ${G.horizonMonths} months_\n\n`;
  md += `## Headline\n\n| | ${results.map((r) => r.sc.label).join(' | ')} |\n|---|${results.map(() => '---:').join('|')}|\n`;
  const line = (label, f) => (md += `| ${label} | ${results.map(f).join(' | ')} |\n`);
  line('Build period', (r) => `${r.sc.buildMonths} mo`);
  line('**Build cost to launch day**', (r) => `**৳${fmt(r.res.buildCost)}** (${toUsd(r.res.buildCost)})`);
  line('Launch-month one-time (promo, stickers)', (r) => `৳${fmt(r.res.launchCostOneTime)}`);
  line('Monthly burn after launch (fixed)', (r) => `৳${fmt(r.res.launchRow.totalCost - r.res.launchRow.cost_oneTime)}`);
  line(`**Raise for build + 12 mo runway (+${G.contingencyPct}%)**`, (r) => `**৳${fmt(r.res.runway12)} ≈ ${lakh(r.res.runway12)} (${toUsd(r.res.runway12)})**`);
  line(`Raise for build + 24 mo runway (+${G.contingencyPct}%)`, (r) => `৳${fmt(r.res.funding)} ≈ ${lakh(r.res.funding)}${r.res.stillFalling ? ' ⚠ still burning' : ''}`);
  line('Monthly break-even', (r) => mo(r.sc, r.res.breakEvenMonth));
  line('Cumulative payback', (r) => mo(r.sc, r.res.paybackMonth));
  line(`Plan: trips/day at maturity (intra + intercity)`, (r) => `${fmt(r.res.last.intraPerDay)} + ${fmt(r.res.last.interPerDay)}`);
  line('**Needed to break even (same mix)**', (r) => `**${fmt(r.be.intraPerDay)} + ${fmt(r.be.interPerDay)}** (${r.be.mult.toFixed(2)}× plan)`);
  line('…or keep intra at plan, grow intercity to', (r) => `${fmt(r.be.intercityOnlyPerDay)} bookings/day`);
  line('Net monthly result at end of horizon', (r) => `৳${fmt(r.res.last.net)}`);

  const ue = unitEconomics(results[0].sc);
  md += `\n## Unit economics (8% commission, 90% collected, after VAT + gateway fee)\n\n`;
  md += `- Avg intra-city fare (weighted mix): **৳${avgIntraFare.toFixed(0)}** → platform keeps **৳${ue.intra.toFixed(2)} per trip**\n`;
  md += `- Avg intercity booking: **৳${D.avgIntercityBooking}** → platform keeps **৳${ue.inter.toFixed(2)} per booking**\n`;
  md += `- ⇒ 1 intercity booking ≈ **${(ue.inter / ue.intra).toFixed(0)} intra-city trips** of revenue\n`;

  for (const { sc, res, sens } of results) {
    md += `\n---\n\n## ${sc.label}\n\n_${sc.description}_\n\n### Build-phase cost breakdown (months 1–${sc.buildMonths})\n\n| Item | BDT |\n|---|---:|\n`;
    const b = res.months.filter((r) => r.phase === 'BUILD');
    const items = [
      ['Team salaries', sum(b, (r) => r.cost_team)],
      ['Legal, registration, BRTA licence, setup, store accounts', sum(b, (r) => r.cost_oneTime)],
      ['Cloud servers (staging)', sum(b, (r) => r.cost_cloud)],
      ['SaaS tools (monitoring, email, etc.)', sum(b, (r) => r.cost_saas)],
      ['Office', sum(b, (r) => r.cost_office)],
      ['SMS testing', sum(b, (r) => r.cost_sms)],
    ];
    items.forEach(([k, v]) => (md += `| ${k} | ${fmt(v)} |\n`));
    md += `| **Total** | **${fmt(res.buildCost)}** |\n`;

    md += `\n### Sensitivity\n\n| Case | Build + 12 mo | Build + 24 mo | Break-even |\n|---|---:|---:|---|\n`;
    sens.forEach((s) => (md += `| ${s.name} | ${lakh(s.res.runway12)} | ${lakh(s.res.funding)} | ${mo(sc, s.res.breakEvenMonth)} |\n`));

    md += `\n### Quarterly snapshot\n\n| Month | Phase | Trips/day | GMV | Net revenue | Costs | Net | Cash position |\n|---:|---|---:|---:|---:|---:|---:|---:|\n`;
    res.months.filter((r) => r.month % 3 === 0 || r.phase === 'LAUNCH').forEach((r) => {
      md += `| ${r.month} | ${r.phase} | ${fmt(r.intraPerDay + r.interPerDay)} | ${fmt(r.gmv)} | ${fmt(r.netRevenue)} | ${fmt(r.totalCost)} | ${fmt(r.net)} | ${fmt(r.cash)} |\n`;
    });
  }
  return md;
}

function toCsv(months) {
  const keys = Object.keys(months[0]);
  return [keys.join(','), ...months.map((r) => keys.map((k) => (typeof r[k] === 'number' ? r[k].toFixed(2) : r[k])).join(','))].join('\n');
}

// ------------------------------------------------------------------ main
const only = process.argv[2];
const keys = only ? [only] : Object.keys(A.scenarios);
fs.mkdirSync(OUT, { recursive: true });

const results = keys.map((key) => {
  const sc = A.scenarios[key];
  if (!sc) throw new Error(`Unknown scenario "${key}". Options: ${Object.keys(A.scenarios).join(', ')}`);
  const res = simulate(sc);
  const sens = [
    { name: 'Plan', over: {} },
    { name: 'Demand 50% of plan', over: { demandMult: 0.5 } },
    { name: 'Adoption 3 months slower', over: { rampDelay: 3 } },
    { name: 'Commission 10% instead of 8%', over: { commissionPct: 10 } },
    { name: 'Only 70% of commission collected', over: { collectionRate: 0.7 } },
    { name: 'No intercity product', over: {} , noIntercity: true },
  ].map((s) => {
    const scx = s.noIntercity ? { ...sc, demand: { ...sc.demand, intercityBookingsPerDayAtMaturity: 0 } } : sc;
    return { name: s.name, res: simulate(scx, s.over) };
  });
  fs.writeFileSync(path.join(OUT, `monthly_${key}.csv`), toCsv(res.months));
  return { key, sc, res, sens, be: breakEvenVolume(sc) };
});

const report = buildReport(results);
fs.writeFileSync(path.join(OUT, 'report.md'), report);
console.log(report);
