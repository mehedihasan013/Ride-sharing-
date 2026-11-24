/** What the public live-tracking page shows. No phone numbers: anyone with the link can open it. */
export interface TrackingView {
  status: string;
  driverName?: string;
  vehicleModel?: string;
  pickupAddress: string;
  dropoffAddress: string;
  fare?: number;
  driverPosition?: { lat: number; lng: number };
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const STATUS: Record<string, [string, string]> = {
  SEARCHING: ['চালক খোঁজা হচ্ছে', 'Finding a driver'],
  BIDDING: ['চালক খোঁজা হচ্ছে', 'Finding a driver'],
  ACCEPTED: ['চালক আসছেন', 'Driver is on the way'],
  ARRIVING: ['চালক পৌঁছেছেন', 'Driver has arrived'],
  IN_PROGRESS: ['যাত্রা চলছে', 'On the trip'],
  COMPLETED: ['যাত্রা শেষ', 'Trip ended'],
  CANCELLED: ['রাইড বাতিল', 'Ride cancelled'],
};

/** One small self-refreshing HTML page (no scripts). Every value is escaped. */
export function renderTrackingPage(view: TrackingView): string {
  const ended = view.status === 'COMPLETED' || view.status === 'CANCELLED';
  const [bn, en] = STATUS[view.status] ?? [view.status, view.status];
  const pos = view.driverPosition;
  const mapLink =
    !ended && pos
      ? `<p><a href="https://www.openstreetmap.org/?mlat=${pos.lat}&amp;mlon=${pos.lng}#map=16/${pos.lat}/${pos.lng}">চালকের অবস্থান ম্যাপে দেখুন · See the driver on the map</a></p>`
      : '';
  const driver = view.driverName
    ? `<p class="row"><span>চালক · Driver</span><b>${escapeHtml(view.driverName)}${
        view.vehicleModel ? ` · ${escapeHtml(view.vehicleModel)}` : ''
      }</b></p>`
    : '';
  const fare = view.fare ? `<p class="row"><span>ভাড়া · Fare</span><b>৳${escapeHtml(view.fare)}</b></p>` : '';

  return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${ended ? '' : '<meta http-equiv="refresh" content="15">'}
<meta name="robots" content="noindex">
<title>চলো ভৈরব · লাইভ ট্রিপ</title>
<style>
body{margin:0;font-family:"Hind Siliguri",system-ui,sans-serif;background:#F6F5F2;color:#16181A}
main{max-width:480px;margin:0 auto;padding:24px 16px}
.card{background:#fff;border:1px solid #DEDBD3;border-radius:12px;padding:16px}
h1{font-size:20px;margin:0 0 4px} .en{color:#6C7278;font-size:14px;margin:0 0 16px}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:${ended ? '#6C7278' : '#006A4E'};margin-right:8px}
.row{display:flex;justify-content:space-between;gap:16px;margin:8px 0} .row span{color:#4D5358}
a{color:#006A4E;font-weight:600} small{color:#6C7278}
</style>
</head>
<body><main>
<div class="card">
<h1><span class="dot"></span>${escapeHtml(bn)}</h1>
<p class="en">${escapeHtml(en)}</p>
${driver}
<p class="row"><span>পিকআপ · Pickup</span><b>${escapeHtml(view.pickupAddress)}</b></p>
<p class="row"><span>গন্তব্য · Drop-off</span><b>${escapeHtml(view.dropoffAddress)}</b></p>
${fare}
${mapLink}
</div>
<p><small>চলো ভৈরব · Cholo Bhairab${ended ? '' : ' · প্রতি 15 সেকেন্ডে আপডেট হয় · updates every 15 seconds'}</small></p>
</main></body>
</html>`;
}
